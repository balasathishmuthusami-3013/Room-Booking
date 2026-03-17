"""
app/payments/razorpay_service.py
────────────────────────────────
All Razorpay business logic lives here.

Responsibilities
────────────────
1. Create a Razorpay Order via the SDK
2. Verify payment signature (HMAC-SHA256)
3. Persist + update Payment rows in the database

Design rules
────────────
* No secrets are hard-coded – everything comes from Settings.
* This module raises ValueError / HTTPException; the router handles HTTP codes.
* All DB mutations go through the Session passed in – no hidden sessions.
"""

import hashlib
import hmac
import uuid
from typing import Optional

import razorpay
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.core.config import Settings
from app.core.logging import logger
from app.models.payment import Payment, PaymentProvider, PaymentStatus
from app.payments.schemas import (
    RazorpayCreateOrderRequest,
    RazorpayOrderResponse,
    RazorpayVerifyRequest,
    RazorpayVerifyResponse,
)


def _get_client(settings: Settings) -> razorpay.Client:
    """Build an authenticated Razorpay client from settings."""
    return razorpay.Client(
        auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET)
    )


# ── Order creation ────────────────────────────────────────────────────────────

def create_order(
    *,
    request: RazorpayCreateOrderRequest,
    user_id: int,
    db: Session,
    settings: Settings,
) -> RazorpayOrderResponse:
    """
    1. Create an order on Razorpay.
    2. Persist a PENDING payment row in our DB.
    3. Return the order details the frontend needs to open the checkout widget.
    """
    client = _get_client(settings)

    # Unique receipt id (max 40 chars per Razorpay docs)
    receipt = f"rcpt_{uuid.uuid4().hex[:16]}"

    order_data = {
        "amount":   request.amount,          # paise / cents
        "currency": request.currency,
        "receipt":  receipt,
        "notes": {
            "user_id":     str(user_id),
            "description": request.description or "",
        },
    }

    try:
        rz_order = client.order.create(data=order_data)
    except Exception as exc:
        logger.error("Razorpay order creation failed: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Payment gateway error. Please try again.",
        ) from exc

    logger.info(
        "Razorpay order created | order_id=%s user=%s amount=%s %s",
        rz_order["id"],
        user_id,
        request.amount,
        request.currency,
    )

    # ── Persist to DB ────────────────────────────────────────────────────
    payment = Payment(
        user_id=user_id,
        provider=PaymentProvider.RAZORPAY,
        amount=request.amount,
        currency=request.currency,
        status=PaymentStatus.PENDING,
        razorpay_order_id=rz_order["id"],
        description=request.description,
        receipt=receipt,
    )
    db.add(payment)
    db.commit()
    db.refresh(payment)

    return RazorpayOrderResponse(
        order_id=rz_order["id"],
        amount=request.amount,
        currency=request.currency,
        key_id=settings.RAZORPAY_KEY_ID,
        payment_db_id=payment.id,
    )


# ── Payment verification ──────────────────────────────────────────────────────

def verify_payment(
    *,
    request: RazorpayVerifyRequest,
    user_id: int,
    db: Session,
    settings: Settings,
) -> RazorpayVerifyResponse:
    """
    Verify the HMAC-SHA256 signature that Razorpay sends after a successful
    checkout and update the payment row accordingly.

    Signature algorithm (from Razorpay docs):
        HMAC_SHA256(order_id + "|" + payment_id, secret)
    """
    # ── Signature check ──────────────────────────────────────────────────
    message = f"{request.razorpay_order_id}|{request.razorpay_payment_id}"
    expected_sig = hmac.new(
        settings.RAZORPAY_KEY_SECRET.encode(),
        message.encode(),
        hashlib.sha256,
    ).hexdigest()

    if not hmac.compare_digest(expected_sig, request.razorpay_signature):
        logger.warning(
            "Razorpay signature mismatch | order=%s user=%s",
            request.razorpay_order_id,
            user_id,
        )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Payment signature verification failed.",
        )

    # ── Update DB ────────────────────────────────────────────────────────
    payment: Optional[Payment] = (
        db.query(Payment)
        .filter(
            Payment.razorpay_order_id == request.razorpay_order_id,
            Payment.user_id == user_id,
        )
        .first()
    )

    if not payment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Payment record not found.",
        )

    payment.razorpay_payment_id = request.razorpay_payment_id
    payment.razorpay_signature  = request.razorpay_signature
    payment.provider_payment_id = request.razorpay_payment_id
    payment.status              = PaymentStatus.COMPLETED
    db.commit()
    db.refresh(payment)

    logger.info(
        "Razorpay payment verified | payment_id=%s order=%s user=%s",
        payment.id,
        request.razorpay_order_id,
        user_id,
    )

    return RazorpayVerifyResponse(
        success=True,
        message="Payment verified successfully.",
        payment_id=payment.id,
    )


