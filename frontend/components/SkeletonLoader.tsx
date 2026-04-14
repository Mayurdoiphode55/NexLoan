"use client";

import React from "react";

/**
 * Pulsing skeleton line — used for text placeholders.
 */
export function SkeletonText({ className = "" }: { className?: string }) {
  return (
    <div
      className={`h-4 bg-gray-200 dark:bg-slate-700 rounded-md animate-pulse ${className}`}
    />
  );
}

/**
 * Pulsing skeleton card — used for dashboard card placeholders.
 */
export function SkeletonCard() {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 p-6 space-y-4 animate-pulse">
      <div className="flex justify-between items-center">
        <SkeletonText className="w-40 h-5" />
        <SkeletonText className="w-20 h-5 rounded-full" />
      </div>
      <SkeletonText className="w-32 h-3" />
      <div className="grid grid-cols-2 gap-4 pt-2">
        <div className="space-y-2">
          <SkeletonText className="w-24 h-3" />
          <SkeletonText className="w-32 h-7" />
        </div>
        <div className="space-y-2">
          <SkeletonText className="w-24 h-3" />
          <SkeletonText className="w-28 h-7" />
        </div>
        <div className="space-y-2">
          <SkeletonText className="w-20 h-3" />
          <SkeletonText className="w-24 h-5" />
        </div>
        <div className="space-y-2">
          <SkeletonText className="w-20 h-3" />
          <SkeletonText className="w-24 h-5" />
        </div>
      </div>
      <SkeletonText className="w-full h-20 rounded-xl mt-2" />
    </div>
  );
}

/**
 * Pulsing skeleton for the credit score gauge area.
 */
export function SkeletonGauge() {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 p-6 flex flex-col items-center justify-center space-y-4 animate-pulse">
      <SkeletonText className="w-36 h-3" />
      <div className="w-48 h-28 bg-gray-200 dark:bg-slate-700 rounded-full" />
      <div className="flex justify-between w-full px-4">
        <SkeletonText className="w-8 h-3" />
        <SkeletonText className="w-8 h-3" />
      </div>
    </div>
  );
}

/**
 * Skeleton row for the EMI table.
 */
export function SkeletonTableRow() {
  return (
    <tr className="animate-pulse">
      <td className="py-4 px-6"><SkeletonText className="w-6 h-4" /></td>
      <td className="py-4 px-6"><SkeletonText className="w-20 h-4" /></td>
      <td className="py-4 px-6"><SkeletonText className="w-16 h-4" /></td>
      <td className="py-4 px-6"><SkeletonText className="w-16 h-4" /></td>
      <td className="py-4 px-6"><SkeletonText className="w-16 h-4" /></td>
      <td className="py-4 px-6"><SkeletonText className="w-20 h-4" /></td>
      <td className="py-4 px-6"><SkeletonText className="w-14 h-5 rounded-full" /></td>
      <td className="py-4 px-6"><SkeletonText className="w-16 h-6 rounded-lg" /></td>
    </tr>
  );
}

/**
 * Full skeleton table for the EMI schedule.
 */
export function SkeletonTable({ rows = 5 }: { rows?: number }) {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden">
      <div className="p-6 border-b border-gray-100 dark:border-slate-700 flex items-center justify-between animate-pulse">
        <SkeletonText className="w-28 h-5" />
        <SkeletonText className="w-20 h-4" />
      </div>
      <table className="w-full">
        <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
          {Array.from({ length: rows }).map((_, i) => (
            <SkeletonTableRow key={i} />
          ))}
        </tbody>
      </table>
    </div>
  );
}
