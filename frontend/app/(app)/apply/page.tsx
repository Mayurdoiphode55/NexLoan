'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import KYCUpload from '@/components/KYCUpload';
import LoanStatusBadge from '@/components/LoanStatusBadge';
import { createInquiry, uploadKYC } from '@/lib/api';

export default function ApplyPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [loanData, setLoanData] = useState<any>(null);
  
  // Auth User Data
  const [user, setUser] = useState<any>(null);
  
  useEffect(() => {
    // Load user from localStorage immediately
    const userData = localStorage.getItem('nexloan_user');
    if (userData) {
      setUser(JSON.parse(userData));
    } else {
      router.push('/');
    }
  }, [router]);

  // Step 1 & 2 forms
  const [formData, setFormData] = useState({
    date_of_birth: '',
    employment_type: 'SALARIED',
    loan_amount: 100000,
    purpose: 'Other',
    tenure_months: 36,
    monthly_income: 50000,
    existing_emi: 0,
  });

  // Step 3 forms
  const [panFile, setPanFile] = useState<File | null>(null);
  const [aadhaarFile, setAadhaarFile] = useState<File | null>(null);
  const [kycResult, setKycResult] = useState<any>(null);

  // Live EMI Calculator (Estimate)
  const calculateEstimateEMI = () => {
    const P = formData.loan_amount;
    const r = 15 / (12 * 100); // generic 15% rate for estimate
    const n = formData.tenure_months;
    if (P === 0 || n === 0) return 0;
    const emi = (P * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
    return Math.round(emi);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'number' || type === 'range' ? Number(value) : value,
    }));
  };

  const handleSubmitStep2 = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (!formData.date_of_birth) throw new Error("Date of Birth is required");
      
      // Combine with user data
      const inquiryPayload = {
        loan_amount: formData.loan_amount,
        tenure_months: formData.tenure_months,
        purpose: formData.purpose,
        monthly_income: formData.monthly_income,
        employment_type: formData.employment_type,
        existing_emi: formData.existing_emi,
        date_of_birth: formData.date_of_birth + "T00:00:00Z" // Fast API datetime format
      };

      const response = await createInquiry(inquiryPayload);
      setLoanData(response);
      setStep(3); // Move to KYC
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || "Failed to create inquiry");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitKYC = async () => {
    if (!panFile || !aadhaarFile) {
      setError("Please upload both PAN and Aadhaar cards.");
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await uploadKYC(loanData.loan_id, panFile, aadhaarFile);
      setKycResult(response);
      setStep(4); // Move to Confirmation
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || "Failed to upload KYC");
    } finally {
      setLoading(false);
    }
  };

  if (!user) return <div className="min-h-screen bg-white dark:bg-slate-900 flex text-blue-600 justify-center items-center">Loading...</div>;

  return (
    <div className="bg-gray-50 dark:bg-slate-900 flex py-12 px-4 sm:px-6 lg:px-8 transition-colors duration-500">
      <div className="max-w-3xl w-full mx-auto">
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-gray-100 dark:border-slate-700 overflow-hidden transition-all">
          
          {/* Header & Progress Bar */}
          <div className="bg-blue-600 dark:bg-blue-700 p-6 text-white">
            <h1 className="text-2xl font-bold">Loan Application</h1>
            <p className="opacity-80">Secure & AI verified • {user.full_name}</p>
            
            <div className="mt-6 flex items-center justify-between relative">
              <div className="absolute left-0 top-1/2 -mt-px w-full h-1 bg-blue-400 dark:bg-blue-800 rounded"></div>
              {[1, 2, 3, 4].map((s) => (
                <div key={s} className="relative z-10 flex flex-col items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shadow transition-all duration-300 ${step >= s ? 'bg-white text-blue-600 scale-110' : 'bg-blue-800 text-blue-200'}`}>
                    {s}
                  </div>
                  <span className={`mt-2 text-[10px] uppercase tracking-wider font-bold absolute -bottom-6 w-24 text-center ${step >= s ? 'text-white' : 'text-blue-300'}`}>
                    {s === 1 ? 'Personal' : s === 2 ? 'Loan Detail' : s === 3 ? 'KYC' : 'Confirm'}
                  </span>
                </div>
              ))}
            </div>
            <div className="mb-6"></div>
          </div>

          <div className="p-8">
            {error && (
              <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 text-red-700 dark:text-red-400 rounded shadow-sm transition-all animate-in fade-in slide-in-from-top-2">
                <p className="font-medium text-sm">Error</p>
                <p className="text-xs opacity-90">{error}</p>
              </div>
            )}

            {/* STEP 1: Personal Details */}
            {step === 1 && (
              <form onSubmit={() => setStep(2)} className="space-y-6 animate-in fade-in">
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white border-b dark:border-slate-700 pb-2 mb-6">Personal Details</h3>
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-400 mb-1 ml-1">Full Name</label>
                      <input type="text" value={user.full_name} disabled className="mt-1 block w-full rounded-lg border-transparent bg-gray-100 dark:bg-slate-900 text-gray-500 dark:text-slate-500 shadow-inner sm:text-sm px-4 py-2.5" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-400 mb-1 ml-1">Email Address</label>
                      <input type="email" value={user.email} disabled className="mt-1 block w-full rounded-lg border-transparent bg-gray-100 dark:bg-slate-900 text-gray-500 dark:text-slate-500 shadow-inner sm:text-sm px-4 py-2.5" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-400 mb-1 ml-1">Mobile Number</label>
                      <input type="text" value={user.mobile} disabled className="mt-1 block w-full rounded-lg border-transparent bg-gray-100 dark:bg-slate-900 text-gray-500 dark:text-slate-500 shadow-inner sm:text-sm px-4 py-2.5" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-400 mb-1 ml-1">Date of Birth</label>
                      <input required type="date" name="date_of_birth" value={formData.date_of_birth} onChange={handleInputChange} className="mt-1 block w-full rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-gray-900 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-4 py-2" />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-400 mb-1 ml-1">Employment Type</label>
                      <select name="employment_type" value={formData.employment_type} onChange={handleInputChange} className="mt-1 block w-full rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-gray-900 dark:text-white py-2.5 pl-3 pr-10 text-base focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm transition-all appearance-none cursor-pointer">
                        <option value="SALARIED">Salaried</option>
                        <option value="BUSINESS">Business</option>
                        <option value="SELF_EMPLOYED">Self Employed</option>
                        <option value="OTHER">Other</option>
                      </select>
                    </div>
                  </div>
                </div>
                <div className="flex justify-end pt-6 border-t dark:border-slate-700">
                  <button type="submit" className="bg-blue-600 dark:bg-blue-500 text-white px-10 py-3 rounded-xl font-bold hover:bg-blue-700 dark:hover:bg-blue-600 shadow-lg shadow-blue-500/30 transition-all active:scale-95">
                    Next Step
                  </button>
                </div>
              </form>
            )}

            {/* STEP 2: Loan Details */}
            {step === 2 && (
              <form onSubmit={handleSubmitStep2} className="space-y-8 animate-in fade-in slide-in-from-right-4 transition-all duration-300">
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white border-b dark:border-slate-700 pb-2 mb-8">Loan Requirements</h3>
                  
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    
                    {/* Amount & Tenure Inputs */}
                    <div className="sm:col-span-2 space-y-12">
                      
                      {/* Loan Amount */}
                      <div>
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-400 ml-1">How much do you need?</label>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-semibold">₹</span>
                            <input 
                              type="number" 
                              name="loan_amount"
                              min="50000" 
                              max="10000000"
                              value={formData.loan_amount}
                              onChange={handleInputChange}
                              className="pl-8 pr-4 py-2.5 w-full sm:w-56 text-xl font-bold text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-900/20 border-transparent rounded-xl focus:ring-2 focus:ring-blue-500 text-right shadow-inner"
                            />
                          </div>
                        </div>
                        <input 
                          type="range" 
                          name="loan_amount" 
                          min="50000" 
                          max="10000000" 
                          step="10000" 
                          value={formData.loan_amount} 
                          onChange={handleInputChange} 
                          className="w-full h-2 bg-gray-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-600 transition-all" 
                        />
                        <div className="flex justify-between text-[10px] uppercase tracking-widest font-bold text-gray-400 dark:text-slate-500 mt-2 ml-1">
                          <span>₹50,000</span>
                          <span>₹1,00,00,000 (1 Cr)</span>
                        </div>
                      </div>

                      {/* Tenure */}
                      <div>
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-400 ml-1">For how long? (Months)</label>
                          <div className="relative">
                            <input 
                              type="number" 
                              name="tenure_months"
                              min="6" 
                              max="120"
                              value={formData.tenure_months}
                              onChange={handleInputChange}
                              className="pr-12 pl-4 py-2.5 w-full sm:w-40 text-xl font-bold text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-900/20 border-transparent rounded-xl focus:ring-2 focus:ring-blue-500 text-right shadow-inner"
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-400 dark:text-blue-600 text-[10px] font-bold">MO</span>
                          </div>
                        </div>
                        <input 
                          type="range" 
                          name="tenure_months" 
                          min="6" 
                          max="120" 
                          step="6" 
                          value={formData.tenure_months} 
                          onChange={handleInputChange} 
                          className="w-full h-2 bg-gray-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-600 transition-all" 
                        />
                        <div className="flex justify-between text-[10px] uppercase tracking-widest font-bold text-gray-400 dark:text-slate-500 mt-2 ml-1">
                          <span>6 Months</span>
                          <span>120 Months (10 Years)</span>
                        </div>
                      </div>

                    </div>

                    {/* EMI Estimator Card */}
                    <div className="sm:col-span-2 bg-blue-600 dark:bg-blue-700 rounded-2xl p-8 flex flex-col sm:flex-row items-center justify-between shadow-xl shadow-blue-500/20">
                      <div>
                        <h4 className="text-sm font-bold text-blue-100 uppercase tracking-widest">Estimated Monthly EMI</h4>
                        <p className="text-xs text-blue-200/60 mt-1 italic">Based on ~15% p.a. standard rate</p>
                      </div>
                      <div className="text-4xl font-black tracking-tight text-white mt-4 sm:mt-0">
                        ₹{calculateEstimateEMI().toLocaleString('en-IN')}
                      </div>
                    </div>

                    {/* Financials & Purpose */}
                    <div className="pt-4 sm:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-400 mb-1 ml-1">Monthly Income (₹)</label>
                        <input required type="number" name="monthly_income" placeholder="50000" min="15000" value={formData.monthly_income} onChange={handleInputChange} className="mt-1 block w-full rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-gray-900 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-4 py-2.5" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-400 mb-1 ml-1">Existing EMIs (₹) <span className="opacity-50 font-normal italic">Optional</span></label>
                        <input type="number" name="existing_emi" min="0" value={formData.existing_emi} onChange={handleInputChange} className="mt-1 block w-full rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-gray-900 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-4 py-2.5" />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-400 mb-1 ml-1">Loan Purpose</label>
                        <select name="purpose" value={formData.purpose} onChange={handleInputChange} className="mt-1 block w-full rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-gray-900 dark:text-white py-2.5 pl-3 pr-10 text-base focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm appearance-none cursor-pointer">
                          <option value="Medical">Medical Emergency</option>
                          <option value="Education">Education</option>
                          <option value="Wedding">Wedding</option>
                          <option value="Home Renovation">Home Renovation</option>
                          <option value="Travel">Travel</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-between pt-8 border-t dark:border-slate-700">
                  <button type="button" onClick={() => setStep(1)} className="text-gray-600 dark:text-slate-400 bg-gray-100 dark:bg-slate-900 hover:bg-gray-200 dark:hover:bg-slate-800 px-8 py-3 rounded-xl font-bold transition-all">
                    Back
                  </button>
                  <button type="submit" disabled={loading} className="bg-blue-600 dark:bg-blue-500 text-white px-10 py-3 rounded-xl font-bold hover:bg-blue-700 dark:hover:bg-blue-600 shadow-lg shadow-blue-500/30 disabled:opacity-70 transition-all flex items-center active:scale-95">
                    {loading ? (
                      <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-3" /> Processing...</>
                    ) : 'Continue to KYC'}
                  </button>
                </div>
              </form>
            )}

            {/* STEP 3: KYC Upload */}
            {step === 3 && (
              <div className="space-y-6 animate-in fade-in zoom-in-95 duration-500">
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white border-b dark:border-slate-700 pb-2 mb-4">Identity Verification</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-8 italic">
                    Our AI-vision system will instantly verify your identity documents. Please ensure clear, well-lit images.
                  </p>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                    <KYCUpload 
                      label="Upload PAN Card" 
                      onFileSelect={(file) => setPanFile(file)} 
                    />
                    
                    <KYCUpload 
                      label="Upload Aadhaar Card" 
                      onFileSelect={(file) => setAadhaarFile(file)} 
                    />
                  </div>
                </div>

                <div className="flex justify-between pt-8 border-t dark:border-slate-700">
                  <button type="button" disabled={loading} onClick={() => setStep(2)} className="text-gray-600 dark:text-slate-400 bg-gray-100 dark:bg-slate-900 hover:bg-gray-200 dark:hover:bg-slate-800 px-8 py-3 rounded-xl font-bold transition-all disabled:opacity-50">
                    Back
                  </button>
                  <button 
                    onClick={handleSubmitKYC} 
                    disabled={loading || !panFile || !aadhaarFile} 
                    className="bg-blue-600 dark:bg-blue-500 text-white px-10 py-3 rounded-xl font-bold hover:bg-blue-700 dark:hover:bg-blue-600 shadow-lg shadow-blue-500/30 disabled:bg-gray-400 dark:disabled:bg-slate-700 transition-all active:scale-95"
                  >
                    {loading ? (
                      <div className="flex items-center">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-3" />
                        AI Verifying...
                      </div>
                    ) : 'Submit for Verification'}
                  </button>
                </div>
              </div>
            )}

            {/* STEP 4: Confirmation */}
            {step === 4 && (
              <div className="text-center py-10 animate-in zoom-in fade-in duration-700">
                <div className="mx-auto flex items-center justify-center h-24 w-24 rounded-full bg-green-100 dark:bg-green-900/30 mb-8 shadow-inner">
                  <svg className="h-12 w-12 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h2 className="text-3xl font-black text-gray-900 dark:text-white mb-2 tracking-tight">Application Received!</h2>
                <p className="text-lg text-gray-600 dark:text-gray-400 max-w-md mx-auto mb-10">
                  Success! Your documents are being processed by our underwriting engine.
                </p>

                <div className="bg-gray-50 dark:bg-slate-900 border border-gray-100 dark:border-slate-700 rounded-2xl p-8 max-w-sm mx-auto mb-10 shadow-inner text-left space-y-5">
                  <div className="flex justify-between items-center border-b dark:border-slate-800 pb-4">
                    <span className="text-gray-500 dark:text-slate-500 font-bold text-[10px] uppercase tracking-widest">Loan Reference</span>
                    <span className="font-extrabold font-mono text-blue-900 dark:text-blue-400">{loanData?.loan_number}</span>
                  </div>
                  <div className="flex justify-between items-center pb-2">
                    <span className="text-gray-500 dark:text-slate-500 font-bold text-[10px] uppercase tracking-widest">Verification Status</span>
                    {kycResult && <LoanStatusBadge status={kycResult.verdict === 'PASS' ? 'KYC_VERIFIED' : 'KYC_PENDING'} />}
                  </div>
                  {kycResult?.remarks && (
                    <div className="pt-2">
                      <span className="block text-[10px] font-black text-gray-400 uppercase mb-2 tracking-tighter">AI Analysis Remarks</span>
                      <p className="text-xs text-gray-600 dark:text-slate-400 italic border-l-4 pl-3 border-gray-200 dark:border-slate-800 leading-relaxed font-medium">"{kycResult.remarks}"</p>
                    </div>
                  )}
                </div>

                <div className="space-y-6">
                  <p className="text-xs text-gray-400 dark:text-slate-500 font-medium">Our underwriting engine will process this momentarily.</p>
                  <button 
                    onClick={() => router.push('/dashboard')} 
                    className="w-full sm:w-auto bg-blue-600 dark:bg-blue-500 text-white px-12 py-4 rounded-xl font-black text-lg hover:bg-blue-700 dark:hover:bg-blue-600 shadow-2xl shadow-blue-500/40 transition-all transform hover:-translate-y-1 active:translate-y-0"
                  >
                    Go to Dashboard
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}
