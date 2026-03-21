"use client";

import { useMemo, useState, type InputHTMLAttributes } from "react";
import { normalizePhone, isValidRuPhoneDigits } from "@/lib/phone";

type PhoneInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, "value" | "onChange"> & {
  value?: string;
  onChange?: (digits: string, formatted: string) => void;
  className?: string;
  error?: string;
};

export function PhoneInput({
  value = "",
  onChange,
  className = "",
  error,
  ...props
}: PhoneInputProps) {
  const isControlled = value !== undefined;
  const normalizedFromValue = useMemo(() => normalizePhone(value), [value]);

  const [uncontrolledDisplayValue, setUncontrolledDisplayValue] = useState<string>(() => {
    return normalizedFromValue.formatted || "+7(";
  });
  const normalizedFromUncontrolled = useMemo(
    () => normalizePhone(uncontrolledDisplayValue),
    [uncontrolledDisplayValue]
  );

  const displayValue = isControlled ? normalizedFromValue.formatted : uncontrolledDisplayValue;
  const digits = isControlled ? normalizedFromValue.digits : normalizedFromUncontrolled.digits;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value;
    const normalized = normalizePhone(input);
    if (!isControlled) {
      setUncontrolledDisplayValue(normalized.formatted);
    }
    onChange?.(normalized.digits, normalized.formatted);
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text");
    const normalized = normalizePhone(pasted);
    if (!isControlled) {
      setUncontrolledDisplayValue(normalized.formatted);
    }
    onChange?.(normalized.digits, normalized.formatted);
  };

  const isValid = digits.length === 10 && isValidRuPhoneDigits(digits);
  const showError = error || (digits.length > 0 && !isValid);

  return (
    <div>
      <input
        {...props}
        type="tel"
        value={displayValue}
        onChange={handleChange}
        onPaste={handlePaste}
        placeholder="+7(XXX) XXX-XX-XX"
        autoComplete="tel"
        className={`h-14 w-full rounded-[var(--radius-btn)] border ${
          showError ? "border-red-500" : "border-[var(--color-border)]"
        } bg-[var(--color-bg)] px-4 text-[16px] placeholder:text-[var(--color-text)] placeholder:opacity-70 focus-visible:border-[var(--color-primary)] ${className}`}
      />
      {showError && (
        <p className="mt-1 text-sm text-red-600">
          {error || "Введите номер в формате +7(XXX) XXX-XX-XX"}
        </p>
      )}
    </div>
  );
}
