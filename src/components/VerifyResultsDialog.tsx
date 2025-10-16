import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { CheckCircle2, XCircle, AlertCircle, Filter } from "lucide-react";
import { VerifyCodeResponse } from "@/lib/api";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface VerifyResultsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  results: VerifyCodeResponse | null;
  isLoading: boolean;
}

const VerifyResultsDialog = ({
  open,
  onOpenChange,
  results,
  isLoading,
}: VerifyResultsDialogProps) => {
  const [statusFilter, setStatusFilter] = useState<"all" | "failed">("all");

  if (isLoading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[900px] max-h-[85vh]">
          <DialogHeader>
            <DialogTitle>Verification Results</DialogTitle>
            <DialogDescription>Running checks on your data...</DialogDescription>
          </DialogHeader>
          <div className="flex items-center justify-center p-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Verifying data quality checks...</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!results) {
    return null;
  }

  const successRate = results.total > 0 
    ? ((results.success / results.total) * 100).toFixed(1) 
    : "0";

  const filteredConstraints = statusFilter === "failed"
    ? results.per_constraint.filter((c) => c.constraint_status !== "Success")
    : results.per_constraint;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[900px] max-h-[85vh]">
        <DialogHeader>
          <DialogTitle>Verification Results</DialogTitle>
          <DialogDescription>
            Data quality check results from Deequ verification
          </DialogDescription>
        </DialogHeader>

        {/* Summary Cards */}
        <div className="grid grid-cols-3 gap-4 mb-4">
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-8 w-8 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Total Checks</p>
                <p className="text-2xl font-bold">{results.total}</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">Passed</p>
                <p className="text-2xl font-bold text-green-600">{results.success}</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <XCircle className="h-8 w-8 text-red-500" />
              <div>
                <p className="text-sm text-muted-foreground">Failed</p>
                <p className="text-2xl font-bold text-red-600">{results.failure}</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Success Rate */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Success Rate</span>
            <span className="text-sm font-bold">{successRate}%</span>
          </div>
          <div className="w-full bg-secondary rounded-full h-2">
            <div
              className="bg-gradient-to-r from-primary to-accent h-2 rounded-full transition-all"
              style={{ width: `${successRate}%` }}
            />
          </div>
        </div>

        {/* Filter Controls */}
        <div className="flex items-center gap-2 mb-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">Filter:</span>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant={statusFilter === "all" ? "default" : "outline"}
              onClick={() => setStatusFilter("all")}
            >
              All ({results.per_constraint.length})
            </Button>
            <Button
              size="sm"
              variant={statusFilter === "failed" ? "destructive" : "outline"}
              onClick={() => setStatusFilter("failed")}
            >
              Failed ({results.failure})
            </Button>
          </div>
        </div>

        {/* All Constraints Table */}
        <ScrollArea className="h-[300px] rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Status</TableHead>
                <TableHead>Constraint</TableHead>
                <TableHead>Current Value</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredConstraints.map((constraint, index) => (
                <TableRow key={index}>
                  <TableCell>
                    <Badge
                      variant={constraint.constraint_status === "Success" ? "default" : "destructive"}
                      className="gap-1"
                    >
                      {constraint.constraint_status === "Success" ? (
                        <CheckCircle2 className="h-3 w-3" />
                      ) : (
                        <XCircle className="h-3 w-3" />
                      )}
                      {constraint.constraint_status}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-mono text-xs max-w-[400px] truncate">
                    {constraint.constraint}
                  </TableCell>
                  <TableCell className="font-mono text-xs">
                    {constraint.current_value || "-"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default VerifyResultsDialog;
