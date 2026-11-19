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
      'bg-[#F1F5F9] text-[#475569] border border-[#E2E8F0]',
    brand:
      'bg-[#EFF4FF] text-[#2B4C9B] border border-[#CBD5E1]',
    success:
      'bg-[#E6F4EA] text-[#12805C] border border-[#A8DAB5]',
    warning:
      'bg-[#FEF3C7] text-[#B45309] border border-[#FDE68A]',
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
