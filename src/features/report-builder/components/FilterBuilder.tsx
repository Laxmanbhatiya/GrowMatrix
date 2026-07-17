"use client";

import * as React from "react";
import { Plus, Trash2, GitMerge, ListFilter } from "lucide-react";
import { FilterGroup, FilterRule, SemanticField, FilterOperator } from "@/types";
import { cn } from "@/utils/cn";
import { SearchableSelect } from "@/components/ui/SearchableSelect";

const OPERATOR_LABELS: Record<FilterOperator, string> = {
  equals: "Equals",
  not_equals: "Not Equals",
  contains: "Contains",
  starts_with: "Starts With",
  ends_with: "Ends With",
  gt: "Greater Than (>)",
  lt: "Less Than (<)",
  between: "Between",
  in: "In List",
  not_in: "Not In List",
  is_null: "Is Null",
  is_not_null: "Is Not Null"
};

interface FilterBuilderProps {
  fields: SemanticField[];
  filters: FilterGroup;
  onChange: (filters: FilterGroup) => void;
}

export function FilterBuilder({ fields, filters, onChange }: FilterBuilderProps) {
  
  // Recursively update or insert filter items
  const updateGroup = (
    current: FilterGroup,
    targetPath: number[],
    updater: (group: FilterGroup) => FilterGroup
  ): FilterGroup => {
    if (targetPath.length === 0) {
      return updater(current);
    }
    const [head, ...tail] = targetPath;
    const newRules = current.rules.map((rule, idx) => {
      if (idx === head && "condition" in rule) {
        return updateGroup(rule as FilterGroup, tail, updater);
      }
      return rule;
    });
    return { ...current, rules: newRules };
  };

  const handleConditionChange = (path: number[], condition: "AND" | "OR") => {
    const updated = updateGroup(filters, path, (g) => ({ ...g, condition }));
    onChange(updated);
  };

  const handleAddRule = (path: number[]) => {
    const defaultField = fields.find(f => !f.isHidden)?.id || "";
    const newRule: FilterRule = {
      field: defaultField,
      operator: "equals",
      value: ""
    };
    const updated = updateGroup(filters, path, (g) => ({
      ...g,
      rules: [...g.rules, newRule]
    }));
    onChange(updated);
  };

  const handleAddGroup = (path: number[]) => {
    const newGroup: FilterGroup = {
      condition: "AND",
      rules: []
    };
    const updated = updateGroup(filters, path, (g) => ({
      ...g,
      rules: [...g.rules, newGroup]
    }));
    onChange(updated);
  };

  const handleRemoveItem = (path: number[], indexToRemove: number) => {
    const updated = updateGroup(filters, path, (g) => ({
      ...g,
      rules: g.rules.filter((_, idx) => idx !== indexToRemove)
    }));
    onChange(updated);
  };

  const handleRuleChange = (
    path: number[],
    ruleIdx: number,
    fieldChange: Partial<FilterRule>
  ) => {
    const updated = updateGroup(filters, path, (g) => {
      const newRules = g.rules.map((rule, idx) => {
        if (idx === ruleIdx && !("condition" in rule)) {
          const original = rule as FilterRule;
          
          // Clear target value if operator shifts to null
          let val = original.value;
          if (fieldChange.operator && ["is_null", "is_not_null"].includes(fieldChange.operator)) {
            val = null;
          } else if (fieldChange.operator === "between" && !Array.isArray(val)) {
            val = ["", ""];
          }
          
          return {
            ...original,
            ...fieldChange,
            value: fieldChange.value !== undefined ? fieldChange.value : val
          };
        }
        return rule;
      });
      return { ...g, rules: newRules };
    });
    onChange(updated);
  };

  // Render a visual bracket layout recursively
  const renderGroup = (group: FilterGroup, path: number[] = []): React.ReactNode => {
    return (
      <div 
        key={path.join("-")}
        className="flex flex-col pl-4 border-l-2 border-primary/20 hover:border-primary/45 transition-colors duration-150 py-2 my-2 space-y-3 bg-secondary/5 rounded-r-lg"
      >
        {/* Logical controls header */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="flex border border-border rounded-md bg-card overflow-hidden">
              {(["AND", "OR"] as const).map(cond => (
                <button
                  key={cond}
                  onClick={() => handleConditionChange(path, cond)}
                  className={cn(
                    "px-2.5 py-1 font-sans text-[10px] font-bold transition-all duration-150",
                    group.condition === cond 
                      ? "bg-primary text-primary-foreground" 
                      : "text-muted-foreground hover:bg-secondary"
                  )}
                >
                  {cond}
                </button>
              ))}
            </div>
            
            <span className="text-[10px] text-muted-foreground font-semibold">operator joins rules below</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleAddRule(path)}
              className="flex items-center gap-1 px-2 py-1 border border-border rounded bg-card hover:bg-secondary text-[10px] font-semibold text-foreground transition-colors duration-150"
            >
              <Plus size={10} />
              <span>Add Rule</span>
            </button>
            <button
              onClick={() => handleAddGroup(path)}
              className="flex items-center gap-1 px-2 py-1 border border-border rounded bg-card hover:bg-secondary text-[10px] font-semibold text-foreground transition-colors duration-150"
            >
              <GitMerge size={10} />
              <span>Add Group</span>
            </button>
            {path.length > 0 && (
              <button
                onClick={() => {
                  const parentPath = path.slice(0, -1);
                  const selfIdx = path[path.length - 1];
                  handleRemoveItem(parentPath, selfIdx);
                }}
                className="p-1 text-muted-foreground hover:text-rose-500 rounded hover:bg-rose-500/10 transition-colors duration-150"
                title="Remove Logical Group"
              >
                <Trash2 size={11} />
              </button>
            )}
          </div>
        </div>

        {/* List of elements inside this group bracket */}
        <div className="space-y-2">
          {group.rules.length === 0 && (
            <span className="text-[10px] text-muted-foreground italic block pl-2">Group holds no active checks yet. Click Add Rule to start.</span>
          )}
          {group.rules.map((rule, idx) => {
            const currentPath = [...path, idx];

            if ("condition" in rule) {
              return renderGroup(rule as FilterGroup, currentPath);
            }

            // Render single rule parameters row
            const filterRule = rule as FilterRule;
            const targetField = fields.find(f => f.id === filterRule.field);

            return (
              <div 
                key={idx}
                className="flex flex-wrap items-center gap-2.5 p-2 bg-card border border-border rounded-lg text-xs"
              >
                {/* Field Selector */}
                <SearchableSelect
                  options={fields.map(f => ({ value: f.id, label: f.displayName }))}
                  value={filterRule.field}
                  onChange={(val) => {
                    const nextField = fields.find(f => f.id === val);
                    const defaultVal = nextField?.dataType === "boolean" ? true : "";
                    handleRuleChange(path, idx, { field: val, value: defaultVal });
                  }}
                  className="shrink-0 w-36"
                />

                {/* Operator Selector */}
                <select
                  value={filterRule.operator}
                  onChange={(e) => handleRuleChange(path, idx, { operator: e.target.value as FilterOperator })}
                  className="bg-secondary/40 border border-border rounded px-2.5 py-1 font-sans focus:outline-none focus:ring-1 focus:ring-primary text-foreground shrink-0 w-32"
                >
                  {Object.entries(OPERATOR_LABELS).map(([op, label]) => {
                    // Filter numeric operators for dimensions etc. if desired (simplified here)
                    return <option key={op} value={op}>{label}</option>;
                  })}
                </select>

                {/* Dynamic Value fields picker */}
                {!["is_null", "is_not_null"].includes(filterRule.operator) && (
                  <div className="flex-1 min-w-[120px]">
                    {filterRule.operator === "between" ? (
                      <div className="flex items-center gap-1.5 w-full">
                        <input
                          type={targetField?.dataType === "number" ? "number" : "text"}
                          placeholder="Min"
                          value={Array.isArray(filterRule.value) ? filterRule.value[0] : ""}
                          onChange={(e) => {
                            const originalVal = Array.isArray(filterRule.value) ? [...filterRule.value] : ["", ""];
                            originalVal[0] = e.target.value;
                            handleRuleChange(path, idx, { value: originalVal });
                          }}
                          className="w-full bg-card border border-border rounded px-2 py-1 font-sans text-xs focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
                        />
                        <span className="text-[10px] text-muted-foreground">-</span>
                        <input
                          type={targetField?.dataType === "number" ? "number" : "text"}
                          placeholder="Max"
                          value={Array.isArray(filterRule.value) ? filterRule.value[1] : ""}
                          onChange={(e) => {
                            const originalVal = Array.isArray(filterRule.value) ? [...filterRule.value] : ["", ""];
                            originalVal[1] = e.target.value;
                            handleRuleChange(path, idx, { value: originalVal });
                          }}
                          className="w-full bg-card border border-border rounded px-2 py-1 font-sans text-xs focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
                        />
                      </div>
                    ) : filterRule.operator === "in" || filterRule.operator === "not_in" ? (
                      <input
                        type="text"
                        placeholder="Comma separated values, e.g. Soy, Maize"
                        value={Array.isArray(filterRule.value) ? filterRule.value.join(", ") : String(filterRule.value || "")}
                        onChange={(e) => {
                          const split = e.target.value.split(",").map(s => s.trim());
                          handleRuleChange(path, idx, { value: split });
                        }}
                        className="w-full bg-card border border-border rounded px-2 py-1 font-sans text-xs focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
                      />
                    ) : targetField?.dataType === "boolean" ? (
                      <div className="flex items-center h-8 pl-1">
                        <label className="flex items-center gap-2 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={filterRule.value === true || String(filterRule.value) === "true"}
                            onChange={(e) => handleRuleChange(path, idx, { value: e.target.checked })}
                            className="h-4 w-4 rounded border-border bg-secondary text-primary focus:ring-0 focus:ring-offset-0"
                          />
                          <span className="text-xs font-semibold text-foreground">
                            {filterRule.value === true || String(filterRule.value) === "true" ? "True" : "False"}
                          </span>
                        </label>
                      </div>
                    ) : targetField?.dataType === "date" ? (
                      <input
                        type="date"
                        value={String(filterRule.value || "")}
                        onChange={(e) => handleRuleChange(path, idx, { value: e.target.value })}
                        className="w-full bg-card border border-border rounded px-2 py-1 font-sans text-xs focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
                      />
                    ) : (
                      <input
                        type={targetField?.dataType === "number" ? "number" : "text"}
                        placeholder="Compare value..."
                        value={String(filterRule.value ?? "")}
                        onChange={(e) => handleRuleChange(path, idx, { value: e.target.value })}
                        className="w-full bg-card border border-border rounded px-2 py-1 font-sans text-xs focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
                      />
                    )}
                  </div>
                )}

                {/* Remove button */}
                <button
                  onClick={() => handleRemoveItem(path, idx)}
                  className="p-1 rounded text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 transition-colors duration-150 shrink-0 ml-auto"
                  title="Remove Rule"
                >
                  <Trash2 size={11} />
                </button>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="border border-border rounded-xl bg-card p-4 shadow-sm">
      <div className="flex items-center gap-2 mb-3 border-b border-border pb-2">
        <ListFilter size={15} className="text-primary" />
        <h4 className="font-bold text-xs text-foreground uppercase tracking-wider">Visual Query logical Filters</h4>
      </div>
      {renderGroup(filters)}
    </div>
  );
}
