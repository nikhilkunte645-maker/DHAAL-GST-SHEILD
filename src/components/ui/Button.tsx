import React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  icon?: string;
  iconPosition?: 'left' | 'right';
  isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  icon,
  iconPosition = 'left',
  isLoading = false,
  className = '',
  disabled,
  ...props
}) => {
  const baseStyles =
    'inline-flex items-center justify-center font-semibold rounded-control transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2B4C9B] focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed select-none min-h-[44px] sm:min-h-[38px] active:scale-[0.98]';

  const sizeStyles = {
    sm: 'text-xs px-3 py-1.5 gap-1.5',
    md: 'text-xs sm:text-sm px-4 py-2 gap-2',
    lg: 'text-sm sm:text-base px-5 py-2.5 gap-2.5',
  };

  const variantStyles = {
    primary:
      'bg-[#0B1F3A] hover:bg-[#2B4C9B] text-white shadow-xs hover:shadow-sm border border-transparent',
    secondary:
      'bg-white hover:bg-[#EFF4FF] text-[#0F172A] border border-[#E3E8F0] hover:border-[#CBD5E1] shadow-2xs',
    ghost:
      'bg-transparent hover:bg-[#EFF4FF] text-[#44474D] hover:text-[#0B1C30] border border-transparent',
    danger:
      'bg-[#C0392B] hover:bg-[#A93226] text-white shadow-xs border border-transparent',
  };

  return (
    <button
      className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <span className="material-symbols-outlined animate-spin text-base">autorenew</span>
      ) : icon && iconPosition === 'left' ? (
        <span className="material-symbols-outlined text-base shrink-0">{icon}</span>
      ) : null}

      <span>{children}</span>

      {!isLoading && icon && iconPosition === 'right' ? (
        <span className="material-symbols-outlined text-base shrink-0">{icon}</span>
      ) : null}
    </button>
  );
};
