import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

interface AnalysisResultsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  results: any;
  isLoading: boolean;
}

const AnalysisResultsDialog = ({
  open,
  onOpenChange,
  results,
  isLoading,
}: AnalysisResultsDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Analysis Results</DialogTitle>
          <DialogDescription>
            Preview of analysis results
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="h-[500px] w-full rounded-md border p-4">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-muted-foreground">Loading results...</div>
            </div>
          ) : (
            <pre className="text-sm font-mono">
              {JSON.stringify(results, null, 2)}
            </pre>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default AnalysisResultsDialog;
