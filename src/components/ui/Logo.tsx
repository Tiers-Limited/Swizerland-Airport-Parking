import Link from 'next/link';
import Image from 'next/image';
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
    sm: { width: 120, height: 40, text: 'text-lg' },
    md: { width: 180, height: 60, text: 'text-xl' },
    lg: { width: 70, height: 50, text: 'text-xl' },
  };

  const LogoContent = () => (
    <div className={cn('flex items-center gap-0', className)}>
      
      {/* Logo Image */}
      <div className="relative">
        <Image
          src="https://res.cloudinary.com/dge3lt4u6/image/upload/v1772734683/Screenshot_2026-03-05_201508-removebg-preview_mhdcyt.png"
          alt="elvario logo"
          width={sizes[size].width}
          height={sizes[size].height}
          className="object-contain"
          priority
        />
      </div>

      {/* Logo Text */}
      {showText && (
        <span
          className={cn("font-semibold text-black lowercase", sizes[size].text)}
          style={{ textTransform: 'none' }}
        >
          Elvario
        </span>
      )}

    </div>
  );

  if (linkTo) {
    return (
      <Link
        href={linkTo}
        className="focus:outline-none focus-visible:ring-2 focus-visible:ring-baby-blue-500 rounded-lg"
      >
        <LogoContent />
      </Link>
    );
  }

  return <LogoContent />;
}