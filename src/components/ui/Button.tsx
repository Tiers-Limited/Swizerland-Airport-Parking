import { forwardRef, ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'success';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  loading?: boolean; // alias for isLoading (pages sometimes pass `loading`)
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      loading, // alias
      leftIcon,
      rightIcon,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const loadingState = !!(isLoading || loading);
    const baseStyles = `
      inline-flex items-center justify-center font-medium rounded-xl 
      transition-all duration-200 focus:outline-none focus-visible:ring-2 
      focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed
    `;

    const variants = {
      primary: `
        bg-baby-blue-500 text-white hover:bg-baby-blue-600 
        focus-visible:ring-baby-blue-500 shadow-blue-glow hover:shadow-lg
      `,
      secondary: `
        bg-white text-gray-700 border border-gray-200 
        hover:bg-gray-50 hover:border-gray-300 focus-visible:ring-gray-500
      `,
      ghost: `
        bg-transparent text-gray-600 hover:bg-gray-100 
        focus-visible:ring-gray-500
      `,
      danger: `
        bg-error-500 text-white hover:bg-error-600 
        focus-visible:ring-error-500
      `,
      success: `
        bg-success-500 text-white hover:bg-success-600 
        focus-visible:ring-success-500
      `,
    };

    const sizes = {
      sm: 'px-3 py-1.5 text-xs',
      md: 'px-4 py-2.5 text-sm',
      lg: 'px-6 py-3 text-base',
    };

    return (
      <button
        ref={ref}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        disabled={disabled || loadingState}
        {...props}
      >
        {loadingState ? (
          <>
            <svg
              className="animate-spin -ml-1 mr-2 h-4 w-4"
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
            Loading...
          </>
        ) : (
          <>
            {leftIcon && <span className="mr-2">{leftIcon}</span>}
            {children}
            {rightIcon && <span className="ml-2">{rightIcon}</span>}
          </>
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';

export default Button;
