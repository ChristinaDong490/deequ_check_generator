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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { Textarea } from "@/components/ui/textarea";
import { DataCheck } from "@/pages/Index";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface AddCheckDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (check: Omit<DataCheck, "id">) => void;
  editingCheck: DataCheck | null;
  availableColumns: string[];
}

const CATEGORIES = [
  "Completeness",
  "ContainedIn",
  "Pattern",
  "Satisfies",
  "DataType",
  "Uniqueness",
  "Row Count",
  "Numeric Ranges",
  "Other"
];

const AddCheckDialog = ({
  open,
  onOpenChange,
  onSave,
  editingCheck,
  availableColumns,
}: AddCheckDialogProps) => {
  const [columnName, setColumnName] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [openCombobox, setOpenCombobox] = useState(false);

  useEffect(() => {
    if (editingCheck) {
      setColumnName(editingCheck.column);
      setCategory(editingCheck.category);
      setDescription(editingCheck.description);
    } else {
      setColumnName("");
      setCategory("");
      setDescription("");
    }
  }, [editingCheck, open]);

  const handleSave = () => {
    if (!columnName || !category || !description) {
      return;
    }

    onSave({
      column: columnName,
      category,
      description,
    });

    setColumnName("");
    setCategory("");
    setDescription("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] bg-card">
        <DialogHeader>
          <DialogTitle>
            {editingCheck ? "Edit Check" : "Add New Check"}
          </DialogTitle>
          <DialogDescription>
            Configure a data quality check for your dataset
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="column">Column Name</Label>
            <Popover open={openCombobox} onOpenChange={setOpenCombobox}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={openCombobox}
                  className="w-full justify-between bg-background"
                >
                  {columnName || "Select column name"}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[450px] p-0" align="start">
                <Command>
                  <CommandInput placeholder="Search columns..." />
                  <CommandList>
                    <CommandEmpty>No column found.</CommandEmpty>
                    <CommandGroup>
                      {availableColumns.length > 0 ? (
                        availableColumns.map((column) => (
                          <CommandItem
                            key={column}
                            value={column}
                            onSelect={(currentValue) => {
                              setColumnName(currentValue === columnName ? "" : currentValue);
                              setOpenCombobox(false);
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                columnName === column ? "opacity-100" : "opacity-0"
                              )}
                            />
                            {column}
                          </CommandItem>
                        ))
                      ) : (
                        <CommandItem disabled>
                          Load suggestions first to see available columns
                        </CommandItem>
                      )}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger id="category" className="bg-background">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent className="bg-popover">
                {CATEGORIES.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="e.g., FILE_AIRBAG_CODE has value range 'N', 'Y', 'U'"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="min-h-[100px] bg-background"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={!columnName || !category || !description}
          >
            {editingCheck ? "Update" : "Add"} Check
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddCheckDialog;
