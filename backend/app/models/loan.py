"""
NexLoan Database Models — SQLAlchemy 2.0 Declarative Syntax
All models, enums, and table definitions per Section 6 of the spec.
"""

import uuid
from datetime import datetime
from enum import Enum as PyEnum

from sqlalchemy import (
    Column,
    String,
    Float,
    Boolean,
    Integer,
    DateTime,
    ForeignKey,
    Text,
    JSON,
    Enum,
    UniqueConstraint,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import DeclarativeBase, relationship


class Base(DeclarativeBase):
    """Base class for all SQLAlchemy models."""
    pass


# ─── Enums ──────────────────────────────────────────────────────────────────────


class LoanStatus(str, PyEnum):
    """Loan state machine — transitions enforced at the API layer."""
    INQUIRY = "INQUIRY"
    APPLICATION = "APPLICATION"
    KYC_PENDING = "KYC_PENDING"
    KYC_VERIFIED = "KYC_VERIFIED"
    UNDERWRITING = "UNDERWRITING"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"
    DISBURSED = "DISBURSED"
    ACTIVE = "ACTIVE"
    PRE_CLOSED = "PRE_CLOSED"
    CLOSED = "CLOSED"


class PaymentStatus(str, PyEnum):
    """EMI payment status."""
    PENDING = "PENDING"
    PAID = "PAID"
    OVERDUE = "OVERDUE"


class EmploymentType(str, PyEnum):
    """Applicant employment classification."""
    SALARIED = "SALARIED"
    SELF_EMPLOYED = "SELF_EMPLOYED"
    BUSINESS = "BUSINESS"
    OTHER = "OTHER"


# ─── Models ─────────────────────────────────────────────────────────────────────


class User(Base):
    """Registered users — authenticated via OTP, no passwords."""
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    full_name = Column(String(255), nullable=False)
    email = Column(String(255), unique=True, nullable=False, index=True)
    mobile = Column(String(15), unique=True, nullable=False, index=True)
    is_verified = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    loans = relationship("Loan", back_populates="user", lazy="selectin")


class Loan(Base):
    """
    Core loan record — tracks the full lifecycle from inquiry to closure.
    Loan number format: NL-YYYY-NNNNN (e.g., NL-2024-00001)
    """
    __tablename__ = "loans"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    loan_number = Column(String(20), unique=True, nullable=False, index=True)
    status = Column(Enum(LoanStatus), nullable=False, default=LoanStatus.INQUIRY)

    # Loan application details
    loan_amount = Column(Float, nullable=True)
    tenure_months = Column(Integer, nullable=True)
    purpose = Column(String(100), nullable=True)
    monthly_income = Column(Float, nullable=True)
    employment_type = Column(Enum(EmploymentType), nullable=True)
    existing_emi = Column(Float, default=0.0)
    date_of_birth = Column(DateTime, nullable=True)

    # Underwriting results
    credit_score = Column(Integer, nullable=True)
    interest_rate = Column(Float, nullable=True)
    dti_ratio = Column(Float, nullable=True)
    approved_amount = Column(Float, nullable=True)
    rejection_reason = Column(Text, nullable=True)
    emi_amount = Column(Float, nullable=True)

    # Disbursement details
    disbursed_at = Column(DateTime, nullable=True)
    disbursed_amount = Column(Float, nullable=True)
    account_number = Column(String(20), nullable=True)

    # Closure details
    closed_at = Column(DateTime, nullable=True)
    preclosure_charge = Column(Float, nullable=True)
    total_paid = Column(Float, default=0.0)
    no_dues_sent = Column(Boolean, default=False)

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    user = relationship("User", back_populates="loans")
    kyc_document = relationship("KYCDocument", back_populates="loan", uselist=False, lazy="selectin")
    emi_schedule = relationship("EMISchedule", back_populates="loan", lazy="selectin", order_by="EMISchedule.installment_no")
    audit_logs = relationship("AuditLog", back_populates="loan", lazy="selectin", order_by="AuditLog.created_at.desc()")


class KYCDocument(Base):
    """
    KYC verification records — one per loan.
    Stores AI verification results for PAN and Aadhaar documents.
    """
    __tablename__ = "kyc_documents"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    loan_id = Column(UUID(as_uuid=True), ForeignKey("loans.id"), unique=True, nullable=False, index=True)

    # PAN document
    pan_doc_url = Column(String(500), nullable=True)
    pan_number = Column(String(20), nullable=True)
    pan_name_extracted = Column(String(255), nullable=True)
    pan_legible = Column(Boolean, nullable=True)
    pan_name_match = Column(Boolean, nullable=True)

    # Aadhaar document
    aadhaar_doc_url = Column(String(500), nullable=True)
    aadhaar_number = Column(String(20), nullable=True)
    aadhaar_name_extracted = Column(String(255), nullable=True)
    aadhaar_legible = Column(Boolean, nullable=True)
    aadhaar_photo_present = Column(Boolean, nullable=True)

    # AI verdict
    ai_verdict = Column(String(20), nullable=True)  # PASS, FAIL, MANUAL_REVIEW
    ai_remarks = Column(Text, nullable=True)
    ai_raw_response = Column(JSON, nullable=True)

    # Timestamps
    verified_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    loan = relationship("Loan", back_populates="kyc_document")


class EMISchedule(Base):
    """
    Individual EMI installment records — one row per month.
    Generated at disbursement using the reducing-balance formula.
    """
    __tablename__ = "emi_schedule"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    loan_id = Column(UUID(as_uuid=True), ForeignKey("loans.id"), nullable=False, index=True)

    installment_no = Column(Integer, nullable=False)
    due_date = Column(DateTime, nullable=False)
    emi_amount = Column(Float, nullable=False)
    principal = Column(Float, nullable=False)
    interest = Column(Float, nullable=False)
    outstanding_balance = Column(Float, nullable=False)

    # Payment tracking
    status = Column(Enum(PaymentStatus), nullable=False, default=PaymentStatus.PENDING)
    paid_at = Column(DateTime, nullable=True)
    paid_amount = Column(Float, nullable=True)

    # Relationships
    loan = relationship("Loan", back_populates="emi_schedule")

    # Unique constraint: one installment number per loan
    __table_args__ = (
        UniqueConstraint("loan_id", "installment_no", name="uq_loan_installment"),
    )


class AuditLog(Base):
    """
    Immutable audit trail — every loan state transition is logged here.
    Never delete audit log entries.
    """
    __tablename__ = "audit_logs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    loan_id = Column(UUID(as_uuid=True), ForeignKey("loans.id"), nullable=False, index=True)

    action = Column(String(100), nullable=False)
    from_status = Column(String(50), nullable=True)
    to_status = Column(String(50), nullable=True)
    actor = Column(String(100), nullable=False)  # user_id or "system"
    metadata_ = Column("metadata", JSON, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    loan = relationship("Loan", back_populates="audit_logs")
