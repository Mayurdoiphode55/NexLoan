"use client";

import React, { useEffect, useState } from "react";
import { getKYCQueue, approveKYC, rejectKYC, KYCQueueItem, getAdminAnalytics, AnalyticsResponse } from "@/lib/api";
import { useToast } from "@/components/ToastProvider";
import LoanStatusBadge from "@/components/LoanStatusBadge";
import { SkeletonText, SkeletonCard } from "@/components/SkeletonLoader";

export default function AdminPage() {
  const [queue, setQueue] = useState<KYCQueueItem[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedLoan, setExpandedLoan] = useState<string | null>(null);
  const [processingMap, setProcessingMap] = useState<Record<string, string>>({});
  const { addToast } = useToast();

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [queueData, analyticsData] = await Promise.all([
        getKYCQueue(),
        getAdminAnalytics(),
      ]);
      setQueue(queueData);
      setAnalytics(analyticsData);
    } catch (err: unknown) {
      console.error("Failed to load admin data", err);
      setError("Failed to load dashboard data. Make sure the backend is running.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleApprove = async (loanId: string, loanNumber: string) => {
    try {
      setProcessingMap((prev) => ({ ...prev, [loanId]: "approving" }));
      const res = await approveKYC(loanId);
      addToast(`✅ ${loanNumber} approved — ready for underwriting`, "success");
      // Remove from queue
      setQueue((prev) => prev.filter((item) => item.loan_id !== loanId));
    } catch (err) {
      console.error("Failed to approve KYC", err);
      addToast(`Failed to approve ${loanNumber}`, "error");
    } finally {
      setProcessingMap((prev) => {
        const next = { ...prev };
        delete next[loanId];
        return next;
      });
    }
  };

  const handleReject = async (loanId: string, loanNumber: string) => {
    if (!confirm(`Are you sure you want to reject KYC for ${loanNumber}? This cannot be undone.`)) return;
    try {
      setProcessingMap((prev) => ({ ...prev, [loanId]: "rejecting" }));
      const res = await rejectKYC(loanId);
      addToast(`❌ ${loanNumber} rejected`, "error");
      setQueue((prev) => prev.filter((item) => item.loan_id !== loanId));
    } catch (err) {
      console.error("Failed to reject KYC", err);
      addToast(`Failed to reject ${loanNumber}`, "error");
    } finally {
      setProcessingMap((prev) => {
        const next = { ...prev };
        delete next[loanId];
        return next;
      });
    }
  };

  const toggleExpand = (loanId: string) => {
    setExpandedLoan((prev) => (prev === loanId ? null : loanId));
  };

  return (
    <div className="bg-gray-50 dark:bg-slate-900 transition-colors duration-500">
      {/* Header */}
      <div className="bg-white dark:bg-slate-800 border-b border-gray-100 dark:border-slate-700 shadow-sm">
        <div className="max-w-6xl mx-auto px-6 py-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">
              Admin Dashboard
            </h1>
            <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">
              KYC Manual Review Queue • Theoremlabs Internal
            </p>
          </div>
          <div className="flex items-center gap-4">
            <span className="bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400 text-xs font-bold px-3 py-1.5 rounded-full border border-yellow-200 dark:border-yellow-800 uppercase tracking-widest">
              {queue.length} Pending
            </span>
            <button
              onClick={fetchDashboardData}
              disabled={loading}
              className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors disabled:opacity-50"
            >
              ↻ Refresh
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Error State */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-700 dark:text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
            </div>
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 p-6 animate-pulse">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <SkeletonText className="w-40 h-5" />
                    <SkeletonText className="w-60 h-3" />
                  </div>
                  <div className="flex gap-3">
                    <SkeletonText className="w-20 h-8 rounded-lg" />
                    <SkeletonText className="w-20 h-8 rounded-lg" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Analytics Dashboard */}
        {!loading && !error && analytics && (
          <div className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Platfom Overview</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 p-6 shadow-sm">
                <h3 className="text-sm font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-2">Total Loans</h3>
                <p className="text-3xl font-black text-blue-600 dark:text-blue-400">{analytics.total_loans}</p>
              </div>
              <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 p-6 shadow-sm">
                <h3 className="text-sm font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-2">Approval Rate</h3>
                <p className="text-3xl font-black text-green-600 dark:text-green-400">{analytics.approval_rate}%</p>
              </div>
              <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 p-6 shadow-sm">
                <h3 className="text-sm font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-2">Total Revenue</h3>
                <p className="text-3xl font-black text-purple-600 dark:text-purple-400">₹{analytics.total_revenue.toLocaleString()}</p>
              </div>
              <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 p-6 shadow-sm">
                <h3 className="text-sm font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-2">Active Loans</h3>
                <p className="text-3xl font-black text-indigo-600 dark:text-indigo-400">{analytics.status_breakdown["ACTIVE"] || 0}</p>
              </div>
            </div>
            
            {/* Status Breakdown Bar */}
            <div className="mt-6 bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 p-6 shadow-sm">
              <h3 className="text-sm font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-4">Status Breakdown</h3>
              <div className="flex w-full h-8 rounded-full overflow-hidden mb-4 bg-gray-100 dark:bg-slate-700">
                {Object.entries(analytics.status_breakdown).map(([status, count]) => {
                  const percentage = (count / analytics.total_loans) * 100;
                  if (percentage === 0) return null;
                  
                  let colorClass = "bg-gray-400";
                  if (status === "ACTIVE" || status === "DISBURSED") colorClass = "bg-blue-500";
                  if (status === "APPROVED") colorClass = "bg-green-500";
                  if (status === "REJECTED") colorClass = "bg-red-500";
                  if (status === "INQUIRY" || status === "APPLICATION") colorClass = "bg-purple-500";
                  if (status === "KYC_PENDING" || status === "KYC_VERIFIED") colorClass = "bg-yellow-500";
                  if (status === "CLOSED" || status === "PRE_CLOSED") colorClass = "bg-teal-500";
                  
                  return (
                    <div 
                      key={status} 
                      className={`h-full ${colorClass} transition-all hover:opacity-80 relative group`}
                      style={{ width: `${percentage}%` }}
                      title={`${status}: ${count}`}
                    />
                  );
                })}
              </div>
              <div className="flex flex-wrap gap-4 text-xs font-semibold text-gray-600 dark:text-gray-300">
                 {Object.entries(analytics.status_breakdown).map(([status, count]) => (
                   <div key={status} className="flex items-center gap-1.5">
                     <span className={`w-2.5 h-2.5 rounded-full ${
                        status === "ACTIVE" || status === "DISBURSED" ? "bg-blue-500" :
                        status === "APPROVED" ? "bg-green-500" :
                        status === "REJECTED" ? "bg-red-500" :
                        status === "INQUIRY" || status === "APPLICATION" ? "bg-purple-500" :
                        status === "KYC_PENDING" || status === "KYC_VERIFIED" ? "bg-yellow-500" :
                        status === "CLOSED" || status === "PRE_CLOSED" ? "bg-teal-500" : "bg-gray-400"
                     }`} />
                     {status} ({count})
                   </div>
                 ))}
              </div>
            </div>
          </div>
        )}

        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Pending KYC Queue</h2>
        {/* Empty State */}
        {!loading && !error && queue.length === 0 && (
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 p-16 text-center">
            <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">All Clear!</h2>
            <p className="text-gray-500 dark:text-slate-400">No loans pending KYC review. All applications have been processed.</p>
          </div>
        )}

        {/* Queue Items */}
        {!loading && queue.length > 0 && (
          <div className="space-y-4">
            {queue.map((item) => {
              const isExpanded = expandedLoan === item.loan_id;
              const isProcessing = !!processingMap[item.loan_id];

              return (
                <div
                  key={item.loan_id}
                  className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm overflow-hidden transition-all duration-300 hover:shadow-md"
                >
                  {/* Row Header */}
                  <div className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div
                      className="flex-1 cursor-pointer"
                      onClick={() => toggleExpand(item.loan_id)}
                    >
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                          {item.applicant_name}
                        </h3>
                        <LoanStatusBadge status="KYC_PENDING" />
                      </div>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-500 dark:text-slate-400">
                        <span className="font-mono font-bold text-blue-600 dark:text-blue-400">{item.loan_number}</span>
                        <span>•</span>
                        <span>₹{item.loan_amount.toLocaleString()}</span>
                        <span>•</span>
                        <span>{item.tenure_months}mo</span>
                        <span>•</span>
                        <span>{item.applicant_email}</span>
                      </div>
                      <div className="mt-2 flex items-center gap-2">
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                          item.ai_verdict === "MANUAL_REVIEW"
                            ? "bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400"
                            : item.ai_verdict === "FAIL"
                            ? "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400"
                            : "bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-400"
                        }`}>
                          AI: {item.ai_verdict || "N/A"}
                        </span>
                        {item.ai_remarks && (
                          <span className="text-xs text-gray-400 dark:text-slate-500 italic truncate max-w-[300px]">
                            "{item.ai_remarks}"
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <button
                        onClick={() => toggleExpand(item.loan_id)}
                        className="text-xs font-bold text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-white bg-gray-100 dark:bg-slate-900 px-3 py-2 rounded-lg transition-all"
                      >
                        {isExpanded ? "▲ Collapse" : "▼ View Docs"}
                      </button>
                      <button
                        onClick={() => handleApprove(item.loan_id, item.loan_number)}
                        disabled={isProcessing}
                        className="bg-green-600 dark:bg-green-700 hover:bg-green-700 dark:hover:bg-green-600 disabled:bg-green-400 dark:disabled:bg-slate-700 text-white text-xs font-black uppercase tracking-widest px-5 py-2.5 rounded-xl transition-all shadow shadow-green-500/20 active:scale-95"
                      >
                        {processingMap[item.loan_id] === "approving" ? "..." : "Approve"}
                      </button>
                      <button
                        onClick={() => handleReject(item.loan_id, item.loan_number)}
                        disabled={isProcessing}
                        className="bg-red-600 dark:bg-red-700 hover:bg-red-700 dark:hover:bg-red-600 disabled:bg-red-400 dark:disabled:bg-slate-700 text-white text-xs font-black uppercase tracking-widest px-5 py-2.5 rounded-xl transition-all shadow shadow-red-500/20 active:scale-95"
                      >
                        {processingMap[item.loan_id] === "rejecting" ? "..." : "Reject"}
                      </button>
                    </div>
                  </div>

                  {/* Expanded Document Preview */}
                  {isExpanded && (
                    <div className="border-t border-gray-100 dark:border-slate-700 bg-gray-50 dark:bg-slate-900 p-6 animate-in fade-in slide-in-from-top-2 duration-300">
                      <h4 className="text-xs font-black text-gray-500 dark:text-slate-500 uppercase tracking-widest mb-4">
                        Document Analysis
                      </h4>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* PAN Card */}
                        <div className="space-y-3">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-gray-800 dark:text-white">PAN Card</span>
                            {item.pan_legible !== null && (
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                                item.pan_legible
                                  ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                                  : "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400"
                              }`}>
                                {item.pan_legible ? "Legible" : "Not Legible"}
                              </span>
                            )}
                          </div>

                          {item.pan_doc_url ? (
                            <div className="border dark:border-slate-700 rounded-xl overflow-hidden bg-white dark:bg-slate-800 shadow-inner">
                              <img
                                src={item.pan_doc_url}
                                alt="PAN Card"
                                className="w-full h-48 object-contain bg-gray-100 dark:bg-slate-900"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = "";
                                  (e.target as HTMLImageElement).alt = "Failed to load image";
                                }}
                              />
                            </div>
                          ) : (
                            <div className="border dark:border-slate-700 rounded-xl bg-gray-100 dark:bg-slate-800 h-48 flex items-center justify-center">
                              <span className="text-sm text-gray-400 dark:text-slate-600">No document uploaded</span>
                            </div>
                          )}

                          <div className="text-xs space-y-1 text-gray-500 dark:text-slate-400">
                            <p><span className="font-bold">Extracted Name:</span> {item.pan_name_extracted || "N/A"}</p>
                          </div>
                        </div>

                        {/* Aadhaar Card */}
                        <div className="space-y-3">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-gray-800 dark:text-white">Aadhaar Card</span>
                            {item.aadhaar_legible !== null && (
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                                item.aadhaar_legible
                                  ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                                  : "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400"
                              }`}>
                                {item.aadhaar_legible ? "Legible" : "Not Legible"}
                              </span>
                            )}
                            {item.aadhaar_photo_present !== null && (
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                                item.aadhaar_photo_present
                                  ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400"
                                  : "bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-400"
                              }`}>
                                {item.aadhaar_photo_present ? "Photo ✓" : "No Photo"}
                              </span>
                            )}
                          </div>

                          {item.aadhaar_doc_url ? (
                            <div className="border dark:border-slate-700 rounded-xl overflow-hidden bg-white dark:bg-slate-800 shadow-inner">
                              <img
                                src={item.aadhaar_doc_url}
                                alt="Aadhaar Card"
                                className="w-full h-48 object-contain bg-gray-100 dark:bg-slate-900"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = "";
                                  (e.target as HTMLImageElement).alt = "Failed to load image";
                                }}
                              />
                            </div>
                          ) : (
                            <div className="border dark:border-slate-700 rounded-xl bg-gray-100 dark:bg-slate-800 h-48 flex items-center justify-center">
                              <span className="text-sm text-gray-400 dark:text-slate-600">No document uploaded</span>
                            </div>
                          )}

                          <div className="text-xs space-y-1 text-gray-500 dark:text-slate-400">
                            <p><span className="font-bold">Extracted Name:</span> {item.aadhaar_name_extracted || "N/A"}</p>
                          </div>
                        </div>
                      </div>

                      {/* Application Details */}
                      <div className="mt-6 pt-4 border-t border-gray-200 dark:border-slate-800">
                        <h4 className="text-xs font-black text-gray-500 dark:text-slate-500 uppercase tracking-widest mb-3">
                          Application Details
                        </h4>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="block text-gray-400 dark:text-slate-500 text-xs mb-0.5">Amount</span>
                            <span className="font-bold text-gray-900 dark:text-white">₹{item.loan_amount.toLocaleString()}</span>
                          </div>
                          <div>
                            <span className="block text-gray-400 dark:text-slate-500 text-xs mb-0.5">Tenure</span>
                            <span className="font-bold text-gray-900 dark:text-white">{item.tenure_months} months</span>
                          </div>
                          <div>
                            <span className="block text-gray-400 dark:text-slate-500 text-xs mb-0.5">Purpose</span>
                            <span className="font-bold text-gray-900 dark:text-white">{item.purpose || "N/A"}</span>
                          </div>
                          <div>
                            <span className="block text-gray-400 dark:text-slate-500 text-xs mb-0.5">Applied On</span>
                            <span className="font-bold text-gray-900 dark:text-white">
                              {item.created_at ? new Date(item.created_at).toLocaleDateString() : "N/A"}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Footer Note */}
        <div className="mt-12 text-center">
          <p className="text-xs text-gray-400 dark:text-slate-600 uppercase tracking-widest font-bold">
            ⚠️ Prototype Mode — No Authentication Guard on Admin Endpoints
          </p>
        </div>
      </div>
    </div>
  );
}
