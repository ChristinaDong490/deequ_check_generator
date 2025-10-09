import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Database, Plus, Sparkles, Copy, Check, Play } from "lucide-react";
import { toast } from "sonner";
import ChecksTable from "@/components/ChecksTable";
import AddCheckDialog from "@/components/AddCheckDialog";
import CodeOutputDialog from "@/components/CodeOutputDialog";
import VerifyResultsDialog from "@/components/VerifyResultsDialog";
import { suggestChecks, generateCode, verifyCode, VerifyCodeResponse } from "@/lib/api";

export interface DataCheck {
  id: string;
  column: string;
  category: string;
  description: string;
  rule?: string;
  code?: string;
  current_value?: string;
  include?: boolean;
}

const getCategoryFromCode = (code?: string): string => {
  if (!code) return "Other";
  if (code.includes(".isComplete")) return "Completeness";
  if (code.includes(".isContainedIn")) return "ContainedIn";
  if (code.includes(".hasPattern")) return "Pattern";
  if (code.includes(".satisfies")) return "Satisfies";
  if (code.includes(".hasDataType")) return "DataType";
  if (code.includes(".isUnique")) return "Uniqueness";
  if (code.includes(".hasSize")) return "Row Count";
  if (code.includes(".hasMin") || code.includes(".hasMean") || 
      code.includes(".hasMax") || code.includes(".hasStandardDeviation")) {
    return "Numeric Ranges";
  }
  return "Other";
};

const Index = () => {
  const [dataPath, setDataPath] = useState("");
  const [keyCols, setKeyCols] = useState("");
  const [schemaColumns, setSchemaColumns] = useState<string[]>([]);
  const [checks, setChecks] = useState<DataCheck[]>([
    {
      id: "1",
      column: "FILE_AIRBAG_CODE",
      category: "Completeness",
      description: "FILE_AIRBAG_CODE has value range 'N', 'Y', 'U'",
    },
    {
      id: "2",
      column: "FILE_AIRBAG_CODE",
      category: "Uniqueness",
      description: "FILE_AIRBAG_CODE has value range 'N' for at least 94.0% of values",
    },
    {
      id: "3",
      column: "RECYCLED_PART_AMT",
      category: "Row Count",
      description: "RECYCLED_PART_AMT is within expected numeric range",
    },
  ]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isCodeDialogOpen, setIsCodeDialogOpen] = useState(false);
  const [isVerifyDialogOpen, setIsVerifyDialogOpen] = useState(false);
  const [editingCheck, setEditingCheck] = useState<DataCheck | null>(null);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [verifyResults, setVerifyResults] = useState<VerifyCodeResponse | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  const handleGetSuggestions = async () => {
    if (!dataPath.trim()) {
      toast.error("Please enter a data path");
      return;
    }
    
    setIsLoadingSuggestions(true);
    try {
      const keyColsArray = keyCols.trim() 
        ? keyCols.split(',').map(col => col.trim()).filter(Boolean)
        : [];
      
      const response = await suggestChecks(dataPath, keyColsArray);
      const newChecks = response.rows.map((row) => ({
        id: row.id,
        column: row.column,
        category: getCategoryFromCode(row.code),
        description: row.description || '',
        rule: row.rule,
        code: row.code,
        current_value: row.current_value,
        include: true,
      }));
      setChecks(newChecks);
      
      // Extract schema columns
      if (response.schema) {
        setSchemaColumns(response.schema.map(s => s.name));
      }
      
      toast.success(`Loaded ${response.row_count} suggested checks`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to fetch suggestions");
    } finally {
      setIsLoadingSuggestions(false);
    }
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

  const handlePreviewResults = async () => {
    if (!dataPath.trim()) {
      toast.error("Please enter a data path");
      return;
    }
    if (checks.length === 0) {
      toast.error("Please add at least one check");
      return;
    }

    setIsVerifying(true);
    setIsVerifyDialogOpen(true);
    
    try {
      const apiRows = checks.map(check => ({
        id: check.id,
        column: check.column,
        description: check.description,
        rule: check.rule,
        code: check.code || "",
        current_value: check.current_value,
        include: check.include ?? true,
      }));

      const codeResponse = await generateCode(apiRows, "Error", "Data Quality Checks");
      const verifyResponse = await verifyCode(dataPath, codeResponse.code);
      
      setVerifyResults(verifyResponse);
      toast.success(`Verification complete: ${verifyResponse.success}/${verifyResponse.total} checks passed`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to verify checks");
      setIsVerifyDialogOpen(false);
    } finally {
      setIsVerifying(false);
    }
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
          <div className="flex flex-col gap-4">
            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block text-foreground">
                Data Path
              </label>
              <Input
                placeholder="e.g., /mnt/data-engineering-share/data/internal/.../PER_DAY_CODE=01"
                value={dataPath}
                onChange={(e) => setDataPath(e.target.value)}
                className="font-mono"
              />
            </div>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <label className="text-sm font-medium mb-2 block text-foreground">
                  Key Columns (optional, comma-separated)
                </label>
                <Input
                  placeholder="e.g., primary_key,FILESUFFIX"
                  value={keyCols}
                  onChange={(e) => setKeyCols(e.target.value)}
                  className="font-mono"
                />
              </div>
              <div className="flex items-end">
                <Button 
                  onClick={handleGetSuggestions} 
                  className="gap-2"
                  disabled={isLoadingSuggestions}
                >
                  <Sparkles className="h-4 w-4" />
                  {isLoadingSuggestions ? "Loading..." : "Get Suggestions"}
                </Button>
              </div>
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

        {/* Action Buttons */}
        <div className="flex justify-end gap-4">
          <Button
            onClick={handlePreviewResults}
            size="lg"
            variant="outline"
            className="gap-2"
            disabled={isVerifying}
          >
            <Play className="h-5 w-5" />
            {isVerifying ? "Running..." : "Preview Results"}
          </Button>
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
          availableColumns={schemaColumns}
        />

        <CodeOutputDialog
          open={isCodeDialogOpen}
          onOpenChange={setIsCodeDialogOpen}
          checks={checks}
          dataPath={dataPath}
        />

        <VerifyResultsDialog
          open={isVerifyDialogOpen}
          onOpenChange={setIsVerifyDialogOpen}
          results={verifyResults}
          isLoading={isVerifying}
        />
      </div>
    </div>
  );
};

export default Index;
