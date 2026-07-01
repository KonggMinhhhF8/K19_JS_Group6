import {
    authApi,
    extractAccessToken,
    extractRefreshToken,
    extractUser,
    saveAuthSession,
} from "../api.js";

// LOGIN PAGE
// Render trang đăng nhập.
// API hiện tại dùng:
// POST /auth/signin

export function renderLoginPage(root, router) {
    root.innerHTML = `
    <section class="login-page">
      <div class="login-card">
        <div class="login-header">
          <h1>ShopAdmin</h1>
          <p>Đăng nhập để quản lý hệ thống</p>
        </div>

        <form id="loginForm">
          <div class="form-group" data-field="email">
            <label for="email">Email</label>
            <input 
              type="email" 
              id="email" 
              name="email"
              placeholder="Nhập email"
              autocomplete="email"
            >
            <small class="form-error"></small>
          </div>

          <div class="form-group" data-field="password">
            <label for="password">Mật khẩu</label>
            <input 
              type="password" 
              id="password" 
              name="password"
              placeholder="Nhập mật khẩu"
              autocomplete="current-password"
            >
            <small class="form-error"></small>
          </div>

          <button type="submit" class="btn-primary login-submit">
            <i class="fas fa-sign-in-alt"></i>
            Đăng nhập
          </button>

          <p id="loginError" class="login-error"></p>
        </form>
      </div>
    </section>
  `;

    const form = document.getElementById("loginForm");
    const loginError = document.getElementById("loginError");

    form.addEventListener("submit", async function (event) {
        event.preventDefault();

        loginError.textContent = "";

        const formData = getLoginFormData(form);
        const isValid = validateLoginForm(form, formData);

        if (!isValid) {
            return;
        }

        try {
            setLoginLoading(true);

            const payload = buildSigninPayload(formData);

            console.log("SIGNIN PAYLOAD:", payload);

            const response = await authApi.signin(payload);

            console.log("SIGNIN RESPONSE:", response);

            const accessToken = extractAccessToken(response);
            const refreshToken = extractRefreshToken(response);
            const user = extractUser(response);

            if (!accessToken) {
                throw new Error("API signin thành công nhưng không trả về access token");
            }

            saveAuthSession({
                accessToken,
                refreshToken,
                user,
            });

            router.navigate("/customers");
        } catch (error) {
            console.error("LOGIN ERROR:", error);

            loginError.textContent =
                error.message || "Email hoặc mật khẩu không đúng.";
        } finally {
            setLoginLoading(false);
        }
    });
}

// GET LOGIN FORM DATA

function getLoginFormData(form) {
    const formData = new FormData(form);

    return {
        email: String(formData.get("email") || "").trim(),
        password: String(formData.get("password") || ""),
    };
}

// BUILD SIGNIN PAYLOAD

function buildSigninPayload(data) {
    return {
        email: data.email,
        password: data.password,
    };
}

// VALIDATION

function validateLoginForm(form, data) {
    clearErrors(form);

    let isValid = true;

    if (!data.email) {
        setError(form, "email", "Vui lòng nhập email");
        isValid = false;
    } else if (!isValidEmail(data.email)) {
        setError(form, "email", "Email không hợp lệ");
        isValid = false;
    }

    if (!data.password) {
        setError(form, "password", "Vui lòng nhập mật khẩu");
        isValid = false;
    }

    return isValid;
}

function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    return emailRegex.test(email);
}

function clearErrors(form) {
    const groups = form.querySelectorAll(".form-group");

    groups.forEach(function (group) {
        group.classList.remove("has-error");

        const error = group.querySelector(".form-error");

        if (error) {
            error.textContent = "";
        }
    });
}

function setError(form, fieldName, message) {
    const group = form.querySelector(`[data-field="${fieldName}"]`);

    if (!group) {
        return;
    }

    group.classList.add("has-error");

    const error = group.querySelector(".form-error");

    if (error) {
        error.textContent = message;
    }
}

function setLoginLoading(isLoading) {
    const button = document.querySelector(".login-submit");

    if (!button) {
        return;
    }

    button.disabled = isLoading;
    button.innerHTML = isLoading
        ? `<i class="fas fa-spinner fa-spin"></i> Đang đăng nhập...`
        : `<i class="fas fa-sign-in-alt"></i> Đăng nhập`;
}