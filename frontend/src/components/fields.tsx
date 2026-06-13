import { forwardRef, type InputHTMLAttributes, type SelectHTMLAttributes, type TextareaHTMLAttributes } from "react";
import { clsx } from "clsx";

type BaseProps = { label?: string; error?: string; help?: string };

export const TextField = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement> & BaseProps>(
  function TextField({ label, error, help, className, ...rest }, ref) {
    return (
      <div>
        {label && <label className="label">{label}</label>}
        <input ref={ref} {...rest} className={clsx("input", className)} />
        {help && !error && <p className="mt-1 text-xs text-slate-500">{help}</p>}
        {error && <p className="field-error">{error}</p>}
      </div>
    );
  },
);

export const TextareaField = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement> & BaseProps>(
  function TextareaField({ label, error, className, ...rest }, ref) {
    return (
      <div>
        {label && <label className="label">{label}</label>}
        <textarea ref={ref} {...rest} className={clsx("input min-h-[100px]", className)} />
        {error && <p className="field-error">{error}</p>}
      </div>
    );
  },
);

export const SelectField = forwardRef<
  HTMLSelectElement,
  SelectHTMLAttributes<HTMLSelectElement> & BaseProps & { options: { value: string; label: string }[] }
>(function SelectField({ label, error, options, className, ...rest }, ref) {
  return (
    <div>
      {label && <label className="label">{label}</label>}
      <select ref={ref} {...rest} className={clsx("input", className)}>
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      {error && <p className="field-error">{error}</p>}
    </div>
  );
});
