"use client";

import * as React from "react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: any[]) {
  return twMerge(clsx(inputs));
}

// ---------------- BUTTONS ----------------
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "destructive" | "icon";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", loading, disabled, children, ...props }, ref) => {
    const sizeClasses = {
      sm: "h-9 px-5 text-button gap-1.5",
      md: "h-11 px-6 text-button gap-2",
      lg: "h-12 px-8 text-button gap-2.5",
    };

    const iconSizeClasses = {
      sm: "h-9 w-9",
      md: "h-11 w-11",
      lg: "h-12 w-12",
    };

    const isIcon = variant === "icon";

    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          "inline-flex items-center justify-center font-medium transition-all duration-200 cursor-pointer select-none",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4c6ee6] focus-visible:ring-offset-2",
          "disabled:opacity-40 disabled:cursor-not-allowed",
          variant === "primary" && "bg-brand text-white rounded-[32px] hover:bg-brand-active",
          variant === "secondary" && "bg-transparent text-text border-b border-border hover:border-text rounded-none px-0 h-auto inline-flex",
          variant === "outline" && "bg-transparent text-text border border-border rounded-[32px] hover:bg-surface",
          variant === "ghost" && "bg-transparent text-muted hover:text-text hover:bg-surface rounded-[32px]",
          variant === "destructive" && "bg-error text-white rounded-[32px] hover:bg-error/90",
          variant === "secondary" && "pb-0.5",
          !isIcon && variant !== "secondary" && sizeClasses[size],
          isIcon && iconSizeClasses[size],
          isIcon && "bg-transparent text-text hover:bg-surface border border-border rounded-[32px]",
          loading && "cursor-wait",
          className
        )}
        {...props}
      >
        {loading ? (
          <svg className="animate-spin -ml-0.5" viewBox="0 0 24 24" fill="none" width={size === "sm" ? 14 : 16} height={size === "sm" ? 14 : 16}>
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="31.4 31.4" strokeLinecap="round" opacity={0.25} />
            <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
          </svg>
        ) : null}
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";

// ---------------- CARDS ----------------
export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "bordered" | "flat" | "brand" | "dark" | "stone";
}

export function Card({ className, variant = "default", ...props }: CardProps) {
  return (
    <div
      className={cn(
        "overflow-hidden",
        variant === "default" && "bg-canvas border border-border rounded-sm",
        variant === "bordered" && "bg-canvas border border-border rounded-sm",
        variant === "flat" && "bg-surface border border-border rounded-sm",
        variant === "brand" && "bg-brand text-white rounded-sm",
        variant === "dark" && "bg-brand text-white rounded-lg border border-white/10",
        variant === "stone" && "bg-surface-alt border border-border/60 rounded-sm",
        className
      )}
      {...props}
    />
  );
}

// ---------------- INPUTS ----------------
export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
  wrapperClassName?: string;
  label?: string;
  hint?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, error, wrapperClassName, label, hint, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, "-");
    return (
      <div className={cn("flex flex-col gap-1.5", wrapperClassName)}>
        {label && (
          <label htmlFor={inputId} className="text-caption text-muted">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={cn(
            "w-full h-10 bg-canvas text-text text-body border border-border-light px-3 py-2.5",
            "focus:outline-none focus:border-[#9b60aa]",
            "placeholder:text-disabled transition-colors duration-150",
            error && "border-error focus:border-error",
            className
          )}
          {...props}
        />
        {hint && !error && <span className="text-caption text-muted">{hint}</span>}
        {error && <span className="text-caption text-error flex items-center gap-1">{error}</span>}
      </div>
    );
  }
);
Input.displayName = "Input";

// ---------------- TEXTAREA ----------------
export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean;
  label?: string;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, error, label, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, "-");
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="text-caption text-muted">{label}</label>
        )}
        <textarea
          ref={ref}
          id={inputId}
          className={cn(
            "w-full bg-canvas text-text text-body border border-border-light px-3 py-2.5 resize-y min-h-[80px]",
            "focus:outline-none focus:border-[#9b60aa]",
            "placeholder:text-disabled transition-colors duration-150",
            error && "border-error focus:border-error",
            className
          )}
          {...props}
        />
      </div>
    );
  }
);
Textarea.displayName = "Textarea";

// ---------------- SELECT ----------------
export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  error?: boolean;
  label?: string;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, error, label, id, children, ...props }, ref) => {
    const selectId = id || label?.toLowerCase().replace(/\s+/g, "-");
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={selectId} className="text-caption text-muted">{label}</label>
        )}
        <select
          ref={ref}
          id={selectId}
          className={cn(
            "w-full h-10 bg-canvas text-text text-body border border-border-light px-3 py-2.5",
            "focus:outline-none focus:border-[#9b60aa]",
            "cursor-pointer transition-colors duration-150 appearance-none",
            "bg-[url('data:image/svg+xml;charset=UTF-8,%3csvg%20xmlns%3d%22http%3a%2f%2fwww.w3.org%2f2000%2fsvg%22%20viewBox%3d%220%200%2020%2020%22%20fill%3d%22%2393939f%22%3e%3cpath%20fill-rule%3d%22evenodd%22%20d%3d%22M5.23%207.21a.75.75%200%20011.06.02L10%2011.168l3.71-3.938a.75.75%200%20111.08%201.04l-4.25%204.5a.75.75%200%2001-1.08%200l-4.25-4.5a.75.75%200%2001.02-1.06z%22%20clip-rule%3d%22evenodd%22%2f%3e%3c%2fsvg%3e')]",
            "bg-[length:20px_20px] bg-[right_10px_center] bg-no-repeat pr-10",
            error && "border-error focus:border-error",
            className
          )}
          {...props}
        >
          {children}
        </select>
      </div>
    );
  }
);
Select.displayName = "Select";

