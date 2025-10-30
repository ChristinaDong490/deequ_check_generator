import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Check, ChevronsUpDown, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";

export interface AnalysisOption {
  id: string;
  label: string;
  category: "stats" | "distribution" | "trend";
}

const ANALYSIS_OPTIONS: AnalysisOption[] = [
  { id: "stats_min", label: "Min", category: "stats" },
  { id: "stats_max", label: "Max", category: "stats" },
  { id: "stats_mean", label: "Mean", category: "stats" },
  { id: "stats_row_count", label: "Row Count", category: "stats" },
  { id: "stats_completeness", label: "Completeness", category: "stats" },
  { id: "stats_column_count", label: "Column Count", category: "stats" },
  { id: "distribution", label: "Distribution", category: "distribution" },
  { id: "distribution_top_k", label: "Top K Distribution", category: "distribution" },
  { id: "trend_min", label: "Min", category: "trend" },
  { id: "trend_max", label: "Max", category: "trend" },
  { id: "trend_mean", label: "Mean", category: "trend" },
  { id: "trend_sum", label: "Sum", category: "trend" },
];

interface AddAnalysisDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (options: string[], columns: string[]) => void;
  availableColumns: string[];
}

const AddAnalysisDialog = ({
  open,
  onOpenChange,
  onSave,
  availableColumns,
}: AddAnalysisDialogProps) => {
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  const [selectedColumns, setSelectedColumns] = useState<string[]>([]);
  const [openColumnsPopover, setOpenColumnsPopover] = useState(false);
  const [topK, setTopK] = useState(5);

  useEffect(() => {
    if (!open) {
      setSelectedOptions([]);
      setSelectedColumns([]);
      setTopK(5);
    }
  }, [open]);

  const toggleOption = (optionId: string) => {
    setSelectedOptions((prev) =>
      prev.includes(optionId)
        ? prev.filter((id) => id !== optionId)
        : [...prev, optionId]
    );
  };

  const handleSave = () => {
    if (selectedOptions.length === 0) {
      return;
    }

    // Check if any option requires columns
    const requiresColumns = selectedOptions.some(
      (opt) => opt !== "stats_row_count" && opt !== "stats_column_count"
    );

    if (requiresColumns && selectedColumns.length === 0) {
      return;
    }

    // Replace distribution_top_k with actual top K value
    const finalOptions = selectedOptions.map((opt) =>
      opt === "distribution_top_k" ? `distribution_top_${topK}` : opt
    );

    onSave(finalOptions, selectedColumns);
    onOpenChange(false);
  };

  // Determine which options should be enabled
  const hasSelectedColumns = selectedColumns.length > 0;
  
  const isOptionEnabled = (optionId: string) => {
    const isCountOption = optionId === "stats_row_count" || optionId === "stats_column_count";
    
    // Count options only enabled when no columns selected
    if (isCountOption) {
      return !hasSelectedColumns;
    }
    
    // Other options only enabled when columns are selected
    return hasSelectedColumns;
  };

  const groupedOptions = {
    stats: ANALYSIS_OPTIONS.filter((opt) => opt.category === "stats"),
    distribution: ANALYSIS_OPTIONS.filter((opt) => opt.category === "distribution"),
    trend: ANALYSIS_OPTIONS.filter((opt) => opt.category === "trend"),
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] bg-card max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Analysis</DialogTitle>
          <DialogDescription>
            Select analysis options and columns to analyze
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Column Selection */}
          <div className="space-y-2">
            <Label>Columns (optional for row/column count)</Label>
            <Popover open={openColumnsPopover} onOpenChange={setOpenColumnsPopover}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  disabled={availableColumns.length === 0}
                  className="w-full justify-start font-mono bg-background h-auto min-h-10 py-2"
                >
                  {selectedColumns.length === 0 ? (
                    <span className="text-muted-foreground font-mono">
                      {availableColumns.length === 0 ? "No columns available" : "Select columns"}
                    </span>
                  ) : (
                    <div className="flex flex-wrap gap-1">
                      {selectedColumns.map((col) => (
                        <Badge key={col} variant="secondary" className="gap-1 font-mono">
                          {col}
                          <X
                            className="h-3 w-3 cursor-pointer hover:text-destructive shrink-0"
                            onPointerDown={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                            }}
                            onMouseDown={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                            }}
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setSelectedColumns((prev) => prev.filter((k) => k !== col));
                            }}
                            aria-label={`Remove ${col}`}
                            role="button"
                          />
                        </Badge>
                      ))}
                    </div>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[500px] p-0" align="start">
                <Command>
                  <CommandInput placeholder="Search columns..." />
                  <CommandList>
                    <CommandEmpty>No columns found.</CommandEmpty>
                    <CommandGroup>
                      {availableColumns.map((column) => (
                        <CommandItem
                          key={column}
                          value={column}
                          onSelect={() => {
                            setSelectedColumns((prev) =>
                              prev.includes(column)
                                ? prev.filter((k) => k !== column)
                                : [...prev, column]
                            );
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              selectedColumns.includes(column) ? "opacity-100" : "opacity-0"
                            )}
                          />
                          {column}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          {/* Analysis Options */}
          <div className="space-y-4">
            <Label>Analysis Options (select multiple)</Label>
            
            {/* Stats */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-muted-foreground">Statistics</h4>
              <div className="grid grid-cols-2 gap-2">
                {groupedOptions.stats.map((option) => {
                  const enabled = isOptionEnabled(option.id);
                  return (
                    <div key={option.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={option.id}
                        checked={selectedOptions.includes(option.id)}
                        onCheckedChange={() => enabled && toggleOption(option.id)}
                        disabled={!enabled}
                      />
                      <label
                        htmlFor={option.id}
                        className={cn(
                          "text-sm font-medium leading-none cursor-pointer",
                          !enabled && "opacity-50 cursor-not-allowed"
                        )}
                      >
                        {option.label}
                      </label>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Distribution */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-muted-foreground">Distribution</h4>
              <div className="grid grid-cols-2 gap-2">
                {groupedOptions.distribution.map((option) => {
                  const enabled = isOptionEnabled(option.id);
                  return (
                    <div key={option.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={option.id}
                        checked={selectedOptions.includes(option.id)}
                        onCheckedChange={() => enabled && toggleOption(option.id)}
                        disabled={!enabled}
                      />
                      <label
                        htmlFor={option.id}
                        className={cn(
                          "text-sm font-medium leading-none cursor-pointer",
                          !enabled && "opacity-50 cursor-not-allowed"
                        )}
                      >
                        {option.label}
                      </label>
                    </div>
                  );
                })}
              </div>
              {selectedOptions.includes("distribution_top_k") && (
                <div className="ml-6 mt-2">
                  <Label htmlFor="topK" className="text-xs">Top K value</Label>
                  <Input
                    id="topK"
                    type="number"
                    min={1}
                    max={100}
                    value={topK}
                    onChange={(e) => setTopK(parseInt(e.target.value) || 5)}
                    className="w-24 h-8 mt-1"
                  />
                </div>
              )}
            </div>

            {/* Trend */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-muted-foreground">Trend</h4>
              <div className="grid grid-cols-2 gap-2">
                {groupedOptions.trend.map((option) => {
                  const enabled = isOptionEnabled(option.id);
                  return (
                    <div key={option.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={option.id}
                        checked={selectedOptions.includes(option.id)}
                        onCheckedChange={() => enabled && toggleOption(option.id)}
                        disabled={!enabled}
                      />
                      <label
                        htmlFor={option.id}
                        className={cn(
                          "text-sm font-medium leading-none cursor-pointer",
                          !enabled && "opacity-50 cursor-not-allowed"
                        )}
                      >
                        {option.label}
                      </label>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={
              selectedOptions.length === 0 ||
              (selectedOptions.some((opt) => opt !== "stats_row_count" && opt !== "stats_column_count") &&
                selectedColumns.length === 0)
            }
          >
            Add Analysis
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddAnalysisDialog;
