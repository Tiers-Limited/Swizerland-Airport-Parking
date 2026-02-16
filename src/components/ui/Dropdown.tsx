'use client';

import { Fragment, ReactNode } from 'react';
import { Menu, Transition } from '@headlessui/react';
import { cn } from '@/lib/utils';

export interface DropdownItem {
  label: string;
  onClick?: () => void;
  href?: string;
  icon?: ReactNode;
  disabled?: boolean;
  danger?: boolean;
  divider?: boolean;
}

export interface DropdownProps {
  trigger: ReactNode;
  items: DropdownItem[];
  align?: 'left' | 'right';
  className?: string;
}

export function Dropdown({ trigger, items, align = 'right', className }: DropdownProps) {
  return (
    <Menu as="div" className={cn('relative inline-block text-left', className)}>
      <Menu.Button as={Fragment}>{trigger}</Menu.Button>

      <Transition
        as={Fragment}
        enter="transition ease-out duration-100"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <Menu.Items
          className={cn(
            'absolute z-50 mt-2 w-56 origin-top-right rounded-xl bg-white shadow-lg ring-1 ring-black/5 focus:outline-none overflow-hidden',
            align === 'right' ? 'right-0' : 'left-0'
          )}
        >
          <div className="py-1">
            {items.map((item, index) => {
              if (item.divider) {
                return <div key={index} className="my-1 h-px bg-gray-100" />;
              }

              return (
                <Menu.Item key={index} disabled={item.disabled}>
                  {({ active }) => {
                    const baseClasses = cn(
                      'flex items-center w-full px-4 py-2.5 text-sm transition-colors',
                      active && !item.danger && 'bg-gray-50',
                      active && item.danger && 'bg-error-50',
                      item.danger ? 'text-error-600' : 'text-gray-700',
                      item.disabled && 'opacity-50 cursor-not-allowed'
                    );

                    if (item.href) {
                      return (
                        <a href={item.href} className={baseClasses}>
                          {item.icon && <span className="mr-3 h-5 w-5">{item.icon}</span>}
                          {item.label}
                        </a>
                      );
                    }

                    return (
                      <button
                        onClick={item.onClick}
                        className={baseClasses}
                        disabled={item.disabled}
                      >
                        {item.icon && <span className="mr-3 h-5 w-5">{item.icon}</span>}
                        {item.label}
                      </button>
                    );
                  }}
                </Menu.Item>
              );
            })}
          </div>
        </Menu.Items>
      </Transition>
    </Menu>
  );
}

export default Dropdown;
