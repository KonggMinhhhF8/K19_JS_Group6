import {
    customerApi,
    clearAuthSession,
} from "../api.js";

// PAGE STATE

const customerState = {
    customers: [],
    search: "",
    tier: "all",
    loading: false,
    error: "",
};

// RENDER CUSTOMER LIST PAGE

export async function renderCustomersPage(root, router) {
    root.innerHTML = `
    <header>
      <div class="search-bar">
        <input 
          type="text" 
          id="customerSearchInput"
          placeholder="Tìm tên, email hoặc số điện thoại..."
          value="${escapeHTML(customerState.search)}"
        >
      </div>

      <a href="/customers/create" class="btn-add" data-navigo>
        <i class="fas fa-user-plus"></i>
        Thêm khách hàng
      </a>
    </header>

    <section class="stats">
      <div class="card">
        <h3>Tổng khách hàng</h3>
        <p id="totalCustomers">0</p>
      </div>

      <div class="card">
        <h3>Khách hàng mới tháng này</h3>
        <p id="newCustomers">0</p>
      </div>

      <div class="card">
        <h3>Tỉ lệ quay lại</h3>
        <p id="returnRate">0%</p>
      </div>
    </section>

    <section class="table-container">
      <div class="table-header">
        <h3>Danh sách khách hàng</h3>

        <select id="tierFilter">
          <option value="all">Hạng: Tất cả</option>
          <option value="gold">Hạng: Vàng</option>
          <option value="silver">Hạng: Bạc</option>
          <option value="bronze">Hạng: Đồng</option>
        </select>
      </div>

      <table>
        <thead>
          <tr>
            <th>Khách hàng</th>
            <th>Liên hệ</th>
            <th>Hạng</th>
            <th>Đơn hàng</th>
            <th>Tổng chi tiêu</th>
            <th>Thao tác</th>
          </tr>
        </thead>

        <tbody id="customerTableBody">
          <tr>
            <td colspan="6" class="empty-state">
              Đang tải dữ liệu khách hàng...
            </td>
          </tr>
        </tbody>
      </table>
    </section>
  `;

    router.updatePageLinks();

    bindCustomerListEvents(router);
    await loadCustomers(router);
}

// BIND LIST EVENTS

function bindCustomerListEvents(router) {
    const searchInput = document.getElementById("customerSearchInput");
    const tierFilter = document.getElementById("tierFilter");
    const tableBody = document.getElementById("customerTableBody");

    tierFilter.value = customerState.tier;

    searchInput.addEventListener("input", function (event) {
        customerState.search = event.target.value;
        renderCustomerRows(router);
    });

    tierFilter.addEventListener("change", function (event) {
        customerState.tier = event.target.value;
        renderCustomerRows(router);
    });

    tableBody.addEventListener("click", async function (event) {
        const deleteButton = event.target.closest("[data-delete-id]");

        if (!deleteButton) {
            return;
        }

        const customerId = deleteButton.dataset.deleteId;

        const confirmed = confirm("Bạn có chắc chắn muốn xóa khách hàng này không?");

        if (!confirmed) {
            return;
        }

        try {
            await customerApi.remove(customerId);
            alert("Xóa khách hàng thành công");
            await loadCustomers(router);
        } catch (error) {
            handleApiError(error, router);
        }
    });
}

// LOAD CUSTOMERS

async function loadCustomers(router) {
    try {
        customerState.loading = true;
        customerState.error = "";

        const response = await customerApi.getAll();

        customerState.customers = normalizeCustomerListResponse(response);

        renderCustomerStats();
        renderCustomerRows(router);
    } catch (error) {
        if (isAuthError(error)) {
            handleApiError(error, router);
            return;
        }

        customerState.error = error.message || "Không thể tải danh sách khách hàng";
        renderCustomerError(customerState.error);
    } finally {
        customerState.loading = false;
    }
}

// RENDER STATS

function renderCustomerStats() {
    const customers = customerState.customers;

    const totalCustomersElement = document.getElementById("totalCustomers");
    const newCustomersElement = document.getElementById("newCustomers");
    const returnRateElement = document.getElementById("returnRate");

    if (!totalCustomersElement || !newCustomersElement || !returnRateElement) {
        return;
    }

    const totalCustomers = customers.length;

    const newCustomers = customers.filter(function (customer) {
        return isCurrentMonth(customer.createdAt);
    }).length;

    const returningCustomers = customers.filter(function (customer) {
        return Number(customer.orders) > 1;
    }).length;

    const returnRate =
        totalCustomers === 0
            ? 0
            : Math.round((returningCustomers / totalCustomers) * 100);

    totalCustomersElement.textContent = totalCustomers;
    newCustomersElement.textContent = newCustomers;
    returnRateElement.textContent = returnRate + "%";
}

