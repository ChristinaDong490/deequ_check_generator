import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Database, Plus, Sparkles, Copy, Check, Play, X } from "lucide-react";
import { toast } from "sonner";
import ChecksTable from "@/components/ChecksTable";
import AddCheckDialog from "@/components/AddCheckDialog";
import CodeOutputDialog from "@/components/CodeOutputDialog";
import VerifyResultsDialog from "@/components/VerifyResultsDialog";
import { suggestChecks, generateCode, verifyCode, VerifyCodeResponse, getSchema } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

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
  const [keyCols, setKeyCols] = useState<string[]>([]);
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
  const [suggestionsProgress, setSuggestionsProgress] = useState(0);
  const [verifyResults, setVerifyResults] = useState<VerifyCodeResponse | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifyProgress, setVerifyProgress] = useState(0);
  const [isLoadingSchema, setIsLoadingSchema] = useState(false);
  const [openKeyColsPopover, setOpenKeyColsPopover] = useState(false);

  // Auto-fetch schema when data path changes
  useEffect(() => {
    const fetchSchema = async () => {
      if (!dataPath.trim()) {
        setSchemaColumns([]);
        return;
      }

      setIsLoadingSchema(true);
      try {
        const response = await getSchema(dataPath, "parquet");
        setSchemaColumns(response.columns);
      } catch (error) {
        console.error("Failed to fetch schema:", error);
        toast.error("Failed to load schema from data path");
      } finally {
        setIsLoadingSchema(false);
      }
    };

    const debounceTimer = setTimeout(fetchSchema, 500);
    return () => clearTimeout(debounceTimer);
  }, [dataPath]);

  const handleGetSuggestions = async () => {
    if (!dataPath.trim()) {
      toast.error("Please enter a data path");
      return;
    }
    
    setIsLoadingSuggestions(true);
    setSuggestionsProgress(0);
    
    // Simulate progress
    const progressInterval = setInterval(() => {
      setSuggestionsProgress(prev => Math.min(prev + 10, 90));
    }, 200);
    
    try {
      const response = await suggestChecks(dataPath, keyCols);
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
      
      setSuggestionsProgress(100);
      toast.success(`Loaded ${response.row_count} suggested checks`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to fetch suggestions");
    } finally {
      clearInterval(progressInterval);
      setIsLoadingSuggestions(false);
      setTimeout(() => setSuggestionsProgress(0), 500);
    }
  };

  const handleAddCheck = async (check: Omit<DataCheck, "id">) => {
    const checkWithId = editingCheck
      ? { ...check, id: editingCheck.id }
      : { ...check, id: Date.now().toString() };

    // First add/update the check in the UI
    if (editingCheck) {
      setChecks(checks.map((c) => (c.id === editingCheck.id ? checkWithId : c)));
    } else {
      setChecks([...checks, checkWithId]);
    }

    // Then call transpile API to generate Deequ code from description
    try {
      const { transpileChecks } = await import("@/lib/api");
      const response = await transpileChecks([{
        id: checkWithId.id,
        column: checkWithId.column,
        description: checkWithId.description,
        rule: checkWithId.rule || "",
        code: checkWithId.code || "",
        include: checkWithId.include ?? true,
        current_value: checkWithId.current_value,
      }], false);
      
      if (response.rows.length > 0) {
        const updatedCheck = response.rows[0];
        setChecks((prev) =>
          prev.map((c) =>
            c.id === checkWithId.id
              ? { ...c, code: updatedCheck.code }
              : c
          )
        );
      }

      if (response.errors.length > 0) {
        console.error("Transpile errors:", response.errors);
        toast.error("Failed to generate code from description");
      } else {
        toast.success(editingCheck ? "Check updated with generated code" : "Check added with generated code");
      }
    } catch (error) {
      console.error("Failed to transpile check:", error);
      toast.error("Failed to generate code from description");
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
    setVerifyProgress(0);
    setIsVerifyDialogOpen(true);
    
    // Simulate progress
    const progressInterval = setInterval(() => {
      setVerifyProgress(prev => Math.min(prev + 8, 90));
    }, 300);
    
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
      setVerifyProgress(50);
      const verifyResponse = await verifyCode(dataPath, codeResponse.code);
      
      setVerifyResults(verifyResponse);
      setVerifyProgress(100);
      toast.success(`Verification complete: ${verifyResponse.success}/${verifyResponse.total} checks passed`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to verify checks");
      setIsVerifyDialogOpen(false);
    } finally {
      clearInterval(progressInterval);
      setIsVerifying(false);
      setTimeout(() => setVerifyProgress(0), 500);
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
                  Key Columns (optional)
                </label>
                <Popover open={openKeyColsPopover} onOpenChange={setOpenKeyColsPopover}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      disabled={isLoadingSchema || schemaColumns.length === 0}
                      className="w-full justify-start font-mono bg-background h-auto min-h-10 py-2"
                    >
                      {keyCols.length === 0 ? (
                        <span className="text-muted-foreground">
                          {isLoadingSchema ? "Loading schema..." : schemaColumns.length === 0 ? "Enter data path first" : "Select key columns"}
                        </span>
                      ) : (
                        <div className="flex flex-wrap gap-1">
                          {keyCols.map((col) => (
                            <Badge key={col} variant="secondary" className="gap-1">
                              {col}
                              <X
                                className="h-3 w-3 cursor-pointer hover:text-destructive"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setKeyCols(keyCols.filter(k => k !== col));
                                }}
                              />
                            </Badge>
                          ))}
                        </div>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[400px] p-0" align="start">
                    <Command>
                      <CommandInput placeholder="Search columns..." />
                      <CommandList>
                        <CommandEmpty>No columns found.</CommandEmpty>
                        <CommandGroup>
                          {schemaColumns.map((column) => (
                            <CommandItem
                              key={column}
                              value={column}
                              onSelect={() => {
                                setKeyCols(prev => 
                                  prev.includes(column)
                                    ? prev.filter(k => k !== column)
                                    : [...prev, column]
                                );
                              }}
                            >
                              <Check
                                className={`mr-2 h-4 w-4 ${
                                  keyCols.includes(column) ? "opacity-100" : "opacity-0"
                                }`}
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
            {isLoadingSuggestions && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Fetching suggestions...</span>
                  <span className="text-muted-foreground">{suggestionsProgress}%</span>
                </div>
                <Progress value={suggestionsProgress} className="h-2" />
              </div>
            )}
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
              availableColumns={schemaColumns}
            />
          </div>
        </Card>

        {/* Action Buttons */}
        <div className="space-y-4">
          {isVerifying && (
            <Card className="p-4 shadow-lg border-border/50 backdrop-blur-sm bg-card/80">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Running verification...</span>
                  <span className="text-muted-foreground">{verifyProgress}%</span>
                </div>
                <Progress value={verifyProgress} className="h-2" />
              </div>
            </Card>
          )}
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
