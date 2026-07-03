import api from "./api.js";
import router from "../router/index.js";
import { saveToken, clearToken } from "../utils/tokenStorage.js";

// ======================================================
// LOGIN
// ======================================================
// API thật:
// POST /auth/signin
//
// Body:
// {
//   email,
//   password
// }

const login = async (data) => {
    const response = await api.post("/auth/signin", data);

    saveToken(response.data);

    return response.data;
};

// ======================================================
// LOGOUT
// ======================================================
// API hiện chưa có /auth/logout.
// Vì vậy logout ở frontend sẽ xóa token localStorage.

const logout = () => {
    clearToken();
    router.navigate("/login");
};

export {
    login,
    logout,
};