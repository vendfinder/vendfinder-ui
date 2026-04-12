'use client';

import Link from 'next/link';
import { cn } from '@/lib/utils';

type Variant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps {
  children: React.ReactNode;
  href?: string;
  variant?: Variant;
  size?: Size;
  className?: string;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
  onClick?: () => void;
  fullWidth?: boolean;
}

const variantStyles: Record<Variant, string> = {
  primary:
    'bg-primary text-white font-bold hover:bg-primary-dark shadow-[0_0_20px_rgba(232,136,58,0.2)] hover:shadow-[0_0_30px_rgba(232,136,58,0.3)]',
  secondary: 'bg-card text-foreground hover:bg-card-hover border border-border',
  outline:
    'border-2 border-border text-foreground hover:border-primary hover:text-primary',
  ghost: 'text-muted hover:text-foreground hover:bg-surface',
  danger: 'bg-error text-white hover:bg-red-700',
};

const sizeStyles: Record<Size, string> = {
  sm: 'px-4 py-2 text-sm',
  md: 'px-6 py-2.5 text-sm',
  lg: 'px-8 py-3 text-base',
};

export default function Button({
  children,
  href,
  variant = 'primary',
  size = 'md',
  className,
  disabled,
  type = 'button',
  onClick,
  fullWidth,
}: ButtonProps) {
  const classes = cn(
    'inline-flex items-center justify-center font-semibold rounded-lg transition-all duration-200 cursor-pointer',
    variantStyles[variant],
    sizeStyles[size],
    fullWidth && 'w-full',
    disabled && 'opacity-50 cursor-not-allowed',
    className
  );

  if (href && !disabled) {
    return (
      <Link href={href} className={classes}>
        {children}
      </Link>
    );
  }

  return (
    <button
      type={type}
      className={classes}
      disabled={disabled}
      onClick={onClick}
    >
      {children}
    </button>
  );
}
