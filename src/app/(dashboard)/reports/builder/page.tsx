/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import * as React from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useDbStore } from "@/store/dbStore";
import { usePermissions } from "@/hooks/usePermissions";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Database, 
  Play, 
  BarChart, 
  HelpCircle,
  ArrowRightLeft,
  Coins,
  Search,
  ChevronDown,
  Calendar,
  SlidersHorizontal,
  RotateCcw
} from "lucide-react";
import { MultiSelect } from "@/components/ui/MultiSelect";
import { FilterBuilder } from "@/features/report-builder/components/FilterBuilder";
import { BaseChart } from "@/components/charts/BaseChart";
import { VirtualTable } from "@/components/tables/VirtualTable";
import { AQNQuery, ChartType, FilterGroup } from "@/types";
import { ColumnDef } from "@tanstack/react-table";
import { cn } from "@/utils/cn";
import { SearchableSelect } from "@/components/ui/SearchableSelect";
import { DateRangePicker } from "@/components/ui/DateRangePicker";

// Dynamic messages for the premium global loading overlay
const LOADING_MESSAGES = [
  "Connecting to Snowflake database...",
  "Compiling AQN logical check trees...",
  "Executing query on active warehouse...",
  "Mapping and structure-formatting records..."
];

export default function ReportBuilderPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const datasetIdParam = searchParams.get("datasetId");
  const reportIdParam = searchParams.get("id");

  const { datasets, saveReport, currentUser, reports, fetchReports, showNotification } = useDbStore();
  const { hasWriteAccess } = usePermissions();
  const canSave = hasWriteAccess("report_builder");

  const resultsRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  // Load saved report config from URL query parameter
  React.useEffect(() => {
    if (!reportIdParam || reports.length === 0) return;
    
    const savedReport = reports.find(r => r.id === reportIdParam);
    if (!savedReport) return;

    // Populate states from report configuration
    setSelectedDatasetId(savedReport.query.datasetId);
    setSelectedFields(savedReport.query.fields || []);
    setFilters(savedReport.query.filters || { condition: "AND", rules: [] });
    setGroupFields(savedReport.query.grouping || []);
    setAggregations(savedReport.query.aggregations || []);
    
    if (savedReport.query.sorting && savedReport.query.sorting.length > 0) {
      setSortField(savedReport.query.sorting[0].field);
      setSortDir(savedReport.query.sorting[0].direction);
    } else {
      setSortField("");
      setSortDir("desc");
    }

    setQueryLimit(savedReport.query.limit || null);

    // Presentation mapping
    const presentation = savedReport.presentation || {};
    setChartType(presentation.chartOptions?.type || "bar");
    
    const display = presentation.displayType === "chart_and_table" ? "split" : (presentation.displayType || "split");
    setDisplayType(display as any);

    // Automatically execute query on Snowflake
    const runSavedQuery = async () => {
      setIsLoading(true);
      try {
        const response = await fetch("http://localhost:3001/api/query", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(savedReport.query)
        });
        const res = await response.json();
        if (res.success && res.data) {
          setPreviewRecords(res.data);
          setQueryExecuted(true);
          setTimeout(() => {
            resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
          }, 150);
        } else {
          console.error("Query execution error:", res.error);
        }
      } catch (err) {
        console.error("API call failed:", err);
      } finally {
        setIsLoading(false);
      }
    };

    runSavedQuery();
  }, [reportIdParam, reports]);

  // Save report modal states
  const [isSaveModalOpen, setIsSaveModalOpen] = React.useState(false);
  const [reportName, setReportName] = React.useState("");
  const [reportDescription, setReportDescription] = React.useState("");
  const [isSaving, setIsSaving] = React.useState(false);

  const handleSaveReportSubmit = async () => {
    if (!reportName.trim()) {
      showNotification("Report Name is required.", "error");
      return;
    }
    setIsSaving(true);
    try {
      const compiledQuery = compileAQNQuery();
      const reportId = "rep_" + Math.random().toString(36).substring(2, 11);
      
      const newReport = {
        id: reportId,
        version: "1.0",
        metadata: {
          name: reportName,
          description: reportDescription,
          owner: currentUser.name,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          favorite: false,
          tags: []
        },
        query: compiledQuery,
        presentation: {
          displayType: (displayType === "split" ? "chart_and_table" : displayType) as any,
          chartOptions: {
            type: chartType
          }
        }
      };

      await saveReport(newReport);
      setIsSaveModalOpen(false);
      showNotification("Report saved successfully!", "success");
    } catch (err) {
      console.error(err);
      showNotification("Failed to save report.", "error");
    } finally {
      setIsSaving(false);
    }
  };
  const [selectedDatasetId, setSelectedDatasetId] = React.useState("");
  
  // Custom dropdown states
  const [isDropdownOpen, setIsDropdownOpen] = React.useState(false);
  const [tableSearchQuery, setTableSearchQuery] = React.useState("");
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  // Click outside listener to close dropdown
  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Filter datasets based on search text
  const filteredDatasets = React.useMemo(() => {
    return datasets.filter(d => 
      d.displayName.toLowerCase().includes(tableSearchQuery.toLowerCase()) ||
      (d.physicalName && d.physicalName.toLowerCase().includes(tableSearchQuery.toLowerCase())) ||
      (d.description && d.description.toLowerCase().includes(tableSearchQuery.toLowerCase()))
    );
  }, [datasets, tableSearchQuery]);
  
  // --------------------------------------------------
  // Query States
  // --------------------------------------------------
  const [selectedFields, setSelectedFields] = React.useState<string[]>([]);
  const [filters, setFilters] = React.useState<FilterGroup>({ condition: "AND", rules: [] });
  const [groupFields, setGroupFields] = React.useState<string[]>([]);
  const [aggregations, setAggregations] = React.useState<{ field: string; type: "sum" | "avg" | "count" | "min" | "max" }[]>([]);
  const [sortField, setSortField] = React.useState("");
  const [sortDir, setSortDir] = React.useState<"asc" | "desc">("desc");
  const [queryLimit, setQueryLimit] = React.useState<number | null>(100);

  const activeDataset = datasets.find(d => d.id === selectedDatasetId);

  // Helper to detect date/timestamp columns (even if mapped as strings in database schema)
  const isDateField = React.useCallback((f: any) => {
    if (!f) return false;
    const name = f.id.toLowerCase();
    const phys = (f.physicalColumn || "").toLowerCase();

    // Exclude user tracker columns (like updated_by, created_by)
    if (name.endsWith("by") || name.includes("_by") || phys.endsWith("by") || phys.includes("_by")) {
      return false;
    }

    return (
      f.dataType === "date" ||
      f.category === "temporal" ||
      name.includes("date") ||
      name.includes("time") ||
      name.endsWith("at") ||
      phys.includes("date") ||
      phys.includes("time") ||
      phys.endsWith("_at")
    );
  }, []);

  // Quick Date Range calendar filters
  const [quickDateCol, setQuickDateCol] = React.useState("");
  const [quickStartDate, setQuickStartDate] = React.useState("");
  const [quickEndDate, setQuickEndDate] = React.useState("");

  // Sync default date column when table changes
  React.useEffect(() => {
    if (activeDataset) {
      const dates = activeDataset.fields.filter(isDateField);
      if (dates.length > 0) {
        setQuickDateCol(dates[0].id);
      } else {
        setQuickDateCol("");
      }
      setQuickStartDate("");
      setQuickEndDate("");
    }
  }, [selectedDatasetId, activeDataset, isDateField]);

  // Automatically apply Date Range filter when dates change
  React.useEffect(() => {
    if (!quickDateCol) return;
    
    const baseRules = filters.rules.filter((r: any) => {
      if ("condition" in r) return true;
      return !(r.field === quickDateCol && r.operator === "between");
    });

    if (quickStartDate || quickEndDate) {
      const newRule = {
        field: quickDateCol,
        operator: "between" as const,
        value: [quickStartDate || "1970-01-01", quickEndDate || "2099-12-31"]
      };
      setFilters(prev => ({
        ...prev,
        rules: [...baseRules, newRule]
      }));
    } else {
      setFilters(prev => ({
        ...prev,
        rules: baseRules
      }));
    }
    // filters.rules intentionally excluded: this effect rewrites it, so including it would loop
  }, [quickDateCol, quickStartDate, quickEndDate]); // eslint-disable-line react-hooks/exhaustive-deps

  // --------------------------------------------------
  // UI Display States
  // --------------------------------------------------
  const [chartType, setChartType] = React.useState<ChartType>("bar");
  const [displayType, setDisplayType] = React.useState<"table" | "chart" | "split">("split");
  
  // Execution & Persistence
  const [isLoading, setIsLoading] = React.useState(false);
  const [queryExecuted, setQueryExecuted] = React.useState(false);
  
  const [loadingMessageIdx, setLoadingMessageIdx] = React.useState(0);

  React.useEffect(() => {
    if (!isLoading) {
      setLoadingMessageIdx(0);
      return;
    }
    const interval = setInterval(() => {
      setLoadingMessageIdx((prev) => (prev + 1) % LOADING_MESSAGES.length);
    }, 1500);
    return () => clearInterval(interval);
  }, [isLoading]);
  const [previewRecords, setPreviewRecords] = React.useState<any[]>([]);

  // Sync default dataset selections when data loads in the store
  React.useEffect(() => {
    if (reportIdParam) return; // Prevent overwriting saved report values on startup!
    if (!selectedDatasetId && datasets.length > 0) {
      const targetId = datasetIdParam || datasets[0].id;
      const targetDataset = datasets.find(d => d.id === targetId || d.id === targetId.toLowerCase()) || datasets[0];
      setSelectedDatasetId(targetDataset.id);
      setSelectedFields(targetDataset.fields.filter((f: any) => !f.isHidden).slice(0, 4).map((f: any) => f.id));
    }
  }, [datasets, selectedDatasetId, datasetIdParam, reportIdParam]);

  // Clean trigger when changing active dataset
  const handleDatasetChange = (id: string) => {
    setSelectedDatasetId(id);
    const target = datasets.find(d => d.id === id);
    if (target) {
      setSelectedFields(target.fields.filter((f: any) => !f.isHidden).slice(0, 4).map((f: any) => f.id));
      setFilters({ condition: "AND", rules: [] });
      setGroupFields([]);
      setAggregations([]);
    }
  };

  // Reset all builder states to default config
  const handleResetQuery = () => {
    setFilters({ condition: "AND", rules: [] });
    setGroupFields([]);
    setAggregations([]);
    setSortField("");
    setSortDir("desc");
    setQuickStartDate("");
    setQuickEndDate("");
    setQueryLimit(100);
    setPreviewRecords([]);
    setQueryExecuted(false);
    if (activeDataset) {
      setSelectedFields(
        activeDataset.fields
          .filter((f: any) => !f.isHidden)
          .slice(0, 4)
          .map((f: any) => f.id)
      );
    }
  };

  // Compile AQN JSON Query
  const compileAQNQuery = (): AQNQuery => {
    return {
      datasetId: selectedDatasetId,
      fields: selectedFields,
      filters: filters,
      grouping: groupFields.length > 0 ? groupFields : undefined,
      aggregations: aggregations.length > 0 ? aggregations : undefined,
      sorting: sortField ? [{ field: sortField, direction: sortDir }] : undefined,
      limit: queryLimit || undefined
    };
  };

  const handleRunQuery = async () => {
    setIsLoading(true);
    try {
      const query = compileAQNQuery();
      const response = await fetch("http://localhost:3001/api/query", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(query)
      });
      const res = await response.json();
      if (res.success && res.data) {
        setPreviewRecords(res.data);
        setQueryExecuted(true);
        setTimeout(() => {
          resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 150);
      } else {
        console.error("Query execution error:", res.error);
        showNotification(`Query execution failed: ${res.error}`, "error");
      }
    } catch (err: any) {
      console.error("API call failed:", err);
      showNotification(`Backend API is offline or unreachable: ${err.message}`, "error");
    } finally {
      setIsLoading(false);
    }
  };

  // Dynamically determine chart axis keys
  const chartKeys = React.useMemo(() => {
    if (!activeDataset || selectedFields.length === 0) {
      return { xAxisKey: "", valueKeys: [] as string[] };
    }

    // X-axis: prefer the first grouping field. If not grouped, choose the first string/date/boolean field. Fallback to first selected field.
    let xAxisKey = "";
    if (groupFields.length > 0) {
      xAxisKey = groupFields[0];
    } else {
      const nonNumeric = selectedFields.find(fid => {
        const f = activeDataset.fields.find((field: any) => field.id === fid);
        return f && f.dataType !== "number";
      });
      xAxisKey = nonNumeric || selectedFields[0];
    }

    // Y-axis value keys: prefer metrics if configured. Otherwise, use all numeric fields selected.
    let valueKeys: string[] = [];
    if (aggregations.length > 0) {
      valueKeys = aggregations.map(a => a.field);
    } else {
      valueKeys = selectedFields.filter(fid => {
        const f = activeDataset.fields.find((field: any) => field.id === fid);
        return f && f.dataType === "number";
      });
    }

    return { xAxisKey, valueKeys };
  }, [activeDataset, selectedFields, groupFields, aggregations]);

  // Build dynamic table columns
  const tableColumns: ColumnDef<any, any>[] = React.useMemo(() => {
    if (!activeDataset) return [];
    
    // Select column list: if grouped, only show group fields and metrics. Otherwise, show selected fields.
    const isGrouped = groupFields.length > 0;
    const activeIds = isGrouped 
      ? [...groupFields, ...aggregations.map(a => a.field)]
      : [...selectedFields];

    // Deduplicate
    const uniqueIds = Array.from(new Set(activeIds));

    return uniqueIds.map(fid => {
      const field = activeDataset.fields.find((f: any) => f.id === fid);
      return {
        id: fid,
        header: field ? field.displayName : fid,
        accessorKey: fid,
        cell: info => {
          const val = info.getValue();
          if (typeof val === "number") {
            if (fid === "totalArea" || fid === "area") {
              return `${val.toLocaleString()} Ac`;
            }
            return val.toLocaleString();
          }
          return String(val ?? "-");
        }
      };
    });
  }, [activeDataset, selectedFields, groupFields, aggregations]);

  return (
    <div className="flex flex-col gap-6 font-sans">
      {/* Header Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-4 select-none">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <BarChart size={20} className="text-primary" />
            <span>Visual Query Report Builder</span>
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Build custom reports visually. Compiled queries run against the Snowflake database backend.
          </p>
        </div>
      </div>

      {/* Top Filter Bar */}
      <div className="bg-card border border-border rounded-xl p-4 shadow-sm grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
        {/* Source Table Selector (span 2) */}
        <div className="md:col-span-2 space-y-1.5">
          <label className="text-[10px] font-bold text-muted-foreground uppercase flex items-center gap-1">
            <Database size={11} className="text-primary" />
            <span>Source Table</span>
          </label>
          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="w-full bg-secondary/40 border border-border rounded px-3 py-2 font-sans text-xs focus:outline-none focus:ring-1 focus:ring-primary text-foreground flex items-center justify-between text-left transition-all duration-150 h-[34px] cursor-pointer"
            >
              <span className="truncate">
                {activeDataset 
                  ? `${activeDataset.displayName}` 
                  : datasets.length === 0 ? "Loading registries..." : "Select Table..."}
              </span>
              <ChevronDown size={14} className="text-muted-foreground shrink-0 ml-2" />
            </button>

            {isDropdownOpen && (
              <div className="absolute left-0 right-0 mt-1.5 bg-card border border-border rounded-xl shadow-xl z-50 overflow-hidden flex flex-col scale-100 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="p-2 border-b border-border flex items-center gap-2 bg-secondary/20">
                  <Search size={13} className="text-muted-foreground" />
                  <input
                    type="text"
                    value={tableSearchQuery}
                    onChange={(e) => setTableSearchQuery(e.target.value)}
                    placeholder="Search tables..."
                    className="w-full bg-transparent text-xs font-sans focus:outline-none text-foreground placeholder:text-muted-foreground"
                    autoFocus
                  />
                </div>
                <div className="max-h-60 overflow-y-auto py-1">
                  {filteredDatasets.length === 0 ? (
                    <div className="px-3 py-2 text-xs text-muted-foreground italic font-sans">
                      No tables found
                    </div>
                  ) : (
                    filteredDatasets.map(d => {
                      const isSelected = d.id === selectedDatasetId;
                      return (
                        <button
                          key={d.id}
                          type="button"
                          onClick={() => {
                            handleDatasetChange(d.id);
                            setIsDropdownOpen(false);
                            setTableSearchQuery("");
                          }}
                          className={cn(
                            "w-full text-left px-3 py-2 text-xs font-sans transition-colors duration-150 flex flex-col gap-0.5 cursor-pointer",
                            isSelected 
                              ? "bg-primary/10 text-primary font-semibold" 
                              : "text-foreground hover:bg-secondary/60"
                          )}
                        >
                          <span className="truncate">{d.displayName}</span>
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Configure Output Columns (span 3) */}
        <div className="md:col-span-3 space-y-1.5">
          <label className="text-[10px] font-bold text-muted-foreground uppercase flex items-center gap-1">
            <span>Result Columns</span>
          </label>
          {activeDataset ? (
            <MultiSelect
              options={activeDataset.fields.map((f: any) => ({
                value: f.id,
                label: f.displayName,
                description: f.dataType
              }))}
              selectedValues={selectedFields}
              onChange={setSelectedFields}
              placeholder="Select columns..."
            />
          ) : (
            <div className="w-full bg-secondary/20 border border-border rounded px-3 py-2 text-xs text-muted-foreground italic h-[34px]">
              Select table first...
            </div>
          )}
        </div>

        {/* Date Column Select Dropdown (span 1) */}
        <div className="md:col-span-1 space-y-1.5">
          <label className="text-[10px] font-bold text-muted-foreground uppercase block text-center truncate">Date Col</label>
          {activeDataset && activeDataset.fields.some(isDateField) ? (
            <div className="relative flex items-center justify-center bg-secondary/40 border border-border text-primary rounded-lg h-[34px] w-full hover:bg-secondary/60 transition-colors group cursor-pointer" title="Change Date Filter Column">
              <div className="flex items-center justify-center gap-1 pointer-events-none">
                <Calendar size={13} className="text-primary" />
                <ChevronDown size={10} className="text-muted-foreground" />
              </div>
              <select
                value={quickDateCol}
                onChange={(e) => setQuickDateCol(e.target.value)}
                className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
              >
                {activeDataset.fields
                  .filter(isDateField)
                  .map((f: any) => (
                    <option key={f.id} value={f.id} className="bg-card text-foreground text-xs font-sans">
                      {f.displayName}
                    </option>
                  ))}
              </select>
            </div>
          ) : (
            <div className="w-full bg-secondary/20 border border-border rounded px-2 py-2 text-[10px] text-muted-foreground italic h-[34px] flex items-center justify-center text-center">
              None
            </div>
          )}
        </div>

        {/* Quick Date Range Calendar Filter (span 2) */}
        <div className="md:col-span-2 space-y-1.5">
          {activeDataset && activeDataset.fields.some(isDateField) ? (
            <>
              <div className="text-[10px] font-bold text-muted-foreground uppercase h-[18px] flex items-center select-none">
                <span>Date Range</span>
              </div>
              <DateRangePicker
                startDate={quickStartDate ? new Date(quickStartDate) : null}
                endDate={quickEndDate ? new Date(quickEndDate) : null}
                onChange={(dates) => {
                  const [start, end] = dates;
                  const formatDate = (d: Date | null) => {
                    if (!d) return "";
                    const year = d.getFullYear();
                    const month = String(d.getMonth() + 1).padStart(2, "0");
                    const day = String(d.getDate()).padStart(2, "0");
                    return `${year}-${month}-${day}`;
                  };
                  setQuickStartDate(formatDate(start));
                  setQuickEndDate(formatDate(end));
                }}
              />
            </>
          ) : (
            <>
              <label className="text-[10px] font-bold text-muted-foreground uppercase block">Date Range</label>
              <div className="w-full bg-secondary/20 border border-border rounded px-3 py-2 text-xs text-muted-foreground italic h-[34px] flex items-center">
                No date columns found
              </div>
            </>
          )}
        </div>

        {/* Sort By Column & Direction (span 2) */}
        <div className="md:col-span-2 space-y-1.5">
          <label className="text-[10px] font-bold text-muted-foreground uppercase block">Sort By</label>
          <div className="grid grid-cols-2 gap-1.5">
            <select
              value={sortField}
              onChange={(e) => setSortField(e.target.value)}
              className="w-full bg-secondary/40 border border-border rounded px-2 py-2 font-sans text-xs focus:outline-none text-foreground h-[34px] cursor-pointer"
            >
              <option value="">None</option>
              {activeDataset && selectedFields.map(fid => {
                const field = activeDataset.fields.find((f: any) => f.id === fid);
                return (
                  <option key={fid} value={fid}>
                    {field ? field.displayName : fid}
                  </option>
                );
              })}
            </select>
            <select
              value={sortDir}
              onChange={(e) => setSortDir(e.target.value as "asc" | "desc")}
              className="w-full bg-secondary/40 border border-border rounded px-2 py-2 font-sans text-xs focus:outline-none text-foreground h-[34px] cursor-pointer"
            >
              <option value="asc">ASC</option>
              <option value="desc">DESC</option>
            </select>
          </div>
        </div>

        {/* Record Size (span 1) */}
        <div className="md:col-span-1 space-y-1.5">
          <label className="text-[10px] font-bold text-muted-foreground uppercase block">Record Size</label>
          <select
            value={queryLimit || "all"}
            onChange={(e) => {
              const val = e.target.value;
              setQueryLimit(val === "all" ? null : Number(val));
            }}
            className="w-full bg-secondary/40 border border-border rounded px-2 py-2 font-sans text-xs focus:outline-none text-foreground h-[34px] cursor-pointer"
          >
            <option value={50}>50</option>
            <option value={100}>100</option>
            <option value={250}>250</option>
            <option value={500}>500</option>
            <option value="all">All</option>
          </select>
        </div>

        {/* Run / Reset buttons (span 1) */}
        <div className="md:col-span-1 flex flex-col justify-end">
          <div className="flex items-center gap-1.5 w-full">
            <button
              onClick={handleResetQuery}
              title="Reset Query Builder"
              className="flex-1 flex items-center justify-center border border-border bg-secondary/40 hover:bg-secondary/70 text-muted-foreground hover:text-foreground rounded-lg h-[34px] transition-colors cursor-pointer"
            >
              <RotateCcw size={13} />
            </button>
            <button
              onClick={handleRunQuery}
              disabled={isLoading || selectedFields.length === 0 || !selectedDatasetId}
              title="Run Query"
              className="flex-1 flex items-center justify-center text-primary-foreground bg-primary hover:bg-primary/95 disabled:bg-muted disabled:text-muted-foreground rounded-lg shadow-sm transition-all duration-150 cursor-pointer h-[34px]"
            >
              <Play size={13} className={cn(isLoading ? "animate-spin" : "")} />
            </button>
          </div>
        </div>
      </div>

      {/* Advanced Builder Tier: Logic Checks & Grouping/Metrics */}
      {activeDataset && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
          
          {/* Logical Filters Card */}
          <div className="bg-card border border-border rounded-xl p-5 shadow-sm space-y-3 flex flex-col justify-between">
            <div className="space-y-3">
              <h3 className="font-bold text-xs text-foreground uppercase tracking-wider">3. visual logic checks</h3>
              <FilterBuilder
                fields={activeDataset.fields}
                filters={filters}
                onChange={setFilters}
              />
            </div>
          </div>

          {/* Grouping & Metrics Card */}
          <div className="bg-card border border-border rounded-xl p-5 shadow-sm space-y-4 flex flex-col justify-between">
            <div className="space-y-4">
              <h3 className="font-bold text-xs text-foreground uppercase tracking-wider flex items-center gap-1.5 border-b border-border pb-2">
                <ArrowRightLeft size={13} className="text-primary" />
                <span>4. Grouping & Metrics</span>
              </h3>

              {/* Group dimensions list checkboxes */}
              <div className="space-y-2">
                <label className="block text-[11px] font-semibold text-muted-foreground uppercase">
                  Group By Dimensions
                </label>
                <div className="flex flex-wrap gap-2">
                  {activeDataset.fields
                    .filter((f: any) => f.category === "dimension" || f.category === "geographic" || f.category === "temporal")
                    .map((f: any) => {
                      const isGrouped = groupFields.includes(f.id);
                      return (
                        <button
                          key={f.id}
                          type="button"
                          onClick={() => {
                            if (isGrouped) {
                              setGroupFields(groupFields.filter(id => id !== f.id));
                            } else {
                              setGroupFields([...groupFields, f.id]);
                            }
                          }}
                          className={cn(
                            "px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all duration-150 cursor-pointer",
                            isGrouped 
                              ? "bg-primary/10 border-primary/20 text-primary font-bold shadow-sm" 
                              : "bg-card border-border hover:bg-secondary/40 text-foreground"
                          )}
                        >
                          {f.displayName}
                        </button>
                      );
                    })}
                </div>
              </div>

              {/* Metrics aggregations dropdowns builder */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <label className="block text-[11px] font-semibold text-muted-foreground uppercase">
                    Metric Aggregations
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      const numCols = activeDataset.fields.filter((f: any) => f.dataType === "number");
                      if (numCols.length > 0) {
                        setAggregations([...aggregations, { field: numCols[0].id, type: "sum" }]);
                      }
                    }}
                    className="text-[10px] text-primary font-bold hover:underline cursor-pointer"
                  >
                    + Add Metric
                  </button>
                </div>

                <div className="space-y-2 pr-1">
                  {aggregations.length === 0 && (
                    <div className="text-[11px] text-muted-foreground italic font-sans py-2">
                      No aggregations configured. Output will show raw database records.
                    </div>
                  )}

                  {aggregations.map((agg, idx) => (
                    <div key={idx} className="flex items-center gap-2 bg-secondary/20 p-2.5 rounded-lg border border-border">
                      {/* SearchableSelect for aggregations */}
                      <div className="flex-1 min-w-0">
                        <SearchableSelect
                          value={agg.field}
                          onChange={(val) => {
                            const updated = [...aggregations];
                            updated[idx].field = val;
                            setAggregations(updated);
                          }}
                          options={activeDataset.fields
                            .filter((f: any) => f.dataType === "number")
                            .map((f: any) => ({
                              value: f.id,
                              label: f.displayName
                            }))
                          }
                          placeholder="Select metric..."
                        />
                      </div>

                      <select
                        value={agg.type}
                        onChange={(e) => {
                          const updated = [...aggregations];
                          updated[idx].type = e.target.value as any;
                          setAggregations(updated);
                        }}
                        className="bg-card border border-border rounded px-2 py-1.5 text-xs text-foreground focus:outline-none"
                      >
                        <option value="sum">SUM</option>
                        <option value="avg">AVG</option>
                        <option value="count">COUNT</option>
                        <option value="min">MIN</option>
                        <option value="max">MAX</option>
                      </select>

                      <button
                        type="button"
                        onClick={() => {
                          setAggregations(aggregations.filter((_, i) => i !== idx));
                        }}
                        className="p-1.5 rounded hover:bg-rose-500/10 text-rose-500 text-xs font-bold transition-colors shrink-0 cursor-pointer"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

        </div>
      )}

        {/* Bottom Preview Results Panel */}
        {queryExecuted && (
          <div className="w-full space-y-6 border-t border-border pt-8 mt-6">

            {/* Results Canvas */}
            <div className="space-y-4">
              
              {/* View selectors */}
              <div className="flex items-center justify-between border-b border-border pb-2 select-none">
                <div className="flex border border-border rounded-md bg-card overflow-hidden">
                  {(["split", "chart", "table"] as const).map(mode => (
                    <button
                      key={mode}
                      onClick={() => setDisplayType(mode)}
                      className={cn(
                        "px-3 py-1.5 font-sans text-xs font-semibold uppercase transition-colors duration-150 cursor-pointer",
                        displayType === mode ? "bg-secondary text-primary font-bold" : "text-muted-foreground hover:bg-secondary/40"
                      )}
                    >
                      {mode}
                    </button>
                  ))}
                </div>

                {/* Right tools side: Chart type picker + Save Report Button */}
                <div className="flex items-center gap-3">
                  {(displayType === "chart" || displayType === "split") && (
                    <select
                      value={chartType}
                      onChange={(e) => setChartType(e.target.value as ChartType)}
                      className="bg-card border border-border rounded px-2.5 py-1.5 font-sans text-xs text-foreground focus:outline-none cursor-pointer"
                    >
                      <option value="bar">Bar Chart</option>
                      <option value="line">Line Chart</option>
                      <option value="area">Area Chart</option>
                      <option value="pie">Pie Chart</option>
                      <option value="donut">Donut Chart</option>
                      <option value="treemap">Treemap Chart</option>
                      <option value="funnel">Funnel Chart</option>
                      <option value="heatmap">Heatmap Grid</option>
                      <option value="radar">Radar web</option>
                      <option value="gauge">Speed Gauge</option>
                    </select>
                  )}

                  {canSave && (
                    <button
                      onClick={() => {
                        setReportName("");
                        setReportDescription("");
                        setIsSaveModalOpen(true);
                      }}
                      disabled={selectedFields.length === 0 || !selectedDatasetId}
                      className="flex items-center gap-1.5 px-4 py-2 bg-primary hover:bg-primary/95 disabled:opacity-50 disabled:cursor-not-allowed text-primary-foreground text-xs font-bold rounded-lg transition-colors cursor-pointer shadow-md shadow-primary/10"
                    >
                      <span>Save Report</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Live Visual mounts */}
              <div ref={resultsRef} className="scroll-mt-6">
                {previewRecords.length === 0 ? (
                  <div className="bg-card border border-border border-dashed rounded-xl p-16 text-center font-sans text-xs text-muted-foreground">
                    <HelpCircle size={32} className="mx-auto mb-3 text-muted-foreground/60" />
                    <span>Configure fields, aggregations, and logic rules, then click <strong className="text-foreground">Run Query</strong> to resolve preview results.</span>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* 1. Table Display */}
                    {(displayType === "table" || displayType === "split") && (
                      <VirtualTable
                        title={`${activeDataset?.displayName} Structured Output`}
                        columns={tableColumns}
                        data={previewRecords}
                        loading={isLoading}
                        onRowClick={(rowData: any) => {
                          let searchVal = "";
                          for (const key of Object.keys(rowData)) {
                            const lowerKey = key.toLowerCase();
                            if (lowerKey === "farmer_id" || lowerKey === "farmer id" || lowerKey === "farmerid") {
                              searchVal = String(rowData[key]);
                              break;
                            }
                            if (lowerKey === "mobile" || lowerKey === "mobile_no" || lowerKey === "mobile number") {
                              searchVal = String(rowData[key]);
                            }
                            if (lowerKey === "id" && selectedDatasetId === "TBLFK_FARMER_DETAIL") {
                              searchVal = String(rowData[key]);
                              break;
                            }
                          }
                          if (!searchVal && selectedDatasetId === "TBLFK_FARMER_DETAIL") {
                            searchVal = rowData.FARMER_ID || rowData.MOBILE || rowData.FARMER_NAME || "";
                          }
                          if (searchVal) {
                            router.push(`/reports/farmer-lookup?search=${encodeURIComponent(searchVal)}`);
                          }
                        }}
                      />
                    )}

                    {/* 2. Chart Display */}
                    {(displayType === "chart" || displayType === "split") && (
                      <BaseChart
                        type={chartType}
                        data={previewRecords}
                        xAxisKey={chartKeys.xAxisKey}
                        valueKeys={chartKeys.valueKeys.length > 0 ? chartKeys.valueKeys : undefined}
                        title={`${activeDataset?.displayName} Visual Chart`}
                        loading={isLoading}
                      />
                    )}
                  </div>
                )}
              </div>

            </div>

          </div>
        )}

        {/* Premium Glassmorphic Global Loading Overlay */}
      {isLoading && (
        <div className="fixed inset-0 z-[9999] bg-background/50 backdrop-blur-md flex flex-col items-center justify-center animate-in fade-in duration-300">
          {/* Top Glow Progress Bar */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary/40 via-primary to-primary-foreground animate-pulse" />
          
          {/* Glow Loader Ring */}
          <div className="relative w-24 h-24 flex items-center justify-center">
            {/* Outer glowing spinning ring */}
            <div className="absolute inset-0 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
            
            {/* Inner pulsating ring */}
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center animate-pulse">
              <Database size={24} className="text-primary" />
            </div>
          </div>

          {/* Text Area */}
          <div className="mt-6 text-center space-y-2 select-none px-4 max-w-sm">
            <h5 className="font-sans font-bold text-sm text-foreground tracking-tight">
              Executing Analytics Query
            </h5>
            <p className="font-sans text-xs text-muted-foreground animate-pulse min-h-[16px] transition-all duration-300">
              {LOADING_MESSAGES[loadingMessageIdx]}
            </p>
          </div>
        </div>
      )}
      {/* Save Report Modal Overlay */}
      <AnimatePresence>
        {isSaveModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-card border border-border rounded-2xl shadow-2xl max-w-sm w-full p-6 space-y-4 text-foreground font-sans relative"
            >
              <div className="flex items-center justify-between pb-3 border-b border-border">
                <h3 className="font-bold text-sm flex items-center gap-2 text-foreground">
                  <BarChart size={16} className="text-primary" />
                  <span>Save Query Report</span>
                </h3>
                <button
                  onClick={() => setIsSaveModalOpen(false)}
                  className="text-muted-foreground hover:text-foreground cursor-pointer text-xs"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">
                    Report Title
                  </label>
                  <input
                    type="text"
                    required
                    value={reportName}
                    onChange={(e) => setReportName(e.target.value)}
                    placeholder="e.g. Regional Revenue Summary"
                    className="w-full bg-secondary/40 border border-border rounded-lg px-3 py-2 focus:outline-none focus:border-primary/50 text-foreground"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">
                    Description
                  </label>
                  <textarea
                    value={reportDescription}
                    onChange={(e) => setReportDescription(e.target.value)}
                    placeholder="Provide a summary of the compiled database query details..."
                    rows={3}
                    className="w-full bg-secondary/40 border border-border rounded-lg px-3 py-2 focus:outline-none focus:border-primary/50 text-foreground resize-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setIsSaveModalOpen(false)}
                  className="px-3.5 py-1.5 rounded-lg border border-border hover:bg-secondary text-xs font-semibold text-foreground transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveReportSubmit}
                  disabled={isSaving}
                  className="px-4 py-1.5 rounded-lg bg-primary hover:bg-primary/95 text-primary-foreground text-xs font-semibold transition-colors cursor-pointer shadow-md shadow-primary/10 flex items-center gap-1.5"
                >
                  {isSaving ? "Saving..." : "Save Report"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
