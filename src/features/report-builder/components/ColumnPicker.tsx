"use client";

import * as React from "react";
import { 
  DndContext, 
  closestCenter, 
  KeyboardSensor, 
  PointerSensor, 
  useSensor, 
  useSensors,
  DragEndEvent
} from "@dnd-kit/core";
import { 
  arrayMove, 
  SortableContext, 
  sortableKeyboardCoordinates, 
  useSortable, 
  verticalListSortingStrategy 
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Search, GripVertical, Check, Star, Pin, EyeOff } from "lucide-react";
import { SemanticField } from "@/types";
import { cn } from "@/utils/cn";

// Individual drag row component
interface SortableItemProps {
  id: string;
  field: SemanticField;
  isPinned: boolean;
  isFavorite: boolean;
  onTogglePin: () => void;
  onToggleFavorite: () => void;
  onRemove: () => void;
}

function SortableFieldRow({
  id,
  field,
  isPinned,
  isFavorite,
  onTogglePin,
  onToggleFavorite,
  onRemove
}: SortableItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 30 : undefined
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-center justify-between p-2 rounded-lg bg-card border border-border text-xs mb-1.5 transition-shadow",
        isDragging ? "shadow-md border-primary" : ""
      )}
    >
      <div className="flex items-center gap-2 truncate flex-1 min-w-0 mr-2">
        {/* Grip handle */}
        <button
          {...attributes}
          {...listeners}
          className="p-1 rounded cursor-grab active:cursor-grabbing hover:bg-secondary text-muted-foreground shrink-0"
        >
          <GripVertical size={12} />
        </button>
        <span className="font-semibold text-foreground truncate">{field.displayName}</span>
        <span className="text-[10px] text-muted-foreground uppercase font-bold bg-secondary px-1.5 py-0.5 rounded shrink-0">
          {field.dataType}
        </span>
      </div>

      <div className="flex items-center gap-1 shrink-0">
        {/* Hide Column */}
        <button
          onClick={onRemove}
          className="p-1 rounded hover:bg-rose-500/10 hover:text-rose-500 text-muted-foreground/60 transition-colors duration-150"
          title="Remove Column"
        >
          <EyeOff size={12} />
        </button>
      </div>
    </div>
  );
}

interface ColumnPickerProps {
  fields: SemanticField[];
  selectedFieldIds: string[];
  onChange: (ids: string[]) => void;
}

export function ColumnPicker({
  fields,
  selectedFieldIds,
  onChange
}: ColumnPickerProps) {
  const [search, setSearch] = React.useState("");
  
  // Custom states for pinning and favorites column metrics
  const [pinnedIds, setPinnedIds] = React.useState<string[]>([]);
  const [favoriteIds, setFavoriteIds] = React.useState<string[]>([]);

  // DND Kit Sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates
    })
  );

  const filteredFields = React.useMemo(() => {
    return fields.filter(
      (f) =>
        !f.isHidden &&
        (f.displayName.toLowerCase().includes(search.toLowerCase()) ||
          f.physicalColumn.toLowerCase().includes(search.toLowerCase()))
    );
  }, [fields, search]);

  const handleCheckboxToggle = (fieldId: string) => {
    if (selectedFieldIds.includes(fieldId)) {
      onChange(selectedFieldIds.filter((id) => id !== fieldId));
    } else {
      onChange([...selectedFieldIds, fieldId]);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = selectedFieldIds.indexOf(String(active.id));
      const newIndex = selectedFieldIds.indexOf(String(over.id));
      onChange(arrayMove(selectedFieldIds, oldIndex, newIndex));
    }
  };

  const handleTogglePin = (fieldId: string) => {
    setPinnedIds((prev) =>
      prev.includes(fieldId) ? prev.filter((id) => id !== fieldId) : [...prev, fieldId]
    );
  };

  const handleToggleFavorite = (fieldId: string) => {
    setFavoriteIds((prev) =>
      prev.includes(fieldId) ? prev.filter((id) => id !== fieldId) : [...prev, fieldId]
    );
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border border-border rounded-xl bg-card overflow-hidden">
      
      {/* Left Column Selector */}
      <div className="flex flex-col h-full border-r border-border p-4">
        <h4 className="font-bold text-xs text-foreground uppercase tracking-wider mb-3">Available Fields</h4>
        
        {/* Search */}
        <div className="relative mb-3">
          <Search className="absolute left-2.5 top-2 text-muted-foreground" size={13} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search variables..."
            className="w-full pl-8 pr-3 py-1.5 font-sans text-xs bg-secondary/40 border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
          />
        </div>

        {/* Scrollable list */}
        <div className="max-h-[320px] overflow-y-auto space-y-1 pr-1">
          {filteredFields.map((field) => {
            const isChecked = selectedFieldIds.includes(field.id);
            return (
              <button
                key={field.id}
                onClick={() => handleCheckboxToggle(field.id)}
                className={cn(
                  "flex items-center gap-3 w-full text-left px-3 py-2 rounded-lg text-xs font-sans border transition-all duration-150",
                  isChecked 
                    ? "bg-primary/5 border-primary/20 text-primary font-semibold" 
                    : "border-transparent hover:bg-secondary/40 text-foreground"
                )}
              >
                <div className={cn(
                  "w-4 h-4 rounded border flex items-center justify-center transition-colors duration-150",
                  isChecked ? "bg-primary border-primary text-primary-foreground" : "border-input bg-card"
                )}>
                  {isChecked && <Check size={10} />}
                </div>
                
                <div className="flex-1 truncate">
                  <span className="block truncate">{field.displayName}</span>
                  <span className="block text-[9px] text-muted-foreground mt-0.5 font-mono truncate">
                    {field.physicalColumn}
                  </span>
                </div>
                
                <span className="px-1.5 py-0.5 rounded bg-secondary/80 text-muted-foreground text-[9px] uppercase font-bold font-mono">
                  {field.dataType}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Right Drag re-order selection list */}
      <div className="flex flex-col h-full p-4 bg-secondary/10">
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-bold text-xs text-foreground uppercase tracking-wider">Active Output Columns</h4>
          <span className="text-[10px] text-muted-foreground font-semibold">({selectedFieldIds.length} columns selected)</span>
        </div>

        {/* Scrollable drag container */}
        <div className="max-h-[320px] overflow-y-auto pr-1">
          {selectedFieldIds.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center text-xs text-muted-foreground border-2 border-dashed border-border rounded-lg p-4 font-sans">
              Select columns from the left panel to begin mapping output results.
            </div>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={selectedFieldIds}
                strategy={verticalListSortingStrategy}
              >
                {selectedFieldIds.map((id) => {
                  const field = fields.find((f) => f.id === id);
                  if (!field) return null;

                  return (
                    <SortableFieldRow
                      key={id}
                      id={id}
                      field={field}
                      isPinned={pinnedIds.includes(id)}
                      isFavorite={favoriteIds.includes(id)}
                      onTogglePin={() => handleTogglePin(id)}
                      onToggleFavorite={() => handleToggleFavorite(id)}
                      onRemove={() => handleCheckboxToggle(id)}
                    />
                  );
                })}
              </SortableContext>
            </DndContext>
          )}
        </div>
      </div>

    </div>
  );
}
