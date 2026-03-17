"""
app/payments/webhook.py
───────────────────────
Thin dispatch layer that routes incoming webhook POST bodies to the
correct provider handler.

Both Razorpay and Strike send raw bytes with a signature header.
We MUST consume the raw body before any JSON parsing so that the
HMAC digest matches.
"""

from fastapi import Header, HTTPException, Request, status
from sqlalchemy.orm import Session

from app.core.config import Settings
from app.core.logging import logger
from app.payments import razorpay_service, strike_service


async def dispatch_razorpay_webhook(
    request: Request,
    db: Session,
    settings: Settings,
    x_razorpay_signature: str = Header(
        ...,
        alias="X-Razorpay-Signature",
        description="HMAC-SHA256 signature from Razorpay",
    ),
) -> dict:
    """
    Entry point for Razorpay webhooks.
    Called by POST /payments/razorpay/webhook.
    """
    payload_bytes: bytes = await request.body()

    if not payload_bytes:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Empty webhook payload.",
        )

    logger.debug(
        "Razorpay webhook received | size=%d sig=%s…",
        len(payload_bytes),
        x_razorpay_signature[:12],
    )

    return razorpay_service.handle_webhook(
        payload_bytes=payload_bytes,
        signature=x_razorpay_signature,
        db=db,
        settings=settings,
    )


async def dispatch_strike_webhook(
    request: Request,
    db: Session,
    settings: Settings,
    strike_signature: str = Header(
        ...,
        alias="Strike-Signature",
        description="HMAC-SHA256 signature from Strike",
    ),
) -> dict:
    """
    Entry point for Strike webhooks.
    Called by POST /payments/strike/webhook.
    """
    payload_bytes: bytes = await request.body()

    if not payload_bytes:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Empty webhook payload.",
        )

    logger.debug(
        "Strike webhook received | size=%d sig=%s…",
        len(payload_bytes),
        strike_signature[:12],
    )

    return strike_service.handle_webhook(
        payload_bytes=payload_bytes,
        signature=strike_signature,
        db=db,
        settings=settings,
    )
