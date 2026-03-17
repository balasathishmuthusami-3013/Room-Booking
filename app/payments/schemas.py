"""
app/payments/schemas.py
───────────────────────
Pydantic v2 schemas for request validation and response serialisation.

Keeping all schemas in one file for clarity; split by provider if the file
grows beyond ~200 lines.
"""

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field, field_validator

from app.models.payment import PaymentProvider, PaymentStatus


# ════════════════════════════════════════════════════════════════════════════
#  RAZORPAY
# ════════════════════════════════════════════════════════════════════════════

class RazorpayCreateOrderRequest(BaseModel):
    """Body accepted by POST /payments/razorpay/create-order"""

    amount: int = Field(
        ...,
        gt=0,
        description="Amount in smallest currency unit (paise for INR, cents for USD)",
        examples=[50000],
    )
    currency: str = Field(
        default="INR",
        min_length=3,
        max_length=3,
        description="ISO 4217 currency code",
        examples=["INR", "USD"],
    )
    description: Optional[str] = Field(
        default=None,
        max_length=255,
        description="Human-readable payment description",
    )

    @field_validator("currency")
    @classmethod
    def currency_upper(cls, v: str) -> str:
        return v.upper()


class RazorpayOrderResponse(BaseModel):
    """Returned to the frontend after order creation."""

    order_id: str
    amount: int
    currency: str
    key_id: str           # Public key – safe to expose to the browser
    payment_db_id: int    # Our internal payment row id


class RazorpayVerifyRequest(BaseModel):
    """Body for POST /payments/razorpay/verify – sent after Razorpay checkout."""

    razorpay_order_id:   str = Field(..., min_length=1)
    razorpay_payment_id: str = Field(..., min_length=1)
    razorpay_signature:  str = Field(..., min_length=1)


class RazorpayVerifyResponse(BaseModel):
    success:    bool
    message:    str
    payment_id: int       # Our internal db id


# ════════════════════════════════════════════════════════════════════════════
#  STRIKE (CRYPTO / BITCOIN)
# ════════════════════════════════════════════════════════════════════════════

class StrikeCreateInvoiceRequest(BaseModel):
    """Body accepted by POST /payments/strike/create-invoice"""

    amount: float = Field(
        ...,
        gt=0,
        description="Amount in fiat currency (Strike converts to BTC automatically)",
        examples=[25.00],
    )
    currency: str = Field(
        default="USD",
        min_length=3,
        max_length=3,
        description="Fiat currency for the invoice amount",
        examples=["USD", "EUR"],
    )
    description: Optional[str] = Field(
        default=None,
        max_length=255,
    )

    @field_validator("currency")
    @classmethod
    def currency_upper(cls, v: str) -> str:
        return v.upper()


class StrikeInvoiceResponse(BaseModel):
    """Returned to the frontend after invoice creation."""

    invoice_id:  str
    payment_url: str       # Lightning / on-chain URL shown as QR or link
    amount:      float
    currency:    str
    payment_db_id: int


# ════════════════════════════════════════════════════════════════════════════
#  SHARED / GENERIC
# ════════════════════════════════════════════════════════════════════════════

class PaymentOut(BaseModel):
    """Safe public representation of a Payment row – returned to the user."""

    id:                  int
    user_id:             int
    provider:            PaymentProvider
    amount:              float
    currency:            str
    status:              PaymentStatus
    provider_payment_id: Optional[str]
    description:         Optional[str]
    created_at:          datetime
    updated_at:          datetime

    model_config = {"from_attributes": True}


class PaymentListResponse(BaseModel):
    total:    int
    payments: list[PaymentOut]


class ErrorResponse(BaseModel):
    """Standard error envelope."""

    error:   str
    detail:  Optional[str] = None
    code:    Optional[str] = None


# ════════════════════════════════════════════════════════════════════════════
#  WEBHOOK PAYLOADS  (for documentation / testing)
# ════════════════════════════════════════════════════════════════════════════

class RazorpayWebhookPayload(BaseModel):
    """
    Sample Razorpay webhook event structure.
    Used only for documentation; raw bytes are consumed in webhook.py.
    """

    entity:    str
    event:     str           # e.g. "payment.captured"
    payload:   dict


class StrikeWebhookPayload(BaseModel):
    """
    Sample Strike webhook event structure.
    Used only for documentation; raw bytes are consumed in webhook.py.
    """

    eventType:  str          # e.g. "invoice.updated"
    data:       dict
