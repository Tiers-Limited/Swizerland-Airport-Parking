'use client';

import { ReactNode } from 'react';
import { Tab } from '@headlessui/react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

export interface TabItem {
  label: string;
  content: ReactNode;
  icon?: ReactNode;
  disabled?: boolean;
}

export interface TabsProps {
  tabs: TabItem[];
  defaultIndex?: number;
  onChange?: (index: number) => void;
  variant?: 'default' | 'pills' | 'underline';
  className?: string;
}

export function Tabs({
  tabs,
  defaultIndex = 0,
  onChange,
  variant = 'default',
  className,
}: TabsProps) {
  return (
    <Tab.Group defaultIndex={defaultIndex} onChange={onChange}>
      <Tab.List
        className={cn(
          'flex',
          variant === 'default' && 'gap-1 bg-gray-100 p-1 rounded-xl',
          variant === 'pills' && 'gap-2',
          variant === 'underline' && 'border-b border-gray-200 gap-4',
          className
        )}
      >
        {tabs.map((tab, index) => (
          <Tab
            key={index}
            disabled={tab.disabled}
            className={({ selected }) =>
              cn(
                'flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2',
                variant === 'default' && [
                  'rounded-lg flex-1 justify-center',
                  selected
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-white/50',
                ],
                variant === 'pills' && [
                  'rounded-full',
                  selected
                    ? 'bg-primary-500 text-white'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100',
                ],
                variant === 'underline' && [
                  'relative pb-3 border-b-2 -mb-px',
                  selected
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300',
                ],
                tab.disabled && 'opacity-50 cursor-not-allowed'
              )
            }
          >
            {tab.icon && <span className="h-5 w-5">{tab.icon}</span>}
            {tab.label}
          </Tab>
        ))}
      </Tab.List>
      <Tab.Panels className="mt-4">
        {tabs.map((tab, index) => (
          <Tab.Panel
            key={index}
            as={motion.div}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="focus:outline-none"
          >
            {tab.content}
          </Tab.Panel>
        ))}
      </Tab.Panels>
    </Tab.Group>
  );
}

export default Tabs;
