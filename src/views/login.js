import router from "../router/index.js";
import { login } from "../services/authService.js";

// ======================================================
// RENDER LOGIN PAGE
// ======================================================

const render = () => {
    return `
    <section class="login-page">
      <div class="login-card">
        <div class="login-header">
          <i class="fas fa-store"></i>
          <h2>ShopAdmin</h2>
          <p>Hệ thống quản lý bán hàng</p>
        </div>

        <form id="login-form">
          <p id="login-error" class="login-error"></p>

          <div class="form-group">
            <label for="email">Email</label>
            <input 
              type="email" 
              id="email" 
              placeholder="Nhập email"
              autocomplete="email"
            >
          </div>

          <div class="form-group">
            <label for="password">Mật khẩu</label>
            <input 
              type="password" 
              id="password" 
              placeholder="Nhập mật khẩu"
              autocomplete="current-password"
            >
          </div>

          <button type="submit" class="login-submit">
            Đăng nhập
          </button>
        </form>
      </div>
    </section>
  `;
};

// ======================================================
// SHOW LOGIN ERROR
// ======================================================

const showPopupError = (message) => {
    const errorElement = document.getElementById("login-error");

    if (!errorElement) {
        return;
    }

    errorElement.textContent = message;
};

// ======================================================
// HANDLE LOGIN
// ======================================================

const handleLogin = async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();

    if (!email || !password) {
        showPopupError("Email và mật khẩu không được để trống");
        return;
    }

    try {
        await login({
            email,
            password,
        });

        router.navigate("/dashboard");
    } catch (error) {
        showPopupError(
            error.response?.data?.message ||
            error.message ||
            "Đăng nhập thất bại"
        );
    }
};

// ======================================================
// INIT LOGIN PAGE
// ======================================================

const init = () => {
    const form = document.getElementById("login-form");

    if (!form) {
        return;
    }

    form.addEventListener("submit", handleLogin);
};

export default {
    render,
    init,
};