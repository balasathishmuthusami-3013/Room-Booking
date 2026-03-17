"""
app/models/payment.py
─────────────────────
SQLAlchemy ORM model for payment transactions.

Each row represents one payment attempt – tied to a user, with provider-
specific identifiers that allow us to reconcile with Razorpay / Strike.
"""

from datetime import datetime, timezone
from enum import Enum as PyEnum

from sqlalchemy import (
    Column,
    DateTime,
    Enum,
    Float,
    Integer,
    String,
    Text,
)
from sqlalchemy.sql import func

from app.core.database import Base


class PaymentProvider(str, PyEnum):
    RAZORPAY = "razorpay"
    STRIKE   = "strike"


class PaymentStatus(str, PyEnum):
    PENDING   = "pending"
    COMPLETED = "completed"
    FAILED    = "failed"
    REFUNDED  = "refunded"


class Payment(Base):
    """Stores every payment transaction for the application."""

    __tablename__ = "payments"

    # ── Primary key ──────────────────────────────────────────────────────
    id = Column(Integer, primary_key=True, index=True)

    # ── Ownership ────────────────────────────────────────────────────────
    user_id = Column(Integer, nullable=False, index=True)

    # ── Provider details ─────────────────────────────────────────────────
    provider = Column(
        Enum(PaymentProvider),
        nullable=False,
        comment="razorpay | strike",
    )

    # ── Monetary ─────────────────────────────────────────────────────────
    amount   = Column(Float,  nullable=False, comment="Amount in smallest unit (paise for INR)")
    currency = Column(String(10), nullable=False, default="INR")

    # ── Status ───────────────────────────────────────────────────────────
    status = Column(
        Enum(PaymentStatus),
        nullable=False,
        default=PaymentStatus.PENDING,
        index=True,
    )

    # ── Provider-specific identifiers ────────────────────────────────────
    # Razorpay
    razorpay_order_id   = Column(String(64),  nullable=True, index=True)
    razorpay_payment_id = Column(String(64),  nullable=True, index=True)
    razorpay_signature  = Column(String(256), nullable=True)

    # Strike
    strike_invoice_id   = Column(String(128), nullable=True, index=True)
    strike_payment_url  = Column(Text,        nullable=True)

    # ── Generic provider payment id (set after success) ──────────────────
    provider_payment_id = Column(String(128), nullable=True, index=True)

    # ── Metadata ─────────────────────────────────────────────────────────
    description = Column(String(256), nullable=True)
    receipt     = Column(String(64),  nullable=True)

    # ── Timestamps ───────────────────────────────────────────────────────
    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    def __repr__(self) -> str:
        return (
            f"<Payment id={self.id} user={self.user_id} "
            f"provider={self.provider} status={self.status} "
            f"amount={self.amount} {self.currency}>"
        )