# ── Webhook handler ───────────────────────────────────────────────────────────

def handle_webhook(
    *,
    payload_bytes: bytes,
    signature: str,
    db: Session,
    settings: Settings,
) -> dict:
    """
    Verify and process a Razorpay webhook event.

    Razorpay sends X-Razorpay-Signature header which is
    HMAC-SHA256(raw_body, webhook_secret).
    """
    # ── Signature verification ───────────────────────────────────────────
    expected = hmac.new(
        settings.RAZORPAY_WEBHOOK_SECRET.encode(),
        payload_bytes,
        hashlib.sha256,
    ).hexdigest()

    if not hmac.compare_digest(expected, signature):
        logger.warning("Razorpay webhook: invalid signature")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid webhook signature.",
        )

    import json
    try:
        event = json.loads(payload_bytes)
    except json.JSONDecodeError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Malformed webhook payload.",
        ) from exc

    event_type: str = event.get("event", "")
    logger.info("Razorpay webhook received | event=%s", event_type)

    # ── Route by event type ──────────────────────────────────────────────
    if event_type == "payment.captured":
        _handle_payment_captured(event, db)

    elif event_type == "payment.failed":
        _handle_payment_failed(event, db)

    elif event_type == "refund.created":
        _handle_refund_created(event, db)

    else:
        logger.debug("Razorpay webhook: unhandled event type %s", event_type)

    return {"status": "ok", "event": event_type}


def _handle_payment_captured(event: dict, db: Session) -> None:
    payment_entity = event.get("payload", {}).get("payment", {}).get("entity", {})
    order_id = payment_entity.get("order_id")
    payment_id = payment_entity.get("id")
    if not order_id:
        return

    row: Optional[Payment] = (
        db.query(Payment)
        .filter(Payment.razorpay_order_id == order_id)
        .first()
    )
    if row and row.status != PaymentStatus.COMPLETED:
        row.razorpay_payment_id = payment_id
        row.provider_payment_id = payment_id
        row.status              = PaymentStatus.COMPLETED
        db.commit()
        logger.info("Webhook: payment captured | order=%s", order_id)


def _handle_payment_failed(event: dict, db: Session) -> None:
    payment_entity = event.get("payload", {}).get("payment", {}).get("entity", {})
    order_id = payment_entity.get("order_id")
    if not order_id:
        return

    row: Optional[Payment] = (
        db.query(Payment)
        .filter(Payment.razorpay_order_id == order_id)
        .first()
    )
    if row and row.status == PaymentStatus.PENDING:
        row.status = PaymentStatus.FAILED
        db.commit()
        logger.info("Webhook: payment failed | order=%s", order_id)


def _handle_refund_created(event: dict, db: Session) -> None:
    payment_entity = event.get("payload", {}).get("payment", {}).get("entity", {})
    payment_id = payment_entity.get("id")
    if not payment_id:
        return

    row: Optional[Payment] = (
        db.query(Payment)
        .filter(Payment.razorpay_payment_id == payment_id)
        .first()
    )
    if row:
        row.status = PaymentStatus.REFUNDED
        db.commit()
        logger.info("Webhook: refund created | payment_id=%s", payment_id)
