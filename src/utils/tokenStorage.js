// ======================================================
// TOKEN STORAGE KEYS
// ======================================================

const ACCESS_TOKEN_KEY = "accessToken";
const REFRESH_TOKEN_KEY = "refreshToken";

// ======================================================
// SAVE TOKEN
// ======================================================
// API signin/refresh có thể trả token trực tiếp:
// {
//   accessToken,
//   refreshToken
// }
//
// Hoặc bọc trong data:
// {
//   data: {
//     accessToken,
//     refreshToken
//   }
// }

const saveToken = (payload = {}) => {
    const accessToken =
        payload.accessToken ||
        payload.access_token ||
        payload.token ||
        payload.data?.accessToken ||
        payload.data?.access_token ||
        payload.data?.token;

    const refreshToken =
        payload.refreshToken ||
        payload.refresh_token ||
        payload.data?.refreshToken ||
        payload.data?.refresh_token;

    if (!accessToken) {
        throw new Error("Access token không hợp lệ");
    }

    localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);

    if (refreshToken) {
        localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
    }
};

// ======================================================
// GET TOKEN
// ======================================================

const getAccessToken = () => {
    return localStorage.getItem(ACCESS_TOKEN_KEY);
};

const getRefreshToken = () => {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
};

// ======================================================
// CLEAR TOKEN
// ======================================================

const clearToken = () => {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
};

// ======================================================
// CHECK LOGIN
// ======================================================

const isLoginIn = () => {
    return Boolean(getAccessToken());
};

export {
    saveToken,
    getAccessToken,
    getRefreshToken,
    clearToken,
    isLoginIn,
};