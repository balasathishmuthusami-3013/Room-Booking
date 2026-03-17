"""
app/routers/payments.py
───────────────────────
FastAPI router for all payment endpoints.

Route summary
─────────────
POST  /payments/razorpay/create-order  → create Razorpay order
POST  /payments/razorpay/verify        → verify Razorpay signature
POST  /payments/razorpay/webhook       → Razorpay event callback (no auth)

POST  /payments/strike/create-invoice  → create Strike BTC invoice
POST  /payments/strike/webhook         → Strike event callback (no auth)

GET   /payments/my                     → list current user's payments
GET   /payments/{payment_id}           → single payment (owner only)

Auth
────
All non-webhook endpoints require a valid JWT (Bearer token).
Webhooks are authenticated via HMAC signature only – no JWT.
"""

from typing import Optional

from fastapi import APIRouter, Depends, Header, HTTPException, Request, status
from sqlalchemy.orm import Session

from app.core.config import Settings, get_settings
from app.core.database import get_db
from app.core.security import get_current_user_id
from app.models.payment import Payment
from app.payments import razorpay_service, strike_service
from app.payments.schemas import (
    PaymentListResponse,
    PaymentOut,
    RazorpayCreateOrderRequest,
    RazorpayOrderResponse,
    RazorpayVerifyRequest,
    RazorpayVerifyResponse,
    StrikeCreateInvoiceRequest,
    StrikeInvoiceResponse,
)
from app.payments.webhook import dispatch_razorpay_webhook, dispatch_strike_webhook

router = APIRouter(prefix="/payments", tags=["Payments"])


# ════════════════════════════════════════════════════════════════════════════
#  RAZORPAY
# ════════════════════════════════════════════════════════════════════════════

@router.post(
    "/razorpay/create-order",
    response_model=RazorpayOrderResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a Razorpay order",
    description=(
        "Creates an order on Razorpay and persists a pending payment row. "
        "Returns the order_id and public key_id that the frontend uses to "
        "open the Razorpay checkout modal."
    ),
)
def razorpay_create_order(
    body: RazorpayCreateOrderRequest,
    current_user_id: int  = Depends(get_current_user_id),
    db: Session           = Depends(get_db),
    settings: Settings    = Depends(get_settings),
) -> RazorpayOrderResponse:
    return razorpay_service.create_order(
        request=body,
        user_id=current_user_id,
        db=db,
        settings=settings,
    )


@router.post(
    "/razorpay/verify",
    response_model=RazorpayVerifyResponse,
    summary="Verify Razorpay payment signature",
    description=(
        "Called by the frontend after the Razorpay checkout widget closes. "
        "Validates the HMAC-SHA256 signature and marks the payment as completed."
    ),
)
def razorpay_verify(
    body: RazorpayVerifyRequest,
    current_user_id: int  = Depends(get_current_user_id),
    db: Session           = Depends(get_db),
    settings: Settings    = Depends(get_settings),
) -> RazorpayVerifyResponse:
    return razorpay_service.verify_payment(
        request=body,
        user_id=current_user_id,
        db=db,
        settings=settings,
    )


@router.post(
    "/razorpay/webhook",
    status_code=status.HTTP_200_OK,
    summary="Razorpay webhook receiver",
    description=(
        "Receives signed event callbacks from Razorpay. "
        "No JWT required – verified via X-Razorpay-Signature header."
    ),
    # Exclude from OpenAPI auth schemas so Razorpay can POST without tokens
    include_in_schema=True,
)
async def razorpay_webhook(
    request: Request,
    x_razorpay_signature: str = Header(
        ...,
        alias="X-Razorpay-Signature",
    ),
    db: Session        = Depends(get_db),
    settings: Settings = Depends(get_settings),
) -> dict:
    return await dispatch_razorpay_webhook(
        request=request,
        db=db,
        settings=settings,
        x_razorpay_signature=x_razorpay_signature,
    )


# ════════════════════════════════════════════════════════════════════════════
#  STRIKE (CRYPTO / BITCOIN)
# ════════════════════════════════════════════════════════════════════════════

@router.post(
    "/strike/create-invoice",
    response_model=StrikeInvoiceResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a Strike Bitcoin invoice",
    description=(
        "Creates a Lightning Network invoice via Strike. "
        "Returns a payment_url the frontend can display as a QR code."
    ),
)
def strike_create_invoice(
    body: StrikeCreateInvoiceRequest,
    current_user_id: int  = Depends(get_current_user_id),
    db: Session           = Depends(get_db),
    settings: Settings    = Depends(get_settings),
) -> StrikeInvoiceResponse:
    return strike_service.create_invoice(
        request=body,
        user_id=current_user_id,
        db=db,
        settings=settings,
    )


@router.post(
    "/strike/webhook",
    status_code=status.HTTP_200_OK,
    summary="Strike webhook receiver",
    description=(
        "Receives signed event callbacks from Strike. "
        "No JWT required – verified via Strike-Signature header."
    ),
)
async def strike_webhook(
    request: Request,
    strike_signature: str = Header(..., alias="Strike-Signature"),
    db: Session           = Depends(get_db),
    settings: Settings    = Depends(get_settings),
) -> dict:
    return await dispatch_strike_webhook(
        request=request,
        db=db,
        settings=settings,
        strike_signature=strike_signature,
    )


# ════════════════════════════════════════════════════════════════════════════
#  SHARED / QUERY ENDPOINTS
# ════════════════════════════════════════════════════════════════════════════

@router.get(
    "/my",
    response_model=PaymentListResponse,
    summary="List current user's payments",
    description="Returns all payment records belonging to the authenticated user.",
)
def list_my_payments(
    skip: int            = 0,
    limit: int           = 20,
    current_user_id: int = Depends(get_current_user_id),
    db: Session          = Depends(get_db),
) -> PaymentListResponse:
    query = db.query(Payment).filter(Payment.user_id == current_user_id)
    total = query.count()
    rows  = query.order_by(Payment.created_at.desc()).offset(skip).limit(limit).all()

    return PaymentListResponse(
        total=total,
        payments=[PaymentOut.model_validate(r) for r in rows],
    )


@router.get(
    "/{payment_id}",
    response_model=PaymentOut,
    summary="Get a single payment",
    description="Returns payment details. Users can only view their own payments.",
)
def get_payment(
    payment_id: int,
    current_user_id: int = Depends(get_current_user_id),
    db: Session          = Depends(get_db),
) -> PaymentOut:
    row: Optional[Payment] = (
        db.query(Payment)
        .filter(
            Payment.id      == payment_id,
            Payment.user_id == current_user_id,
        )
        .first()
    )
    if not row:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Payment not found.",
        )
    return PaymentOut.model_validate(row)
