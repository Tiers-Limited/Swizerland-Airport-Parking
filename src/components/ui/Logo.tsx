import Link from 'next/link';
import { cn } from '@/lib/utils';

export interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  linkTo?: string;
  showText?: boolean;
}

export default function Logo({ 
  size = 'md', 
  className, 
  linkTo = '/', 
  showText = true 
}: LogoProps) {
  const sizes = {
    sm: { icon: 'h-6 w-6', text: 'text-lg' },
    md: { icon: 'h-8 w-8', text: 'text-xl' },
    lg: { icon: 'h-10 w-10', text: 'text-2xl' },
  };

  const LogoContent = () => (
    <div className={cn('flex items-center gap-2', className)}>
      {/* Parking icon with airplane */}
      <div className={cn('relative', sizes[size].icon)}>
        <svg
          viewBox="0 0 40 40"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full"
        >
          {/* Background circle */}
          <circle cx="20" cy="20" r="18" fill="#3B9AFF" />
          {/* P letter */}
          <path
            d="M14 12h7c3.5 0 6 2.5 6 6s-2.5 6-6 6h-4v6h-3V12zm3 9h4c1.5 0 3-1 3-3s-1.5-3-3-3h-4v6z"
            fill="white"
          />
          {/* Small airplane */}
          <path
            d="M28 8l3 2-8 4-2-1 7-5z"
            fill="white"
            opacity="0.8"
          />
        </svg>
      </div>
      {showText && (
        <div className="flex flex-col leading-none">
          <span className={cn('font-bold text-gray-900', sizes[size].text)}>
            ZurichPark
          </span>
          <span className="text-xs text-gray-500">Airport Parking</span>
        </div>
      )}
    </div>
  );

  if (linkTo) {
    return (
      <Link href={linkTo} className="focus:outline-none focus-visible:ring-2 focus-visible:ring-baby-blue-500 rounded-lg">
        <LogoContent />
      </Link>
    );
  }

  return <LogoContent />;
}
