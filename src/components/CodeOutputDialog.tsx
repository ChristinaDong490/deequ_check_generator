import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Copy, Check } from "lucide-react";
import { toast } from "sonner";
import { DataCheck } from "@/pages/Index";
import { generateCode, transpileChecks } from "@/lib/api";
import { ScrollArea } from "@/components/ui/scroll-area";


interface CodeOutputDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  checks: DataCheck[];
  dataPath: string;
}

const CodeOutputDialog = ({
  open,
  onOpenChange,
  checks,
  dataPath,
}: CodeOutputDialogProps) => {
  const [copied, setCopied] = useState(false);
  const [generatedCode, setGeneratedCode] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [processingTime, setProcessingTime] = useState(0);

  useEffect(() => {
    if (open) {
      fetchGeneratedCode();
    }
  }, [open, checks]);

  const fetchGeneratedCode = async () => {
    setIsGenerating(true);
    setProcessingTime(0);
    
    // Start timer
    const startTime = Date.now();
    const timerInterval = setInterval(() => {
      setProcessingTime(Math.floor((Date.now() - startTime) / 1000));
    }, 100);
    
    try {
      let apiRows = checks.map(check => ({
        id: check.id,
        column: check.column,
        description: check.description,
        rule: check.rule,
        code: check.code || "",
        current_value: check.current_value,
        include: check.include ?? true,
      }));

      // Check if any checks have empty code
      const hasEmptyCode = apiRows.some(row => !row.code || row.code.trim() === "" || row.code.trim() === "-");
      
      if (hasEmptyCode) {
        // Call transpile to fill in empty codes
        const transpileResponse = await transpileChecks(apiRows, false);
        if (transpileResponse.rows.length > 0) {
          // Map transpiled rows back to apiRows format
          apiRows = transpileResponse.rows.map(row => ({
            id: row.id,
            column: row.column,
            description: row.description || "",
            rule: row.rule || "",
            code: row.code || "",
            current_value: row.current_value || "",
            include: row.include ?? true,
          }));
        }
        if (transpileResponse.errors.length > 0) {
          console.error("Transpile errors:", transpileResponse.errors);
          toast.warning("Some checks failed to generate code");
        }
      }

      const response = await generateCode(apiRows, "Error", "Data Quality Checks");
      setGeneratedCode(response.code);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to generate code");
      setGeneratedCode("// Error generating code");
    } finally {
      clearInterval(timerInterval);
      setIsGenerating(false);
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success("Code copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  const installCode = "# Installation instructions will be added later";
  const mysqlCode = "# MySQL code will be added later";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[900px] max-h-[90vh] bg-card flex flex-col overflow-hidden">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>Generated Deequ Code</DialogTitle>
          <DialogDescription>
            Copy the code sections below to implement your data quality checks
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="deequ" className="w-full flex-1 flex flex-col overflow-hidden">
          <TabsList className="grid w-full grid-cols-3 flex-shrink-0">
            <TabsTrigger value="install">Installation</TabsTrigger>
            <TabsTrigger value="deequ">Deequ Code</TabsTrigger>
            <TabsTrigger value="mysql">MySQL</TabsTrigger>
          </TabsList>

          <TabsContent value="install" className="mt-4 flex-1 overflow-hidden flex flex-col">
            <div className="relative flex-1 overflow-hidden">
              <ScrollArea className="h-full w-full rounded-lg border bg-muted">
                <pre className="p-4 text-sm whitespace-pre-wrap break-words">
                  <code className="text-foreground">{installCode}</code>
                </pre>
              </ScrollArea>
              <Button
                size="sm"
                variant="outline"
                className="absolute top-2 right-2"
                onClick={() => handleCopy(installCode)}
              >
                {copied ? (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 mr-2" />
                    Copy
                  </>
                )}
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="deequ" className="mt-4 flex-1 overflow-hidden flex flex-col">
            <div className="relative flex-1 overflow-hidden">
              <ScrollArea className="h-full w-full rounded-lg border bg-muted">
                <pre className="p-4 text-sm whitespace-pre-wrap break-words">
                  <code className="text-foreground">
                    {isGenerating 
                      ? `Generating code... (${processingTime}s)` 
                      : generatedCode}
                  </code>
                </pre>
              </ScrollArea>
              <Button
                size="sm"
                variant="outline"
                className="absolute top-2 right-2"
                onClick={() => handleCopy(generatedCode)}
                disabled={isGenerating}
              >
                {copied ? (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 mr-2" />
                    Copy
                  </>
                )}
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="mysql" className="mt-4 flex-1 overflow-hidden flex flex-col">
            <div className="relative flex-1 overflow-hidden">
              <ScrollArea className="h-full w-full rounded-lg border bg-muted">
                <pre className="p-4 text-sm whitespace-pre-wrap break-words">
                  <code className="text-foreground">{mysqlCode}</code>
                </pre>
              </ScrollArea>
              <Button
                size="sm"
                variant="outline"
                className="absolute top-2 right-2"
                onClick={() => handleCopy(mysqlCode)}
              >
                {copied ? (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 mr-2" />
                    Copy
                  </>
                )}
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default CodeOutputDialog;
