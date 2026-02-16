'use client';

import { Switch } from '@headlessui/react';
import { cn } from '@/lib/utils';

export interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  description?: string;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizes = {
  sm: {
    switch: 'h-5 w-9',
    dot: 'h-3.5 w-3.5',
    translate: 'translate-x-4',
  },
  md: {
    switch: 'h-6 w-11',
    dot: 'h-4 w-4',
    translate: 'translate-x-5',
  },
  lg: {
    switch: 'h-7 w-14',
    dot: 'h-5 w-5',
    translate: 'translate-x-7',
  },
};

export function Toggle({
  checked,
  onChange,
  label,
  description,
  disabled = false,
  size = 'md',
  className,
}: ToggleProps) {
  const sizeConfig = sizes[size];

  return (
    <Switch.Group as="div" className={cn('flex items-center', className)}>
      <Switch
        checked={checked}
        onChange={onChange}
        disabled={disabled}
        className={cn(
          'relative inline-flex shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2',
          sizeConfig.switch,
          checked ? 'bg-primary-500' : 'bg-gray-200',
          disabled && 'opacity-50 cursor-not-allowed'
        )}
      >
        <span
          aria-hidden="true"
          className={cn(
            'pointer-events-none inline-block rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out',
            sizeConfig.dot,
            checked ? sizeConfig.translate : 'translate-x-0.5'
          )}
        />
      </Switch>
      {(label || description) && (
        <div className="ml-3">
          {label && (
            <Switch.Label
              as="span"
              className={cn(
                'text-sm font-medium text-gray-900',
                disabled && 'opacity-50'
              )}
            >
              {label}
            </Switch.Label>
          )}
          {description && (
            <Switch.Description as="span" className="block text-sm text-gray-500">
              {description}
            </Switch.Description>
          )}
        </div>
      )}
    </Switch.Group>
  );
}

export default Toggle;
