import * as React from "react";
import { cn } from "@/lib/utils";

// Simple Select wrapper - uses native HTML select for compatibility
interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  onValueChange?: (value: string) => void;
  defaultValue?: string;
  value?: string;
}

const Select: React.FC<{
  children: React.ReactNode;
  onValueChange?: (value: string) => void;
  defaultValue?: string;
  value?: string;
}> = ({ children, onValueChange, defaultValue, value }) => {
  return (
    <div className="relative">
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child) && child.type === SelectTrigger) {
          return React.cloneElement(child as React.ReactElement<any>, {
            onValueChange,
            defaultValue,
            value,
          });
        }
        return child;
      })}
    </div>
  );
};

const SelectGroup: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <>{children}</>
);

const SelectValue: React.FC<{ placeholder?: string }> = () => null;

const SelectTrigger = React.forwardRef<
  HTMLSelectElement,
  SelectProps & { children?: React.ReactNode }
>(({ className, children, onValueChange, defaultValue, value, onChange, ...props }, ref) => {
  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onChange?.(e);
    onValueChange?.(e.target.value);
  };

  return (
    <select
      ref={ref}
      className={cn(
        "flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm",
        "ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none",
        "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      onChange={handleChange}
      defaultValue={defaultValue}
      value={value}
      {...props}
    >
      {children}
    </select>
  );
});
SelectTrigger.displayName = "SelectTrigger";

const SelectContent: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <>{children}</>
);

const SelectItem: React.FC<React.OptionHTMLAttributes<HTMLOptionElement>> = ({
  className,
  children,
  ...props
}) => {
  return (
    <option className={cn("text-sm", className)} {...props}>
      {children}
    </option>
  );
};

export {
  Select,
  SelectGroup,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectItem,
};
