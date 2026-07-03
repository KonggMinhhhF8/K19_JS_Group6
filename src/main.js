import router from "./router/index.js";

import loginPage from "./views/login.js";
import dashboardPage from "./views/dashboard.js";
import customerPage from "./views/customers.js";
import productPage from "./views/products.js";
import orderPage from "./views/orders.js";
import reportPage from "./views/reports.js";

import helpers from "./utils/helpers.js";
import { authGuard } from "./router/guards.js";
import { logout } from "./services/authService.js";

import "./style.css";

const logoutBtn = document.getElementById("logout-btn");

// ======================================================
// LOGOUT EVENT
// ======================================================

if (logoutBtn) {
    logoutBtn.addEventListener("click", (event) => {
        event.preventDefault();

        const confirmed = confirm("Bạn có chắc chắn muốn đăng xuất không?");

        if (!confirmed) {
            return;
        }

        logout();
    });
}

// ======================================================
// ROUTES
// ======================================================

router
    .on("/", () => {
        helpers.loadPage(loginPage, false);
    })

    .on("/login", () => {
        helpers.loadPage(loginPage, false);
    })

    .on("/dashboard", () => {
        if (!authGuard()) return;

        helpers.loadPage(dashboardPage, true);
    })

    .on("/products", () => {
        if (!authGuard()) return;

        helpers.loadPage(productPage, true);
    })

    .on("/orders", () => {
        if (!authGuard()) return;

        helpers.loadPage(orderPage, true);
    })

    .on("/customers", () => {
        if (!authGuard()) return;

        customerPage.mode = "list";
        customerPage.customerId = null;

        helpers.loadPage(customerPage, true);
    })

    .on("/customers/create", () => {
        if (!authGuard()) return;

        customerPage.mode = "create";
        customerPage.customerId = null;

        helpers.loadPage(customerPage, true);
    })

    .on("/customers/edit/:id", (match) => {
        if (!authGuard()) return;

        customerPage.mode = "edit";
        customerPage.customerId = match.data.id;

        helpers.loadPage(customerPage, true);
    })

    .on("/reports", () => {
        if (!authGuard()) return;

        helpers.loadPage(reportPage, true);
    })

    .notFound(() => {
        if (!authGuard()) return;

        helpers.loadPage(
            {
                render: () => {
                    return `
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
                },
            },
            true
        );
    })

    .resolve();