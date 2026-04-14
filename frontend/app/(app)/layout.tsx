"use client";

import React from "react";
import Sidebar from "@/components/Sidebar";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex bg-gray-50 dark:bg-slate-900 min-h-screen">
      <Sidebar />
      <div className="flex-1 overflow-x-hidden flex flex-col h-screen overflow-y-auto">
        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}
