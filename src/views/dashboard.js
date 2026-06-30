import {logout} from "../services/authService.js";
import router from "../router/index.js";
import { getProducts } from "../services/productService";

const render = () => {
    return `
        <h1>Dashboard</h1>
        <button id="logout-btn">
            Logout
        </button>
    `;
};

const handleLogout = () => {
    logout();
    router.navigate("/login");
};

const init = async () => {
    try {
        const products = await getProducts();
        console.log(products);
    } catch (error) {
        console.log(error);
    }
    document
        .getElementById("logout-btn")
        .addEventListener(
            "click",
            handleLogout
        );
};

export default {
    render,
    init
};