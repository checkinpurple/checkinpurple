import React from "react";

interface LogoProps {
  compact?: boolean;
  className?: string;
}

export default function Logo({ compact = false, className = "" }: LogoProps) {
  if (compact) {
    return (
      <div className={`inline-flex items-center justify-center ${className}`}>
        <span className="text-2xl font-black tracking-tight text-transparent bg-gradient-to-r from-primary to-accent bg-clip-text">
          CP
        </span>
      </div>
    );
  }

  return (
    <div className={`inline-flex items-center justify-center ${className}`}>
      <span className="text-xl sm:text-2xl font-black tracking-tight text-transparent bg-gradient-to-r from-primary to-accent bg-clip-text">
        CheckinPurple
      </span>
    </div>
  );
}
