import React from 'react';

interface LogoIconProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export const LogoIcon: React.FC<LogoIconProps> = ({ 
  size = 'md', 
  className = '' 
}) => {
  const sizeClasses = {
    sm: 'h-6 w-6',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
    xl: 'h-16 w-16'
  };

  return (
    <div className={`${sizeClasses[size]} relative ${className}`}>
      <img 
        src="/logo.svg" 
        alt="Rhubaia Logo" 
        className="w-full h-full object-contain rounded-full"
      />
    </div>
  );
}; 