// ---------------- DIALOG ----------------
export interface DialogProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}

export function Dialog({ isOpen, onClose, title, children }: DialogProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-text/30" onClick={onClose} />
      <div
        className="relative bg-canvas border border-border max-w-lg w-full flex flex-col animate-scale-in"
        style={{ paddingTop: "var(--sat, 0px)", paddingBottom: "var(--sab, 0px)" }}
      >
        {title && (
          <div className="flex items-center justify-between px-6 py-4 border-b border-border">
            <h3 className="text-feature-heading text-text">{title}</h3>
            <button
              onClick={onClose}
              className="h-8 w-8 flex items-center justify-center text-muted hover:text-text hover:bg-surface transition-colors cursor-pointer"
              aria-label="Close"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        )}
        <div className="px-6 py-5 overflow-y-auto max-h-[65vh] text-body text-secondary leading-relaxed">
          {children}
        </div>
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-border bg-surface">
          <Button variant="ghost" size="sm" onClick={onClose}>Close</Button>
        </div>
      </div>
    </div>
  );
}

// ---------------- TABLES ----------------
export function Table({ className, ...props }: React.HTMLAttributes<HTMLTableElement>) {
  return (
    <div className="w-full overflow-x-auto">
      <table className={cn("w-full border-collapse text-left", className)} {...props} />
    </div>
  );
}

export function TableHeader({ className, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) {
  return <thead className={cn("border-b border-border", className)} {...props} />;
}

export function TableBody({ className, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) {
  return <tbody className={cn("divide-y divide-border", className)} {...props} />;
}

export function TableRow({ className, ...props }: React.HTMLAttributes<HTMLTableRowElement>) {
  return <tr className={cn("transition-colors", className)} {...props} />;
}

export function TableHead({ className, ...props }: React.ThHTMLAttributes<HTMLTableCellElement>) {
  return <th className={cn("px-4 py-3 text-caption text-muted font-normal", className)} {...props} />;
}

export function TableCell({ className, ...props }: React.TdHTMLAttributes<HTMLTableCellElement>) {
  return <td className={cn("px-4 py-3 text-body text-text align-middle", className)} {...props} />;
}

// ---------------- BADGE ----------------
export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "success" | "warning" | "error" | "info" | "brand" | "coral" | "blue";
  size?: "sm" | "md";
}

export function Badge({ className, variant = "default", size = "md", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 font-medium whitespace-nowrap",
        size === "sm" && "text-micro px-2.5 py-1 rounded-full",
        size === "md" && "text-caption px-3 py-1 rounded-full",
        variant === "default" && "bg-surface text-muted border border-border",
        variant === "coral" && "bg-coral/10 text-coral border border-coral/20",
        variant === "blue" && "bg-blue-soft text-blue border border-blue/20",
        variant === "success" && "bg-success-subtle text-success border border-success/20",
        variant === "warning" && "bg-warning-subtle text-warning border border-warning/20",
        variant === "error" && "bg-error-subtle text-error border border-error/20",
        variant === "info" && "bg-info-subtle text-info border border-info/20",
        variant === "brand" && "bg-brand-soft text-text border border-border",
        className
      )}
      {...props}
    />
  );
}

// ---------------- TABS ----------------
export interface TabsProps {
  tabs: { key: string; label: string }[];
  activeKey: string;
  onChange: (key: string) => void;
  className?: string;
}

export function Tabs({ tabs, activeKey, onChange, className }: TabsProps) {
  return (
    <div className={cn("flex gap-1 border-b border-border", className)}>
      {tabs.map((tab) => (
        <button
          key={tab.key}
          onClick={() => onChange(tab.key)}
          className={cn(
            "px-4 py-3 text-caption transition-colors duration-150 cursor-pointer whitespace-nowrap relative",
            activeKey === tab.key
              ? "text-text"
              : "text-muted hover:text-text"
          )}
        >
          {tab.label}
          {activeKey === tab.key && (
            <div className="absolute bottom-0 left-0 right-0 h-px bg-text" />
          )}
        </button>
      ))}
    </div>
  );
}

// ---------------- EMPTY STATE ----------------
export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center px-4">
      {icon && <div className="w-12 h-12 rounded-full bg-surface flex items-center justify-center text-muted mb-4">{icon}</div>}
      <h3 className="text-feature-heading text-text mb-1">{title}</h3>
      {description && <p className="text-body text-muted max-w-sm mb-4">{description}</p>}
      {action}
    </div>
  );
}

// ---------------- LOADING SKELETON ----------------
export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {}

export function Skeleton({ className, ...props }: SkeletonProps) {
  return <div className={cn("bg-surface-alt animate-pulse-soft", className)} {...props} />;
}

// ---------------- SPINNER ----------------
export function Spinner({ className, size = 20 }: { className?: string; size?: number }) {
  return (
    <svg className={cn("animate-spin text-muted", className)} width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="31.4 31.4" strokeLinecap="round" opacity={0.25} />
      <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

// ---------------- TOOLTIP ----------------
export interface TooltipProps {
  content: string;
  children: React.ReactNode;
}

export function Tooltip({ content, children }: TooltipProps) {
  return (
    <div className="relative group inline-flex">
      {children}
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-brand text-white text-caption whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50">
        {content}
        <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-brand" />
      </div>
    </div>
  );
}