// RENDER TABLE ROWS

function renderCustomerRows(router) {
    const tableBody = document.getElementById("customerTableBody");

    if (!tableBody) {
        return;
    }

    const customers = getFilteredCustomers();

    if (customers.length === 0) {
        tableBody.innerHTML = `
      <tr>
        <td colspan="6" class="empty-state">
          Không tìm thấy khách hàng phù hợp
        </td>
      </tr>
    `;
        return;
    }

    tableBody.innerHTML = customers
        .map(function (customer) {
            const tier = getCustomerTier(customer.totalSpent);

            return `
        <tr>
          <td>
            <div class="cust-info">
              <div class="avatar">
                ${escapeHTML(getInitials(customer.name))}
              </div>

              <div>
                <strong>${escapeHTML(customer.name)}</strong><br>
                <small>ID: ${escapeHTML(customer.id)}</small>
              </div>
            </div>
          </td>

          <td>
            ${escapeHTML(customer.email)}<br>
            <small>${escapeHTML(customer.phone)}</small>
          </td>

          <td>
            <span class="tier ${tier.className}">
              ${tier.label}
            </span>
          </td>

          <td>${Number(customer.orders)}</td>

          <td>
            <strong>${formatCurrency(customer.totalSpent)}</strong>
          </td>

          <td>
            <a 
              href="/customers/edit/${encodeURIComponent(customer.id)}"
              class="btn-action"
              title="Sửa"
              data-navigo
            >
              <i class="fas fa-user-edit"></i>
            </a>

            <button 
              type="button"
              class="btn-action"
              title="Xóa"
              data-delete-id="${escapeHTML(customer.id)}"
            >
              <i class="fas fa-trash"></i>
            </button>
          </td>
        </tr>
      `;
        })
        .join("");

    if (router) {
        router.updatePageLinks();
    }
}

function renderCustomerError(message) {
    const tableBody = document.getElementById("customerTableBody");

    if (!tableBody) {
        return;
    }

    tableBody.innerHTML = `
    <tr>
      <td colspan="6" class="empty-state error-text">
        ${escapeHTML(message)}
      </td>
    </tr>
  `;
}

// CREATE PAGE

export function renderCustomerCreatePage(root, router) {
    renderCustomerFormPage(root, router);
}

// EDIT PAGE

export async function renderCustomerEditPage(root, router, customerId) {
    root.innerHTML = `
    <div class="page-header">
      <h2>Đang tải khách hàng...</h2>

      <a href="/customers" class="btn-secondary" data-navigo>
        <i class="fas fa-arrow-left"></i>
        Quay lại
      </a>
    </div>
  `;

    router.updatePageLinks();

    try {
        const response = await customerApi.getAll();
        const customers = normalizeCustomerListResponse(response);

        const customer = customers.find(function (item) {
            return String(item.id) === String(customerId);
        });

        if (!customer) {
            throw new Error("Không tìm thấy khách hàng");
        }

        renderCustomerFormPage(root, router, customer);
    } catch (error) {
        if (isAuthError(error)) {
            handleApiError(error, router);
            return;
        }

        root.innerHTML = `
      <div class="page-header">
        <h2>Không tìm thấy khách hàng</h2>

        <a href="/customers" class="btn-secondary" data-navigo>
          <i class="fas fa-arrow-left"></i>
          Quay lại
        </a>
      </div>

      <section class="card">
        <h3>Lỗi</h3>
        <p>${escapeHTML(error.message || "Không thể tải khách hàng")}</p>
      </section>
    `;

        router.updatePageLinks();
    }
}

// FORM PAGE

