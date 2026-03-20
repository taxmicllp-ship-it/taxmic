import React from 'react';

export type BadgeVariant = 'success' | 'warning' | 'error' | 'info' | 'neutral' | 'purple';
export type BadgeSize = 'sm' | 'md';

interface BadgeProps {
  variant: BadgeVariant;
  size?: BadgeSize;
  children: React.ReactNode;
  className?: string;
}

const variantClasses: Record<BadgeVariant, string> = {
  success: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  warning: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  error:   'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  info:    'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  neutral: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  purple:  'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
};

const sizeClasses: Record<BadgeSize, string> = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-2.5 py-1 text-xs',
};

const Badge: React.FC<BadgeProps> = ({ variant, size = 'md', children, className = '' }) => {
  const base = 'inline-flex items-center rounded-full font-medium';
  const classes = `${base} ${variantClasses[variant]} ${sizeClasses[size]}${className ? ` ${className}` : ''}`;

  return <span className={classes}>{children}</span>;
};

export default Badge;
