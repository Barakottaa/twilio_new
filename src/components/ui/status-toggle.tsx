'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface StatusToggleProps {
  status: 'open' | 'closed' | 'pending';
  onToggle: () => void;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function StatusToggle({ 
  status, 
  onToggle, 
  disabled = false, 
  size = 'md',
  className 
}: StatusToggleProps) {
  const isOpen = status === 'open';
  
  const sizeClasses = {
    sm: 'w-8 h-4',
    md: 'w-10 h-5',
    lg: 'w-12 h-6'
  };
  
  const thumbSizeClasses = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5'
  };
  
  const thumbPositionClasses = {
    sm: isOpen ? 'translate-x-4' : 'translate-x-0.5',
    md: isOpen ? 'translate-x-5' : 'translate-x-0.5',
    lg: isOpen ? 'translate-x-6' : 'translate-x-0.5'
  };

  return (
    <button
      onClick={onToggle}
      disabled={disabled}
      className={cn(
        'relative inline-flex items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2',
        sizeClasses[size],
        isOpen 
          ? 'bg-green-500 focus:ring-green-500' 
          : 'bg-red-500 focus:ring-red-500',
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
      title={`Click to ${isOpen ? 'close' : 'reopen'} conversation`}
    >
      <span
        className={cn(
          'inline-block rounded-full bg-white shadow-lg transform transition-transform duration-200',
          thumbSizeClasses[size],
          thumbPositionClasses[size]
        )}
      />
    </button>
  );
}
