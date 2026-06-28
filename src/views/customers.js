import {
    getCustomers,
    getCustomerById,
    createCustomer,
    updateCustomer,
    deleteCustomer,
} from "../api.js";

const customerState = {
    search: "",
    tier: "all",
};

export function renderCustomersPage(root, path) {
    const pathParts = path.split("/").filter(Boolean);

    const action = pathParts[1];
    const customerId = pathParts[2];

    if (action === "create") {
        renderCustomerFormPage(root);
        return;
    }

    if (action === "edit") {
        renderCustomerFormPage(root, customerId);
        return;
    }

    renderCustomerListPage(root);
}

function renderCustomerListPage(root) {
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

      <a href="#/customers/create" class="btn-add">
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

        <tbody id="customerTableBody"></tbody>
      </table>
    </section>
  `;

    const searchInput = document.getElementById("customerSearchInput");
    const tierFilter = document.getElementById("tierFilter");
    const tableBody = document.getElementById("customerTableBody");

    tierFilter.value = customerState.tier;

    renderCustomerStats();
    renderCustomerRows();

    searchInput.addEventListener("input", function (event) {
        customerState.search = event.target.value;
        renderCustomerRows();
    });

    tierFilter.addEventListener("change", function (event) {
        customerState.tier = event.target.value;
        renderCustomerRows();
    });

    tableBody.addEventListener("click", function (event) {
        const deleteButton = event.target.closest("[data-delete-id]");

        if (!deleteButton) {
            return;
        }

        const customerId = deleteButton.dataset.deleteId;

        const confirmed = confirm("Bạn có chắc chắn muốn xóa khách hàng này?");

        if (!confirmed) {
            return;
        }

        deleteCustomer(customerId);

        renderCustomerStats();
        renderCustomerRows();

        alert("Xóa khách hàng thành công");
    });
}

function renderCustomerStats() {
    const customers = getCustomers();

    const totalCustomersElement = document.getElementById("totalCustomers");
    const newCustomersElement = document.getElementById("newCustomers");
    const returnRateElement = document.getElementById("returnRate");

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

function renderCustomerRows() {
    const tableBody = document.getElementById("customerTableBody");
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
              href="#/customers/edit/${encodeURIComponent(customer.id)}"
              class="btn-action"
              title="Sửa"
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
}

function renderCustomerFormPage(root, customerId = null) {
    const isEditMode = Boolean(customerId);
    const customer = isEditMode ? getCustomerById(customerId) : null;

    if (isEditMode && !customer) {
        root.innerHTML = `
      <div class="page-header">
        <h2>Không tìm thấy khách hàng</h2>

        <a href="#/customers" class="btn-secondary">
          <i class="fas fa-arrow-left"></i>
          Quay lại
        </a>
      </div>
    `;
        return;
    }

    root.innerHTML = `
    <div class="page-header">
      <h2>${isEditMode ? "Sửa khách hàng" : "Thêm khách hàng"}</h2>

      <a href="#/customers" class="btn-secondary">
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

          <a href="#/customers" class="btn-secondary">
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

    const form = document.getElementById("customerForm");
    const deleteButton = document.getElementById("deleteCustomerButton");

    form.addEventListener("submit", function (event) {
        event.preventDefault();

        const formData = getCustomerFormData(form);

        const isValid = validateCustomerForm(form, formData, customerId);

        if (!isValid) {
            return;
        }

        if (isEditMode) {
            updateCustomer(customerId, formData);
            alert("Cập nhật khách hàng thành công");
        } else {
            createCustomer(formData);
            alert("Thêm khách hàng thành công");
        }

        window.location.hash = "#/customers";
    });

    if (deleteButton) {
        deleteButton.addEventListener("click", function () {
            const confirmed = confirm("Bạn có chắc chắn muốn xóa khách hàng này?");

            if (!confirmed) {
                return;
            }

            deleteCustomer(customerId);
            alert("Xóa khách hàng thành công");

            window.location.hash = "#/customers";
        });
    }
}

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

function validateCustomerForm(form, data, currentCustomerId) {
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

    if (isEmailDuplicated(data.email, currentCustomerId)) {
        setError(form, "email", "Email này đã tồn tại");
        isValid = false;
    }

    if (!isValidPhone(data.phone)) {
        setError(form, "phone", "Số điện thoại phải có từ 9 đến 11 chữ số");
        isValid = false;
    }

    if (isPhoneDuplicated(data.phone, currentCustomerId)) {
        setError(form, "phone", "Số điện thoại này đã tồn tại");
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

function getFilteredCustomers() {
    const customers = getCustomers();

    return customers.filter(function (customer) {
        const searchValue = normalizeText(customerState.search);

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

function isEmailDuplicated(email, currentCustomerId) {
    const customers = getCustomers();
    const normalizedEmail = String(email).trim().toLowerCase();

    return customers.some(function (customer) {
        return (
            customer.email.toLowerCase() === normalizedEmail &&
            customer.id !== currentCustomerId
        );
    });
}

function isPhoneDuplicated(phone, currentCustomerId) {
    const customers = getCustomers();
    const normalizedPhone = normalizePhone(phone);

    return customers.some(function (customer) {
        return (
            normalizePhone(customer.phone) === normalizedPhone &&
            customer.id !== currentCustomerId
        );
    });
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