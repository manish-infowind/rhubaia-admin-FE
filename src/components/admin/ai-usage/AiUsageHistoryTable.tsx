import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { AiUsageHistoryItem, AiUsageHistoryPagination } from "@/api/types";

interface AiUsageHistoryTableProps {
  items: AiUsageHistoryItem[];
  pagination: AiUsageHistoryPagination | null;
  loading?: boolean;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
  onSelectItem: (item: AiUsageHistoryItem) => void;
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 4,
  }).format(value || 0);

export function AiUsageHistoryTable({
  items,
  pagination,
  loading = false,
  onPageChange,
  onLimitChange,
  onSelectItem,
}: AiUsageHistoryTableProps) {
  const currentPage = pagination?.page ?? 1;
  const totalPages = pagination?.total_pages ?? 1;

  return (
    <Card className="border-border/60">
      <CardHeader className="pb-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <CardTitle>Usage History</CardTitle>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">
              {pagination?.total ?? 0} records
            </span>
            <Select value={String(pagination?.limit ?? 20)} onValueChange={(value) => onLimitChange(Number(value))}>
              <SelectTrigger className="w-[110px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10 / page</SelectItem>
                <SelectItem value="20">20 / page</SelectItem>
                <SelectItem value="50">50 / page</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Created At</TableHead>
              <TableHead>Operation</TableHead>
              <TableHead>User</TableHead>
              <TableHead>Model</TableHead>
              <TableHead>Format</TableHead>
              <TableHead>Tokens</TableHead>
              <TableHead>Cost</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} className="h-28 text-center text-muted-foreground">
                  Loading history...
                </TableCell>
              </TableRow>
            ) : items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="h-28 text-center text-muted-foreground">
                  No AI usage history found for the selected filters.
                </TableCell>
              </TableRow>
            ) : (
              items.map((item) => (
                <TableRow
                  key={item.id}
                  className="cursor-pointer"
                  onClick={() => onSelectItem(item)}
                >
                  <TableCell>{new Date(item.created_at).toLocaleString()}</TableCell>
                  <TableCell>{item.operation_label}</TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div>{item.user?.full_name || "System"}</div>
                      <div className="text-xs text-muted-foreground">
                        {item.user?.email || "Unknown User"}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{item.model || "N/A"}</TableCell>
                  <TableCell>
                    <div className="space-y-1 text-xs">
                      <div>{item.output_format || "N/A"}</div>
                      <div className="text-muted-foreground">{item.quality || "N/A"}</div>
                    </div>
                  </TableCell>
                  <TableCell>{item.tokens.total}</TableCell>
                  <TableCell>{formatCurrency(item.estimated_cost_usd)}</TableCell>
                  <TableCell>
                    <Badge variant={item.success ? "secondary" : "destructive"}>
                      {item.success ? "Success" : "Failed"}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <p className="text-sm text-muted-foreground">
            Page {currentPage} of {totalPages}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage <= 1 || loading}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage >= totalPages || loading}
            >
              Next
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
