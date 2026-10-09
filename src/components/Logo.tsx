import React from "react";

interface LogoProps {
  size?: number;
  className?: string;
}

export const Logo: React.FC<LogoProps> = ({ size = 36, className = "" }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ display: "block" }}
    >
      <defs>
        <linearGradient id="bookEasyLogoGradient" x1="10" y1="10" x2="90" y2="90" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#a855f7" />
          <stop offset="50%" stopColor="#6366f1" />
          <stop offset="100%" stopColor="#06b6d4" />
        </linearGradient>
      </defs>

      {/* Calendar Outer Border & Body */}
      <rect
        x="15"
        y="22"
        width="70"
        height="66"
        rx="16"
        stroke="url(#bookEasyLogoGradient)"
        strokeWidth="11"
        fill="none"
      />

      {/* Top Binder Pins */}
      <rect x="28" y="10" width="10" height="20" rx="5" fill="url(#bookEasyLogoGradient)" />
      <rect x="62" y="10" width="10" height="20" rx="5" fill="url(#bookEasyLogoGradient)" />

      {/* Checkmark Breaking Out Top-Right */}
      <path
        d="M28 52 L48 72 L94 30 L80 18 L48 50 L38 40 Z"
        fill="url(#bookEasyLogoGradient)"
      />
    </svg>
  );
};

export default Logo;
