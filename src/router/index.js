import Navigo from "navigo";
import "../style.css";
import DashboardView from "../views/dashboard.js";
import ProductsView from "../views/products.js";
import OrdersView from "../views/orders.js";
import CustomersView from "../views/customers.js";
import ReportsView from "../views/reports.js";
import LoginView from "../views/login.js";
import { isLoginIn, clearToken } from "../utils/tokenStorage.js";

const router = new Navigo("/", { hash: true });
window.router = router;

function renderView(view) {
    const main = document.getElementById("main-content");
    if (!main) return;

    const loggedIn = isLoginIn();
    if (!loggedIn && view !== LoginView) {
        clearToken();
        router.navigate("/login");
        return;
    }

    if (loggedIn && view === LoginView) {
        router.navigate("/");
        return;
    }

    if (view === LoginView) {
        document.body.classList.add("login-active");
    } else {
        document.body.classList.remove("login-active");
    }

    window.scrollTo(0, 0);
    main.classList.remove("fade-in");
    void main.offsetWidth; // reflow
    main.innerHTML = view.render();
    main.classList.add("fade-in");

    view.init?.();
}

function setActiveMenu(route) {
    document.querySelectorAll(".sidebar ul li").forEach(li => {
        li.classList.remove("active");
        if (li.dataset.route === route || (route === "/" && li.dataset.route === "/")) {
            li.classList.add("active");
        }
    });
}

// Khởi tạo các Route
const initRoutes = () => {
    router
        .on("/", () => { setActiveMenu("/"); renderView(DashboardView); })
        .on("/dashboard", () => { setActiveMenu("/"); renderView(DashboardView); })
        .on("/login", () => { renderView(LoginView); })
        .on("/products", () => { setActiveMenu("/products"); renderView(ProductsView); })
        .on("/orders", () => { setActiveMenu("/orders"); renderView(OrdersView); })
        .on("/customers", () => { setActiveMenu("/customers"); renderView(CustomersView); })
        .on("/reports", () => { setActiveMenu("/reports"); renderView(ReportsView); })
        .notFound(() => router.navigate("/"))
        .resolve();
};

// Khởi chạy khi DOM load xong
document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll(".sidebar ul li[data-route]").forEach(li => {
        li.addEventListener("click", () => {
            document.getElementById("sidebar")?.classList.remove("active");
            document.getElementById("overlay")?.classList.remove("active");
            router.navigate(li.dataset.route);
        });
    });

    // Nút đăng xuất
    document.getElementById("sidebar-logout")?.addEventListener("click", () => {
        if (confirm("Bạn có chắc chắn muốn đăng xuất?")) {
            clearToken();
            router.navigate("/login");
        }
    });

    // Mobile sidebar toggle
    document.addEventListener("click", e => {
        if (e.target.closest("#menuToggle")) {
            document.getElementById("sidebar")?.classList.toggle("active");
            document.getElementById("overlay")?.classList.toggle("active");
        } else if (e.target.closest("#overlay")) {
            document.getElementById("sidebar")?.classList.remove("active");
            document.getElementById("overlay")?.classList.remove("active");
        }
    });

    initRoutes();
});

export default router;