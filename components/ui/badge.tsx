import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary';
  className?: string;
}

const Badge: React.FC<BadgeProps> = ({ children, variant = 'primary', className }) => {
  const variantClasses = variant === 'primary' ? 'bg-blue-500 text-white' : 'bg-gray-300 text-black';
  
  return (
    <span className={`inline-flex items-center px-2 py-1 rounded-full text-sm font-medium ${variantClasses} ${className}`}>
      {children}
    </span>
  );
};

export default Badge;
