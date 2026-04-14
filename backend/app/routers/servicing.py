"""
NexLoan Servicing Router
Handles EMI schedule fetching, payments, and loan summaries.
"""

import logging
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy import select, asc, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.utils.database import get_db
from app.utils.auth import get_current_user
from app.models.loan import User, Loan, LoanStatus, EMISchedule, PaymentStatus

logger = logging.getLogger("nexloan.servicing")

router = APIRouter()


class PaymentResponse(BaseModel):
    message: str
    installment_no: int
    amount_paid: float


@router.get(
    "/{loan_id}/schedule",
    summary="Get full EMI schedule with statuses"
)
async def get_schedule(
    loan_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Returns all EMI rows ordered by installment_no."""
    # Verify ownership
    stmt = select(Loan).where(Loan.id == loan_id, Loan.user_id == current_user.id)
    result = await db.execute(stmt)
    if not result.scalars().first():
        raise HTTPException(status_code=404, detail="Loan not found")

    sched_stmt = select(EMISchedule).where(EMISchedule.loan_id == loan_id).order_by(asc(EMISchedule.installment_no))
    sched_result = await db.execute(sched_stmt)
    
    return sched_result.scalars().all()


@router.post(
    "/{loan_id}/pay/{installment_no}",
    response_model=PaymentResponse,
    summary="Simulate EMI payment"
)
async def pay_emi(
    loan_id: str,
    installment_no: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Simulates a successful EMI payment.
    Updates EMISchedule row to PAID and increments Loan total_paid.
    """
    # Verify ownership and status
    stmt = select(Loan).where(Loan.id == loan_id, Loan.user_id == current_user.id)
    result = await db.execute(stmt)
    loan = result.scalars().first()
    
    if not loan or loan.status != LoanStatus.ACTIVE:
        raise HTTPException(status_code=400, detail="Loan not active or not found")

    # Fetch specific installment
    sched_stmt = select(EMISchedule).where(
        EMISchedule.loan_id == loan_id,
        EMISchedule.installment_no == installment_no
    )
    sched_result = await db.execute(sched_stmt)
    installment = sched_result.scalars().first()
    
    if not installment:
        raise HTTPException(status_code=404, detail="Installment not found")
        
    if installment.status == PaymentStatus.PAID:
        raise HTTPException(status_code=400, detail="Installment already paid")
        
    # Update Installment
    installment.status = PaymentStatus.PAID
    installment.paid_at = datetime.utcnow()
    installment.paid_amount = installment.emi_amount
    
    # Update Loan total_paid
    loan.total_paid = (loan.total_paid or 0.0) + installment.emi_amount
    
    await db.commit()
    logger.info(f"💰 Payment received: ₹{installment.emi_amount} for Loan {loan.loan_number} (Installment #{installment_no})")
    
    return PaymentResponse(
        message="Payment successful",
        installment_no=installment_no,
        amount_paid=installment.emi_amount
    )


@router.get(
    "/{loan_id}/summary",
    summary="Get outstanding balance, next due date, and paid count"
)
async def get_summary(
    loan_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Returns a high-level summary of the loan's servicing state."""
    stmt = select(Loan).where(Loan.id == loan_id, Loan.user_id == current_user.id)
    result = await db.execute(stmt)
    loan = result.scalars().first()
    
    if not loan:
        raise HTTPException(status_code=404, detail="Loan not found")
        
    # Find next pending installment
    next_stmt = select(EMISchedule).where(
        EMISchedule.loan_id == loan_id,
        EMISchedule.status == PaymentStatus.PENDING
    ).order_by(asc(EMISchedule.installment_no))
    next_result = await db.execute(next_stmt)
    next_installment = next_result.scalars().first()
    
    # Count total paid installments
    paid_stmt = select(func.count(EMISchedule.id)).where(
        EMISchedule.loan_id == loan_id,
        EMISchedule.status == PaymentStatus.PAID
    )
    paid_result = await db.execute(paid_stmt)
    paid_count = paid_result.scalar()
    
    return {
        "loan_id": loan_id,
        "loan_number": loan.loan_number,
        "status": loan.status.value,
        "total_paid": loan.total_paid or 0.0,
        "paid_installments": paid_count,
        "total_installments": loan.tenure_months,
        "next_due_date": next_installment.due_date if next_installment else None,
        "next_emi_amount": next_installment.emi_amount if next_installment else 0.0,
        "outstanding_principal_on_schedule": next_installment.outstanding_balance if next_installment else 0.0
    }
