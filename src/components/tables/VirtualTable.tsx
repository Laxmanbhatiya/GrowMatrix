"use client";

import * as React from "react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  SortingState,
  flexRender,
  ColumnDef,
  ColumnOrderState
} from "@tanstack/react-table";
import { useVirtualizer } from "@tanstack/react-virtual";
import {
  Download,
  Maximize2,
  Minimize2,
  ArrowUpDown,
  Pin,
  TableProperties
} from "lucide-react";
import { cn } from "@/utils/cn";

interface VirtualTableProps<TData> {
  columns: ColumnDef<TData, unknown>[];
  data: TData[];
  loading?: boolean;
  title?: string;
  enableSearch?: boolean;
  onRowClick?: (row: TData) => void;
}

export function VirtualTable<TData>({
  columns,
  data,
  loading = false,
  title = "Data Grid",
  enableSearch = true,
  onRowClick
}: VirtualTableProps<TData>) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = React.useState("");
  const [columnOrder, setColumnOrder] = React.useState<ColumnOrderState>(
    columns.map(c => c.id as string || "")
  );
  
  // States for UX Customization
  const [density, setDensity] = React.useState<"compact" | "standard" | "relaxed">("standard");
  const [isFullscreen, setIsFullscreen] = React.useState(false);
  const [pinnedColumns, setPinnedColumns] = React.useState<string[]>([]);

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      globalFilter,
      columnOrder
    },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    onColumnOrderChange: setColumnOrder,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    columnResizeMode: "onChange"
  });

  const { rows } = table.getRowModel();

  // Virtual Scrolling Setup
  const tableContainerRef = React.useRef<HTMLDivElement>(null);
  
  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => tableContainerRef.current,
    estimateSize: React.useCallback(() => {
      if (density === "compact") return 32;
      if (density === "relaxed") return 50;
      return 40; // standard
    }, [density]),
    overscan: 12
  });

  const virtualItems = rowVirtualizer.getVirtualItems();
  const totalSize = rowVirtualizer.getTotalSize();
  const paddingTop = virtualItems.length > 0 ? virtualItems[0].start : 0;
  const paddingBottom = virtualItems.length > 0 ? totalSize - virtualItems[virtualItems.length - 1].end : 0;

  // Calculate CSV Export
  const handleCSVExport = () => {
    if (data.length === 0) return;
    
    // Extract column keys & names
    const headers = columns.map(c => c.header as string || c.id || "").join(",");
    const keys = columns.map(c => c.id || "");
    
    const csvContent = [
      headers,
      ...data.map((row) =>
        keys.map(key => {
          const val = (row as Record<string, unknown>)[key];
          return typeof val === "string" ? `"${val.replace(/"/g, '""')}"` : val;
        }).join(",")
      )
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", `${title.toLowerCase().replace(/[^a-z0-9]/g, "_")}_export.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Toggle Pinned status
  const togglePin = (colId: string) => {
    if (pinnedColumns.includes(colId)) {
      setPinnedColumns(pinnedColumns.filter(id => id !== colId));
    } else {
      setPinnedColumns([...pinnedColumns, colId]);
    }
  };

  // Reorder order hook
  const moveColumn = (index: number, direction: 'left' | 'right') => {
    const newOrder = [...columnOrder];
    const targetIdx = direction === 'left' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= newOrder.length) return;
    
    // Swap
    const temp = newOrder[index];
    newOrder[index] = newOrder[targetIdx];
    newOrder[targetIdx] = temp;
    setColumnOrder(newOrder);
  };

  return (
    <div
      className={cn(
        "relative flex flex-col bg-card border border-border rounded-xl shadow-sm overflow-hidden transition-all duration-200",
        isFullscreen 
          ? "fixed inset-4 z-[99] bg-card p-6 shadow-2xl scale-100 animate-in fade-in duration-200 h-[calc(100vh-32px)]" 
          : "h-[450px]"
      )}
    >
      {/* Table Action Controls Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 border-b border-border bg-secondary/10">
        
        {/* Title & Info */}
        <div className="flex items-center gap-2">
          <TableProperties size={16} className="text-primary shrink-0" />
          <h4 className="font-sans font-bold text-xs text-foreground tracking-tight">
            {title} <span className="font-normal text-muted-foreground ml-1.5">({data.length} records)</span>
          </h4>
        </div>

        {/* Filters and Utilities */}
        <div className="flex flex-wrap items-center gap-3">
          {enableSearch && (
            <input
              type="text"
              value={globalFilter}
              onChange={(e) => setGlobalFilter(e.target.value)}
              placeholder="Search table rows..."
              className="px-3 py-1.5 w-44 sm:w-56 font-sans text-xs bg-card border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
            />
          )}

          {/* Density Picker */}
          <div className="flex items-center border border-border rounded-md bg-card overflow-hidden">
            {(["compact", "standard", "relaxed"] as const).map(d => (
              <button
                key={d}
                onClick={() => setDensity(d)}
                className={cn(
                  "px-2 py-1.5 font-sans text-[10px] uppercase font-semibold border-r border-border last:border-r-0 transition-colors duration-150",
                  density === d ? "bg-secondary text-primary font-bold" : "text-muted-foreground hover:bg-secondary/40"
                )}
              >
                {d}
              </button>
            ))}
          </div>

          {/* CSV Exporter */}
          <button
            onClick={handleCSVExport}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold hover:bg-secondary border border-border rounded-md bg-card transition-colors duration-150 text-muted-foreground hover:text-foreground"
            title="Export CSV"
          >
            <Download size={13} />
            <span className="hidden sm:inline">Export</span>
          </button>

          {/* Fullscreen Toggle */}
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-2 border border-border rounded-md bg-card hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors duration-150"
            title={isFullscreen ? "Exit Fullscreen" : "Maximize Screen"}
          >
            {isFullscreen ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
          </button>
        </div>
      </div>

      {/* Grid Canvas Panel */}
      <div 
        ref={tableContainerRef}
        className="flex-1 overflow-auto relative bg-card"
      >
        {loading && (
          <div className="absolute inset-0 bg-card/60 flex items-center justify-center z-20">
            <div className="w-8 h-8 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
          </div>
        )}

        <table className="w-full border-collapse table-layout-fixed font-sans text-xs">
          {/* Sticky Header */}
          <thead className="sticky top-0 z-10 bg-secondary/80 backdrop-blur-sm border-b border-border shadow-[0_1px_0_0_rgba(0,0,0,0.05)]">
            {table.getHeaderGroups().map(headerGroup => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header, colIdx) => {
                  const colId = header.column.id;
                  const isPinned = pinnedColumns.includes(colId);

                  return (
                    <th
                      key={header.id}
                      colSpan={header.colSpan}
                      className={cn(
                        "text-left font-semibold text-muted-foreground border-b border-r border-border select-none relative group transition-colors duration-150",
                        density === "compact" ? "px-2 py-1.5" : density === "relaxed" ? "px-4 py-3" : "px-3 py-2",
                        isPinned ? "sticky left-0 bg-secondary/95 z-20 shadow-[2px_0_5px_0_rgba(0,0,0,0.05)] border-r-2" : ""
                      )}
                      style={{ 
                        width: header.getSize(),
                        left: isPinned ? 0 : undefined 
                      }}
                    >
                      <div className="flex items-center justify-between gap-1">
                        <button
                          onClick={header.column.getToggleSortingHandler()}
                          className="flex items-center gap-1.5 hover:text-foreground font-semibold font-sans truncate"
                        >
                          {flexRender(header.column.columnDef.header, header.getContext())}
                          {header.column.getCanSort() && (
                            <ArrowUpDown size={11} className="text-muted-foreground/60 shrink-0" />
                          )}
                        </button>

                        {/* Column Reordering and Pinning Controls */}
                        <div className="hidden group-hover:flex items-center gap-0.5 shrink-0 pl-1.5">
                          <button
                            onClick={() => togglePin(colId)}
                            className={cn(
                              "p-0.5 rounded hover:bg-secondary transition-colors duration-150",
                              isPinned ? "text-primary" : "text-muted-foreground"
                            )}
                            title="Pin Column"
                          >
                            <Pin size={10} className={isPinned ? "fill-primary" : ""} />
                          </button>
                          
                          {/* Column reordering triggers */}
                          {colIdx > 0 && (
                            <button 
                              onClick={() => moveColumn(colIdx, 'left')}
                              className="text-[9px] px-0.5 hover:bg-secondary rounded text-muted-foreground"
                              title="Move Left"
                            >
                              ◀
                            </button>
                          )}
                          {colIdx < columnOrder.length - 1 && (
                            <button 
                              onClick={() => moveColumn(colIdx, 'right')}
                              className="text-[9px] px-0.5 hover:bg-secondary rounded text-muted-foreground"
                              title="Move Right"
                            >
                              ▶
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Resize handler */}
                      {header.column.getCanResize() && (
                        <div
                          onMouseDown={header.getResizeHandler()}
                          onTouchStart={header.getResizeHandler()}
                          className={cn(
                            "absolute top-0 right-0 h-full w-1 cursor-col-resize hover:bg-primary/50",
                            header.column.getIsResizing() ? "bg-primary w-1.5" : "bg-transparent"
                          )}
                        />
                      )}
                    </th>
                  );
                })}
              </tr>
            ))}
          </thead>

          {/* Virtual Row Body */}
          <tbody>
            {paddingTop > 0 && (
              <tr>
                <td style={{ height: `${paddingTop}px` }} colSpan={columns.length} />
              </tr>
            )}
            
            {virtualItems.map(virtualRow => {
              const row = rows[virtualRow.index];
              if (!row) return null;
              const isOdd = virtualRow.index % 2 !== 0;

              return (
                <tr
                  key={row.id}
                  onClick={() => onRowClick && onRowClick(row.original)}
                  className={cn(
                    "hover:bg-secondary/40 transition-colors duration-100",
                    onRowClick ? "cursor-pointer" : "",
                    isOdd ? "bg-secondary/15" : "bg-card"
                  )}
                >
                  {row.getVisibleCells().map(cell => {
                    const colId = cell.column.id;
                    const isPinned = pinnedColumns.includes(colId);

                    return (
                      <td
                        key={cell.id}
                        className={cn(
                          "border-b border-r border-border truncate font-sans text-foreground align-middle",
                          density === "compact" ? "px-2 py-1" : density === "relaxed" ? "px-4 py-2" : "px-3 py-1.5",
                          isPinned ? "sticky left-0 bg-card/95 z-10 shadow-[2px_0_5px_0_rgba(0,0,0,0.03)] border-r-2" : ""
                        )}
                        style={{ 
                          width: cell.column.getSize(),
                          left: isPinned ? 0 : undefined 
                        }}
                      >
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    );
                  })}
                </tr>
              );
            })}

            {paddingBottom > 0 && (
              <tr>
                <td style={{ height: `${paddingBottom}px` }} colSpan={columns.length} />
              </tr>
            )}
          </tbody>
        </table>

        {/* Empty State */}
        {rows.length === 0 && !loading && (
          <div className="flex flex-col items-center justify-center p-8 h-40">
            <span className="text-muted-foreground font-sans text-xs">No records available matching visual filters.</span>
          </div>
        )}
      </div>

      {/* Table Pagination Footer */}
      {data.length > 0 && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 border-t border-border bg-secondary/5 font-sans text-xs select-none shrink-0">
          {/* Left: Entries Info */}
          <div className="text-muted-foreground font-medium">
            Showing {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1} to{" "}
            {Math.min(
              (table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize,
              table.getFilteredRowModel().rows.length
            )}{" "}
            of {table.getFilteredRowModel().rows.length} entries
          </div>

          {/* Right: Controls */}
          <div className="flex flex-wrap items-center gap-4">
            {/* Page Size Select */}
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <span>Show</span>
              <select
                value={table.getState().pagination.pageSize}
                onChange={(e) => {
                  table.setPageSize(Number(e.target.value));
                }}
                className="bg-card border border-border rounded px-1.5 py-1 text-xs text-foreground focus:outline-none cursor-pointer"
              >
                {[10, 25, 50, 100].map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </select>
              <span>entries</span>
            </div>

            {/* Nav Buttons */}
            <div className="flex items-center gap-1 border border-border rounded-md bg-card overflow-hidden">
              <button
                onClick={() => table.setPageIndex(0)}
                disabled={!table.getCanPreviousPage()}
                className="px-2 py-1.5 hover:bg-secondary/40 disabled:opacity-40 disabled:hover:bg-transparent text-muted-foreground hover:text-foreground font-semibold cursor-pointer disabled:cursor-not-allowed"
                title="First Page"
              >
                «
              </button>
              <button
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
                className="px-2.5 py-1.5 hover:bg-secondary/40 disabled:opacity-40 disabled:hover:bg-transparent text-muted-foreground hover:text-foreground font-semibold cursor-pointer disabled:cursor-not-allowed"
                title="Previous Page"
              >
                ‹
              </button>
              
              <span className="px-3 py-1.5 text-foreground font-semibold border-x border-border bg-secondary/10">
                Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
              </span>

              <button
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
                className="px-2.5 py-1.5 hover:bg-secondary/40 disabled:opacity-40 disabled:hover:bg-transparent text-muted-foreground hover:text-foreground font-semibold cursor-pointer disabled:cursor-not-allowed"
                title="Next Page"
              >
                ›
              </button>
              <button
                onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                disabled={!table.getCanNextPage()}
                className="px-2 py-1.5 hover:bg-secondary/40 disabled:opacity-40 disabled:hover:bg-transparent text-muted-foreground hover:text-foreground font-semibold cursor-pointer disabled:cursor-not-allowed"
                title="Last Page"
              >
                »
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
