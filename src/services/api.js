import axios from "axios";

import router from "../router/index.js";
import {
    getAccessToken,
    getRefreshToken,
    clearToken,
    saveToken,
} from "../utils/tokenStorage.js";
import { refresh } from "./refreshService.js";

const API_URL = "https://wo365ovs53.execute-api.ap-southeast-1.amazonaws.com";

const api = axios.create({
    baseURL: API_URL,
    timeout: 15000,
    headers: {
        "Content-Type": "application/json",
    },
});

// ======================================================
// REQUEST INTERCEPTOR
// ======================================================
// Tự động gắn access token vào mọi request nếu đã đăng nhập.

api.interceptors.request.use(
    (config) => {
        const token = getAccessToken();

        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        return config;
    },

    (error) => {
        return Promise.reject(error);
    }
);

// ======================================================
// RESPONSE INTERCEPTOR
// ======================================================
// Nếu access token hết hạn:
// - Thử refresh token một lần.
// - Lưu token mới.
// - Gọi lại request cũ.
// Nếu refresh thất bại:
// - Xóa token.
// - Điều hướng về login.

api.interceptors.response.use(
    (response) => {
        return response;
    },

    async (error) => {
        const originalRequest = error.config;

        const status = error.response?.status;
        const isAuthError = [401, 403].includes(status);
        const isRefreshableError = [400, 401, 403].includes(status);

        const isAuthEndpoint =
            originalRequest?.url?.includes("/auth/signin") ||
            originalRequest?.url?.includes("/auth/refresh-token");

        if (
            isRefreshableError &&
            isAuthError &&
            !isAuthEndpoint &&
            originalRequest &&
            !originalRequest._retry
        ) {
            originalRequest._retry = true;

            try {
                const refreshToken = getRefreshToken();

                if (!refreshToken) {
                    clearToken();
                    router.navigate("/login");
                    return Promise.reject(error);
                }

                const refreshResponse = await refresh(refreshToken);

                saveToken(refreshResponse);

                const newAccessToken =
                    refreshResponse.accessToken ||
                    refreshResponse.access_token ||
                    refreshResponse.token ||
                    refreshResponse.data?.accessToken ||
                    refreshResponse.data?.access_token ||
                    refreshResponse.data?.token;

                if (!newAccessToken) {
                    clearToken();
                    router.navigate("/login");
                    return Promise.reject(error);
                }

                originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

                return api(originalRequest);
            } catch (refreshError) {
                clearToken();
                router.navigate("/login");

                return Promise.reject(refreshError);
            }
        }

        return Promise.reject(error);
    }
);

export default api;