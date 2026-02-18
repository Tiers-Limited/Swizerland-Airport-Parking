import { forwardRef, InputHTMLAttributes, useId } from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      type = 'text',
      label,
      error,
      helperText,
      leftIcon,
      rightIcon,
      id,
      ...props
    },
    ref
  ) => {
    const generatedId = useId();
    const inputId = id || generatedId;

    // normalize `value` so React never receives `null` for the input value
    const { value: propValue, ...restProps } = props as InputHTMLAttributes<HTMLInputElement>;
    const normalizedValue = propValue === null ? '' : propValue;

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-gray-700 mb-1.5"
          >
            {label}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              {leftIcon}
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            type={type}
            className={cn(
              `w-full px-4 py-2.5 text-sm bg-white border rounded-xl
              placeholder:text-gray-400 focus:outline-none transition-all duration-200`,
              error
                ? 'border-error-500 focus:border-error-500 focus:ring-2 focus:ring-error-100'
                : 'border-gray-200 focus:border-baby-blue-500 focus:ring-2 focus:ring-baby-blue-100',
              leftIcon && 'pl-10',
              rightIcon && 'pr-10',
              className
            )}
            value={normalizedValue}
            {...restProps}
          />
          {rightIcon && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
              {rightIcon}
            </div>
          )}
        </div>
        {error && <p className="text-xs text-error-500 mt-1">{error}</p>}
        {helperText && !error && (
          <p className="text-xs text-gray-500 mt-1">{helperText}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;
