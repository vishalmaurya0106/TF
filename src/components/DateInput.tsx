import React from 'react';
import { Calendar } from 'lucide-react';
import { formatDate } from '../utils';

interface DateInputProps {
  id?: string;
  value: string; // YYYY-MM-DD
  onChange: (value: string) => void;
  className?: string;
  disabled?: boolean;
}

export const DateInput: React.FC<DateInputProps> = ({
  id,
  value,
  onChange,
  className = '',
  disabled = false,
}) => {
  const displayDate = formatDate(value) || 'DD/MM/YYYY';

  return (
    <div className={`relative flex items-center justify-between bg-slate-50 border border-slate-200 focus-within:border-indigo-500 rounded-xl px-3.5 py-2.5 text-sm font-medium text-slate-800 hover:bg-slate-100/80 transition-all ${disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'} ${className}`}>
      <span className="font-mono font-bold text-slate-800 text-xs tracking-wider select-none">
        {displayDate}
      </span>
      <Calendar className="h-4 w-4 text-indigo-600 shrink-0 ml-2 pointer-events-none" />
      <input
        id={id}
        type="date"
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
      />
    </div>
  );
};

export default DateInput;
