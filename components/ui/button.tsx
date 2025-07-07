import React from 'react';

interface ButtonProps {
  onClick: () => void;
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg'; // Add size prop
  variant?: 'default' | 'ghost'; // Add variant prop
}

const Button: React.FC<ButtonProps> = ({ onClick, children, className, disabled, size, variant }) => {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded ${variant === 'ghost' ? 'bg-transparent text-blue-500' : 'bg-blue-500 text-white hover:bg-blue-600'} ${className}`}
      disabled={disabled}
      style={{ fontSize: size === 'sm' ? '0.75rem' : size === 'lg' ? '1.25rem' : '1rem' }} // Adjust size
    >
      {children}
    </button>
  );
};

export default Button;
