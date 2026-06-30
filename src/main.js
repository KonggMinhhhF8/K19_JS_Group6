import Navigo from 'navigo';
import './style.css';

import DashboardView from './views/dashboard.js';
import ProductsView from './views/products.js';
import OrdersView from './views/orders.js';
import CustomersView from './views/customers.js';
import ReportsView from './views/reports.js';
import LoginView from './views/login.js';

// ── Router ──────────────────────────────────────────────────────────────────
const router = new Navigo('/', { hash: true });
window.router = router;

// ── Helpers ──────────────────────────────────────────────────────────────────
function renderView(view) {
    const main = document.getElementById('main-content');
    if (!main) return;

    // Route Guard: Kiểm tra đăng nhập
    const token = localStorage.getItem('API_TOKEN');
    if (!token && view !== LoginView) {
        router.navigate('/login');
        return;
    }

    if (token && view === LoginView) {
        router.navigate('/');
        return;
    }

    // Quản lý hiển thị sidebar bằng body class
    if (view === LoginView) {
        document.body.classList.add('login-active');
    } else {
        document.body.classList.remove('login-active');
    }

    window.scrollTo(0, 0);
    main.classList.remove('fade-in');
    void main.offsetWidth; // reflow
    main.innerHTML = view.render();
    main.classList.add('fade-in');

    view.init?.();
}

function setActiveMenu(route) {
    document.querySelectorAll('.sidebar ul li').forEach(li => {
        li.classList.remove('active');
        if (li.dataset.route === route || (route === '/' && li.dataset.route === '/')) {
            li.classList.add('active');
        }
    });
}

// ── Sidebar click delegation ─────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {

    document.querySelectorAll('.sidebar ul li[data-route]').forEach(li => {
        li.addEventListener('click', () => {
            // Đóng menu mobile nếu đang mở
            document.getElementById('sidebar')?.classList.remove('active');
            document.getElementById('overlay')?.classList.remove('active');
            router.navigate(li.dataset.route);
        });
    });

    // Xử lý nút Đăng xuất
    document.getElementById('sidebar-logout')?.addEventListener('click', () => {
        if (confirm('Bạn có chắc chắn muốn đăng xuất?')) {
            localStorage.removeItem('API_TOKEN');
            router.navigate('/login');
        }
    });

    // Mobile sidebar toggle
    document.addEventListener('click', e => {
        if (e.target.closest('#menuToggle')) {
            document.getElementById('sidebar')?.classList.toggle('active');
            document.getElementById('overlay')?.classList.toggle('active');
        } else if (e.target.closest('#overlay')) {
            document.getElementById('sidebar')?.classList.remove('active');
            document.getElementById('overlay')?.classList.remove('active');
        }
    });

    // ── Routes ────────────────────────────────────────────────────────────────
    router
        .on('/', () => { setActiveMenu('/'); renderView(DashboardView); })
        .on('/login', () => { renderView(LoginView); })
        .on('/products', () => { setActiveMenu('/products'); renderView(ProductsView); })
        .on('/orders', () => { setActiveMenu('/orders'); renderView(OrdersView); })
        .on('/customers', () => { setActiveMenu('/customers'); renderView(CustomersView); })
        .on('/reports', () => { setActiveMenu('/reports'); renderView(ReportsView); })
        .notFound(() => router.navigate('/'))
        .resolve();
});

