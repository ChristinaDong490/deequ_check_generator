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
import { Textarea } from "@/components/ui/textarea";
import { DataCheck } from "@/pages/Index";

interface AddCheckDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (check: Omit<DataCheck, "id">) => void;
  editingCheck: DataCheck | null;
}

const COLUMN_NAMES = ["FILE_AIRBAG_CODE", "RECYCLED_PART_AMT", "TOWING_AMT"];
const CATEGORIES = ["completeness", "uniqueness", "size"];

const AddCheckDialog = ({
  open,
  onOpenChange,
  onSave,
  editingCheck,
}: AddCheckDialogProps) => {
  const [columnName, setColumnName] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    if (editingCheck) {
      setColumnName(editingCheck.columnName);
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
      columnName,
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
            <Select value={columnName} onValueChange={setColumnName}>
              <SelectTrigger id="column" className="bg-background">
                <SelectValue placeholder="Select column name" />
              </SelectTrigger>
              <SelectContent className="bg-popover">
                {COLUMN_NAMES.map((name) => (
                  <SelectItem key={name} value={name}>
                    {name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
