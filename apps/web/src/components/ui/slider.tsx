'use client';

import * as React from 'react';

export interface SliderProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'> {
  value?: number[];
  onValueChange?: (value: number[]) => void;
  min?: number;
  max?: number;
  step?: number;
}

const Slider = React.forwardRef<HTMLInputElement, SliderProps>(
  ({ className, value, onValueChange, min = 0, max = 100, step = 1, ...props }, ref) => {
    const currentValue = value?.[0] ?? min;
    const pct = ((currentValue - min) / (max - min)) * 100;
    return (
      <div className={['relative flex w-full touch-none select-none items-center py-1', className].filter(Boolean).join(' ')}>
        <div className="relative h-2 w-full rounded-full bg-slate-200">
          <div className="absolute h-full rounded-full bg-pink-500" style={{ width: `${pct}%` }} />
        </div>
        <input
          ref={ref}
          type="range"
          min={min}
          max={max}
          step={step}
          value={currentValue}
          onChange={(e) => onValueChange?.([Number(e.target.value)])}
          className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
          {...props}
        />
      </div>
    );
  }
);
Slider.displayName = 'Slider';

export { Slider };
