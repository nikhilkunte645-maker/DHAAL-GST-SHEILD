import React from 'react';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'neutral' | 'brand' | 'success' | 'warning' | 'danger';
  size?: 'sm' | 'md';
  icon?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'neutral',
  size = 'md',
  icon,
  className = '',
  ...props
}) => {
  const baseStyles =
    'inline-flex items-center font-medium rounded-full transition-colors select-none';

  const sizeStyles = {
    sm: 'text-[10px] px-2 py-0.5 gap-1',
    md: 'text-[11px] px-2.5 py-0.5 gap-1.5',
  };

  const variantStyles = {
    neutral:
      'bg-[#F1F5F9] text-[#687674] border border-[#E4E9E5]',
    brand:
      'bg-[#E7F4EE] text-[#087F73] border border-[#119B72]/30',
    success:
      'bg-[#E7F4EE] text-[#119B72] border border-[#119B72]/40 font-semibold',
    warning:
      'bg-[#FEF3C7] text-[#D97706] border border-[#FDE68A]',
    danger:
      'bg-[#FEE2E2] text-[#C0392B] border border-[#FECACA]',
  };

  return (
    <span
      className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {icon && <span className="material-symbols-outlined text-[13px] shrink-0">{icon}</span>}
      <span>{children}</span>
    </span>
  );
};
