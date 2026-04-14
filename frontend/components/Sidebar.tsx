"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);
  const [userName, setUserName] = useState("User");

  useEffect(() => {
    // Check local storage for user info
    const userData = localStorage.getItem("nexloan_user");
    if (userData) {
      try {
        const user = JSON.parse(userData);
        setUserName(user.full_name || "User");
        
        // Define which email has admin privileges from .env or default to a predefined specific email structure
        const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL || "mitesh@theoremlabs.com";
        setIsAdmin(user.email?.toLowerCase() === adminEmail.toLowerCase());
      } catch (err) {
        console.error("Failed to parse user data", err);
      }
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("nexloan_token");
    localStorage.removeItem("nexloan_user");
    router.push("/");
  };

  const navLinks = [
    { name: "My Dashboard", path: "/dashboard", icon: "📊" },
    { name: "Apply for Loan", path: "/apply", icon: "📝" },
  ];

  if (isAdmin) {
    navLinks.push({ name: "Admin Dashboard", path: "/admin", icon: "🛡️" });
  }

  return (
    <div className="w-64 bg-white dark:bg-slate-800 border-r border-gray-100 dark:border-slate-700 h-screen flex flex-col transition-colors duration-500 shadow-sm sticky top-0">
      <div className="p-6">
        <h1 className="text-2xl font-bold text-blue-600 dark:text-blue-400">NexLoan</h1>
        <p className="text-xs text-gray-400 font-medium tracking-wider uppercase mt-1">
          Welcome, {userName.split(" ")[0]}
        </p>
      </div>

      <nav className="flex-1 px-4 space-y-2 mt-4">
        {navLinks.map((link) => {
          const isActive = pathname === link.path;
          return (
            <Link
              key={link.path}
              href={link.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-medium ${
                isActive
                  ? "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 shadow-sm"
                  : "text-gray-600 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-700/50 hover:text-gray-900 dark:hover:text-white"
              }`}
            >
              <span className="text-lg">{link.icon}</span>
              {link.name}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-gray-100 dark:border-slate-700">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-4 py-3 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all duration-200 font-medium"
        >
          <span className="text-lg">🚪</span>
          Log Out
        </button>
      </div>
    </div>
  );
}
