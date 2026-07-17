"use client";

import * as React from "react";
import { Search, ChevronDown, Check, X } from "lucide-react";
import { cn } from "@/utils/cn";

interface Option {
  value: string;
  label: string;
  description?: string;
}

interface MultiSelectProps {
  options: Option[];
  selectedValues: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
  className?: string;
}

export function MultiSelect({
  options,
  selectedValues,
  onChange,
  placeholder = "Select columns...",
  className
}: MultiSelectProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");
  const containerRef = React.useRef<HTMLDivElement>(null);

  const filteredOptions = React.useMemo(() => {
    return options.filter((opt) =>
      opt.label.toLowerCase().includes(search.toLowerCase()) ||
      opt.value.toLowerCase().includes(search.toLowerCase())
    );
  }, [options, search]);

  const buttonText = React.useMemo(() => {
    if (selectedValues.length === 0) return placeholder;
    return selectedValues
      .map(val => {
        const opt = options.find(o => o.value === val);
        return opt ? opt.label : val;
      })
      .join(", ");
  }, [selectedValues, options, placeholder]);

  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearch("");
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleToggle = (val: string) => {
    if (selectedValues.includes(val)) {
      onChange(selectedValues.filter((v) => v !== val));
    } else {
      onChange([...selectedValues, val]);
    }
  };

  const handleSelectAll = () => {
    onChange(options.map(o => o.value));
  };

  const handleClearAll = () => {
    onChange([]);
  };

  return (
    <div ref={containerRef} className={cn("relative w-full", className)}>
      {/* Dropdown Toggle Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-secondary/40 border border-border rounded-lg px-3 py-2.5 font-sans text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary flex items-center justify-between gap-1.5 transition-colors hover:bg-secondary/60 text-left select-none cursor-pointer"
      >
        <span className={cn("truncate", selectedValues.length === 0 ? "text-muted-foreground" : "text-foreground font-medium")}>
          {buttonText}
        </span>
        <ChevronDown size={14} className="text-muted-foreground shrink-0" />
      </button>

      {/* Dropdown Content */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-1.5 w-full bg-card border border-border rounded-xl shadow-xl py-2 flex flex-col gap-2 z-[9999] scale-100 animate-in fade-in slide-in-from-top-2 duration-150">
          {/* Search Field */}
          <div className="px-3 pt-1 relative">
            <Search className="absolute left-5 top-3.5 h-3.5 w-3.5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search variables..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-secondary/30 border border-border rounded-lg pl-8 pr-3 py-1.5 text-xs focus:outline-none focus:border-primary font-sans text-foreground"
              autoFocus
            />
          </div>

          {/* Quick Shortcuts */}
          <div className="px-3 flex items-center justify-between border-b border-border/40 pb-2">
            <button
              type="button"
              onClick={handleSelectAll}
              className="text-[10px] text-primary font-bold hover:underline cursor-pointer"
            >
              Select All
            </button>
            <button
              type="button"
              onClick={handleClearAll}
              className="text-[10px] text-rose-500 font-bold hover:underline cursor-pointer"
            >
              Clear All
            </button>
          </div>

          {/* Items List */}
          <div className="max-h-60 overflow-y-auto px-1 divide-y divide-border/10">
            {filteredOptions.length === 0 ? (
              <div className="px-3 py-2 text-xs text-muted-foreground italic font-sans">
                No variables found
              </div>
            ) : (
              filteredOptions.map((opt) => {
                const isSelected = selectedValues.includes(opt.value);
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => handleToggle(opt.value)}
                    className={cn(
                      "w-full flex items-center justify-between px-3 py-2 text-xs font-sans transition-colors duration-150 rounded-lg text-left cursor-pointer",
                      isSelected
                        ? "bg-primary/5 text-primary font-semibold"
                        : "text-foreground hover:bg-secondary/40"
                    )}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <div className={cn(
                        "w-3.5 h-3.5 rounded border flex items-center justify-center transition-colors duration-150 shrink-0",
                        isSelected ? "bg-primary border-primary text-primary-foreground" : "border-input bg-card"
                      )}>
                        {isSelected && <Check size={9} />}
                      </div>
                      <span className="truncate">{opt.label}</span>
                    </div>
                    {opt.description && (
                      <span className="text-[9px] text-muted-foreground truncate uppercase bg-secondary px-1 py-0.5 rounded font-mono shrink-0 ml-2">
                        {opt.description}
                      </span>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
