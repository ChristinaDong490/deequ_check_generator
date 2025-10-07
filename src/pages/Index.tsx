import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Database, Plus, Sparkles, Copy, Check } from "lucide-react";
import { toast } from "sonner";
import ChecksTable from "@/components/ChecksTable";
import AddCheckDialog from "@/components/AddCheckDialog";
import CodeOutputDialog from "@/components/CodeOutputDialog";

export interface DataCheck {
  id: string;
  columnName: string;
  category: string;
  description: string;
}

const Index = () => {
  const [dataPath, setDataPath] = useState("");
  const [checks, setChecks] = useState<DataCheck[]>([
    {
      id: "1",
      columnName: "FILE_AIRBAG_CODE",
      category: "completeness",
      description: "FILE_AIRBAG_CODE has value range 'N', 'Y', 'U'",
    },
    {
      id: "2",
      columnName: "FILE_AIRBAG_CODE",
      category: "uniqueness",
      description: "FILE_AIRBAG_CODE has value range 'N' for at least 94.0% of values",
    },
    {
      id: "3",
      columnName: "RECYCLED_PART_AMT",
      category: "size",
      description: "RECYCLED_PART_AMT is within expected numeric range",
    },
  ]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isCodeDialogOpen, setIsCodeDialogOpen] = useState(false);
  const [editingCheck, setEditingCheck] = useState<DataCheck | null>(null);

  const handleGetSuggestions = () => {
    if (!dataPath.trim()) {
      toast.error("Please enter a data path");
      return;
    }
    toast.success("Fetching Deequ check suggestions...");
  };

  const handleAddCheck = (check: Omit<DataCheck, "id">) => {
    if (editingCheck) {
      setChecks(checks.map((c) => (c.id === editingCheck.id ? { ...check, id: c.id } : c)));
      toast.success("Check updated successfully");
    } else {
      setChecks([...checks, { ...check, id: Date.now().toString() }]);
      toast.success("Check added successfully");
    }
    setEditingCheck(null);
  };

  const handleEditCheck = (check: DataCheck) => {
    setEditingCheck(check);
    setIsAddDialogOpen(true);
  };

  const handleDeleteCheck = (id: string) => {
    setChecks(checks.filter((c) => c.id !== id));
    toast.success("Check deleted successfully");
  };

  const handleGenerate = () => {
    if (checks.length === 0) {
      toast.error("Please add at least one check");
      return;
    }
    setIsCodeDialogOpen(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/20">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-gradient-to-br from-primary to-accent">
              <Database className="h-6 w-6 text-primary-foreground" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Deequ Check Generator
            </h1>
          </div>
          <p className="text-muted-foreground text-lg">
            Configure data quality checks and generate validation code
          </p>
        </div>

        {/* Data Path Input */}
        <Card className="p-6 mb-6 shadow-lg border-border/50 backdrop-blur-sm bg-card/80">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block text-foreground">
                Data Path
              </label>
              <Input
                placeholder="Enter your data path (e.g., s3://bucket/data.parquet)"
                value={dataPath}
                onChange={(e) => setDataPath(e.target.value)}
                className="font-mono"
              />
            </div>
            <div className="flex items-end">
              <Button onClick={handleGetSuggestions} className="gap-2">
                <Sparkles className="h-4 w-4" />
                Get Suggestions
              </Button>
            </div>
          </div>
        </Card>

        {/* Checks Table */}
        <Card className="mb-6 shadow-lg border-border/50 backdrop-blur-sm bg-card/80">
          <div className="p-6 border-b border-border/50">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-semibold">Data Quality Checks</h2>
              <Button onClick={() => setIsAddDialogOpen(true)} className="gap-2">
                <Plus className="h-4 w-4" />
                Add Check
              </Button>
            </div>
          </div>
          <div className="p-6">
            <ChecksTable
              checks={checks}
              onEdit={handleEditCheck}
              onDelete={handleDeleteCheck}
            />
          </div>
        </Card>

        {/* Generate Button */}
        <div className="flex justify-end">
          <Button
            onClick={handleGenerate}
            size="lg"
            className="gap-2 bg-gradient-to-r from-primary to-accent hover:opacity-90 shadow-lg"
          >
            <Check className="h-5 w-5" />
            Generate Code
          </Button>
        </div>

        {/* Dialogs */}
        <AddCheckDialog
          open={isAddDialogOpen}
          onOpenChange={(open) => {
            setIsAddDialogOpen(open);
            if (!open) setEditingCheck(null);
          }}
          onSave={handleAddCheck}
          editingCheck={editingCheck}
        />

        <CodeOutputDialog
          open={isCodeDialogOpen}
          onOpenChange={setIsCodeDialogOpen}
          checks={checks}
          dataPath={dataPath}
        />
      </div>
    </div>
  );
};

export default Index;
