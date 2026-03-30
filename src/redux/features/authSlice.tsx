import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { User } from "@/api/types";
import { authStorage } from "@/lib/authStorage";

interface AuthState {
    loginState: User | null;
    login2FAState: {},
    loadingState: boolean,
    isAuthenticated: boolean,
    isLoggingIn: boolean,
    isVerifying2FA: boolean,
};

const initialState: AuthState = {
    loginState: null,
    login2FAState: {},
    loadingState: false,
    isAuthenticated: false,
    isLoggingIn: false,
    isVerifying2FA: false,
};

const authSlice = createSlice({
    name: "auth",
    initialState,
    reducers: {
        loginInfo: (state, action: PayloadAction<User>) => {
            state.loginState = action.payload;
            state.loadingState = false;
            state.isAuthenticated = true;
            state.isLoggingIn = false;
        },
        login2FAInfo: (state, action) => {
            state.login2FAState = action.payload;
            state.loadingState = false;
            state.isAuthenticated = true;
            state.isLoggingIn = false;
            state.isVerifying2FA = true;
        },
        logout: (state) => {
            // Clear Redux state
            state.loginState = null;
            state.login2FAState = {};
            state.loadingState = false;
            state.isAuthenticated = false;
            state.isLoggingIn = false;
            state.isVerifying2FA = false;
            
            authStorage.clearAuth();
        },
        setLoading: (state, action: PayloadAction<boolean>) => {
            state.loadingState = action.payload;
        },
        setLoggingIn: (state, action: PayloadAction<boolean>) => {
            state.isLoggingIn = action.payload;
        }
    }
});

export const { loginInfo, login2FAInfo, logout, setLoading, setLoggingIn } = authSlice.actions;
export default authSlice.reducer;
