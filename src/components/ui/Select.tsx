'use client';

import { Fragment } from 'react';
import { Listbox, Transition } from '@headlessui/react';
import { cn } from '@/lib/utils';
import { Icon } from './Icons';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  label?: string;
  placeholder?: string;
  error?: string;
  helperText?: string;
  disabled?: boolean;
  className?: string;
}

export function Select({
  value,
  onChange,
  options,
  label,
  placeholder = 'Select an option',
  error,
  helperText,
  disabled = false,
  className,
}: SelectProps) {
  const selectedOption = options.find((opt) => opt.value === value);

  return (
    <div className={cn('w-full', className)}>
      <Listbox value={value} onChange={onChange} disabled={disabled}>
        {({ open }) => (
          <>
            {label && (
              <Listbox.Label className="block text-sm font-medium text-gray-700 mb-1.5">
                {label}
              </Listbox.Label>
            )}
            <div className="relative">
              <Listbox.Button
                className={cn(
                  'relative w-full cursor-pointer rounded-xl bg-white py-3 pl-4 pr-10 text-left border transition-all duration-200',
                  'focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500',
                  error
                    ? 'border-error-500 focus:border-error-500 focus:ring-error-500/20'
                    : 'border-gray-200 hover:border-gray-300',
                  disabled && 'bg-gray-50 cursor-not-allowed opacity-60',
                  open && 'border-primary-500 ring-2 ring-primary-500/20'
                )}
              >
                <span className={cn('block truncate', !selectedOption && 'text-gray-400')}>
                  {selectedOption?.label || placeholder}
                </span>
                <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                  <Icon
                    name="ChevronDown"
                    className={cn(
                      'h-5 w-5 text-gray-400 transition-transform duration-200',
                      open && 'rotate-180'
                    )}
                  />
                </span>
              </Listbox.Button>

              <Transition
                as={Fragment}
                leave="transition ease-in duration-100"
                leaveFrom="opacity-100"
                leaveTo="opacity-0"
              >
                <Listbox.Options
                  className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-xl bg-white py-1 text-base shadow-lg ring-1 ring-black/5 focus:outline-none"
                >
                  {options.map((option) => (
                    <Listbox.Option
                      key={option.value}
                      className={({ active, selected }) =>
                        cn(
                          'relative cursor-pointer select-none py-2.5 pl-10 pr-4 transition-colors',
                          active && 'bg-primary-50 text-primary-900',
                          selected && 'font-medium',
                          option.disabled && 'cursor-not-allowed opacity-50'
                        )
                      }
                      value={option.value}
                      disabled={option.disabled}
                    >
                      {({ selected }) => (
                        <>
                          <span className={cn('block truncate', selected && 'font-medium')}>
                            {option.label}
                          </span>
                          {selected && (
                            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-primary-600">
                              <Icon name="CheckCircle" className="h-5 w-5" />
                            </span>
                          )}
                        </>
                      )}
                    </Listbox.Option>
                  ))}
                </Listbox.Options>
              </Transition>
            </div>
          </>
        )}
      </Listbox>
      {error && <p className="mt-1 text-xs text-error-500">{error}</p>}
      {helperText && !error && (
        <p className="mt-1 text-xs text-gray-500">{helperText}</p>
      )}
    </div>
  );
}

export default Select;
