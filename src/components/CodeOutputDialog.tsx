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
    if (open) fetchGeneratedCode();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, checks]);

  const fetchGeneratedCode = async () => {
    setIsGenerating(true);
    try {
      const apiRows = checks.map((check) => ({
        id: check.id,
        column: check.column,
        description: check.description,
        rule: check.rule,
        code: check.code || "",
        current_value: check.current_value,
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
      {/* 让对话框本身有最大高，内部使用overflow-y-auto容器承接滚动 */}
      <DialogContent className="sm:max-w-[900px] max-h-[90vh] bg-card p-6 flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>Generated Deequ Code</DialogTitle>
          <DialogDescription>
            Copy the code sections below to implement your data quality checks
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="deequ" className="w-full flex-1 flex flex-col mt-2">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="install">Installation</TabsTrigger>
            <TabsTrigger value="deequ">Deequ Code</TabsTrigger>
            <TabsTrigger value="mysql">MySQL</TabsTrigger>
          </TabsList>

          {/* 统一：仅纵向滚动，固定可视高度 */}
          <TabsContent value="install" className="mt-4 flex-1">
            <div className="relative">
              <div className="h-[60vh] w-full rounded-lg border bg-muted overflow-y-auto overflow-x-hidden">
                <pre className="p-4 text-sm font-mono whitespace-pre-wrap break-words">
                  <code className="text-foreground">{installCode}</code>
                </pre>
              </div>
              <Button
                size="sm"
                variant="outline"
                className="absolute top-2 right-2"
                onClick={() => handleCopy(installCode)}
              >
                {copied ? <><Check className="h-4 w-4 mr-2" />Copied!</> : <><Copy className="h-4 w-4 mr-2" />Copy</>}
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="deequ" className="mt-4 flex-1">
            <div className="relative">
              <div className="h-[60vh] w-full rounded-lg border bg-muted overflow-y-auto overflow-x-hidden">
                <pre className="p-4 text-sm font-mono whitespace-pre-wrap break-words">
                  <code className="text-foreground">
                    {isGenerating ? "Generating code..." : generatedCode}
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
                {copied ? <><Check className="h-4 w-4 mr-2" />Copied!</> : <><Copy className="h-4 w-4 mr-2" />Copy</>}
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="mysql" className="mt-4 flex-1">
            <div className="relative">
              <div className="h-[60vh] w-full rounded-lg border bg-muted overflow-y-auto overflow-x-hidden">
                <pre className="p-4 text-sm font-mono whitespace-pre-wrap break-words">
                  <code className="text-foreground">{mysqlCode}</code>
                </pre>
              </div>
              <Button
                size="sm"
                variant="outline"
                className="absolute top-2 right-2"
                onClick={() => handleCopy(mysqlCode)}
              >
                {copied ? <><Check className="h-4 w-4 mr-2" />Copied!</> : <><Copy className="h-4 w-4 mr-2" />Copy</>}
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default CodeOutputDialog;
