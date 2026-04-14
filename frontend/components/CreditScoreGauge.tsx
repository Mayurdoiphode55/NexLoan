"use client";

import React, { useEffect, useState } from "react";

interface CreditScoreGaugeProps {
  score: number;
}

export default function CreditScoreGauge({ score }: CreditScoreGaugeProps) {
  const [animatedScore, setAnimatedScore] = useState(300);

  useEffect(() => {
    // Simple count-up animation
    const duration = 1500;
    const steps = 60;
    const stepDuration = duration / steps;
    const scoreDiff = score - 300;
    const stepValue = scoreDiff / steps;

    let currentStep = 0;
    const timer = setInterval(() => {
      currentStep++;
      if (currentStep >= steps) {
        setAnimatedScore(score);
        clearInterval(timer);
      } else {
        setAnimatedScore(Math.floor(300 + stepValue * currentStep));
      }
    }, stepDuration);

    return () => clearInterval(timer);
  }, [score]);

  // Math for SVG arc (half circle)
  const radius = 80;
  const strokeWidth = 16;
  const circumference = Math.PI * radius; // Half circle

  // Score mapping (300 to 850)
  const minScore = 300;
  const maxScore = 850;
  
  // Calculate percentage of the arc
  const clampedScore = Math.min(Math.max(animatedScore, minScore), maxScore);
  const percentage = (clampedScore - minScore) / (maxScore - minScore);
  
  // Calculate the strokeDashoffset to fill the arc partially
  const strokeDashoffset = circumference - percentage * circumference;

  let color = "#ef4444"; // Red (Poor)
  let statusText = "Poor";
  
  if (clampedScore >= 750) {
    color = "#22c55e"; // Green (Excellent)
    statusText = "Excellent";
  } else if (clampedScore >= 700) {
    color = "#eab308"; // Yellow (Good)
    statusText = "Good";
  } else if (clampedScore >= 600) {
    color = "#f97316"; // Orange (Fair)
    statusText = "Fair";
  }

  return (
    <div className="flex flex-col items-center justify-center p-6 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 transition-all duration-300">
      <h3 className="text-sm font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-4">
        Theoremlabs Credit Score
      </h3>

      <div className="relative w-48 h-28 flex items-end justify-center overflow-hidden">
        {/* Background Arc */}
        <svg
          viewBox="0 0 200 100"
          className="w-full absolute top-0"
          style={{ transform: "rotate(0deg)" }}
        >
          <path
            d="M 20 90 A 80 80 0 0 1 180 90"
            fill="none"
            stroke="currentColor"
            className="text-gray-100 dark:text-slate-700"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />
          {/* Foreground Animated Arc */}
          <path
            d="M 20 90 A 80 80 0 0 1 180 90"
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-300 ease-in-out"
          />
        </svg>

        {/* Text Details Inside Arc */}
        <div className="absolute flex flex-col items-center bottom-2">
          <span className="text-4xl font-black transition-colors duration-500" style={{ color }}>
            {clampedScore}
          </span>
          <span className="text-sm font-medium text-gray-500 dark:text-slate-400 mt-1">{statusText}</span>
        </div>
      </div>

      <div className="flex justify-between w-full text-xs text-gray-400 dark:text-slate-500 mt-4 px-4 font-mono">
        <span>300</span>
        <span>850</span>
      </div>
    </div>

  );
}
