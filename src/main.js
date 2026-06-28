import "./style.css";

import { renderDashboardPage } from "./views/dashboard.js";
import { renderProductsPage } from "./views/products.js";
import { renderOrdersPage } from "./views/orders.js";
import { renderCustomersPage } from "./views/customers.js";
import { renderReportsPage } from "./views/reports.js";

const app = document.getElementById("app");

function getCurrentPath() {
    return window.location.hash.slice(1) || "/customers";
}

function setActiveSidebar(path) {
    const links = document.querySelectorAll(".sidebar a");

    links.forEach(function (link) {
        const listItem = link.closest("li");
        const href = link.getAttribute("href").replace("#", "");

        listItem.classList.toggle("active", path.startsWith(href));
    });
}

function renderRoute() {
    const path = getCurrentPath();

    setActiveSidebar(path);

    if (path.startsWith("/dashboard")) {
        renderDashboardPage(app);
        return;
    }

    if (path.startsWith("/products")) {
        renderProductsPage(app);
        return;
    }

    if (path.startsWith("/orders")) {
        renderOrdersPage(app);
        return;
    }

    if (path.startsWith("/customers")) {
        renderCustomersPage(app, path);
        return;
    }

    if (path.startsWith("/reports")) {
        renderReportsPage(app);
        return;
    }

    window.location.hash = "#/customers";
}

window.addEventListener("hashchange", renderRoute);

renderRoute();