import React from 'react';
import classNames from 'classnames';

export interface LoadingButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Whether the button is in loading state */
  loading?: boolean;
  /** Loading text to display (optional) */
  loadingText?: string;
  /** Button variant */
  variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'warning';
  /** Button size */
  size?: 'sm' | 'md' | 'lg';
  /** Full width button */
  fullWidth?: boolean;
  /** Icon to display before text */
  icon?: React.ReactNode;
  /** Children (button content) */
  children: React.ReactNode;
}

export const LoadingButton: React.FC<LoadingButtonProps> = ({
  loading = false,
  loadingText,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  icon,
  disabled,
  className,
  children,
  ...props
}) => {
  // Variant classes
  const variantClasses = {
    primary: 'bg-btn-primary text-btn-primary hover:bg-btn-hover border-2 border-btn-primary',
    secondary: 'bg-secondary text-primary border-2 border-secondary hover:bg-tertiary',
    success: 'bg-success text-white border-2 border-success hover:bg-opacity-90',
    danger: 'bg-error text-white border-2 border-error hover:bg-opacity-90',
    warning: 'bg-warning text-white border-2 border-warning hover:bg-opacity-90'
  };

  // Size classes
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg'
  };

  // Combined button classes
  const buttonClasses = classNames(
    // Base classes
    'relative inline-flex items-center justify-center gap-2',
    'rounded-lg font-semibold',
    'transition-all duration-200',
    'focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2',
    'disabled:opacity-50 disabled:cursor-not-allowed',

    // Variant and size
    variantClasses[variant],
    sizeClasses[size],

    // Full width
    fullWidth && 'w-full',

    // Loading state
    loading && 'cursor-wait',

    // Custom className
    className
  );

  return (
    <button
      className={buttonClasses}
      disabled={disabled || loading}
      {...props}
    >
      {/* Loading spinner */}
      {loading && (
        <svg
          className="animate-spin h-5 w-5"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      )}

      {/* Icon (only shown when not loading) */}
      {!loading && icon && <span className="flex-shrink-0">{icon}</span>}

      {/* Button text */}
      <span className={classNames(
        'flex-1 text-center',
        loading && 'opacity-75'
      )}>
        {loading ? (loadingText || children) : children}
      </span>
    </button>
  );
};
