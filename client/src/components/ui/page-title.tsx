import React from "react";

interface PageTitleProps {
  children: React.ReactNode;
  className?: string;
}

export function PageTitle({ children, className }: PageTitleProps) {
  return (
    <h1 className={`text-3xl font-bold mb-6 text-neutral-900 ${className || ""}`}>
      {children}
    </h1>
  );
}