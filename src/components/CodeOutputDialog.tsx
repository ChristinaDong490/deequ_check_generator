import { useState, useEffect, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Copy, Check, PlayCircle } from "lucide-react";
import { toast } from "sonner";
import { DataCheck } from "@/pages/Index";
import { Analysis } from "./AnalysisTable";
import { generateCode, transpileChecks, verifyCode, VerifyCodeResponse, runBatchAnalysis, previewAnalysis, PreviewAnalysisResponse } from "@/lib/api";
import { ScrollArea } from "@/components/ui/scroll-area";
import VerifyResultsDialog from "./VerifyResultsDialog";
import AnalysisResultsDialog from "./AnalysisResultsDialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";


interface CodeOutputDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  checks: DataCheck[];
  analyses: Analysis[];
  dataPath: string;
}

const CodeOutputDialog = ({
  open,
  onOpenChange,
  checks,
  analyses,
  dataPath,
}: CodeOutputDialogProps) => {
  const [copied, setCopied] = useState(false);
  const [copiedTerminal, setCopiedTerminal] = useState(false);
  const [copiedPython, setCopiedPython] = useState(false);
  const [generatedCode, setGeneratedCode] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [processingTime, setProcessingTime] = useState(0);
  const [verifyDialogOpen, setVerifyDialogOpen] = useState(false);
  const [verifyResults, setVerifyResults] = useState<VerifyCodeResponse | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [analysisResults, setAnalysisResults] = useState<any>(null);
  const [analysisCode, setAnalysisCode] = useState<string>("");
  const [previewAnalysisResults, setPreviewAnalysisResults] = useState<PreviewAnalysisResponse | null>(null);
  const [isPreviewingAnalysis, setIsPreviewingAnalysis] = useState(false);
  const [activeTab, setActiveTab] = useState("deequ");

  useEffect(() => {
    if (open) {
      fetchGeneratedCode();
    }
  }, [open, checks, analyses]);

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

      // Run batch analysis for all analyses
      if (analyses.length > 0) {
        try {
          const batchAnalyses = analyses.map(analysis => ({
            options: analysis.options,
            columns: analysis.columns
          }));
          const result = await runBatchAnalysis(dataPath, batchAnalyses);
          setAnalysisResults(result.results);
          setAnalysisCode(result.code || "");
        } catch (error) {
          console.error("Batch analysis error:", error);
          setAnalysisResults(null);
          setAnalysisCode("");
        }
      } else {
        setAnalysisResults(null);
        setAnalysisCode("");
      }
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

  const handleCopyTerminal = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedTerminal(true);
    toast.success("Terminal instructions copied to clipboard");
    setTimeout(() => setCopiedTerminal(false), 2000);
  };

  const handleCopyPython = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedPython(true);
    toast.success("Python instructions copied to clipboard");
    setTimeout(() => setCopiedPython(false), 2000);
  };

  const handlePreviewChecks = async () => {
    if (!generatedCode || isGenerating) {
      toast.error("Please wait for code generation to complete");
      return;
    }

    setIsVerifying(true);
    setVerifyDialogOpen(true);
    setVerifyResults(null);

    try {
      const results = await verifyCode(dataPath, generatedCode);
      setVerifyResults(results);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to verify code");
      setVerifyDialogOpen(false);
    } finally {
      setIsVerifying(false);
    }
  };

  const handlePreviewAnalysis = async () => {
    if (analyses.length === 0) {
      toast.error("No analysis rules configured");
      return;
    }

    setIsPreviewingAnalysis(true);
    setPreviewAnalysisResults(null);
    try {
      const batchAnalyses = analyses.map(analysis => ({
        options: analysis.options,
        columns: analysis.columns
      }));
      const results = await previewAnalysis(dataPath, batchAnalyses);
      setPreviewAnalysisResults(results);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to preview analysis");
    } finally {
      setIsPreviewingAnalysis(false);
    }
  };

  const terminalInstallCode = `# Terminal Installation Instructions
pip install pydeequ pyspark pandas`;

  const pythonInstallCode = `# Python Script Installation
# Add these imports to your Python script:
from pydeequ.checks import *
from pydeequ.verification import *
from pyspark.sql import SparkSession
import pandas as pd`;

  const mysqlCode = "# MySQL code will be added later";

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[900px] max-h-[90vh] bg-card flex flex-col overflow-hidden">
          <DialogHeader className="flex-shrink-0">
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle>Generated Deequ Code</DialogTitle>
                <DialogDescription>
                  Copy the code sections below to implement your data quality checks
                </DialogDescription>
              </div>
              {activeTab === "deequ" && (
                <Button
                  onClick={handlePreviewChecks}
                  disabled={isGenerating || !generatedCode}
                  className="gap-2"
                >
                  <PlayCircle className="h-4 w-4" />
                  Preview Checks
                </Button>
              )}
              {activeTab === "analysis" && (
                <Button
                  onClick={handlePreviewAnalysis}
                  disabled={isPreviewingAnalysis || analyses.length === 0}
                  className="gap-2"
                >
                  <PlayCircle className="h-4 w-4" />
                  {isPreviewingAnalysis ? "Running..." : "Preview Analysis"}
                </Button>
              )}
            </div>
          </DialogHeader>

        <Tabs defaultValue="deequ" value={activeTab} onValueChange={setActiveTab} className="w-full flex-1 flex flex-col overflow-hidden">
          <TabsList className="grid w-full grid-cols-4 flex-shrink-0">
            <TabsTrigger value="install">Installation</TabsTrigger>
            <TabsTrigger value="deequ">Deequ Code</TabsTrigger>
            <TabsTrigger value="analysis">Analysis Preview</TabsTrigger>
            <TabsTrigger value="mysql">MySQL</TabsTrigger>
          </TabsList>

          <TabsContent value="install" className="mt-4 flex-1 overflow-auto">
            <div className="space-y-4 pb-4">
              {/* Terminal Installation Box */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center justify-between">
                    Installation Instructions for Terminal
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleCopyTerminal(terminalInstallCode)}
                    >
                      {copiedTerminal ? (
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
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="rounded-lg border bg-muted">
                    <pre className="p-4 text-sm overflow-x-auto">
                      <code className="text-foreground">{terminalInstallCode}</code>
                    </pre>
                  </div>
                </CardContent>
              </Card>

              {/* Python Script Installation Box */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center justify-between">
                    Installation Instructions for Python Script
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleCopyPython(pythonInstallCode)}
                    >
                      {copiedPython ? (
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
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="rounded-lg border bg-muted">
                    <pre className="p-4 text-sm overflow-x-auto">
                      <code className="text-foreground">{pythonInstallCode}</code>
                    </pre>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="deequ" className="mt-4 flex-1 overflow-hidden flex flex-col">
            <div className="relative flex-1 overflow-hidden">
              <div className="h-[500px] w-full rounded-lg border bg-muted overflow-auto">
                <pre className="p-4 text-sm whitespace-pre min-w-max">
                  <code className="text-foreground">
                    {isGenerating 
                      ? `Generating code... (${processingTime}s)` 
                      : generatedCode}
                  </code>
                </pre>
              </div>
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

          <TabsContent value="analysis" className="mt-4 flex-1 overflow-hidden flex flex-col">
            <div className="relative flex-1 overflow-hidden">
              <div className="h-[500px] w-full rounded-lg border bg-muted overflow-auto">
                <pre className="p-4 text-sm whitespace-pre min-w-max">
                  <code className="text-foreground">
                    {analysisCode || "# No analysis code generated yet"}
                  </code>
                </pre>
              </div>
              <Button
                size="sm"
                variant="outline"
                className="absolute top-2 right-2"
                onClick={() => handleCopy(analysisCode)}
                disabled={!analysisCode}
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
              <div className="h-[500px] w-full rounded-lg border bg-muted overflow-auto">
                <pre className="p-4 text-sm whitespace-pre min-w-max">
                  <code className="text-foreground">{mysqlCode}</code>
                </pre>
              </div>
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

    <VerifyResultsDialog
      open={verifyDialogOpen}
      onOpenChange={setVerifyDialogOpen}
      results={verifyResults}
      isLoading={isVerifying}
    />

    <AnalysisResultsDialog
      open={!!previewAnalysisResults || isPreviewingAnalysis}
      onOpenChange={(open) => !open && setPreviewAnalysisResults(null)}
      results={previewAnalysisResults}
      isLoading={isPreviewingAnalysis}
    />
    </>
  );
};

export default CodeOutputDialog;
