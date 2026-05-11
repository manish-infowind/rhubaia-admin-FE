import React, { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useSelector } from "react-redux";
import type { RootState } from "@/redux/store/store";
import { canPerformAction } from "@/lib/permissions";
import BlockPage from "@/components/common/BlockPage";
import PageLoader from "@/components/common/PageLoader";
import RetryPage from "@/components/common/RetryPage";
import PageHeader from "@/components/common/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import {
  useContactSupportDetail,
  useContactSupportReply,
  useContactSupportUpdate,
} from "@/api/hooks/useContactSupport";
import { HTTP_STATUS } from "@/api/config";

const ContactSupportDetail = () => {
  const { id } = useParams<{ id: string }>();
  const ticketId = id ? Number(id) : NaN;
  const navigate = useNavigate();
  const { toast } = useToast();

  const loginState = useSelector((state: RootState) => state.auth.loginState);
  const canRead = canPerformAction(loginState as any, "contact_support", "read");
  const canUpdate = canPerformAction(loginState as any, "contact_support", "update");

  const [replyMessage, setReplyMessage] = useState("");
  const [markResolved, setMarkResolved] = useState(false);

  const { data, isLoading, error, refetch } = useContactSupportDetail(String(id || ""));
  const ticket = data?.data?.ticket;
  const history = data?.data?.history ?? [];

  const replyMutation = useContactSupportReply();
  const updateMutation = useContactSupportUpdate();

  const isBusy = replyMutation.isPending || updateMutation.isPending;

  const statusLabel = useMemo(() => {
    if (!ticket) return "—";
    return ticket.isResolved ? "Resolved" : "Unresolved";
  }, [ticket]);

  const statusBadge = useMemo(() => {
    if (!ticket) return <Badge variant="secondary">—</Badge>;
    return ticket.isResolved ? (
      <Badge variant="secondary">Resolved</Badge>
    ) : (
      <Badge variant="default" className="bg-brand-green text-white">
        Unresolved
      </Badge>
    );
  }, [ticket]);

  const formatDate = (value?: string | null) => {
    if (!value) return "—";
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return "—";
    return parsed.toLocaleString();
  };

  const onToggleResolved = (checked: boolean) => {
    if (!ticket) return;
    updateMutation.mutate({
      id: ticket.id,
      payload: { isResolved: checked },
    });
  };

  const onSendReply = () => {
    if (!ticket) return;
    const message = replyMessage.trim();
    if (!message) {
      toast({
        title: "Validation",
        description: "Please write a reply.",
        variant: "destructive",
      });
      return;
    }

    replyMutation.mutate(
      {
        id: ticket.id,
        payload: { message, markResolved },
      },
      {
        onSuccess: () => {
          setReplyMessage("");
          setMarkResolved(false);
        },
      } as any,
    );
  };

  if (!canRead) {
    return <BlockPage message="Access denied. You don't have permission to view contact support tickets." />;
  }

  if (isLoading) {
    return <PageLoader pagename="ticket detail" />;
  }

  if (error) {
    const status = Number((error as any)?.status);
    if (status === HTTP_STATUS.NOT_FOUND) {
      return (
        <RetryPage
          message="Ticket not found"
          btnName="Back to list"
          onRetry={() => navigate("/admin/contact-support")}
        />
      );
    }
    return (
      <RetryPage
        message="Failed to load ticket"
        btnName="Retry"
        onRetry={() => refetch()}
      />
    );
  }

  if (!ticket) {
    return (
      <RetryPage
        message="Ticket not found"
        btnName="Back to list"
        onRetry={() => navigate("/admin/contact-support")}
      />
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        page="contactSupportDetail"
        heading={`Ticket #${ticket.id}`}
        subHeading={`${ticket.name} • ${ticket.email}`}
      />

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {statusBadge}
          <Badge variant="outline">Created: {formatDate(ticket.createdAt)}</Badge>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-sm text-muted-foreground">Resolved</div>
          <Switch
            checked={ticket.isResolved}
            onCheckedChange={onToggleResolved}
            disabled={!canUpdate || isBusy}
          />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Original message</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="text-sm whitespace-pre-wrap">{ticket.message}</div>
          {ticket.imageUrl ? (
            <div className="text-sm">
              <a
                href={ticket.imageUrl}
                target="_blank"
                rel="noreferrer"
                className="text-blue-600 hover:underline"
              >
                Open image
              </a>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>History</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {history.length === 0 ? (
            <div className="text-sm text-muted-foreground">No history yet.</div>
          ) : (
            <div className="space-y-3">
              {history.map((item, index) => {
                const isAdmin = item.type === "admin";
                const meta = isAdmin
                  ? `${item.adminName} • ${item.adminEmail}`
                  : `${item.name} • ${item.email}`;
                return (
                  <div
                    key={`${item.type}-${item.createdAt}-${index}`}
                    className={`rounded-lg border p-3 ${isAdmin ? "bg-muted/20" : "bg-background"}`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="text-xs font-medium">
                        <Badge variant={isAdmin ? "secondary" : "outline"}>
                          {isAdmin ? "Admin" : "User"}
                        </Badge>
                        <span className="ml-2 text-muted-foreground">{meta}</span>
                      </div>
                      <div className="text-xs text-muted-foreground">{formatDate(item.createdAt)}</div>
                    </div>
                    <Separator className="my-2" />
                    <div className="text-sm whitespace-pre-wrap">{item.message}</div>
                    {"imageUrl" in item && item.imageUrl ? (
                      <div className="text-sm mt-2">
                        <a
                          href={item.imageUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          Open image
                        </a>
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Reply</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {!canUpdate ? (
            <div className="text-sm text-muted-foreground">
              You have read access only. Replying and resolving tickets requires `contact_support:update`.
            </div>
          ) : (
            <>
              <div className="space-y-2">
                <Label htmlFor="reply">Write a reply…</Label>
                <Textarea
                  id="reply"
                  value={replyMessage}
                  onChange={(e) => setReplyMessage(e.target.value)}
                  placeholder="Write a reply…"
                  disabled={isBusy}
                />
              </div>

              <div className="flex items-center justify-between gap-3">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={markResolved}
                    onChange={(e) => setMarkResolved(e.target.checked)}
                    disabled={isBusy}
                  />
                  Mark as resolved
                </label>

                <Button
                  onClick={onSendReply}
                  disabled={isBusy}
                  className="bg-brand-green hover:bg-brand-green/90 text-white"
                >
                  {replyMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Sending…
                    </>
                  ) : (
                    "Send reply"
                  )}
                </Button>
              </div>
              <div className="text-xs text-muted-foreground">
                Status: {statusLabel}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <div>
        <Button variant="outline" onClick={() => navigate("/admin/contact-support")}>
          Back to list
        </Button>
      </div>
    </div>
  );
};

export default ContactSupportDetail;

