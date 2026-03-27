import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Calendar,
  Clock,
  Mail,
  Users,
  Send,
  Eye,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  XCircle,
  Loader2,
  StopCircle,
} from "lucide-react";
import { Campaign } from "@/api/types";
import { format } from "date-fns";

interface CampaignPreviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  campaign: Campaign;
}

export function CampaignPreviewModal({
  open,
  onOpenChange,
  campaign,
}: CampaignPreviewModalProps) {
  const getStatusIcon = (status: Campaign['status']) => {
    const statusConfig = {
      draft: Clock,
      scheduled: Calendar,
      running: Loader2,
      completed: CheckCircle,
      failed: XCircle,
      cancelled: StopCircle,
    };
    return statusConfig[status];
  };

  const getStatusColor = (status: Campaign['status']) => {
    const colorConfig = {
      draft: "bg-gray-100 text-gray-800",
      scheduled: "bg-blue-100 text-blue-800",
      running: "bg-yellow-100 text-yellow-800",
      completed: "bg-green-100 text-green-800",
      failed: "bg-red-100 text-red-800",
      cancelled: "bg-gray-100 text-gray-800",
    };
    return colorConfig[status];
  };

  const StatusIcon = getStatusIcon(campaign.status);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Campaign Preview
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Campaign Header */}
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <h2 className="text-2xl font-bold">{campaign.name}</h2>
              <div className="flex items-center gap-2">
                <Badge className={getStatusColor(campaign.status)}>
                  <StatusIcon className="h-3 w-3 mr-1" />
                  {campaign.status.charAt(0).toUpperCase() + campaign.status.slice(1)}
                </Badge>
                <Badge variant="outline">
                  {campaign.type.toUpperCase()}
                </Badge>
              </div>
            </div>
          </div>

          {/* Campaign Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Users className="h-4 w-4" />
                Recipients
              </div>
              <div className="text-2xl font-bold">{campaign.totalRecipients}</div>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Send className="h-4 w-4" />
                Sent
              </div>
                          <div className="text-2xl font-bold text-green-600">{campaign.sentCount}</div>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Eye className="h-4 w-4" />
              Opened
            </div>
            <div className="text-2xl font-bold text-blue-600">{campaign.openedCount}</div>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <TrendingUp className="h-4 w-4" />
              Clicked
            </div>
            <div className="text-2xl font-bold text-purple-600">{campaign.clickedCount}</div>
            </div>
          </div>

          {/* Schedule Information */}
          {campaign.scheduledAt && (
            <div className="bg-muted p-4 rounded-lg">
              <div className="flex items-center gap-2 text-sm font-medium mb-2">
                <Calendar className="h-4 w-4" />
                Scheduled Information
              </div>
              <div className="text-sm text-muted-foreground">
                Scheduled to run on {format(new Date(campaign.scheduledAt), "EEEE, MMMM dd, yyyy 'at' HH:mm")}
              </div>
            </div>
          )}

          {/* Email Preview */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Email Preview</h3>
            
            <div className="border rounded-lg overflow-hidden">
              <div className="bg-muted p-4 border-b">
                <div className="text-sm font-medium">Subject: {campaign.subject}</div>
                <div className="text-xs text-muted-foreground">
                  From: Rhubaia &lt;noreply@rhubaia.com&gt;
                </div>
              </div>
              
              <div className="p-6">
                <div 
                  className="prose max-w-none"
                  dangerouslySetInnerHTML={{ __html: campaign.content }}
                />
              </div>
            </div>
          </div>

          {/* Campaign Settings */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Campaign Settings</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="text-sm font-medium">Send Interval</div>
                              <div className="text-sm text-muted-foreground">
                {campaign.settings.sendInterval} seconds between emails
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="text-sm font-medium">Max Retries</div>
              <div className="text-sm text-muted-foreground">
                {campaign.settings.maxRetries} retry attempts for failed emails
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="text-sm font-medium">Include Unsubscribed</div>
              <div className="text-sm text-muted-foreground">
                {campaign.settings.includeUnsubscribed ? "Yes" : "No"}
              </div>
              </div>
              
              <div className="space-y-2">
                <div className="text-sm font-medium">Created</div>
                <div className="text-sm text-muted-foreground">
                  {format(new Date(campaign.createdAt), "MMM dd, yyyy 'at' HH:mm")}
                </div>
              </div>
            </div>
          </div>

          {/* Notes */}
          {campaign.notes && (
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">Notes</h3>
              <div className="bg-muted p-4 rounded-lg">
                <p className="text-sm">{campaign.notes}</p>
              </div>
            </div>
          )}

          {/* Statistics */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Performance Statistics</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-muted p-4 rounded-lg">
                <div className="text-sm font-medium mb-2">Delivery Rate</div>
                <div className="text-2xl font-bold text-green-600">
                  {campaign.totalRecipients > 0 
                    ? ((campaign.sentCount / campaign.totalRecipients) * 100).toFixed(1)
                    : 0}%
                </div>
                <div className="text-xs text-muted-foreground">
                  {campaign.sentCount} of {campaign.totalRecipients} delivered
                </div>
              </div>
              
              <div className="bg-muted p-4 rounded-lg">
                <div className="text-sm font-medium mb-2">Open Rate</div>
                <div className="text-2xl font-bold text-blue-600">
                  {campaign.sentCount > 0 
                    ? ((campaign.openedCount / campaign.sentCount) * 100).toFixed(1)
                    : 0}%
                </div>
                <div className="text-xs text-muted-foreground">
                  {campaign.openedCount} of {campaign.sentCount} opened
                </div>
              </div>
              
              <div className="bg-muted p-4 rounded-lg">
                <div className="text-sm font-medium mb-2">Click Rate</div>
                <div className="text-2xl font-bold text-purple-600">
                  {campaign.sentCount > 0 
                    ? ((campaign.clickedCount / campaign.sentCount) * 100).toFixed(1)
                    : 0}%
                </div>
                <div className="text-xs text-muted-foreground">
                  {campaign.clickedCount} of {campaign.sentCount} clicked
                </div>
              </div>
            </div>
          </div>

          {/* Close Button */}
          <div className="flex justify-end">
            <Button onClick={() => onOpenChange(false)}>
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 