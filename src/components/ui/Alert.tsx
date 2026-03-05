import { HTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';
import { Icon } from './Icons';

export interface AlertProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'success' | 'error' | 'warning' | 'info';
  title?: string;
  onClose?: () => void;
}

const icons = {
  success: <Icon name="CheckCircle" className="h-5 w-5 text-success-500" />, 
  error: <Icon name="XCircle" className="h-5 w-5 text-error-500" />, 
  warning: <Icon name="AlertTriangle" className="h-5 w-5 text-warning-500" />, 
  info: <Icon name="Info" className="h-5 w-5 text-info-500" />, 
};

const Alert = forwardRef<HTMLDivElement, AlertProps>(
  ({ className, variant = 'info', title, onClose, children, ...props }, ref) => {
    const variants = {
      success: 'bg-success-50 border-success-200',
      error: 'bg-error-50 border-error-200',
      warning: 'bg-warning-50 border-warning-200',
      info: 'bg-info-50 border-info-200',
    };

    const textColors = {
      success: 'text-success-700',
      error: 'text-error-700',
      warning: 'text-warning-700',
      info: 'text-info-700',
    };

    return (
      <div
        ref={ref}
        className={cn(
          'flex items-start p-4 rounded-xl border',
          variants[variant],
          className
        )}
        role="alert"
        {...props}
      >
        <div className="shrink-0">{icons[variant]}</div>
        <div className="ml-3 flex-1">
          {title && (
            <h3 className={cn('text-sm font-medium', textColors[variant])}>
              {title}
            </h3>
          )}
          <div className={cn('text-sm', textColors[variant], title && 'mt-1')}>
            {children}
          </div>
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className={cn(
              'ml-3 shrink-0 inline-flex rounded-lg p-1.5 focus:outline-none focus:ring-2 focus:ring-offset-2',
              textColors[variant],
              variant === 'success' && 'hover:bg-success-100 focus:ring-success-500',
              variant === 'error' && 'hover:bg-error-100 focus:ring-error-500',
              variant === 'warning' && 'hover:bg-warning-100 focus:ring-warning-500',
              variant === 'info' && 'hover:bg-info-100 focus:ring-info-500'
            )}
          >
            <span className="sr-only">Close</span>
            <Icon name="X" className="h-5 w-5" />
          </button>
        )}
      </div>
    );
  }
);

Alert.displayName = 'Alert';

export default Alert;
