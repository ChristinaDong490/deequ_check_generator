import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export interface Analysis {
  id: string;
  options: string[];
  columns: string[];
}

interface AnalysisTableProps {
  analyses: Analysis[];
  onDelete: (id: string) => void;
}

const AnalysisTable = ({
  analyses,
  onDelete,
}: AnalysisTableProps) => {
  if (analyses.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No analysis rules added yet. Click "Add Analysis" to add one.
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Options</TableHead>
            <TableHead>Columns</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {analyses.map((analysis) => (
            <TableRow key={analysis.id}>
              <TableCell>
                <div className="flex flex-wrap gap-1">
                  {analysis.options.map((opt) => (
                    <Badge key={opt} variant="secondary" className="text-xs">
                      {opt}
                    </Badge>
                  ))}
                </div>
              </TableCell>
              <TableCell>
                <div className="flex flex-wrap gap-1">
                  {analysis.columns.map((col) => (
                    <Badge key={col} variant="outline" className="text-xs font-mono">
                      {col}
                    </Badge>
                  ))}
                </div>
              </TableCell>
              <TableCell className="text-right">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onDelete(analysis.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default AnalysisTable;
