export type LoanStatus = 
  | 'INQUIRY' 
  | 'APPLICATION' 
  | 'KYC_PENDING' 
  | 'KYC_VERIFIED' 
  | 'UNDERWRITING' 
  | 'APPROVED' 
  | 'REJECTED' 
  | 'DISBURSED' 
  | 'ACTIVE' 
  | 'PRE_CLOSED' 
  | 'CLOSED';

export type PaymentStatus = 'PENDING' | 'PAID' | 'OVERDUE';

export type EmploymentType = 'SALARIED' | 'SELF_EMPLOYED' | 'BUSINESS' | 'OTHER';

export interface User {
  id: string;
  full_name: string;
  email: string;
  mobile: string;
  is_verified: boolean;
  created_at: string;
}

export interface KYCDetails {
  id: string;
  pan_number?: string;
  aadhaar_number?: string;
  ai_verdict?: 'PASS' | 'FAIL' | 'MANUAL_REVIEW';
  ai_remarks?: string;
}

export interface EMISchedule {
  id: string;
  installment_no: number;
  due_date: string;
  emi_amount: number;
  principal: number;
  interest: number;
  outstanding_balance: number;
  status: PaymentStatus;
  paid_at?: string;
  paid_amount?: number;
}

export interface Loan {
  id: string;
  user_id: string;
  loan_number: string;
  status: LoanStatus;
  loan_amount?: number;
  tenure_months?: number;
  purpose?: string;
  monthly_income?: number;
  employment_type?: EmploymentType;
  existing_emi?: number;
  credit_score?: number;
  interest_rate?: number;
  dti_ratio?: number;
  approved_amount?: number;
  rejection_reason?: string;
  emi_amount?: number;
  disbursed_at?: string;
  disbursed_amount?: number;
  account_number?: string;
  closed_at?: string;
  preclosure_charge?: number;
  total_paid?: number;
  created_at: string;
  updated_at: string;
  
  // Included relations (if expanded)
  user?: User;
  kyc_document?: KYCDetails;
  emi_schedule?: EMISchedule[];
}
