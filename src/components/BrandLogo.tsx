import React from 'react';

interface BrandLogoProps {
  variant?: 'full' | 'compact' | 'light' | 'dark-bg';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  showSubtitle?: boolean;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  variant = 'full',
  size = 'md',
  className = '',
  showSubtitle = true,
}) => {
  // Dimension definitions
  const dimensions = {
    sm: { icon: 28, text: 'text-base', sub: 'text-[9px]', devanagari: 'text-xs' },
    md: { icon: 34, text: 'text-lg', sub: 'text-[10px]', devanagari: 'text-sm' },
    lg: { icon: 42, text: 'text-2xl', sub: 'text-xs', devanagari: 'text-base' },
  }[size];

  const isDarkBg = variant === 'dark-bg';

  return (
    <div className={`flex items-center gap-2.5 select-none ${className}`}>
      {/* Precision Geometric Shield Icon */}
      <div
        className="relative shrink-0 flex items-center justify-center"
        style={{ width: dimensions.icon, height: dimensions.icon }}
      >
        <svg
          viewBox="0 0 36 36"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full drop-shadow-xs"
        >
          {/* Outer Shield Geometry */}
          <path
            d="M18 3L5 8.2V17.5C5 25.4 10.5 32.7 18 34.5C25.5 32.7 31 25.4 31 17.5V8.2L18 3Z"
            fill={isDarkBg ? '#087F73' : '#073B3A'}
          />
          {/* Inner Emerald Accent Facet */}
          <path
            d="M18 5L7 9.4V17.5C7 24.3 11.7 30.7 18 32.3C24.3 30.7 29 24.3 29 17.5V9.4L18 5Z"
            fill={isDarkBg ? '#073B3A' : '#087F73'}
            fillOpacity={isDarkBg ? 0.9 : 0.15}
          />
          {/* Core Central Shield Plate */}
          <path
            d="M18 7.5L8.8 11.2V17.5C8.8 23.3 12.7 28.7 18 30.2C23.3 28.7 27.2 23.3 27.2 17.5V11.2L18 7.5Z"
            fill={isDarkBg ? '#0E4D48' : '#FFFFFF'}
          />
          {/* Statutory Verification / Check Emblem */}
          <path
            d="M15.2 21.6L11.5 17.9L12.9 16.5L15.2 18.8L22.6 11.4L24 12.8L15.2 21.6Z"
            fill="#119B72"
          />
          {/* Micro Top Crest Accent */}
          <path
            d="M18 8.8L13 11V14.5C13 17.2 15.1 20 18 20.8C20.9 20 23 17.2 23 14.5V11L18 8.8Z"
            fill="#119B72"
            fillOpacity={0.25}
          />
        </svg>
      </div>

      {/* Wordmark & Typography */}
      {variant !== 'compact' && (
        <div className="flex flex-col leading-none">
          <div className="flex items-center gap-1.5">
            <span
              className={`font-headline font-extrabold tracking-tight ${dimensions.text} ${
                isDarkBg ? 'text-white' : 'text-[#073B3A]'
              }`}
            >
              DHAAL
            </span>
            <span
              className={`font-devanagari font-bold ${dimensions.devanagari} ${
                isDarkBg ? 'text-[#119B72]' : 'text-[#087F73]'
              }`}
            >
              (ढाल)
            </span>
          </div>

          {showSubtitle && (
            <span
              className={`font-sans tracking-wide uppercase font-semibold mt-0.5 ${dimensions.sub} ${
                isDarkBg ? 'text-[#A3B8B5]' : 'text-[#687674]'
              } hidden sm:block`}
            >
              GST Scrutiny Shield
            </span>
          )}
        </div>
      )}
    </div>
  );
};
