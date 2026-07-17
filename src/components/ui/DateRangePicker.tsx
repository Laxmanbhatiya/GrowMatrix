"use client";

import * as React from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { Calendar as CalendarIcon, X } from "lucide-react";

interface DateRangePickerProps {
  startDate: Date | null;
  endDate: Date | null;
  onChange: (dates: [Date | null, Date | null]) => void;
  placeholderText?: string;
}

export function DateRangePicker({
  startDate,
  endDate,
  onChange,
  placeholderText = "Select date range..."
}: DateRangePickerProps) {
  const showClear = startDate !== null || endDate !== null;

  return (
    <div className="relative w-full text-xs font-sans date-range-picker-container">
      <DatePicker
        selectsRange={true}
        startDate={startDate || undefined}
        endDate={endDate || undefined}
        onChange={(update: [Date | null, Date | null]) => onChange(update)}
        placeholderText={placeholderText}
        isClearable={false}
        className="w-full bg-card border border-border rounded-lg pl-9 pr-8 py-2 text-xs text-foreground focus:outline-none focus:border-primary transition-colors font-sans select-none cursor-pointer"
        dateFormat="dd/MM/yyyy"
      />
      <CalendarIcon className="absolute left-3 top-2.5 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
      
      {showClear && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onChange([null, null]);
          }}
          className="absolute right-2.5 top-2.5 h-4.5 w-4.5 flex items-center justify-center rounded-full bg-secondary hover:bg-secondary/80 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
        >
          <X size={10} />
        </button>
      )}
    </div>
  );
}
