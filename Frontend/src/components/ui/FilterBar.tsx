import React from 'react';

interface FilterBarProps {
  children: React.ReactNode;
}

export function FilterBar({ children }: FilterBarProps) {
  return <div className="flex flex-wrap items-center gap-2.5 mb-4">{children}</div>;
}

interface SelectProps {
  label: string;
  value: string;
  options: string[];
  onChange?: (value: string) => void;
  disabled?: boolean;
}

export function FilterSelect({ label, value, options, onChange, disabled }: SelectProps) {
  return (
    <div className="flex items-center gap-1.5 bg-white border border-border-subtle rounded-md px-2.5 py-1 shadow-subtle">
      <span className="text-2xs font-semibold uppercase tracking-wider text-slate-400 select-none">
        {label}:
      </span>
      <select
        value={value}
        disabled={disabled}
        onChange={(e) => onChange?.(e.target.value)}
        className="bg-transparent text-xs text-slate-700 font-medium focus:outline-none cursor-pointer disabled:opacity-50"
      >
        {options.map((opt) => (
          <option key={opt} value={opt} className="bg-white text-slate-800">
            {opt}
          </option>
        ))}
      </select>
    </div>
  );
}

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

export function SearchInput({
  value,
  onChange,
  placeholder = 'Search...',
  disabled = false,
}: SearchInputProps) {
  return (
    <div className="relative flex-1 min-w-[220px]">
      <svg
        className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400"
        width="13"
        height="13"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="11" cy="11" r="8" />
        <path d="m21 21-4.3-4.3" />
      </svg>
      <input
        type="text"
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="input pl-8 py-1 text-xs"
      />
    </div>
  );
}
