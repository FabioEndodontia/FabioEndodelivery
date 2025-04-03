import React from "react";

interface PageTitleProps {
  children?: React.ReactNode;
  className?: string;
  title?: string;
  description?: string;
}

export function PageTitle({ children, className, title, description }: PageTitleProps) {
  return (
    <div className="mb-6">
      <h1 className={`text-3xl font-bold text-neutral-900 ${className || ""}`}>
        {title || children}
      </h1>
      {description && (
        <p className="text-neutral-600 mt-1">{description}</p>
      )}
    </div>
  );
}