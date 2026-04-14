"""
NexLoan EMI Engine
Handles complex financial math for amortization boundaries, EMI calculation, and settlement quotes.
"""

from typing import List, Dict
from datetime import datetime
from dateutil.relativedelta import relativedelta


def calculate_emi(principal: float, annual_rate: float, tenure_months: int) -> float:
    """
    Standard reducing-balance EMI formula.
    EMI = P * r * (1+r)^n / ((1+r)^n - 1)
    """
    if annual_rate <= 0:
        return principal / tenure_months
        
    r = annual_rate / (12 * 100)
    emi = (principal * r * (1 + r)**tenure_months) / ((1 + r)**tenure_months - 1)
    return round(emi, 2)


def generate_amortization_schedule(
    loan_id: str,
    principal: float, 
    annual_rate: float, 
    tenure_months: int,
    disbursement_date: datetime
) -> List[Dict]:
    """
    Generates a full amortization schedule.
    Returns a list of dictionaries representing each installment.
    """
    emi = calculate_emi(principal, annual_rate, tenure_months)
    r = annual_rate / (12 * 100)
    
    schedule = []
    outstanding_balance = principal
    
    for i in range(1, tenure_months + 1):
        # Calculate interest for the month
        interest = round(outstanding_balance * r, 2)
        
        # Calculate principal component
        principal_comp = round(emi - interest, 2)
        
        # Adjust last month to clear rounding errors perfectly
        if i == tenure_months:
            principal_comp = outstanding_balance
            emi = round(principal_comp + interest, 2)
            outstanding_balance = 0.0
        else:
            outstanding_balance = round(outstanding_balance - principal_comp, 2)
            
        due_date = disbursement_date + relativedelta(months=i)
        
        schedule.append({
            "loan_id": loan_id,
            "installment_no": i,
            "due_date": due_date,
            "emi_amount": emi,
            "principal": principal_comp,
            "interest": interest,
            "outstanding_balance": outstanding_balance,
            "status": "PENDING"
        })
        
    return schedule


def calculate_preclosure(pending_installments: List) -> Dict:
    """
    Calculates the pre-closure / settlement quote for remaining pending installments.
    Takes a list of ORM EMISchedule objects (or dicts).
    """
    # Defensive, handle empty
    if not pending_installments:
        return {
            "outstanding_principal": 0.0,
            "preclosure_charge": 0.0,
            "total_payable": 0.0
        }
    
    # Calculate sum of remaining principal components
    # Handle both ORM objects and dictionaries
    total_principal = 0.0
    for installment in pending_installments:
        if isinstance(installment, dict):
            total_principal += installment.get("principal", 0.0)
        else:
            total_principal += installment.principal
            
    total_principal = round(total_principal, 2)
    
    # Policy: 2% of outstanding principal as pre-closure charge
    preclosure_charge = round(total_principal * 0.02, 2)
    
    return {
        "outstanding_principal": total_principal,
        "preclosure_charge": preclosure_charge,
        "total_payable": round(total_principal + preclosure_charge, 2)
    }
