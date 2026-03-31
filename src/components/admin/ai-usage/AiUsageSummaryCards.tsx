import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { AiUsageOperationSummary, AiUsageOperationsTotals } from "@/api/types";
import { Bot, CheckCircle2, Coins, DollarSign, Sparkles, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface AiUsageSummaryCardsProps {
  operations: AiUsageOperationSummary[];
  summary: AiUsageOperationsTotals | null;
  selectedOperation: string;
  onSelectOperation: (operation: string) => void;
  loading?: boolean;
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(value || 0);

const formatNumber = (value: number) => new Intl.NumberFormat("en-US").format(value || 0);

export function AiUsageSummaryCards({
  operations,
  summary,
  selectedOperation,
  onSelectOperation,
  loading = false,
}: AiUsageSummaryCardsProps) {
  const cards = [
    {
      title: "Total Runs",
      value: formatNumber(summary?.total_runs || 0),
      icon: Bot,
      tone: "bg-brand-green/10 text-brand-green",
    },
    {
      title: "Successful",
      value: formatNumber(summary?.successful_runs || 0),
      icon: CheckCircle2,
      tone: "bg-emerald-100 text-emerald-700",
    },
    {
      title: "Failed",
      value: formatNumber(summary?.failed_runs || 0),
      icon: XCircle,
      tone: "bg-red-100 text-red-700",
    },
    {
      title: "Tokens",
      value: formatNumber(summary?.total_tokens || 0),
      icon: Coins,
      tone: "bg-blue-100 text-blue-700",
    },
    {
      title: "Estimated Cost",
      value: formatCurrency(summary?.total_cost_usd || 0),
      icon: DollarSign,
      tone: "bg-amber-100 text-amber-700",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {cards.map((card) => (
          <Card key={card.title} className="border-border/60">
            <CardContent className="flex items-center justify-between p-5">
              <div>
                <p className="text-sm text-muted-foreground">{card.title}</p>
                <p className="mt-2 text-2xl font-semibold tracking-tight">
                  {loading ? "..." : card.value}
                </p>
              </div>
              <div className={cn("rounded-full p-3", card.tone)}>
                <card.icon className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-border/60">
        <CardHeader className="pb-4">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle>AI Operations</CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">
                Select an operation to filter trends and history.
              </p>
            </div>
            <Badge variant="secondary" className="w-fit">
              {operations.length} operation{operations.length === 1 ? "" : "s"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          <Button
            variant={selectedOperation === "all" ? "default" : "outline"}
            className={cn(
              "h-auto items-start justify-start px-4 py-4 text-left",
              selectedOperation === "all" && "bg-brand-green hover:bg-brand-green/90 text-white",
            )}
            onClick={() => onSelectOperation("all")}
          >
            <div className="flex w-full items-start justify-between gap-3">
              <div>
                <div className="font-medium">All Operations</div>
                <div className="mt-1 text-xs opacity-80">
                  View combined usage across every AI workflow.
                </div>
              </div>
              <Sparkles className="mt-0.5 h-4 w-4 shrink-0" />
            </div>
          </Button>

          {operations.map((item) => {
            const isActive = selectedOperation === item.operation;
            return (
              <Button
                key={item.operation}
                variant={isActive ? "default" : "outline"}
                className={cn(
                  "h-auto items-start justify-start px-4 py-4 text-left",
                  isActive && "bg-brand-green hover:bg-brand-green/90 text-white",
                )}
                onClick={() => onSelectOperation(item.operation)}
              >
                <div className="w-full space-y-2">
                  <div className="flex items-start justify-between gap-3">
                    <div className="font-medium">{item.label}</div>
                    <Badge
                      variant="secondary"
                      className={cn(
                        "ml-auto",
                        isActive ? "bg-white/15 text-white" : "bg-muted text-foreground",
                      )}
                    >
                      {formatNumber(item.total_runs)}
                    </Badge>
                  </div>
                  <div className={cn("grid grid-cols-2 gap-2 text-xs", isActive ? "text-white/85" : "text-muted-foreground")}>
                    <span>Success: {formatNumber(item.successful_runs)}</span>
                    <span>Failed: {formatNumber(item.failed_runs)}</span>
                    <span>Tokens: {formatNumber(item.total_tokens)}</span>
                    <span>Cost: {formatCurrency(item.total_cost_usd)}</span>
                  </div>
                </div>
              </Button>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
