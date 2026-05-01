import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loader2, ShieldAlert } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type {
  ApiError,
  ManualSubscriptionAssignRequest,
  ManualSubscriptionPlatform,
  ManualSubscriptionLookupQuery,
  SubscriptionPlanListItem,
  UserDetails,
} from "@/api/types";
import {
  useManualSubscriptionAssign,
  useManualSubscriptionLookup,
  useManualTransactionDetails,
  useSubscriptionPlans,
} from "@/api/hooks/useManualSubscription";
import { canReadSubscriptionManagement, canUpdateSubscriptionManagement, hasSuperAdminRole } from "@/lib/permissions";

type Mode = "repair" | "force";

interface ManualSubscriptionAssignmentProps {
  user: UserDetails;
  loginUser: any; // from auth redux (User | LoginResponse shape)
}

export function ManualSubscriptionAssignment({ user, loginUser }: ManualSubscriptionAssignmentProps) {
  const { toast } = useToast();

  const isSuperAdmin = hasSuperAdminRole(loginUser as any);
  const canRead = isSuperAdmin || canReadSubscriptionManagement(loginUser as any);
  const canUpdate = isSuperAdmin || canUpdateSubscriptionManagement(loginUser as any);

  const [platform, setPlatform] = useState<ManualSubscriptionPlatform>("android");
  const [mode, setMode] = useState<Mode>("repair");

  const [planId, setPlanId] = useState<string>("");
  const [reason, setReason] = useState("");
  const [notes, setNotes] = useState("");

  // Repair fields
  const [transactionId, setTransactionId] = useState("");

  // Force fields
  const [amount, setAmount] = useState<string>("");
  const [currency, setCurrency] = useState("USD");
  // Optional proof fields (advanced)
  const [purchaseToken, setPurchaseToken] = useState("");
  const [orderId, setOrderId] = useState("");

  // Lookup (optional helper)
  const [lookupTriggered, setLookupTriggered] = useState(false);

  const assign = useManualSubscriptionAssign();
  const plansQuery = useSubscriptionPlans({ enabled: canRead });
  const txQuery = useManualTransactionDetails(
    mode === "repair" && transactionId.trim() ? { transactionId: transactionId.trim(), userId: user.uuid } : null,
    { enabled: canRead && mode === "repair" && Boolean(transactionId.trim()) },
  );

  const lookupQuery = (() => {
    if (!canRead) return null;
    if (!lookupTriggered) return null;
    const base: ManualSubscriptionLookupQuery = { userId: user.uuid, platform };
    if (platform === "android") {
      if (purchaseToken.trim()) base.purchaseToken = purchaseToken.trim();
      if (orderId.trim()) base.orderId = orderId.trim();
      // productId not required by backend; keep lookup minimal
    } else {
      // productId not required by backend; keep lookup minimal
    }
    return base;
  })();

  const lookup = useManualSubscriptionLookup(lookupQuery, { enabled: Boolean(lookupQuery) });

  const activePlanLabel = user.subscriptionDetails?.currentPlan?.name || user.firstPlan?.planName || "No active plan";

  if (!canRead) {
    return null;
  }

  useEffect(() => {
    if (!txQuery.data?.success || !txQuery.data.data) return;
    const details = txQuery.data.data;
    if (details.platform) setPlatform(details.platform);
    if (details.planId && !planId) setPlanId(details.planId);
  }, [txQuery.data, planId]);

  useEffect(() => {
    const plans = plansQuery.data?.data?.plans || [];
    const selected = plans.find((p) => p.id === planId);
    if (!selected) return;
    if (selected.currency) setCurrency(String(selected.currency));
    if (selected.price !== undefined && selected.price !== null && Number.isFinite(Number(selected.price))) {
      setAmount(String(selected.price));
    }
  }, [planId, platform, plansQuery.data]);

  const validateAssign = (): string | null => {
    if (!planId.trim()) return "Plan is required.";
    if (!reason.trim()) return "Reason is required.";

    if (mode === "repair") {
      if (!transactionId.trim()) return "Transaction ID is required for Repair mode.";
    } else {
      const parsed = Number(amount);
      if (!Number.isFinite(parsed) || parsed <= 0) return "Selected plan is missing a valid price.";
      if (!currency.trim()) return "Selected plan is missing currency.";
    }

    return null;
  };

  const buildPayload = (): ManualSubscriptionAssignRequest => {
    if (mode === "repair") {
      return {
        userId: user.uuid,
        platform,
        mode: "repair",
        planId: planId.trim(),
        transactionId: transactionId.trim(),
        reason: reason.trim(),
        notes: notes.trim() || undefined,
        ...(platform === "android"
          ? {
              purchaseToken: purchaseToken.trim() || undefined,
              orderId: orderId.trim() || undefined,
            }
          : {
              // iOS proof fields removed from UI
            }),
      };
    }

    return {
      userId: user.uuid,
      platform,
      mode: "force",
      planId: planId.trim(),
      amount: Number(amount),
      currency: currency.trim(),
      reason: reason.trim(),
      notes: notes.trim() || undefined,
      ...(platform === "android"
        ? {
            purchaseToken: purchaseToken.trim() || undefined,
            orderId: orderId.trim() || undefined,
          }
        : {
            // iOS proof fields removed from UI
          }),
    };
  };

  const handleAssign = async () => {
    const validationError = validateAssign();
    if (validationError) {
      toast({ title: "Validation error", description: validationError, variant: "destructive" });
      return;
    }

    try {
      const payload = buildPayload();
      const res = await assign.mutateAsync(payload);
      if (res.success) {
        toast({
          title: "Subscription assigned",
          description: `Subscription repaired/assigned successfully.`,
        });
      } else {
        toast({
          title: "Assign failed",
          description: res.message || "Failed to assign subscription.",
          variant: "destructive",
        });
      }
    } catch (e: any) {
      toast({
        title: "Assign failed",
        description: e?.message || "Failed to assign subscription.",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="border-border/60">
      <CardHeader>
        <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
          <div>
            <CardTitle>Manual Subscription Assignment</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              Fix store purchases that didn’t activate.
            </p>
          </div>
          <Badge variant="outline" className="w-fit">
            Current: {activePlanLabel}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {!canUpdate ? (
          <Alert>
            <ShieldAlert className="h-4 w-4" />
            <AlertTitle>Read-only</AlertTitle>
            <AlertDescription>
              You don’t have permission to assign subscriptions. You can still run Lookup.
            </AlertDescription>
          </Alert>
        ) : null}

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <Label>Mode</Label>
            <Select value={mode} onValueChange={(v) => setMode(v as Mode)}>
              <SelectTrigger>
                <SelectValue placeholder="Select mode" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="repair">Repair</SelectItem>
                <SelectItem value="force">Force assign</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Plan</Label>
            <Select value={planId} onValueChange={setPlanId}>
              <SelectTrigger>
                <SelectValue placeholder={plansQuery.isLoading ? "Loading plans..." : "Select a plan"} />
              </SelectTrigger>
              <SelectContent>
                {(plansQuery.data?.data?.plans || []).map((p: SubscriptionPlanListItem) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Platform</Label>
            <Select value={platform} onValueChange={(v) => setPlatform(v as ManualSubscriptionPlatform)}>
              <SelectTrigger>
                <SelectValue placeholder="Select platform" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="android">Android</SelectItem>
                <SelectItem value="ios">iOS</SelectItem>
              </SelectContent>
            </Select>
            {mode === "repair" ? (
              <p className="text-xs text-muted-foreground">Auto-fills after transaction fetch (if available).</p>
            ) : null}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {mode === "repair" ? (
            <div className="space-y-2 md:col-span-2">
              <Label>Transaction ID (internal)</Label>
              <Input
                value={transactionId}
                onChange={(e) => setTransactionId(e.target.value)}
                placeholder="TX_UUID"
              />
              {txQuery.isError && ((txQuery.error as unknown) as ApiError | undefined)?.status === 404 ? (
                <p className="text-xs font-medium text-destructive">
                  Transaction not found for this Transaction ID.
                </p>
              ) : null}
              <p className="text-xs text-muted-foreground">
                Transaction details will be fetched automatically.
              </p>
              {txQuery.isFetching ? (
                <div className="text-xs text-muted-foreground flex items-center gap-2">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Fetching transaction details...
                </div>
              ) : null}
              {txQuery.data?.success && txQuery.data.data ? (
                <div className="rounded-md border p-3 text-sm grid grid-cols-1 md:grid-cols-2 gap-2">
                  {(() => {
                    const d = txQuery.data.data;
                    const Row = (props: { label: string; value?: unknown; mono?: boolean }) => {
                      const valueStr =
                        props.value === undefined || props.value === null ? "" : String(props.value).trim();
                      if (!valueStr) return null;
                      return (
                        <div>
                          <span className="text-muted-foreground">{props.label}:</span>{" "}
                          {props.mono ? <span className="font-mono">{valueStr}</span> : <span>{valueStr}</span>}
                        </div>
                      );
                    };

                    const amountStr =
                      d.amount === undefined || d.amount === null
                        ? ""
                        : `${d.amount}${d.currency ? ` ${d.currency}` : ""}`;

                    return (
                      <>
                        <Row label="Transaction" value={d.transactionId} mono />
                        <Row label="User" value={d.userId} mono />
                        <Row label="User name" value={d.userFullName} />
                        <Row label="User email" value={d.userEmail} />
                        <Row label="Platform" value={d.platform} />
                        <Row label="Plan" value={d.planId} mono />
                        <Row label="Plan name" value={d.planName} />
                        <Row label="Status" value={d.status} />
                        <Row label="Product" value={d.productId} />
                        <Row label="Amount" value={amountStr} />
                        <Row label="Created" value={d.createdAt} />
                        <Row label="Raw status" value={d.rawStatus} />
                        <Row label="Raw payment status" value={d.rawPaymentStatus} />
                      </>
                    );
                  })()}
                </div>
              ) : null}
              {txQuery.isError && ((txQuery.error as unknown) as ApiError | undefined)?.status !== 404 ? (
                <Alert variant="destructive">
                  <AlertTitle>Transaction lookup failed</AlertTitle>
                  <AlertDescription>
                    {(txQuery.error as any)?.message || "Unable to fetch transaction details."}
                  </AlertDescription>
                </Alert>
              ) : null}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Amount</Label>
                  <Input value={amount} readOnly disabled placeholder="Auto-filled from plan" />
                </div>
                <div className="space-y-2">
                  <Label>Currency</Label>
                  <Input value={currency} readOnly disabled placeholder="Auto-filled from plan" />
                </div>
              </div>
              <div className="md:col-span-2">
                <Alert variant="destructive">
                  <ShieldAlert className="h-4 w-4" />
                  <AlertTitle>Force assign warning</AlertTitle>
                  <AlertDescription>
                    Force assigning will activate a plan even if we cannot match a store transaction. Provide a clear reason.
                  </AlertDescription>
                </Alert>
              </div>
            </>
          )}
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {platform === "android" ? (
            <>
              <div className="space-y-2">
                <Label>Purchase Token (optional)</Label>
                <Input
                  value={purchaseToken}
                  onChange={(e) => setPurchaseToken(e.target.value)}
                  placeholder="PLAY_PURCHASE_TOKEN"
                />
              </div>
              <div className="space-y-2">
                <Label>Order ID (optional)</Label>
                <Input value={orderId} onChange={(e) => setOrderId(e.target.value)} placeholder="GPA.1234-..." />
              </div>
            </>
          ) : null}
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Reason</Label>
            <Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Why are we assigning manually?" />
          </div>
          <div className="space-y-2">
            <Label>Notes (optional)</Label>
            <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Extra context (optional)" />
          </div>
        </div>

        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <Button
            variant="outline"
            onClick={() => {
              setLookupTriggered(true);
              void lookup.refetch();
            }}
            disabled={!canRead || lookup.isFetching}
          >
            {lookup.isFetching ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Lookup
          </Button>

          <Button
            className="bg-brand-teal text-white hover:bg-brand-teal/90"
            onClick={handleAssign}
            disabled={!canUpdate || assign.isPending}
          >
            {assign.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Assign / Repair
          </Button>
        </div>

        {lookup.isError ? (
          <Alert variant="destructive">
            <AlertTitle>Lookup failed</AlertTitle>
            <AlertDescription>
              {(lookup.error as any)?.message || "Unable to lookup subscription transaction."}
            </AlertDescription>
          </Alert>
        ) : null}

        {lookup.data?.success && lookup.data.data?.results?.length ? (
          <div className="rounded-lg border p-4 space-y-2">
            <div className="text-sm font-semibold">Lookup Results</div>
            <div className="space-y-2">
              {lookup.data.data.results.slice(0, 5).map((r, idx) => (
                <div
                  key={`${r.paymentSummaryId || "row"}-${idx}`}
                  className="text-sm grid grid-cols-1 md:grid-cols-2 gap-2"
                >
                  <div>
                    <span className="text-muted-foreground">PaymentSummary:</span>{" "}
                    <span className="font-mono">{r.paymentSummaryId || "—"}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Subscription:</span>{" "}
                    <span className="font-mono">{r.subscriptionId || "—"}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Plan:</span>{" "}
                    <span className="font-mono">{r.planId || "—"}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Transaction:</span>{" "}
                    <span className="font-mono">{r.transactionId || "—"}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Status:</span> <span>{r.status || "—"}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : lookupTriggered && lookup.isFetched ? (
          <div className="text-sm text-muted-foreground">No lookup results found.</div>
        ) : null}
      </CardContent>
    </Card>
  );
}

