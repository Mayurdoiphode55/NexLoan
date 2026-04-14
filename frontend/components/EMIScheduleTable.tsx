"use client";

import React from "react";
import { payEMI } from "@/lib/api";

interface EMIScheduleRow {
  id: string;
  installment_no: number;
  due_date: string;
  emi_amount: number;
  principal: number;
  interest: number;
  outstanding_balance: number;
  status: "PENDING" | "PAID" | "OVERDUE";
  paid_at: string | null;
}

interface Props {
  loanId: string;
  schedule: EMIScheduleRow[];
  onPaymentSuccess: () => void;
}

export default function EMIScheduleTable({ loanId, schedule, onPaymentSuccess }: Props) {
  const [payingMap, setPayingMap] = React.useState<Record<number, boolean>>({});

  const handlePay = async (installmentNo: number) => {
    try {
      setPayingMap((prev) => ({ ...prev, [installmentNo]: true }));
      await payEMI(loanId, installmentNo);
      onPaymentSuccess();
    } catch (err) {
      console.error(err);
      alert("Failed to process payment. Please try again.");
    } finally {
      setPayingMap((prev) => ({ ...prev, [installmentNo]: false }));
    }
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden transition-all duration-300">
      <div className="p-6 border-b border-gray-100 dark:border-slate-700 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">EMI Schedule</h3>
        <span className="text-sm text-gray-500 dark:text-slate-400 font-medium">
          {schedule.filter(s => s.status === "PAID").length} of {schedule.length} Paid
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-gray-50 dark:bg-slate-900/50 text-gray-600 dark:text-slate-400 font-medium border-b border-gray-100 dark:border-slate-700">
            <tr>
              <th className="py-3 px-6 uppercase tracking-wider text-[10px] font-bold">#</th>
              <th className="py-3 px-6 uppercase tracking-wider text-[10px] font-bold">Due Date</th>
              <th className="py-3 px-6 uppercase tracking-wider text-[10px] font-bold">EMI (₹)</th>
              <th className="py-3 px-6 uppercase tracking-wider text-[10px] font-bold">Principal (₹)</th>
              <th className="py-3 px-6 uppercase tracking-wider text-[10px] font-bold">Interest (₹)</th>
              <th className="py-3 px-6 uppercase tracking-wider text-[10px] font-bold">Balance (₹)</th>
              <th className="py-3 px-6 uppercase tracking-wider text-[10px] font-bold">Status</th>
              <th className="py-3 px-6 uppercase tracking-wider text-[10px] font-bold text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-slate-700 text-gray-700 dark:text-slate-300">
            {schedule.map((row) => (
              <tr key={row.installment_no} className={row.status === "OVERDUE" ? "bg-red-50 dark:bg-red-900/10" : "hover:bg-gray-50 dark:hover:bg-slate-900/30 transition-colors"}>
                <td className="py-4 px-6 font-mono text-gray-500 dark:text-slate-500">{row.installment_no}</td>
                <td className="py-4 px-6 font-medium text-gray-900 dark:text-white">
                  {new Date(row.due_date).toLocaleDateString()}
                </td>
                <td className="py-4 px-6 font-bold text-blue-600 dark:text-blue-400 font-mono">
                  ₹{row.emi_amount.toLocaleString()}
                </td>
                <td className="py-4 px-6 text-gray-500 dark:text-slate-500 font-mono">
                  ₹{row.principal.toLocaleString()}
                </td>
                <td className="py-4 px-6 text-gray-500 dark:text-slate-500 font-mono">
                  ₹{row.interest.toLocaleString()}
                </td>
                <td className="py-4 px-6 font-semibold text-gray-900 dark:text-white font-mono">
                  ₹{row.outstanding_balance.toLocaleString()}
                </td>
                <td className="py-4 px-6">
                  {row.status === "PAID" && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400">
                      Paid
                    </span>
                  )}
                  {row.status === "PENDING" && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-gray-100 dark:bg-slate-700 text-gray-800 dark:text-slate-300">
                      Pending
                    </span>
                  )}
                  {row.status === "OVERDUE" && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400">
                      Overdue
                    </span>
                  )}
                </td>
                <td className="py-4 px-6 text-right">
                  {row.status !== "PAID" && (
                    <button
                      onClick={() => handlePay(row.installment_no)}
                      disabled={payingMap[row.installment_no]}
                      className="bg-blue-600 dark:bg-blue-500 hover:bg-blue-700 dark:hover:bg-blue-600 disabled:bg-blue-400 dark:disabled:bg-slate-700 text-white text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-lg transition-all shadow shadow-blue-500/20 active:scale-95"
                    >
                      {payingMap[row.installment_no] ? "..." : "Pay now"}
                    </button>
                  )}
                  {row.status === "PAID" && row.paid_at && (
                    <span className="text-[10px] text-green-600 dark:text-green-500 font-bold uppercase whitespace-pre-wrap">
                      ✓ Paid on {new Date(row.paid_at).toLocaleDateString()}
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>

  );
}
