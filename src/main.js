import router from "./router";
import loginPage from "./views/login";
import dashboardPage from "./views/dashboard";
import customerPage from "./views/customers";
import productPage from "./views/products";
import orderPage from "./views/orders";
import reportPage from "./views/reports";
import helpers from "./utils/helpers";
import { authGuard } from "./router/guards";
import './style.css'
import { logout } from "./services/authService";

const logoutBtn = document.getElementById("logout-btn");

if (logoutBtn) {
    logoutBtn.addEventListener("click", (e) => {
        e.preventDefault();
        logout();
    });
}



router
    .on("/", () => {
        helpers.loadPage(loginPage,false)
    })
    .on("/login", () => {
        helpers.loadPage(loginPage,false)
    })

    .on("/dashboard", () => {
        if (!authGuard()) return;
        helpers.loadPage(dashboardPage,true)
    })

    .on("/products", () => {
        if (!authGuard()) return;
        helpers.loadPage(productPage,true)
    })

    .on("/orders", () => {
        if (!authGuard()) return;
        helpers.loadPage(orderPage,true)
    })

    .on("/customers", () => {
        if (!authGuard()) return;
        helpers.loadPage(customerPage,true)
    })

    .on("/reports", () => {
        if (!authGuard()) return;
        helpers.loadPage(reportPage,true)
    })

    .resolve();