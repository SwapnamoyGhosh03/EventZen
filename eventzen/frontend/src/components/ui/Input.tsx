import { forwardRef, type InputHTMLAttributes } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, className = "", id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, "-");

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-near-black mb-1.5 font-body"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={`
            w-full bg-white border-[1.5px] border-warm-tan rounded-md
            px-4 py-3.5 font-body text-base text-near-black
            placeholder:text-muted-gray
            transition-all duration-200
            focus:outline-none focus:border-amber focus:shadow-[0_0_0_3px_rgba(212,168,67,0.15)]
            disabled:bg-cream disabled:cursor-not-allowed
            ${error ? "border-burgundy focus:border-burgundy focus:shadow-[0_0_0_3px_rgba(122,27,45,0.15)]" : ""}
            ${className}
          `}
          {...props}
        />
        {error && (
          <p className="mt-1 text-sm text-burgundy font-body">{error}</p>
        )}
        {helperText && !error && (
          <p className="mt-1 text-sm text-muted-gray font-body">{helperText}</p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";
export default Input;
