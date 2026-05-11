import { apiClient } from "../client";
import { API_CONFIG } from "../config";
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

export class ContactSupportService {
  static async listTickets(
    params?: ContactSupportListParams,
  ): Promise<ApiResponse<{ items: ContactSupportTicketListResponse["items"]; pagination: ContactSupportTicketListResponse["pagination"] }>> {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value === undefined || value === null || value === "") return;
        searchParams.append(key, String(value));
      });
    }

    const endpoint = API_CONFIG.ENDPOINTS.CONTACT_SUPPORT.LIST;
    const url = `${endpoint}${searchParams.toString() ? `?${searchParams.toString()}` : ""}`;
    return apiClient.get(url);
  }

  static async getTicket(id: number | string): Promise<ApiResponse<ContactSupportDetailResponse>> {
    const url = API_CONFIG.ENDPOINTS.CONTACT_SUPPORT.DETAILS.replace(":id", String(id));
    return apiClient.get(url);
  }

  static async replyToTicket(
    id: number | string,
    payload: ContactSupportReplyRequest,
  ): Promise<ApiResponse<ContactSupportReplyResponse>> {
    const url = API_CONFIG.ENDPOINTS.CONTACT_SUPPORT.REPLY.replace(":id", String(id));
    return apiClient.post(url, payload);
  }

  static async updateTicket(
    id: number | string,
    payload: ContactSupportUpdateRequest,
  ): Promise<ApiResponse<ContactSupportUpdateResponse>> {
    const url = API_CONFIG.ENDPOINTS.CONTACT_SUPPORT.UPDATE.replace(":id", String(id));
    return apiClient.patch(url, payload);
  }
}

export default ContactSupportService;

