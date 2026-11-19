import React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'muted' | 'interactive';
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ children, variant = 'default', padding = 'md', className = '', ...props }, ref) => {
    const baseStyles = 'rounded-card border transition-all duration-150';

    const variantStyles = {
      default: 'bg-white border-[#E4E9E5] shadow-xs',
      muted: 'bg-[#FAF9F5] border-[#E4E9E5]',
      interactive:
        'bg-white border-[#E4E9E5] shadow-xs hover:border-[#087F73]/40 hover:shadow-sm cursor-pointer',
    };

    const paddingStyles = {
      none: 'p-0',
      sm: 'p-3 sm:p-4',
      md: 'p-4 sm:p-6',
      lg: 'p-6 sm:p-8',
    };

    return (
      <div
        ref={ref}
        className={`${baseStyles} ${variantStyles[variant]} ${paddingStyles[padding]} ${className}`}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';