function renderCustomerFormPage(root, router, customer = null) {
    const isEditMode = Boolean(customer?.id);

    root.innerHTML = `
    <div class="page-header">
      <h2>${isEditMode ? "Sửa khách hàng" : "Thêm khách hàng"}</h2>

      <a href="/customers" class="btn-secondary" data-navigo>
        <i class="fas fa-arrow-left"></i>
        Quay lại
      </a>
    </div>

    <section class="form-card">
      <form id="customerForm">
        <div class="form-grid">
          <div class="form-group" data-field="name">
            <label for="customerName">Tên khách hàng</label>
            <input 
              type="text" 
              id="customerName" 
              name="name"
              value="${escapeHTML(customer ? customer.name : "")}"
              placeholder="Nhập tên khách hàng"
            >
            <small class="form-error"></small>
          </div>

          <div class="form-group" data-field="email">
            <label for="customerEmail">Email</label>
            <input 
              type="email" 
              id="customerEmail" 
              name="email"
              value="${escapeHTML(customer ? customer.email : "")}"
              placeholder="example@email.com"
            >
            <small class="form-error"></small>
          </div>

          <div class="form-group" data-field="phone">
            <label for="customerPhone">Số điện thoại</label>
            <input 
              type="text" 
              id="customerPhone" 
              name="phone"
              value="${escapeHTML(customer ? customer.phone : "")}"
              placeholder="0912.345.678"
            >
            <small class="form-error"></small>
          </div>

          <div class="form-group" data-field="orders">
            <label for="customerOrders">Số đơn hàng</label>
            <input 
              type="number" 
              id="customerOrders" 
              name="orders"
              min="0"
              value="${escapeHTML(customer ? customer.orders : 0)}"
            >
            <small class="form-error"></small>
          </div>

          <div class="form-group full" data-field="totalSpent">
            <label for="customerTotalSpent">Tổng chi tiêu</label>
            <input 
              type="number" 
              id="customerTotalSpent" 
              name="totalSpent"
              min="0"
              value="${escapeHTML(customer ? customer.totalSpent : 0)}"
            >
            <small class="form-error"></small>
          </div>
        </div>

        <div class="form-actions">
          ${
        isEditMode
            ? `
                <button 
                  type="button" 
                  class="btn-danger"
                  id="deleteCustomerButton"
                >
                  <i class="fas fa-trash"></i>
                  Xóa
                </button>
              `
            : ""
    }

          <a href="/customers" class="btn-secondary" data-navigo>
            Hủy
          </a>

          <button type="submit" class="btn-primary">
            <i class="fas fa-save"></i>
            Lưu khách hàng
          </button>
        </div>
      </form>
    </section>
  `;

    router.updatePageLinks();

    const form = document.getElementById("customerForm");
    const deleteButton = document.getElementById("deleteCustomerButton");

    form.addEventListener("submit", async function (event) {
        event.preventDefault();

        const formData = getCustomerFormData(form);
        const isValid = validateCustomerForm(form, formData);

        if (!isValid) {
            return;
        }

        try {
            const payload = buildCustomerPayload(formData);

            if (isEditMode) {
                await customerApi.update(customer.id, payload);
                alert("Cập nhật khách hàng thành công");
            } else {
                await customerApi.create(payload);
                alert("Thêm khách hàng thành công");
            }

            router.navigate("/customers");
        } catch (error) {
            handleApiError(error, router);
        }
    });

    if (deleteButton) {
        deleteButton.addEventListener("click", async function () {
            const confirmed = confirm("Bạn có chắc chắn muốn xóa khách hàng này không?");

            if (!confirmed) {
                return;
            }

            try {
                await customerApi.remove(customer.id);
                alert("Xóa khách hàng thành công");
                router.navigate("/customers");
            } catch (error) {
                handleApiError(error, router);
            }
        });
    }
}

// API ERROR HANDLING

function isAuthError(error) {
    return error?.status === 401 || error?.status === 403;
}

function handleApiError(error, router) {
    if (isAuthError(error)) {
        clearAuthSession();
        alert("Phiên đăng nhập hết hạn hoặc không có quyền truy cập. Vui lòng đăng nhập lại.");
        router.navigate("/login");
        return;
    }

    alert(error.message || "Đã có lỗi xảy ra");
}

// API RESPONSE NORMALIZATION

function normalizeCustomerListResponse(response) {
    if (Array.isArray(response)) {
        return response.map(normalizeCustomer);
    }

    if (Array.isArray(response?.data)) {
        return response.data.map(normalizeCustomer);
    }

    if (Array.isArray(response?.customers)) {
        return response.customers.map(normalizeCustomer);
    }

    if (Array.isArray(response?.items)) {
        return response.items.map(normalizeCustomer);
    }

    return [];
}

