"use client";

import React, { useEffect, useState } from "react";
import { getMyLoans, runUnderwriting, disburseLoan, getSchedule, getPreclosureQuote, closeLoan, getAuditTrail, AuditLogItem, downloadReport } from "@/lib/api";
import LoanStatusBadge from "@/components/LoanStatusBadge";
import CreditScoreGauge from "@/components/CreditScoreGauge";
import EMIScheduleTable from "@/components/EMIScheduleTable";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ToastProvider";
import { SkeletonCard, SkeletonGauge, SkeletonTable } from "@/components/SkeletonLoader";

export default function DashboardPage() {
  const { addToast } = useToast();
  const [loan, setLoan] = useState<any>(null);
  const [schedule, setSchedule] = useState<any[]>([]);
  const [quote, setQuote] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [loadingSchedule, setLoadingSchedule] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [auditTrail, setAuditTrail] = useState<AuditLogItem[]>([]);
  const [showKFS, setShowKFS] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const fetchLoan = async () => {
      try {
        const token = localStorage.getItem("nexloan_token");
        if (!token) {
          router.push("/");
          return;
        }

        const loans = await getMyLoans();
        if (loans && loans.length > 0) {
          const activeLoan = loans[0];
          setLoan(activeLoan);
          
          if (activeLoan.status === "ACTIVE") {
            setLoadingSchedule(true);
            try {
              const sched = await getSchedule(activeLoan.id);
              setSchedule(sched);
            } catch (err) {
              console.error("Failed to load schedule", err);
            } finally {
              setLoadingSchedule(false);
            }
          }

          // Fetch Audit Trail
          try {
            const logs = await getAuditTrail(activeLoan.id);
            setAuditTrail(logs);
          } catch(err) {
            console.error("Failed to load audit trail", err);
          }
        }
      } catch (err) {
        console.error("Failed to load loans", err);
      } finally {
        setLoading(false);
      }
    };
    fetchLoan();
  }, [router]);

  const handleRunUnderwriting = async () => {
    try {
      setProcessing(true);
      await runUnderwriting(loan.id);
      window.location.reload(); // Quick refresh to load new state
    } catch (err) {
      console.error("Failed to run underwriting", err);
      addToast("Failed to run underwriting. Loan may not be in KYC_VERIFIED status.", "error");
    } finally {
      setProcessing(false);
    }
  };

  const handleDisburse = async () => {
    try {
      setProcessing(true);
      await disburseLoan(loan.id);
      window.location.reload(); // Quick refresh to load new state & fetch schedule
    } catch (err) {
      console.error("Failed to disburse loan", err);
      addToast("Failed to disburse loan. Cannot generate schedule.", "error");
    } finally {
      setProcessing(false);
    }
  };

  const reloadSchedule = async () => {
    try {
      const sched = await getSchedule(loan.id);
      setSchedule(sched);
      // Reset quote if they make a payment
      setQuote(null);
    } catch (err) {
       console.error("Failed to load schedule", err);
    }
  };

  const handleGetQuote = async () => {
    try {
      setProcessing(true);
      const data = await getPreclosureQuote(loan.id);
      setQuote(data);
    } catch (err) {
      console.error("Failed to get quote", err);
      addToast("Failed to get pre-closure quote.", "error");
    } finally {
      setProcessing(false);
    }
  };

  const handleCloseLoan = async () => {
    if (!confirm("Are you sure you want to completely settle and close this loan?")) return;
    try {
      setProcessing(true);
      await closeLoan(loan.id);
      window.location.reload();
    } catch (err) {
      console.error("Failed to close loan", err);
      addToast("Failed to process loan closure.", "error");
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900 p-6 transition-colors duration-500">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div className="h-8 w-48 bg-gray-200 dark:bg-slate-700 rounded-lg animate-pulse" />
            <div className="h-6 w-24 bg-gray-200 dark:bg-slate-700 rounded-full animate-pulse" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <SkeletonCard />
            <div className="flex flex-col gap-6">
              <SkeletonGauge />
              <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 p-6 animate-pulse">
                <div className="h-3 w-28 bg-gray-200 dark:bg-slate-700 rounded mb-3" />
                <div className="h-8 w-20 bg-gray-200 dark:bg-slate-700 rounded" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!loan) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900 p-6">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">Dashboard</h1>
          <div className="bg-white dark:bg-slate-800 p-8 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 text-center">
            <p className="text-gray-500 dark:text-gray-400 mb-4">You do not have any active loans.</p>
            <button
              onClick={() => router.push("/apply")}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition"
            >
              Apply Now
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 pb-20 transition-colors duration-500">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Your Dashboard</h1>
            {loan && (
              <button 
                onClick={() => downloadReport(loan.id, loan.loan_number)}
                className="mt-2 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium flex items-center gap-1 transition"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                Download PDF Report
              </button>
            )}
          </div>
          <LoanStatusBadge status={loan.status} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Main Loan Summary */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 p-6 flex flex-col justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                Loan Reference: {loan.loan_number}
              </h2>
              <p className="text-gray-500 dark:text-gray-400 mb-6 text-sm">Created on {new Date(loan.created_at).toLocaleDateString()}</p>

              <div className="grid grid-cols-2 gap-6 mb-6">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Requested Amount</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">₹{loan.loan_amount.toLocaleString()}</p>
                </div>
                {loan.approved_amount && (
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Approved Amount</p>
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">₹{loan.approved_amount.toLocaleString()}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Tenure</p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">{loan.tenure_months} Months</p>
                </div>
                {loan.interest_rate && (
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Interest Rate</p>
                    <p className="text-lg font-semibold text-blue-600 dark:text-blue-400">{loan.interest_rate}% p.a.</p>
                  </div>
                )}
              </div>
            </div>

            {(loan.status === "KYC_VERIFIED" || loan.status === "KYC_PENDING") && (
              <div className="p-4 bg-orange-50 dark:bg-orange-950/20 border border-orange-100 dark:border-orange-900/50 rounded-xl mt-4">
                <h3 className="font-semibold text-orange-800 dark:text-orange-300 mb-1">Underwriting Required</h3>
                <p className="text-sm text-orange-600 dark:text-orange-400/80 mb-3">
                  This loan is ready for automated risk evaluation. Click below to simulate the backend underwriting process.
                </p>
                <button
                  onClick={handleRunUnderwriting}
                  disabled={processing}
                  className="w-full bg-orange-600 dark:bg-orange-700 hover:bg-orange-700 dark:hover:bg-orange-600 disabled:bg-orange-400 text-white font-medium py-2 rounded-lg transition"
                >
                  {processing ? "Evaluating..." : "Run Underwriting Engine"}
                </button>
              </div>
            )}

            {loan.status === "APPROVED" && (
              <div className="p-4 bg-green-50 dark:bg-green-950/20 border border-green-100 dark:border-green-900/50 rounded-xl mt-4">
                <h3 className="font-semibold text-green-800 dark:text-green-300 mb-1">Loan Ready for Disbursement</h3>
                <p className="text-sm text-green-600 dark:text-green-400/80 mb-3">
                  Please review the terms. Once you accept, the loan will be disbursed and the EMI schedule generated.
                </p>
                <button
                  onClick={() => setShowKFS(true)}
                  disabled={processing}
                  className="w-full bg-green-600 dark:bg-green-700 hover:bg-green-700 dark:hover:bg-green-600 disabled:bg-green-400 text-white font-medium py-2 rounded-lg transition"
                >
                  Review Key Fact Statement (KFS)
                </button>
              </div>
            )}

            {loan.status === "ACTIVE" && (
              <div className="p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/50 rounded-xl mt-4">
                <h3 className="font-semibold text-blue-800 dark:text-blue-300 mb-1">Loan is Active</h3>
                <p className="text-sm text-blue-600 dark:text-blue-400/80">
                  Your loan was successfully disbursed on {new Date(loan.disbursed_at).toLocaleDateString()}. Check your EMI schedule below.
                </p>
                <div className="mt-4 pt-4 border-t border-blue-200 dark:border-blue-800">
                  {!quote ? (
                    <button
                      onClick={handleGetQuote}
                      disabled={processing}
                      className="text-sm text-blue-700 dark:text-blue-300 bg-white dark:bg-slate-900 hover:bg-blue-100 dark:hover:bg-blue-900/30 font-medium py-1.5 px-4 rounded border border-blue-200 dark:border-blue-800 transition"
                    >
                      {processing ? "Loading..." : "Get Pre-closure Quote"}
                    </button>
                  ) : (
                    <div className="bg-white dark:bg-slate-900 p-4 rounded border border-blue-200 dark:border-blue-800 shadow-inner">
                      <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Settlement Quote</h4>
                      <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400 mb-4">
                        <div className="flex justify-between">
                          <span>Outstanding Principal:</span>
                          <span className="font-medium text-gray-900 dark:text-white">₹{quote.outstanding_principal.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Pre-closure Fee (2%):</span>
                          <span className="font-medium inline-block pb-1 border-b border-gray-300 dark:border-slate-700 text-gray-900 dark:text-white">₹{quote.preclosure_charge.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-gray-900 dark:text-white font-bold mt-1 pt-1">
                          <span>Total Payable:</span>
                          <span>₹{quote.total_payable.toLocaleString()}</span>
                        </div>
                      </div>
                      <button
                        onClick={handleCloseLoan}
                        disabled={processing}
                        className="w-full bg-blue-600 dark:bg-blue-700 hover:bg-blue-700 dark:hover:bg-blue-600 disabled:bg-blue-400 text-white font-medium py-2 rounded transition shadow-lg shadow-blue-500/20"
                      >
                        {processing ? "Processing..." : "Confirm & Settle Loan"}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {(loan.status === "CLOSED" || loan.status === "PRE_CLOSED") && (
              <div className="p-4 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900/50 rounded-xl mt-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xl">🏆</span>
                  <h3 className="font-semibold text-green-800 dark:text-green-300">Loan Successfully Closed</h3>
                </div>
                <p className="text-sm text-green-700 dark:text-green-400/80 mb-2">
                  This loan was successfully settled on {new Date(loan.closed_at).toLocaleDateString()}.
                </p>
                <p className="text-sm text-green-700 dark:text-green-400 font-medium">
                  We have emailed your official No-Dues Certificate to your registered email address.
                </p>
              </div>
            )}

            {loan.status === "REJECTED" && loan.rejection_reason && (
              <div className="p-4 bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/50 rounded-xl mt-4">
                <h3 className="font-semibold text-red-800 dark:text-red-300 mb-1">Loan Rejected</h3>
                <p className="text-sm text-red-600 dark:text-red-400/80">{loan.rejection_reason}</p>
              </div>
            )}
          </div>

          {/* Underwriting Metrics / Credit Score */}
          <div className="flex flex-col gap-6">
            {loan.credit_score ? (
              <CreditScoreGauge score={loan.credit_score} />
            ) : (
              <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 p-6 flex items-center justify-center h-48">
                <p className="text-gray-400 dark:text-slate-500 italic">Underwriting not completed yet.</p>
              </div>
            )}

            {/* DTI Readout */}
            {loan.dti_ratio !== null && (
              <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 p-6">
                <h3 className="text-sm font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-3">
                  Debt-to-Income (DTI)
                </h3>
                <div className="flex items-end gap-2">
                  <span className={`text-3xl font-bold ${(loan.dti_ratio * 100) > 40 ? "text-red-500" : "text-green-500"}`}>
                    {(loan.dti_ratio * 100).toFixed(1)}%
                  </span>
                  <span className="text-sm text-gray-500 dark:text-slate-500 mb-1">of monthly income</span>
                </div>
              </div>
            )}
            
            {/* Audit Trail Timeline */}
            {auditTrail.length > 0 && (
              <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 p-6">
                <h3 className="text-sm font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-4">
                  Audit Trail
                </h3>
                <div className="relative border-l-2 border-gray-200 dark:border-slate-700 ml-3 space-y-4">
                  {auditTrail.map((log) => (
                    <div key={log.id} className="relative pl-6">
                      <div className="absolute w-3 h-3 bg-blue-500 rounded-full -left-[7px] top-1.5 ring-4 ring-white dark:ring-slate-800" />
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">{log.action}</p>
                      <p className="text-xs text-gray-500 dark:text-slate-400">
                        {new Date(log.created_at).toLocaleString()}
                        {log.actor && ` • by ${log.actor}`}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {loan.status === "ACTIVE" && (
          <div className="mt-8 transition-all duration-300">
            {loadingSchedule ? (
              <SkeletonTable rows={6} />
            ) : (
              <EMIScheduleTable 
                loanId={loan.id} 
                schedule={schedule} 
                onPaymentSuccess={reloadSchedule} 
              />
            )}
          </div>
        )}

        {/* Cooling-off Period Button */}
        {loan.status === "ACTIVE" && loan.disbursed_at && (
          (new Date().getTime() - new Date(loan.disbursed_at).getTime()) <= 3 * 24 * 60 * 60 * 1000
        ) && (
          <div className="mt-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-400 rounded-r-lg shadow-sm">
            <h3 className="font-semibold text-yellow-800 dark:text-yellow-400">Cooling-off Period Active</h3>
            <p className="text-sm text-yellow-700 dark:text-yellow-500 mb-3">
              As per RBI Guidelines, you have 3 days from disbursement to cancel this loan without any pre-closure charges. You only pay the principal and proportionate interest.
            </p>
            <button 
              onClick={handleCloseLoan}
              disabled={processing}
              className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-md text-sm font-medium transition"
            >
              Cancel Loan (Cooling-off)
            </button>
          </div>
        )}

        {/* RBI DLA Disclosure Footer */}
        <div className="mt-12 text-center py-6 border-t border-gray-200 dark:border-slate-800">
          <p className="text-xs text-gray-500 dark:text-slate-500">
            <strong>Regulatory Disclosure:</strong> This loan is originated by <strong>Theoremlabs Lending Private Limited</strong>, an RBI-registered Non-Banking Financial Company (NBFC).<br/>
            NexLoan acts purely as a Digital Lending App (DLA) facilitating the transaction. User data is processed strictly as per Digital Lending Guidelines.
          </p>
        </div>

      </div>

      {/* KFS Modal */}
      {showKFS && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-gray-100 dark:border-slate-700">
            <div className="p-6 border-b border-gray-100 dark:border-slate-700 sticky top-0 bg-white dark:bg-slate-800 flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Key Fact Statement (KFS)</h2>
                <p className="text-sm text-gray-500 dark:text-slate-400">Standard RBI Format for Digital Lending</p>
              </div>
              <button onClick={() => setShowKFS(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="bg-gray-50 dark:bg-slate-900 p-4 rounded-xl border border-gray-100 dark:border-slate-700">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-4 border-b border-gray-200 dark:border-slate-700 pb-2">1. Loan Details</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="text-gray-500 dark:text-slate-400">Loan Amount:</div>
                  <div className="font-medium text-right text-gray-900 dark:text-white">₹{loan.approved_amount?.toLocaleString()}</div>
                  <div className="text-gray-500 dark:text-slate-400">Tenure:</div>
                  <div className="font-medium text-right text-gray-900 dark:text-white">{loan.tenure_months} Months</div>
                  <div className="text-gray-500 dark:text-slate-400">Interest Rate:</div>
                  <div className="font-medium text-right text-gray-900 dark:text-white">{loan.interest_rate}% p.a.</div>
                  <div className="text-gray-500 dark:text-slate-400">Processing Fee:</div>
                  <div className="font-medium text-right text-gray-900 dark:text-white">₹0.00</div>
                  <div className="text-gray-500 dark:text-slate-400 mt-2 font-semibold">Net Disbursed Amount:</div>
                  <div className="font-bold text-right text-green-600 dark:text-green-400 mt-2">₹{loan.approved_amount?.toLocaleString()}</div>
                </div>
              </div>

              <div className="bg-gray-50 dark:bg-slate-900 p-4 rounded-xl border border-gray-100 dark:border-slate-700">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2 border-b border-gray-200 dark:border-slate-700 pb-2">2. Annual Percentage Rate (APR)</h3>
                <p className="text-sm text-gray-600 dark:text-slate-400">
                  The Annual Percentage Rate (APR) represents the true cost of borrowing. For this loan, the APR is exactly the interest rate of <strong>{loan.interest_rate}%</strong> as there are no hidden fees.
                </p>
              </div>

              <div className="bg-gray-50 dark:bg-slate-900 p-4 rounded-xl border border-gray-100 dark:border-slate-700">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2 border-b border-gray-200 dark:border-slate-700 pb-2">3. Penalties & Recovery</h3>
                <ul className="list-disc pl-5 text-sm text-gray-600 dark:text-slate-400 space-y-1">
                  <li>Late Payment Penalty: 2% of overdue EMI amount per month.</li>
                  <li>Pre-closure Charge: 0% (As per RBI guidelines for floating rate / user choice).</li>
                  <li>Recovery Mechanism: Direct auto-debit / standard collection processes in accordance with Fair Practices Code.</li>
                </ul>
              </div>

              <div className="bg-gray-50 dark:bg-slate-900 p-4 rounded-xl border border-gray-100 dark:border-slate-700">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2 border-b border-gray-200 dark:border-slate-700 pb-2">4. Cooling-off Period & Grievance</h3>
                <ul className="list-disc pl-5 text-sm text-gray-600 dark:text-slate-400 space-y-1">
                  <li><strong>Cooling-off Period:</strong> You may cancel this loan within 3 days of disbursement by paying only the principal and proportionate interest. No penalty will be charged.</li>
                  <li><strong>Grievance Redressal Officer:</strong> Mayur (grievance@theoremlabs.com | 1800-123-4567)</li>
                  <li><strong>Regulated Entity:</strong> Theoremlabs Lending Private Limited.</li>
                </ul>
              </div>
            </div>

            <div className="p-6 border-t border-gray-100 dark:border-slate-700 bg-gray-50 dark:bg-slate-800/50 flex justify-end gap-3 rounded-b-2xl">
              <button 
                onClick={() => setShowKFS(false)}
                className="px-6 py-2.5 rounded-xl font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-700 transition"
              >
                Cancel
              </button>
              <button 
                onClick={() => {
                  setShowKFS(false);
                  handleDisburse();
                }}
                disabled={processing}
                className="px-6 py-2.5 rounded-xl font-medium bg-green-600 text-white hover:bg-green-700 flex items-center transition disabled:opacity-50"
              >
                {processing ? "Processing..." : "I Accept the KFS & Terms"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>

  );
}
