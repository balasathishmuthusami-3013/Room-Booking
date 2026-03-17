"""
app/payments/strike_service.py
──────────────────────────────
All Strike (Bitcoin / Lightning) business logic lives here.

Strike API docs: https://docs.strike.me/api/

Responsibilities
────────────────
1. Create a Strike invoice (returns a Lightning payment URL)
2. Handle webhook to confirm / fail a payment
3. Persist + update Payment rows in the database

Strike authentication
─────────────────────
Strike uses Bearer token authentication.  The STRIKE_API_KEY is sent as:
    Authorization: Bearer <STRIKE_API_KEY>
"""

import hashlib
import hmac
import json
import uuid
from typing import Optional

import httpx
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.core.config import Settings
from app.core.logging import logger
from app.models.payment import Payment, PaymentProvider, PaymentStatus
from app.payments.schemas import (
    StrikeCreateInvoiceRequest,
    StrikeInvoiceResponse,
)


# ── HTTP client factory ───────────────────────────────────────────────────────

def _headers(settings: Settings) -> dict:
    return {
        "Authorization": f"Bearer {settings.STRIKE_API_KEY}",
        "Content-Type":  "application/json",
        "Accept":        "application/json",
    }


# ── Invoice creation ──────────────────────────────────────────────────────────

def create_invoice(
    *,
    request: StrikeCreateInvoiceRequest,
    user_id: int,
    db: Session,
    settings: Settings,
) -> StrikeInvoiceResponse:
    """
    1. POST to Strike API to create a new invoice.
    2. Persist a PENDING payment row in our DB.
    3. Return the payment URL for the frontend QR / redirect.
    """
    description = request.description or f"Payment for user {user_id}"
    correlation_id = str(uuid.uuid4())

    # ── Build Strike invoice payload ─────────────────────────────────────
    # Strike API: POST /v1/invoices
    # https://docs.strike.me/api/#tag/Invoices/operation/CreateInvoice
    payload = {
        "correlationId": correlation_id,
        "description":   description,
        "amount": {
            "amount":   str(request.amount),
            "currency": request.currency,
        },
    }

    try:
        response = httpx.post(
            f"{settings.strike_base_url}/invoices",
            json=payload,
            headers=_headers(settings),
            timeout=15.0,
        )
        response.raise_for_status()
        invoice_data: dict = response.json()

    except httpx.TimeoutException:
        logger.error("Strike API timeout creating invoice | user=%s", user_id)
        raise HTTPException(
            status_code=status.HTTP_504_GATEWAY_TIMEOUT,
            detail="Payment gateway timeout. Please retry.",
        )
    except httpx.HTTPStatusError as exc:
        logger.error(
            "Strike API error | status=%s body=%s",
            exc.response.status_code,
            exc.response.text,
        )
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Could not create crypto invoice. Please try again.",
        ) from exc

    invoice_id: str = invoice_data["invoiceId"]

    # ── Fetch the Lightning payment URL ──────────────────────────────────
    # Strike requires a second call to get the payment quote / URL
    payment_url = _get_payment_url(invoice_id, settings)

    logger.info(
        "Strike invoice created | invoice_id=%s user=%s amount=%s %s",
        invoice_id,
        user_id,
        request.amount,
        request.currency,
    )

    # ── Persist to DB ────────────────────────────────────────────────────
    payment = Payment(
        user_id=user_id,
        provider=PaymentProvider.STRIKE,
        amount=request.amount,
        currency=request.currency,
        status=PaymentStatus.PENDING,
        strike_invoice_id=invoice_id,
        strike_payment_url=payment_url,
        description=description,
    )
    db.add(payment)
    db.commit()
    db.refresh(payment)

    return StrikeInvoiceResponse(
        invoice_id=invoice_id,
        payment_url=payment_url,
        amount=request.amount,
        currency=request.currency,
        payment_db_id=payment.id,
    )


