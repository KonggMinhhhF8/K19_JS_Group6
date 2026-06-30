import { apiService } from '../api.js';

const LoginView = {
    render() {
        return `
            <div class="login-container">
                <div class="login-card">
                    <div class="login-header">
                        <div class="login-logo">
                            <i class="fas fa-shopping-bag"></i>
                        </div>
                        <h2>ShopAdmin</h2>
                        <p>Hệ Thống Quản Lý Bán Hàng</p>
                    </div>
                    <form id="loginForm" class="login-form">
                        <div class="form-group-login">
                            <label for="email"><i class="fas fa-envelope"></i> Email</label>
                            <input type="email" id="email" placeholder="Nhập email (ví dụ: admin@email.com)" required autocomplete="email">
                        </div>
                        <div class="form-group-login">
                            <label for="password"><i class="fas fa-lock"></i> Mật khẩu</label>
                            <input type="password" id="password" placeholder="Nhập mật khẩu" required autocomplete="current-password">
                        </div>
                        <div id="loginError" class="login-error" style="display: none;">
                            <i class="fas fa-exclamation-circle"></i> <span id="loginErrorMessage">Tài khoản hoặc mật khẩu không đúng!</span>
                        </div>
                        <button type="submit" class="btn-login" id="btnLoginSubmit">
                            <span>Đăng Nhập</span>
                            <i class="fas fa-arrow-right"></i>
                        </button>
                    </form>
                    <div class="login-footer">
                        <p>K19 JS Group 6 &copy; 2026</p>
                    </div>
                </div>
            </div>
        `;
    },

    init() {
        document.body.classList.add('login-active');

        const form = document.getElementById('loginForm');
        const errorEl = document.getElementById('loginError');
        const errorMessageEl = document.getElementById('loginErrorMessage');
        const submitBtn = document.getElementById('btnLoginSubmit');

        form?.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('email').value.trim();
            const password = document.getElementById('password').value;

            if (errorEl) errorEl.style.display = 'none';



            // Show loading state
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> <span>Đang đăng nhập...</span>`;
            }

            try {
                const data = await apiService.auth.login(email, password);
                if (data && data.accessToken) {
                    localStorage.setItem('API_TOKEN', data.accessToken);
                    if (data.refreshToken) {
                        localStorage.setItem('REFRESH_TOKEN', data.refreshToken);
                    }
                    document.body.classList.remove('login-active');
                    window.router.navigate('/');
                } else {
                    throw new Error('Không nhận được token xác thực');
                }
            } catch (err) {
                console.error('Lỗi đăng nhập:', err);
                if (errorEl && errorMessageEl) {
                    let msg = 'Tài khoản hoặc mật khẩu không đúng!';
                    if (err.response?.data?.message) {
                        msg = err.response.data.message;
                    } else if (err.message) {
                        msg = err.message;
                    }
                    errorMessageEl.textContent = msg;
                    errorEl.style.display = 'flex';
                    errorEl.classList.remove('shake');
                    void errorEl.offsetWidth; // trigger reflow
                    errorEl.classList.add('shake');
                }
            } finally {
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = `<span>Đăng Nhập</span> <i class="fas fa-arrow-right"></i>`;
                }
            }
        });
    }
};

export default LoginView;
