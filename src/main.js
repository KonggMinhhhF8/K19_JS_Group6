import Navigo from "navigo";

import "./style.css";

import {
    isAuthenticated,
    clearAuthSession,
} from "./api.js";

import { renderLoginPage } from "./views/login.js";
import { renderDashboardPage } from "./views/dashboard.js";
import { renderProductsPage } from "./views/products.js";
import { renderOrdersPage } from "./views/orders.js";
import {
    renderCustomersPage,
    renderCustomerCreatePage,
    renderCustomerEditPage,
} from "./views/customers.js";
import { renderReportsPage } from "./views/reports.js";

const app = document.getElementById("app");

const logoutButton =
    document.getElementById("logoutButton") ||
    document.getElementById("logout-btn");

const router = new Navigo("/", {
    linksSelector: "a[data-navigo]",
});

// SIDEBAR ACTIVE

function setActiveSidebar(currentPath) {
    const links = document.querySelectorAll(".sidebar a");

    links.forEach(function (link) {
        const listItem = link.closest("li");
        const href = link.getAttribute("href");

        if (!listItem) {
            return;
        }

        listItem.classList.toggle("active", currentPath.startsWith(href));
    });
}

// AUTH UI

function updateAuthUI() {
    const sidebar = document.querySelector(".sidebar");

    if (sidebar) {
        sidebar.style.display = isAuthenticated() ? "flex" : "none";
    }

    if (logoutButton) {
        logoutButton.style.display = isAuthenticated() ? "flex" : "none";
    }

    document.body.classList.toggle("is-logged-out", !isAuthenticated());
}

// LOGOUT

function handleLogout() {
    const confirmed = confirm("Bạn có chắc chắn muốn đăng xuất không?");

    if (!confirmed) {
        return;
    }

    clearAuthSession();
    updateAuthUI();
    router.navigate("/login");
}

if (logoutButton) {
    logoutButton.addEventListener("click", handleLogout);
}

// ROUTE GUARD

function renderProtectedPage(activePath, callback) {
    if (!isAuthenticated()) {
        router.navigate("/login");
        return;
    }

    setActiveSidebar(activePath);
    updateAuthUI();

    callback();

    router.updatePageLinks();
}

function renderPublicPage(callback) {
    setActiveSidebar("");
    updateAuthUI();

    callback();

    router.updatePageLinks();
}

// ROUTES

router.on("/", function () {
    if (isAuthenticated()) {
        router.navigate("/customers");
    } else {
        router.navigate("/login");
    }
});

router.on("/login", function () {
    if (isAuthenticated()) {
        router.navigate("/customers");
        return;
    }

    renderPublicPage(function () {
        renderLoginPage(app, router);
    });
});

router.on("/dashboard", function () {
    renderProtectedPage("/dashboard", function () {
        renderDashboardPage(app);
    });
});

router.on("/products", function () {
    renderProtectedPage("/products", function () {
        renderProductsPage(app);
    });
});

router.on("/orders", function () {
    renderProtectedPage("/orders", function () {
        renderOrdersPage(app);
    });
});

router.on("/customers", function () {
    renderProtectedPage("/customers", function () {
        renderCustomersPage(app, router);
    });
});

router.on("/customers/create", function () {
    renderProtectedPage("/customers", function () {
        renderCustomerCreatePage(app, router);
    });
});

router.on("/customers/edit/:id", function (match) {
    renderProtectedPage("/customers", function () {
        renderCustomerEditPage(app, router, match.data.id);
    });
});

router.on("/reports", function () {
    renderProtectedPage("/reports", function () {
        renderReportsPage(app);
    });
});

router.notFound(function () {
    if (!isAuthenticated()) {
        router.navigate("/login");
        return;
    }

    app.innerHTML = `
    <div class="page-header">
      <h2>404 - Không tìm thấy trang</h2>

      <a href="/customers" class="btn-secondary" data-navigo>
        <i class="fas fa-arrow-left"></i>
        Quay lại Customers
      </a>
    </div>

    <section class="card">
      <h3>Trang không tồn tại</h3>
      <p>Vui lòng chọn chức năng khác trong menu.</p>
    </section>
  `;

    updateAuthUI();
    router.updatePageLinks();
});

updateAuthUI();
router.resolve();