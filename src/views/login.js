import { login } from "../services/authService";
import router from "../router";

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

            <div class="form-group">
                <label>Email</label>

                <input
                    id="email"
                    type="email"
                    placeholder="Nhập email"
                >
            </div>

            <div class="form-group">
                <label>Mật khẩu</label>

                <input
                    id="password"
                    type="password"
                    placeholder="Nhập mật khẩu"
                >
            </div>
            <p id="login-error" class="login-error"></p>
            <button type="submit">
                Đăng nhập
            </button>

        </form>

    </div>
</section>
    `;
};

const showPopupError = (message) => {
    const errorElement = document.getElementById("login-error");

    if (!errorElement) return;

    errorElement.textContent = message;
};

const handleLogin = async (e) => {
    e.preventDefault();

    const email = document
        .getElementById("email")
        .value
        .trim();

    const password = document
        .getElementById("password")
        .value
        .trim();

    // Validate
    if (!email || !password) {
        showPopupError(
            "Email và mật khẩu không được để trống"
        );
        return;
    }

    try {
        await login({
            email,
            password
        });

        router.navigate("/dashboard");
        console.log("Đăng nhập thành công");

    } catch (error) {
        showPopupError(
            error.response?.data?.message ||
            "Đăng nhập thất bại"
        );
    }
};

const init = () => {
    const form = document.getElementById("login-form");

    form.addEventListener(
        "submit",
        handleLogin
    );
};


export default {render,init};