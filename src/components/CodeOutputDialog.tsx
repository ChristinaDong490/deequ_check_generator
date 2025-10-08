import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Copy, Check } from "lucide-react";
import { toast } from "sonner";
import { DataCheck } from "@/pages/Index";
import { generateCode } from "@/lib/api";

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

  useEffect(() => {
    if (open) {
      fetchGeneratedCode();
    }
  }, [open, checks]);

  const fetchGeneratedCode = async () => {
    setIsGenerating(true);
    try {
      const apiRows = checks.map(check => ({
        column_name: check.columnName,
        category: check.category,
        description: check.description,
        code: check.code || "",
        include: check.include ?? true,
      }));

      const response = await generateCode(apiRows, "Error", "Data Quality Checks");
      setGeneratedCode(response.code);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to generate code");
      setGeneratedCode("// Error generating code");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedCode);
    setCopied(true);
    toast.success("Code copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[80vh] bg-card">
        <DialogHeader>
          <DialogTitle>Generated Deequ Code</DialogTitle>
          <DialogDescription>
            Copy this code to implement your data quality checks
          </DialogDescription>
        </DialogHeader>

        <div className="relative">
          <pre className="bg-muted p-4 rounded-lg overflow-auto max-h-[500px] text-sm">
            <code className="text-foreground">
              {isGenerating ? "Generating code..." : generatedCode}
            </code>
          </pre>
          <Button
            size="sm"
            variant="outline"
            className="absolute top-2 right-2"
            onClick={handleCopy}
          >
            {copied ? (
              <>
                <Check className="h-4 w-4 mr-2" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="h-4 w-4 mr-2" />
                Copy Code
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CodeOutputDialog;
