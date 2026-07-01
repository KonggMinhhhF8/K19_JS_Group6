import axios from "axios";

const API_BASE_URL = "https://wo365ovs53.execute-api.ap-southeast-1.amazonaws.com";

const AUTH_SIGNIN_ENDPOINT = "/auth/signin";
const AUTH_REFRESH_TOKEN_ENDPOINT = "/auth/refresh-token";

const CUSTOMER_ENDPOINT = "/customers";

const ACCESS_TOKEN_KEY = "shopadmin_access_token";
const REFRESH_TOKEN_KEY = "shopadmin_refresh_token";
const USER_KEY = "shopadmin_user";

export const apiClient = axios.create({
    baseURL: API_BASE_URL,
    timeout: 15000,
});

// REQUEST INTERCEPTOR
// Trước mỗi request, nếu đã có accessToken thì tự động gắn vào header.
apiClient.interceptors.request.use(function (config) {
    const token = getAccessToken();

    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
});

// RESPONSE INTERCEPTOR
// Chuẩn hóa response và error.
// Nếu API trả 401 thì thử refresh token một lần.
apiClient.interceptors.response.use(
    function handleSuccess(response) {
        return response.data;
    },

    async function handleError(error) {
        const originalRequest = error.config;

        const isUnauthorized = error.response?.status === 401;
        const hasNotRetried = !originalRequest?._retry;
        const hasRefreshToken = Boolean(getRefreshToken());

        if (isUnauthorized && hasNotRetried && hasRefreshToken) {
            originalRequest._retry = true;

            try {
                const refreshResponse = await authApi.refreshToken();

                const newAccessToken = extractAccessToken(refreshResponse);
                const newRefreshToken = extractRefreshToken(refreshResponse);

                if (!newAccessToken) {
                    throw new Error("Refresh token không trả về access token mới");
                }

                saveAuthSession({
                    accessToken: newAccessToken,
                    refreshToken: newRefreshToken || getRefreshToken(),
                    user: getCurrentUser(),
                });

                originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

                return apiClient(originalRequest);
            } catch {
                clearAuthSession();
            }
        }

        console.error("API ERROR DETAIL:", {
            url: error.config?.url,
            method: error.config?.method,
            baseURL: error.config?.baseURL,
            status: error.response?.status,
            responseData: error.response?.data,
        });

        const message =
            error.response?.data?.message ||
            error.response?.data?.error ||
            error.response?.data ||
            error.message ||
            "Đã có lỗi xảy ra khi gọi API";

        return Promise.reject({
            status: error.response?.status,
            message,
            responseData: error.response?.data,
            originalError: error,
        });
    }
);

// AUTH STORAGE

export function getAccessToken() {
    return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function getRefreshToken() {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function isAuthenticated() {
    return Boolean(getAccessToken());
}

export function saveAuthSession({ accessToken, refreshToken, user }) {
    if (accessToken) {
        localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
    }

    if (refreshToken) {
        localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
    }

    if (user) {
        localStorage.setItem(USER_KEY, JSON.stringify(user));
    }
}

export function clearAuthSession() {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
}

export function getCurrentUser() {
    try {
        return JSON.parse(localStorage.getItem(USER_KEY));
    } catch {
        return null;
    }
}

// AUTH API

export const authApi = {
    signin(payload) {
        return apiClient.post(AUTH_SIGNIN_ENDPOINT, payload);
    },

    refreshToken() {
        return apiClient.post(AUTH_REFRESH_TOKEN_ENDPOINT, {
            refreshToken: getRefreshToken(),
        });
    },
};

// CUSTOMER API

export const customerApi = {
    // GET /customers
    getAll() {
        return apiClient.get(CUSTOMER_ENDPOINT);
    },

    // POST /customers
    create(payload) {
        return apiClient.post(CUSTOMER_ENDPOINT, payload);
    },

    // PUT /customers/{id}
    update(customerId, payload) {
        return apiClient.put(`${CUSTOMER_ENDPOINT}/${customerId}`, payload);
    },

    // DELETE /customers/{id}
    remove(customerId) {
        return apiClient.delete(`${CUSTOMER_ENDPOINT}/${customerId}`);
    },
};

// AUTH RESPONSE HELPERS

export function extractAccessToken(response) {
    return (
        response?.accessToken ||
        response?.access_token ||
        response?.token ||
        response?.jwt ||
        response?.data?.accessToken ||
        response?.data?.access_token ||
        response?.data?.token ||
        ""
    );
}

export function extractRefreshToken(response) {
    return (
        response?.refreshToken ||
        response?.refresh_token ||
        response?.data?.refreshToken ||
        response?.data?.refresh_token ||
        ""
    );
}

export function extractUser(response) {
    return (
        response?.user ||
        response?.data?.user ||
        response?.profile ||
        response?.data?.profile ||
        null
    );
}