def _get_payment_url(invoice_id: str, settings: Settings) -> str:
    """
    Strike API: POST /v1/invoices/{invoice_id}/quote
    Returns the Lightning invoice string (BOLT 11) or a generic URL.
    """
    try:
        resp = httpx.patch(
            f"{settings.strike_base_url}/invoices/{invoice_id}/quote",
            headers=_headers(settings),
            timeout=10.0,
        )
        resp.raise_for_status()
        data = resp.json()
        # Lightning BOLT-11 invoice – frontend wraps this in QR
        ln_invoice: str = data.get("lnInvoice", "")
        if ln_invoice:
            return f"lightning:{ln_invoice}"

        # Fallback: generic Strike URL
        return f"https://strike.me/pay/{invoice_id}"

    except Exception as exc:
        logger.warning("Could not fetch Strike payment URL: %s", exc)
        # Non-fatal – caller still gets a usable page URL
        return f"https://strike.me/pay/{invoice_id}"


# ── Webhook handler ───────────────────────────────────────────────────────────

def handle_webhook(
    *,
    payload_bytes: bytes,
    signature: str,
    db: Session,
    settings: Settings,
) -> dict:
    """
    Verify and process a Strike webhook event.

    Strike signs webhooks with HMAC-SHA256 using the webhook secret.
    Header: Strike-Signature  value: t=<timestamp>,v0=<hex_sig>
    """
    # ── Signature verification ───────────────────────────────────────────
    _verify_strike_signature(
        payload_bytes=payload_bytes,
        signature_header=signature,
        secret=settings.STRIKE_WEBHOOK_SECRET,
    )

    try:
        event: dict = json.loads(payload_bytes)
    except json.JSONDecodeError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Malformed webhook payload.",
        ) from exc

    event_type: str = event.get("eventType", "")
    logger.info("Strike webhook received | event=%s", event_type)

    if event_type == "invoice.updated":
        _handle_invoice_updated(event, db)
    else:
        logger.debug("Strike webhook: unhandled event type %s", event_type)

    return {"status": "ok", "event": event_type}


def _verify_strike_signature(
    payload_bytes: bytes,
    signature_header: str,
    secret: str,
) -> None:
    """
    Strike-Signature header format: t=<epoch_ms>,v0=<hex_digest>
    We reconstruct the signed string as: <timestamp>.<payload>
    """
    try:
        parts = dict(item.split("=", 1) for item in signature_header.split(","))
        timestamp = parts["t"]
        received_sig = parts["v0"]
    except (KeyError, ValueError):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid Strike-Signature header format.",
        )

    signed_payload = f"{timestamp}.{payload_bytes.decode()}"
    expected = hmac.new(
        secret.encode(),
        signed_payload.encode(),
        hashlib.sha256,
    ).hexdigest()

    if not hmac.compare_digest(expected, received_sig):
        logger.warning("Strike webhook: invalid signature")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Strike webhook signature invalid.",
        )


def _handle_invoice_updated(event: dict, db: Session) -> None:
    """
    Strike fires `invoice.updated` for every state transition.
    We care about: PAID → completed, CANCELLED / EXPIRED → failed.
    """
    data        = event.get("data", {})
    invoice_id  = data.get("entityId") or data.get("id")
    new_state   = data.get("state", "").upper()    # UNPAID | PENDING | PAID | CANCELLED

    if not invoice_id:
        logger.warning("Strike webhook: invoice.updated missing entityId")
        return

    row: Optional[Payment] = (
        db.query(Payment)
        .filter(Payment.strike_invoice_id == invoice_id)
        .first()
    )
    if not row:
        logger.warning("Strike webhook: no payment found for invoice %s", invoice_id)
        return

    if new_state == "PAID":
        row.status              = PaymentStatus.COMPLETED
        row.provider_payment_id = invoice_id
        logger.info("Strike invoice paid | invoice=%s", invoice_id)

    elif new_state in ("CANCELLED", "EXPIRED"):
        if row.status == PaymentStatus.PENDING:
            row.status = PaymentStatus.FAILED
        logger.info("Strike invoice %s | invoice=%s", new_state.lower(), invoice_id)

    db.commit()
