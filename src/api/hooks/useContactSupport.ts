import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { HTTP_STATUS } from "../config";
import type {
  ApiResponse,
  ContactSupportDetailResponse,
  ContactSupportListParams,
  ContactSupportReplyRequest,
  ContactSupportReplyResponse,
  ContactSupportTicketListResponse,
  ContactSupportUpdateRequest,
  ContactSupportUpdateResponse,
} from "../types";
import { ContactSupportService } from "../services/contactSupportService";

export const contactSupportKeys = {
  all: ["contactSupport"] as const,
  list: (params?: ContactSupportListParams) => [...contactSupportKeys.all, "list", params ?? {}] as const,
  detail: (id: number | string) => [...contactSupportKeys.all, "detail", id] as const,
};

export function useContactSupportList(params?: ContactSupportListParams) {
  return useQuery<ApiResponse<{ items: ContactSupportTicketListResponse["items"]; pagination: ContactSupportTicketListResponse["pagination"] }>>({
    queryKey: contactSupportKeys.list(params),
    queryFn: () => ContactSupportService.listTickets(params),
    staleTime: 0,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}

export function useContactSupportDetail(id: number | string) {
  return useQuery<ApiResponse<ContactSupportDetailResponse>>({
    queryKey: contactSupportKeys.detail(id),
    queryFn: () => ContactSupportService.getTicket(id),
    enabled: Boolean(id),
    staleTime: 0,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}

export function useContactSupportReply() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { toast } = useToast();

  return useMutation<ApiResponse<ContactSupportReplyResponse>, any, { id: number | string; payload: ContactSupportReplyRequest }>({
    mutationFn: ({ id, payload }) => ContactSupportService.replyToTicket(id, payload),
    onSuccess: (_response, variables) => {
      toast({ title: "Reply sent", description: "Reply sent" });
      queryClient.invalidateQueries({ queryKey: contactSupportKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: contactSupportKeys.all });
    },
    onError: (error: any) => {
      const status = Number(error?.status);
      if (status === HTTP_STATUS.NOT_FOUND) {
        toast({ title: "Ticket not found", description: "Ticket not found", variant: "destructive" });
        navigate("/admin/contact-support");
        return;
      }
      toast({
        title: "Error",
        description: error?.message || "Failed to send reply",
        variant: "destructive",
      });
    },
  });
}

export function useContactSupportUpdate() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { toast } = useToast();

  return useMutation<ApiResponse<ContactSupportUpdateResponse>, any, { id: number | string; payload: ContactSupportUpdateRequest }>({
    mutationFn: ({ id, payload }) => ContactSupportService.updateTicket(id, payload),
    onSuccess: (_response, variables) => {
      toast({ title: "Ticket updated", description: "Ticket updated" });
      queryClient.invalidateQueries({ queryKey: contactSupportKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: contactSupportKeys.all });
    },
    onError: (error: any) => {
      const status = Number(error?.status);
      if (status === HTTP_STATUS.NOT_FOUND) {
        toast({ title: "Ticket not found", description: "Ticket not found", variant: "destructive" });
        navigate("/admin/contact-support");
        return;
      }
      toast({
        title: "Error",
        description: error?.message || "Failed to update ticket",
        variant: "destructive",
      });
    },
  });
}

