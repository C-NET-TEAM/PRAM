import React, { forwardRef } from 'react';
import clsx from 'clsx';
import { twMerge } from 'tailwind-merge';

export const Input = forwardRef(({ className, type = 'text', error, icon: Icon, ...props }, ref) => {
  return (
    <div className="relative w-full">
      {Icon && (
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Icon className="h-5 w-5 text-gray-400" />
        </div>
      )}
      <input
        type={type}
        className={twMerge(
          clsx(
            'flex w-full rounded-xl border border-border bg-card px-4 py-2.5 text-sm',
            'transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent',
            'placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50',
            Icon && 'pl-10',
            error && 'border-[#EF4444] focus:ring-[#EF4444]',
            className
          )
        )}
        ref={ref}
        {...props}
      />
      {error && (
        <p className="mt-1 text-sm text-[#EF4444]">{error}</p>
      )}
    </div>
  );
});

Input.displayName = 'Input';
