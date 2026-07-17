"use client";

import * as React from "react";
import { Search, ChevronDown } from "lucide-react";
import { cn } from "@/utils/cn";

interface Option {
  value: string;
  label: string;
}

interface SearchableSelectProps {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
  placeholder?: string;
}

export function SearchableSelect({
  options,
  value,
  onChange,
  className,
  placeholder = "Select option..."
}: SearchableSelectProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");
  const containerRef = React.useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  const filteredOptions = React.useMemo(() => {
    return options.filter((opt) =>
      opt.label.toLowerCase().includes(search.toLowerCase()) ||
      opt.value.toLowerCase().includes(search.toLowerCase())
    );
  }, [options, search]);

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

  return (
    <div ref={containerRef} className={cn("relative inline-block", className)}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-secondary/40 border border-border rounded px-2.5 py-1 font-sans text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary flex items-center justify-between gap-1.5 transition-colors hover:bg-secondary/60 text-left"
      >
        <span className="truncate">{selectedOption ? selectedOption.label : placeholder}</span>
        <ChevronDown size={12} className="text-muted-foreground shrink-0" />
      </button>

      {isOpen && (
        <div className="absolute z-50 left-0 mt-1 w-64 bg-card border border-border rounded-lg shadow-lg py-1 flex flex-col gap-1.5">
          <div className="px-2 pt-1 relative">
            <Search className="absolute left-4 top-3 h-3 w-3 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-secondary/30 border border-border rounded-md pl-7 pr-2.5 py-1 text-[11px] focus:outline-none focus:border-primary font-sans text-foreground"
              autoFocus
            />
          </div>

          <div className="max-h-48 overflow-y-auto py-1 divide-y divide-border/20">
            {filteredOptions.length === 0 ? (
              <div className="px-3 py-2 text-[10px] text-muted-foreground italic font-sans">
                No items found
              </div>
            ) : (
              filteredOptions.map((opt) => {
                const isSelected = opt.value === value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => {
                      onChange(opt.value);
                      setIsOpen(false);
                      setSearch("");
                    }}
                    className={cn(
                      "w-full text-left px-3 py-1.5 text-[11px] font-sans transition-colors truncate block",
                      isSelected
                        ? "bg-primary/10 text-primary font-semibold"
                        : "text-foreground hover:bg-secondary/40"
                    )}
                  >
                    {opt.label}
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
