import { useState, useMemo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Pencil, Trash2, Filter, ArrowUpDown } from "lucide-react";
import { DataCheck } from "@/pages/Index";

interface ChecksTableProps {
  checks: DataCheck[];
  onEdit: (check: DataCheck) => void;
  onDelete: (id: string) => void;
}

const COLUMN_NAMES = ["FILE_AIRBAG_CODE", "RECYCLED_PART_AMT", "TOWING_AMT"];
const CATEGORIES = ["completeness", "uniqueness", "size"];

const ChecksTable = ({ checks, onEdit, onDelete }: ChecksTableProps) => {
  const [columnFilter, setColumnFilter] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [columnSort, setColumnSort] = useState<"asc" | "desc" | null>(null);
  const [categorySort, setCategorySort] = useState<"asc" | "desc" | null>(null);

  const filteredAndSortedChecks = useMemo(() => {
    let result = [...checks];

    // Apply filters
    if (columnFilter) {
      result = result.filter((check) => check.column === columnFilter);
    }
    if (categoryFilter) {
      result = result.filter((check) => check.category === categoryFilter);
    }

    // Apply sorting
    if (columnSort) {
      result.sort((a, b) => {
        const comparison = a.column.localeCompare(b.column);
        return columnSort === "asc" ? comparison : -comparison;
      });
    } else if (categorySort) {
      result.sort((a, b) => {
        const comparison = a.category.localeCompare(b.category);
        return categorySort === "asc" ? comparison : -comparison;
      });
    }

    return result;
  }, [checks, columnFilter, categoryFilter, columnSort, categorySort]);

  const toggleColumnSort = () => {
    if (!columnSort) setColumnSort("asc");
    else if (columnSort === "asc") setColumnSort("desc");
    else setColumnSort(null);
    setCategorySort(null);
  };

  const toggleCategorySort = () => {
    if (!categorySort) setCategorySort("asc");
    else if (categorySort === "asc") setCategorySort("desc");
    else setCategorySort(null);
    setColumnSort(null);
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "completeness":
        return "bg-primary/10 text-primary border-primary/20";
      case "uniqueness":
        return "bg-accent/10 text-accent border-accent/20";
      case "size":
        return "bg-muted text-muted-foreground border-border";
      default:
        return "bg-secondary text-secondary-foreground border-border";
    }
  };

  return (
    <div className="space-y-4">
      {/* Filter Pills */}
      <div className="flex flex-wrap gap-2">
        {columnFilter && (
          <Badge variant="outline" className="gap-2">
            Column: {columnFilter}
            <button
              onClick={() => setColumnFilter(null)}
              className="ml-1 hover:text-destructive"
            >
              ×
            </button>
          </Badge>
        )}
        {categoryFilter && (
          <Badge variant="outline" className="gap-2">
            Category: {categoryFilter}
            <button
              onClick={() => setCategoryFilter(null)}
              className="ml-1 hover:text-destructive"
            >
              ×
            </button>
          </Badge>
        )}
        {(columnFilter || categoryFilter) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setColumnFilter(null);
              setCategoryFilter(null);
            }}
          >
            Clear all
          </Button>
        )}
      </div>

      {/* Table */}
      <div className="rounded-lg border border-border/50 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/70">
              <TableHead className="font-semibold">
                <div className="flex items-center gap-2">
                  Column Name
                  <div className="flex gap-1">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                          <Filter className="h-3 w-3" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start" className="bg-popover">
                        {COLUMN_NAMES.map((name) => (
                          <DropdownMenuItem
                            key={name}
                            onClick={() => setColumnFilter(name)}
                            className="cursor-pointer"
                          >
                            {name}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={toggleColumnSort}
                    >
                      <ArrowUpDown className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </TableHead>
              <TableHead className="font-semibold">
                <div className="flex items-center gap-2">
                  Category
                  <div className="flex gap-1">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                          <Filter className="h-3 w-3" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start" className="bg-popover">
                        {CATEGORIES.map((cat) => (
                          <DropdownMenuItem
                            key={cat}
                            onClick={() => setCategoryFilter(cat)}
                            className="cursor-pointer"
                          >
                            {cat}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={toggleCategorySort}
                    >
                      <ArrowUpDown className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </TableHead>
              <TableHead className="font-semibold">Description</TableHead>
              <TableHead className="font-semibold text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredAndSortedChecks.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                  No checks found. Add your first check to get started.
                </TableCell>
              </TableRow>
            ) : (
              filteredAndSortedChecks.map((check) => (
                <TableRow key={check.id} className="hover:bg-muted/30">
                  <TableCell className="font-mono text-sm">{check.column}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={getCategoryColor(check.category)}>
                      {check.category}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm">{check.description}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEdit(check)}
                        className="h-8 w-8 p-0"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDelete(check.id)}
                        className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default ChecksTable;
