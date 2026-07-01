import axios from "axios";

const API_BASE_URL = "https://wo365ovs53.execute-api.ap-southeast-1.amazonaws.com";

const AUTH_SIGNIN_ENDPOINT = "/auth/signin";
const AUTH_REFRESH_TOKEN_ENDPOINT = "/auth/refresh-token";

const CUSTOMER_ENDPOINT = "/customers";

const ACCESS_TOKEN_KEY = "accessToken";
const REFRESH_TOKEN_KEY = "refreshToken";
const USER_KEY = "shopadmin_user";

export const apiClient = axios.create({
    baseURL: API_BASE_URL,
    timeout: 15000,
    headers: {
        "Content-Type": "application/json",
    },
});

// TOKEN STORAGE

export function getAccessToken() {
    return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function getRefreshToken() {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function isAuthenticated() {
    return Boolean(getAccessToken());
}

export function saveAuthSession(response) {
    const accessToken =
        response?.accessToken ||
        response?.token ||
        response?.data?.accessToken ||
        response?.data?.token ||
        "";

    const refreshToken =
        response?.refreshToken ||
        response?.data?.refreshToken ||
        "";

    const user =
        response?.user ||
        response?.data?.user ||
        null;

    if (!accessToken) {
        throw new Error("API signin không trả về accessToken");
    }

    localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);

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

// REQUEST INTERCEPTOR
// Tự động gắn Bearer token vào request sau khi đăng nhập.

apiClient.interceptors.request.use(
    function handleRequest(config) {
        const accessToken = getAccessToken();

        if (accessToken) {
            config.headers.Authorization = `Bearer ${accessToken}`;
        }

        return config;
    },

    function handleRequestError(error) {
        return Promise.reject(error);
    }
);

// RESPONSE INTERCEPTOR
// Nếu access token hết hạn, thử refresh token rồi gọi lại request cũ.

apiClient.interceptors.response.use(
    function handleSuccess(response) {
        return response.data;
    },

    async function handleError(error) {
        const originalRequest = error.config;

        const status = error.response?.status;
        const requestUrl = originalRequest?.url || "";

        const isAuthRequest =
            requestUrl.includes(AUTH_SIGNIN_ENDPOINT) ||
            requestUrl.includes(AUTH_REFRESH_TOKEN_ENDPOINT);

        const shouldTryRefresh =
            [400, 401, 403].includes(status) &&
            !originalRequest?._retry &&
            !isAuthRequest &&
            Boolean(getRefreshToken());

        if (shouldTryRefresh) {
            originalRequest._retry = true;

            try {
                const refreshResponse = await axios.post(
                    `${API_BASE_URL}${AUTH_REFRESH_TOKEN_ENDPOINT}`,
                    {
                        refreshToken: getRefreshToken(),
                    },
                    {
                        headers: {
                            "Content-Type": "application/json",
                        },
                    }
                );

                const refreshData = refreshResponse.data;

                saveAuthSession(refreshData);

                const newAccessToken = getAccessToken();

                originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

                return apiClient(originalRequest);
            } catch (refreshError) {
                clearAuthSession();

                return Promise.reject({
                    status: refreshError.response?.status,
                    message: "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.",
                    responseData: refreshError.response?.data,
                    originalError: refreshError,
                });
            }
        }

        const message =
            error.response?.data?.message ||
            error.response?.data?.error ||
            error.response?.data ||
            error.message ||
            "Đã có lỗi xảy ra khi gọi API";

        return Promise.reject({
            status,
            message,
            responseData: error.response?.data,
            originalError: error,
        });
    }
);

// AUTH API

export const authApi = {
    signin(payload) {
        return apiClient.post(AUTH_SIGNIN_ENDPOINT, payload);
    },
};

// CUSTOMER API

export const customerApi = {
    getAll() {
        return apiClient.get(CUSTOMER_ENDPOINT);
    },

    create(payload) {
        return apiClient.post(CUSTOMER_ENDPOINT, payload);
    },

    update(customerId, payload) {
        return apiClient.put(`${CUSTOMER_ENDPOINT}/${customerId}`, payload);
    },

    remove(customerId) {
        return apiClient.delete(`${CUSTOMER_ENDPOINT}/${customerId}`);
    },
};