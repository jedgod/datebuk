import React from 'react';

export const Badge = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { variant?: 'default' | 'secondary' | 'destructive' | 'outline' }
>(({ className, variant = 'default', ...props }, ref) => {
  const variants = {
    default: 'border border-transparent bg-slate-900 text-slate-50 hover:bg-slate-800',
    secondary: 'border border-transparent bg-slate-200 text-slate-900 hover:bg-slate-300',
    destructive: 'border border-transparent bg-red-500 text-white hover:bg-red-600',
    outline: 'border border-slate-300 text-slate-900',
  };

  return (
    <div
      ref={ref}
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-slate-950 focus:ring-offset-2 ${
        variants[variant]
      } ${className || ''}`}
      {...props}
    />
  );
});
Badge.displayName = 'Badge';
