import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Trash2, Code, Eye } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export interface Analysis {
  id: string;
  options: string[];
  columns: string[];
}

interface AnalysisTableProps {
  analyses: Analysis[];
  onDelete: (id: string) => void;
  onGenerateCode: (analysis: Analysis) => void;
  onPreviewResults: (analysis: Analysis) => void;
}

const AnalysisTable = ({
  analyses,
  onDelete,
  onGenerateCode,
  onPreviewResults,
}: AnalysisTableProps) => {
  if (analyses.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No analysis rules added yet. Click "Analysis" to add one.
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
                <div className="flex justify-end gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onGenerateCode(analysis)}
                  >
                    <Code className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onPreviewResults(analysis)}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDelete(analysis.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default AnalysisTable;
