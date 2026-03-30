import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { CreateCampaignRequest } from "@/api/types";

interface CreateCampaignModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: CreateCampaignRequest) => Promise<void>;
  loading: boolean;
}

export function CreateCampaignModal({
  open,
  onOpenChange,
  onSubmit,
  loading,
}: CreateCampaignModalProps) {
  const [formData, setFormData] = useState<CreateCampaignRequest>({
    name: "",
    subject: "",
    content: "",
    type: "email",
    settings: {
      sendInterval: 2,
      maxRetries: 3,
      includeUnsubscribed: false,
    },
    notes: "",
  });
  const [scheduledAt, setScheduledAt] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const submitData: CreateCampaignRequest = {
      ...formData,
      scheduledAt: scheduledAt ? new Date(scheduledAt).toISOString() : undefined,
    };

    await onSubmit(submitData);
  };

  const handleInputChange = (field: keyof CreateCampaignRequest, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSettingsChange = (field: keyof CreateCampaignRequest['settings'], value: any) => {
    setFormData(prev => ({
      ...prev,
      settings: {
        ...prev.settings,
        [field]: value,
      },
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Campaign</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Campaign Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                placeholder="Enter campaign name"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="type">Campaign Type *</Label>
              <Select
                value={formData.type}
                onValueChange={(value) => handleInputChange("type", value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="sms">SMS</SelectItem>
                  <SelectItem value="push">Push Notification</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="subject">Subject Line *</Label>
            <Input
              id="subject"
              value={formData.subject}
              onChange={(e) => handleInputChange("subject", e.target.value)}
              placeholder="Enter email subject"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="content">Content *</Label>
            <Textarea
              id="content"
              value={formData.content}
              onChange={(e) => handleInputChange("content", e.target.value)}
              placeholder="Enter campaign content (HTML supported)"
              rows={8}
              required
            />
            <p className="text-sm text-muted-foreground">
              You can use HTML tags for formatting. Example: &lt;h1&gt;Title&lt;/h1&gt; &lt;p&gt;Content&lt;/p&gt;
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="sendInterval">Send Interval (seconds)</Label>
              <Input
                id="sendInterval"
                type="number"
                min="1"
                max="60"
                value={formData.settings.sendInterval}
                onChange={(e) => handleSettingsChange("sendInterval", parseInt(e.target.value))}
                placeholder="2"
              />
              <p className="text-xs text-muted-foreground">
                Time between emails to avoid rate limiting
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="maxRetries">Max Retries</Label>
              <Input
                id="maxRetries"
                type="number"
                min="0"
                max="5"
                value={formData.settings.maxRetries}
                onChange={(e) => handleSettingsChange("maxRetries", parseInt(e.target.value))}
                placeholder="3"
              />
              <p className="text-xs text-muted-foreground">
                Number of retry attempts for failed emails
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="scheduledAt">Schedule Date & Time</Label>
              <Input
                id="scheduledAt"
                type="datetime-local"
                value={scheduledAt}
                onChange={(e) => setScheduledAt(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Leave empty to run immediately
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="includeUnsubscribed"
              checked={formData.settings.includeUnsubscribed}
              onCheckedChange={(checked) => handleSettingsChange("includeUnsubscribed", checked)}
            />
            <Label htmlFor="includeUnsubscribed">
              Include unsubscribed users
            </Label>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleInputChange("notes", e.target.value)}
              placeholder="Optional notes about this campaign"
              rows={3}
            />
          </div>

          <div className="flex justify-end space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Creating..." : "Create Campaign"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
} 
