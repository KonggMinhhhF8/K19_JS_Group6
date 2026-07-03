import router from "./index.js";
import { isLoginIn } from "../utils/tokenStorage.js";

const authGuard = () => {
    if (!isLoginIn()) {
        router.navigate("/login");
        return false;
    }

    return true;
};

export { authGuard };