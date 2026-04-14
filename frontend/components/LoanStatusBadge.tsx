import React from 'react';

type LoanStatus = 
  | "INQUIRY" | "APPLICATION" | "KYC_PENDING" | "KYC_VERIFIED"
  | "UNDERWRITING" | "APPROVED" | "REJECTED" | "DISBURSED" 
  | "ACTIVE" | "PRE_CLOSED" | "CLOSED";

interface LoanStatusBadgeProps {
  status: LoanStatus | string;
}

export default function LoanStatusBadge({ status }: LoanStatusBadgeProps) {
  const getBadgeStyle = () => {
    switch (status) {
      case 'INQUIRY':
      case 'APPLICATION':
        return 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400 border-blue-200 dark:border-blue-800';
      case 'KYC_PENDING':
      case 'UNDERWRITING':
        return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800';
      case 'KYC_VERIFIED':
      case 'APPROVED':
        return 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800';
      case 'DISBURSED':
      case 'ACTIVE':
        return 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800';
      case 'REJECTED':
        return 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400 border-red-200 dark:border-red-800';
      case 'PRE_CLOSED':
      case 'CLOSED':
        return 'bg-gray-100 dark:bg-slate-700 text-gray-800 dark:text-slate-300 border-gray-200 dark:border-slate-600';
      default:
        return 'bg-gray-100 dark:bg-slate-700 text-gray-800 dark:text-slate-300 border-gray-200 dark:border-slate-600';
    }
  };

  const getStatusLabel = () => {
    return status.replace('_', ' ');
  };

  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getBadgeStyle()}`}>
      {getStatusLabel()}
    </span>
  );
}
