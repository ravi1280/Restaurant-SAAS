import React from 'react';

type ButtonVariant = 'accent' | 'secondary' | 'ghost' | 'danger' | 'success';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  children: React.ReactNode;
}

export function Button({
  variant = 'accent',
  size = 'md',
  loading = false,
  children,
  className = '',
  disabled,
  ...props
}: ButtonProps) {
  const base = 'inline-flex items-center justify-center gap-2 font-medium rounded-xl transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-accent/50 active:scale-95 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100';

  const variants: Record<ButtonVariant, string> = {
    accent: 'bg-accent text-white hover:bg-accent/90 border border-accent/50',
    secondary: 'bg-transparent text-primary border border-border hover:bg-elevated hover:border-accent/50',
    ghost: 'bg-transparent text-muted hover:text-primary hover:bg-elevated border border-transparent',
    danger: 'bg-danger/10 text-danger border border-danger/30 hover:bg-danger/20',
    success: 'bg-success/10 text-success border border-success/30 hover:bg-success/20',
  };

  const sizes: Record<ButtonSize, string> = {
    sm: 'px-3 py-1.5 text-sm h-8',
    md: 'px-4 py-2 text-sm h-10',
    lg: 'px-6 py-3 text-base h-12',
  };

  return (
    <button
      disabled={disabled || loading}
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {loading ? (
        <>
          <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
          Processing...
        </>
      ) : children}
    </button>
  );
}
