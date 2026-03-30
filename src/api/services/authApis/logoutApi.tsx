import { API_CONFIG } from "@/api/config";
import { authStorage } from "@/lib/authStorage";
import axios from "axios";

// Clear all authentication data from localStorage
const clearLocalStorage = (): void => {
    authStorage.clearAuth();
};

// Get access token
const getAccessToken = (): string | null => {
    return authStorage.getAccessToken();
};

export const LogoutApi = () => {
    const accessToken = getAccessToken();
    if (!accessToken) {
        // Clear local storage only
        clearLocalStorage();
        return { success: true, message: 'Logged out successfully' };
    }

    const response = axios.post(API_CONFIG.ENDPOINTS.AUTH.LOGOUT, {}, {
        headers: {
            "Authorization": `Bearer ${accessToken}`,
        }
    });

    return response;
};
