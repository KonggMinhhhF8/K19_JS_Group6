import {clearToken, isLoginIn } from "../utils/tokenStorage";
import router from "./index";

const authGuard = () => {
    if (!isLoginIn()) {
        router.navigate("/login");
        return false;
    }

    return true;
};

export { authGuard };