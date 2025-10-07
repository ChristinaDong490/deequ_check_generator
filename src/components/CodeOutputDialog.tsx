import { useState } from "react";
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

  const generateCode = () => {
    const checksByCategory = checks.reduce((acc, check) => {
      if (!acc[check.category]) {
        acc[check.category] = [];
      }
      acc[check.category].push(check);
      return acc;
    }, {} as Record<string, DataCheck[]>);

    let code = `// Deequ Quality Checks
// Generated for: ${dataPath || "data path not specified"}

import com.amazon.deequ.VerificationSuite
import com.amazon.deequ.checks.{Check, CheckLevel}

val verificationResult = VerificationSuite()
  .onData(df)
  .addCheck(
    Check(CheckLevel.Error, "Data Quality Checks")
`;

    Object.entries(checksByCategory).forEach(([category, categoryChecks]) => {
      code += `\n      // ${category.charAt(0).toUpperCase() + category.slice(1)} checks\n`;
      categoryChecks.forEach((check) => {
        code += `      // ${check.description}\n`;
        
        if (category === "completeness") {
          code += `      .hasCompleteness("${check.columnName}", _ >= 0.95)\n`;
        } else if (category === "uniqueness") {
          code += `      .hasUniqueness("${check.columnName}", _ >= 0.95)\n`;
        } else if (category === "size") {
          code += `      .hasSize(_ > 0)\n`;
        }
      });
    });

    code += `  )
  .run()

// Check results
if (verificationResult.status == CheckStatus.Success) {
  println("All checks passed!")
} else {
  println("Some checks failed:")
  verificationResult.checkResults.foreach { case (check, result) =>
    println(s"Check: \${check.description}, Status: \${result.status}")
  }
}`;

    return code;
  };

  const handleCopy = () => {
    const code = generateCode();
    navigator.clipboard.writeText(code);
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
            <code className="text-foreground">{generateCode()}</code>
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