function normalizeCustomer(customer = {}) {
    return {
        id: String(customer.id || customer._id || customer.customerId || ""),
        name: String(customer.name || customer.fullName || customer.customerName || ""),
        email: String(customer.email || ""),
        phone: String(customer.phone || customer.phoneNumber || ""),
        orders: Number(customer.orders || customer.ordersCount || customer.totalOrders || 0),
        totalSpent: Number(
            customer.totalSpent ||
            customer.total_spent ||
            customer.spent ||
            customer.totalAmount ||
            0
        ),
        createdAt: customer.createdAt || customer.created_at || new Date().toISOString(),
        updatedAt: customer.updatedAt || customer.updated_at || new Date().toISOString(),
    };
}

// FORM HELPERS

function getCustomerFormData(form) {
    const formData = new FormData(form);

    return {
        name: String(formData.get("name") || "").trim(),
        email: String(formData.get("email") || "").trim(),
        phone: String(formData.get("phone") || "").trim(),
        orders: Number(formData.get("orders")),
        totalSpent: Number(formData.get("totalSpent")),
    };
}

function buildCustomerPayload(formData) {
    return {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        orders: formData.orders,
        totalSpent: formData.totalSpent,
    };
}

function validateCustomerForm(form, data) {
    clearErrors(form);

    let isValid = true;

    if (data.name.length < 2) {
        setError(form, "name", "Tên khách hàng phải có ít nhất 2 ký tự");
        isValid = false;
    }

    if (!isValidEmail(data.email)) {
        setError(form, "email", "Email không hợp lệ");
        isValid = false;
    }

    if (!isValidPhone(data.phone)) {
        setError(form, "phone", "Số điện thoại phải có từ 9 đến 11 chữ số");
        isValid = false;
    }

    if (!Number.isInteger(data.orders) || data.orders < 0) {
        setError(form, "orders", "Số đơn hàng phải là số nguyên >= 0");
        isValid = false;
    }

    if (Number.isNaN(data.totalSpent) || data.totalSpent < 0) {
        setError(form, "totalSpent", "Tổng chi tiêu phải >= 0");
        isValid = false;
    }

    return isValid;
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

// FILTER HELPERS

function getFilteredCustomers() {
    const searchValue = normalizeText(customerState.search);

    return customerState.customers.filter(function (customer) {
        const name = normalizeText(customer.name);
        const email = normalizeText(customer.email);
        const phone = normalizeText(customer.phone);

        const tier = getCustomerTier(customer.totalSpent);

        const matchesSearch =
            !searchValue ||
            name.includes(searchValue) ||
            email.includes(searchValue) ||
            phone.includes(searchValue);

        const matchesTier =
            customerState.tier === "all" || tier.value === customerState.tier;

        return matchesSearch && matchesTier;
    });
}

// COMMON HELPERS

function getCustomerTier(totalSpent) {
    const spent = Number(totalSpent);

    if (spent >= 30000000) {
        return {
            label: "VÀNG",
            className: "gold",
            value: "gold",
        };
    }

    if (spent >= 10000000) {
        return {
            label: "BẠC",
            className: "silver",
            value: "silver",
        };
    }

    return {
        label: "ĐỒNG",
        className: "bronze",
        value: "bronze",
    };
}

function isCurrentMonth(dateString) {
    const date = new Date(dateString);
    const now = new Date();

    if (Number.isNaN(date.getTime())) {
        return false;
    }

    return (
        date.getMonth() === now.getMonth() &&
        date.getFullYear() === now.getFullYear()
    );
}

function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    return emailRegex.test(email);
}

function isValidPhone(phone) {
    const digits = normalizePhone(phone);

    return digits.length >= 9 && digits.length <= 11;
}

function normalizeText(value) {
    return String(value)
        .toLowerCase()
        .trim()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[\s.\-_]/g, "");
}

function normalizePhone(phone) {
    return String(phone).replace(/\D/g, "");
}

function getInitials(name) {
    const words = String(name).trim().split(/\s+/);

    if (words.length === 1) {
        return words[0].slice(0, 2).toUpperCase();
    }

    return words
        .map(function (word) {
            return word[0];
        })
        .join("")
        .slice(0, 2)
        .toUpperCase();
}

function formatCurrency(value) {
    return new Intl.NumberFormat("vi-VN").format(Number(value) || 0) + "đ";
}

function escapeHTML(value) {
    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}