"use client";

import React from "react";
import { RefreshCw } from "lucide-react";
import { cn } from "./cn";

type LoadingSize = "sm" | "md" | "lg";

interface LoadingProps {
  label?: string;
  size?: LoadingSize;
  className?: string;
  iconClassName?: string;
}

const sizeClasses: Record<LoadingSize, string> = {
  sm: "h-4 w-4",
  md: "h-6 w-6",
  lg: "h-10 w-10",
};

export default function Loading({
  label,
  size = "md",
  className,
  iconClassName,
}: LoadingProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn("flex flex-col items-center justify-center gap-2", className)}
    >
      <RefreshCw
        className={cn("animate-spin text-blue-500", sizeClasses[size], iconClassName)}
      />
      {label ? <span className="text-sm text-gray-600">{label}</span> : null}
    </div>
  );
}
