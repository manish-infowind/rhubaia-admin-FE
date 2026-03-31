import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import type { AiUsageHistoryItem } from "@/api/types";

interface AiUsageDetailsModalProps {
  item: AiUsageHistoryItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 4,
  }).format(value || 0);

export function AiUsageDetailsModal({
  item,
  open,
  onOpenChange,
}: AiUsageDetailsModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] max-w-4xl overflow-y-auto">
        {!item ? null : (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-3">
                <span>{item.operation_label}</span>
                <Badge variant={item.success ? "secondary" : "destructive"}>
                  {item.success ? "Success" : "Failed"}
                </Badge>
              </DialogTitle>
              <DialogDescription>
                Audit entry #{item.id} created on{" "}
                {new Date(item.created_at).toLocaleString()}
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-6 lg:grid-cols-2">
              <div className="space-y-4">
                <section className="space-y-3">
                  <h3 className="font-medium">Request Details</h3>
                  <div className="grid gap-2 text-sm">
                    <div><span className="text-muted-foreground">Operation:</span> {item.operation}</div>
                    <div><span className="text-muted-foreground">Model:</span> {item.model || "N/A"}</div>
                    <div><span className="text-muted-foreground">Format:</span> {item.output_format || "N/A"}</div>
                    <div><span className="text-muted-foreground">Quality:</span> {item.quality || "N/A"}</div>
                    <div><span className="text-muted-foreground">Size:</span> {item.size || "N/A"}</div>
                    <div><span className="text-muted-foreground">Estimated Cost:</span> {formatCurrency(item.estimated_cost_usd)}</div>
                  </div>
                </section>

                <Separator />

                <section className="space-y-3">
                  <h3 className="font-medium">User</h3>
                  <div className="grid gap-2 text-sm">
                    <div><span className="text-muted-foreground">Name:</span> {item.user?.full_name || "System"}</div>
                    <div><span className="text-muted-foreground">Email:</span> {item.user?.email || "Unknown User"}</div>
                    <div><span className="text-muted-foreground">UUID:</span> {item.user?.uuid || "N/A"}</div>
                  </div>
                </section>

                <Separator />

                <section className="space-y-3">
                  <h3 className="font-medium">Token Usage</h3>
                  <div className="grid gap-2 text-sm">
                    <div><span className="text-muted-foreground">Input:</span> {item.tokens.input}</div>
                    <div><span className="text-muted-foreground">Output:</span> {item.tokens.output}</div>
                    <div><span className="text-muted-foreground">Total:</span> {item.tokens.total}</div>
                  </div>
                </section>

                <Separator />

                <section className="space-y-3">
                  <h3 className="font-medium">Outcome</h3>
                  <div className="grid gap-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">Result URL:</span>{" "}
                      {item.result_url ? (
                        <a
                          href={item.result_url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-brand-green underline"
                        >
                          Open result
                        </a>
                      ) : (
                        "N/A"
                      )}
                    </div>
                    <div>
                      <span className="text-muted-foreground">Error:</span>{" "}
                      {item.error_message || "None"}
                    </div>
                  </div>
                </section>
              </div>

              <div className="space-y-4">
                <section className="space-y-3">
                  <h3 className="font-medium">Usage Details</h3>
                  <pre className="overflow-x-auto rounded-lg bg-muted p-4 text-xs">
                    {JSON.stringify(item.usage_details ?? {}, null, 2)}
                  </pre>
                </section>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
