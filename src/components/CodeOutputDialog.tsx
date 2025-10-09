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

  useEffect(() => {
    if (open) {
      fetchGeneratedCode();
    }
  }, [open, checks]);

  const fetchGeneratedCode = async () => {
    setIsGenerating(true);
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
      <DialogContent className="sm:max-w-[800px] max-h-[85vh] bg-card">
        <DialogHeader>
          <DialogTitle>Generated Deequ Code</DialogTitle>
          <DialogDescription>
            Copy the code sections below to implement your data quality checks
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="deequ" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="install">Installation</TabsTrigger>
            <TabsTrigger value="deequ">Deequ Code</TabsTrigger>
            <TabsTrigger value="mysql">MySQL</TabsTrigger>
          </TabsList>

          <TabsContent value="install" className="mt-4">
            <div className="relative">
              <ScrollArea className="h-[450px] w-full rounded-lg border">
                <pre className="bg-muted p-4 text-sm">
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

          <TabsContent value="deequ" className="mt-4">
            <div className="relative">
              <ScrollArea className="h-[450px] w-full rounded-lg border">
                <pre className="bg-muted p-4 text-sm">
                  <code className="text-foreground">
                    {isGenerating ? "Generating code..." : generatedCode}
                  </code>
                </pre>
              </ScrollArea>
              <Button
                size="sm"
                variant="outline"
                className="absolute top-2 right-2"
                onClick={() => handleCopy(generatedCode)}
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

          <TabsContent value="mysql" className="mt-4">
            <div className="relative">
              <ScrollArea className="h-[450px] w-full rounded-lg border">
                <pre className="bg-muted p-4 text-sm">
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
