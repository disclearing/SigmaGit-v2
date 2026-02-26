import * as React from "react";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

export interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange"> {
  onCheckedChange?: (checked: boolean) => void;
}

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(({ className, onCheckedChange, ...props }, ref) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (onCheckedChange) {
      onCheckedChange(e.target.checked);
    }
    if (props.onChange) {
      props.onChange(e);
    }
  };

  return (
    <label className="relative inline-flex items-center cursor-pointer">
      <input
        type="checkbox"
        ref={ref}
        className={cn("sr-only peer", className)}
        {...props}
        onChange={handleChange}
      />
      <div className="w-5 h-5 border-2 border-input rounded-md bg-background peer-checked:bg-primary peer-checked:border-primary transition-all duration-200 flex items-center justify-center hover:border-primary/50">
        {props.checked && <Check className="size-3.5 text-primary-foreground" />}
      </div>
    </label>
  );
});

Checkbox.displayName = "Checkbox";

export { Checkbox };
