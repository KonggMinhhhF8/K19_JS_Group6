import router from "../router/index.js";

import {
    getCustomers,
    createCustomer,
    updateCustomer,
    deleteCustomer,
} from "../services/customerService.js";

import { clearToken } from "../utils/tokenStorage.js";

import {
    normalizeEmail,
    normalizeText,
    normalizePhone,
    isValidEmail,
    isValidPhone,
    formatCurrency,
    formatDate,
    debounce,
    escapeHTML,
    getInitials,
    getCustomerTier,
    isCurrentMonth,
} from "../utils/customerHelpers.js";

// ======================================================
// PAGE STATE
// ======================================================

const customerState = {
    customers: [],
    search: "",
    tier: "all",
    sort: "newest",
    page: 1,
    pageSize: 5,
    loading: false,
    error: "",
};

// ======================================================
// RENDER HTML BY MODE
// ======================================================

const render = () => {
    if (customerPage.mode === "create") {
        return renderCustomerFormHTML();
    }

    if (customerPage.mode === "edit") {
        return `
      <div class="page-header">
        <h2>Đang tải khách hàng...</h2>

        <a href="/customers" class="btn-secondary" data-navigo>
          <i class="fas fa-arrow-left"></i>
          Quay lại
        </a>
      </div>
    `;
    }

    return renderCustomerListHTML();
};

// ======================================================
// INIT BY MODE
// ======================================================

const init = async () => {
    if (customerPage.mode === "create") {
        try {
            await ensureCustomersLoaded();
        } catch {
            // Nếu không tải được danh sách để check trùng,
            // form vẫn hoạt động với các validate còn lại.
        }

        bindCustomerFormEvents();
        return;
    }

    if (customerPage.mode === "edit") {
        await renderEditFormById(customerPage.customerId);
        return;
    }

    bindCustomerListEvents();
    await loadCustomers();
};

// ======================================================
// LIST HTML
// ======================================================

function renderCustomerListHTML() {
    return `
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

        <div class="table-actions">
          <select id="tierFilter">
            <option value="all">Hạng: Tất cả</option>
            <option value="gold">Hạng: Vàng</option>
            <option value="silver">Hạng: Bạc</option>
            <option value="bronze">Hạng: Đồng</option>
          </select>

          <select id="customerSortSelect">
            <option value="newest">Khách hàng mới nhất</option>
            <option value="nameAsc">Tên A-Z</option>
            <option value="totalSpentDesc">Tổng chi tiêu cao nhất</option>
            <option value="ordersDesc">Số đơn hàng nhiều nhất</option>
          </select>
        </div>
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

      <div id="customerPagination" class="pagination"></div>
    </section>
  `;
}

// ======================================================
// FORM HTML
// ======================================================

function renderCustomerFormHTML(customer = null) {
    const isEditMode = Boolean(customer?.id);

    return `
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
}

// ======================================================
// BIND LIST EVENTS
// ======================================================

function bindCustomerListEvents() {
    const searchInput = document.getElementById("customerSearchInput");
    const tierFilter = document.getElementById("tierFilter");
    const sortSelect = document.getElementById("customerSortSelect");
    const tableBody = document.getElementById("customerTableBody");
    const pagination = document.getElementById("customerPagination");

    if (!searchInput || !tierFilter || !sortSelect || !tableBody || !pagination) {
        return;
    }

    tierFilter.value = customerState.tier;
    sortSelect.value = customerState.sort;

    const handleSearch = debounce((value) => {
        customerState.search = value;
        customerState.page = 1;
        renderCustomerRows();
    }, 300);

    searchInput.addEventListener("input", (event) => {
        handleSearch(event.target.value);
    });

    tierFilter.addEventListener("change", (event) => {
        customerState.tier = event.target.value;
        customerState.page = 1;
        renderCustomerRows();
    });

    sortSelect.addEventListener("change", (event) => {
        customerState.sort = event.target.value;
        customerState.page = 1;
        renderCustomerRows();
    });

    tableBody.addEventListener("click", async (event) => {
        const historyButton = event.target.closest("[data-history-id]");
        const deleteButton = event.target.closest("[data-delete-id]");

        if (historyButton) {
            openCustomerHistoryModal(historyButton.dataset.historyId);
            return;
        }

        if (!deleteButton) {
            return;
        }

        const customerId = deleteButton.dataset.deleteId;

        const confirmed = confirm("Bạn có chắc chắn muốn xóa khách hàng này không?");

        if (!confirmed) {
            return;
        }

        try {
            await deleteCustomer(customerId);
            alert("Xóa khách hàng thành công");
            await loadCustomers();
        } catch (error) {
            handleApiError(error);
        }
    });

    pagination.addEventListener("click", (event) => {
        const pageButton = event.target.closest("[data-page]");

        if (!pageButton) {
            return;
        }

        const nextPage = Number(pageButton.dataset.page);

        if (Number.isNaN(nextPage)) {
            return;
        }

        customerState.page = nextPage;
        renderCustomerRows();
    });
}

// ======================================================
// LOAD CUSTOMERS
// ======================================================

async function loadCustomers() {
    try {
        customerState.loading = true;
        customerState.error = "";

        const response = await getCustomers();

        customerState.customers = normalizeCustomerListResponse(response);

        renderCustomerStats();
        renderCustomerRows();
    } catch (error) {
        if (isAuthError(error)) {
            handleApiError(error);
            return;
        }

        customerState.error =
            error.response?.data?.message ||
            error.message ||
            "Không thể tải danh sách khách hàng";

        renderCustomerError(customerState.error);
    } finally {
        customerState.loading = false;
    }
}

async function ensureCustomersLoaded() {
    if (customerState.customers.length > 0) {
        return;
    }

    const response = await getCustomers();

    customerState.customers = normalizeCustomerListResponse(response);
}

// ======================================================
// RENDER STATS
// ======================================================

function renderCustomerStats() {
    const customers = customerState.customers;

    const totalCustomersElement = document.getElementById("totalCustomers");
    const newCustomersElement = document.getElementById("newCustomers");
    const returnRateElement = document.getElementById("returnRate");

    if (!totalCustomersElement || !newCustomersElement || !returnRateElement) {
        return;
    }

    const totalCustomers = customers.length;

    const newCustomers = customers.filter((customer) => {
        return isCurrentMonth(customer.createdAt);
    }).length;

    const returningCustomers = customers.filter((customer) => {
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

// ======================================================
// RENDER CUSTOMER ROWS
// ======================================================

function renderCustomerRows() {
    const tableBody = document.getElementById("customerTableBody");

    if (!tableBody) {
        return;
    }

    const filteredSortedCustomers = getFilteredSortedCustomers();
    const paginatedCustomers = getPaginatedCustomers(filteredSortedCustomers);

    if (filteredSortedCustomers.length === 0) {
        tableBody.innerHTML = `
      <tr>
        <td colspan="6" class="empty-state">
          Không tìm thấy khách hàng phù hợp
        </td>
      </tr>
    `;

        renderPagination(0);
        return;
    }

    tableBody.innerHTML = paginatedCustomers
        .map((customer) => {
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
            <button 
              type="button"
              class="btn-action"
              title="Lịch sử khách hàng"
              data-history-id="${escapeHTML(customer.id)}"
            >
              <i class="fas fa-history"></i>
            </button>

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

    renderPagination(filteredSortedCustomers.length);
    router.updatePageLinks();
}

// ======================================================
// RENDER PAGINATION
// ======================================================

function renderPagination(totalItems) {
    const pagination = document.getElementById("customerPagination");

    if (!pagination) {
        return;
    }

    if (totalItems <= customerState.pageSize) {
        pagination.innerHTML = "";
        return;
    }

    const totalPages = Math.ceil(totalItems / customerState.pageSize);

    if (customerState.page > totalPages) {
        customerState.page = totalPages;
    }

    const previousPage = Math.max(customerState.page - 1, 1);
    const nextPage = Math.min(customerState.page + 1, totalPages);

    let pageButtons = "";

    for (let page = 1; page <= totalPages; page++) {
        pageButtons += `
      <button 
        type="button"
        class="pagination-btn ${page === customerState.page ? "active" : ""}"
        data-page="${page}"
      >
        ${page}
      </button>
    `;
    }

    pagination.innerHTML = `
    <div class="pagination-info">
      Trang ${customerState.page} / ${totalPages}
    </div>

    <div class="pagination-actions">
      <button 
        type="button"
        class="pagination-btn"
        data-page="${previousPage}"
        ${customerState.page === 1 ? "disabled" : ""}
      >
        <i class="fas fa-chevron-left"></i>
      </button>

      ${pageButtons}

      <button 
        type="button"
        class="pagination-btn"
        data-page="${nextPage}"
        ${customerState.page === totalPages ? "disabled" : ""}
      >
        <i class="fas fa-chevron-right"></i>
      </button>
    </div>
  `;
}

// ======================================================
// ERROR UI
// ======================================================

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

// ======================================================
// EDIT FLOW
// ======================================================

async function renderEditFormById(customerId) {
    const app = document.getElementById("app");

    try {
        const response = await getCustomers();
        const customers = normalizeCustomerListResponse(response);

        customerState.customers = customers;

        const customer = customers.find((item) => {
            return String(item.id) === String(customerId);
        });

        if (!customer) {
            throw new Error("Không tìm thấy khách hàng");
        }

        app.innerHTML = renderCustomerFormHTML(customer);
        router.updatePageLinks();
        bindCustomerFormEvents(customer);
    } catch (error) {
        if (isAuthError(error)) {
            handleApiError(error);
            return;
        }

        app.innerHTML = `
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

// ======================================================
// FORM EVENTS
// ======================================================

function bindCustomerFormEvents(customer = null) {
    const form = document.getElementById("customerForm");
    const deleteButton = document.getElementById("deleteCustomerButton");
    const isEditMode = Boolean(customer?.id);

    if (!form) {
        return;
    }

    form.addEventListener("submit", async (event) => {
        event.preventDefault();

        try {
            await ensureCustomersLoaded();
        } catch {
            // Vẫn cho validate local nếu không lấy được danh sách.
        }

        const formData = getCustomerFormData(form);
        const currentCustomerId = isEditMode ? customer.id : null;
        const isValid = validateCustomerForm(form, formData, currentCustomerId);

        if (!isValid) {
            return;
        }

        try {
            const payload = buildCustomerPayload(formData);

            if (isEditMode) {
                await updateCustomer(customer.id, payload);
                alert("Cập nhật khách hàng thành công");
            } else {
                await createCustomer(payload);
                alert("Thêm khách hàng thành công");
            }

            customerPage.mode = "list";
            customerPage.customerId = null;

            router.navigate("/customers");
        } catch (error) {
            handleApiError(error);
        }
    });

    if (deleteButton && isEditMode) {
        deleteButton.addEventListener("click", async () => {
            const confirmed = confirm("Bạn có chắc chắn muốn xóa khách hàng này không?");

            if (!confirmed) {
                return;
            }

            try {
                await deleteCustomer(customer.id);
                alert("Xóa khách hàng thành công");

                customerPage.mode = "list";
                customerPage.customerId = null;

                router.navigate("/customers");
            } catch (error) {
                handleApiError(error);
            }
        });
    }
}

// ======================================================
// HISTORY MODAL
// ======================================================

function openCustomerHistoryModal(customerId) {
    const customer = customerState.customers.find((item) => {
        return String(item.id) === String(customerId);
    });

    if (!customer) {
        alert("Không tìm thấy khách hàng");
        return;
    }

    const historyItems = getCustomerHistoryItems(customer);

    const modal = document.createElement("div");

    modal.className = "modal-overlay";

    modal.innerHTML = `
    <div class="modal-card customer-history-modal">
      <div class="modal-header">
        <div>
          <h3>Lịch sử khách hàng</h3>
          <p>${escapeHTML(customer.name)} - ID: ${escapeHTML(customer.id)}</p>
        </div>

        <button type="button" class="modal-close" data-close-modal>
          <i class="fas fa-times"></i>
        </button>
      </div>

      <div class="history-summary">
        <div>
          <span>Email</span>
          <strong>${escapeHTML(customer.email)}</strong>
        </div>

        <div>
          <span>Số điện thoại</span>
          <strong>${escapeHTML(customer.phone)}</strong>
        </div>

        <div>
          <span>Số đơn hàng</span>
          <strong>${Number(customer.orders)}</strong>
        </div>

        <div>
          <span>Tổng chi tiêu</span>
          <strong>${formatCurrency(customer.totalSpent)}</strong>
        </div>
      </div>

      ${
        historyItems.length === 0
            ? `
            <div class="empty-state">
              API hiện chưa trả về lịch sử đơn hàng chi tiết của khách hàng này.
            </div>
          `
            : `
            <table class="history-table">
              <thead>
                <tr>
                  <th>Mã đơn</th>
                  <th>Ngày mua</th>
                  <th>Giá trị</th>
                  <th>Trạng thái</th>
                </tr>
              </thead>

              <tbody>
                ${historyItems
                .map((item) => {
                    return `
                      <tr>
                        <td>${escapeHTML(item.orderId)}</td>
                        <td>${escapeHTML(formatDate(item.date))}</td>
                        <td>${formatCurrency(item.total)}</td>
                        <td>${escapeHTML(item.status)}</td>
                      </tr>
                    `;
                })
                .join("")}
              </tbody>
            </table>
          `
    }
    </div>
  `;

    document.body.appendChild(modal);

    modal.addEventListener("click", (event) => {
        const closeButton = event.target.closest("[data-close-modal]");
        const clickedOverlay = event.target === modal;

        if (closeButton || clickedOverlay) {
            modal.remove();
        }
    });
}

function getCustomerHistoryItems(customer) {
    const rawHistory =
        customer.history ||
        customer.orderHistory ||
        customer.ordersHistory ||
        customer.purchaseHistory ||
        [];

    if (!Array.isArray(rawHistory)) {
        return [];
    }

    return rawHistory.map((item, index) => {
        return {
            orderId: item.orderId || item.id || `ORDER-${index + 1}`,
            date: item.date || item.createdAt || item.created_at || "",
            total: Number(item.total || item.totalAmount || item.amount || 0),
            status: item.status || "Không rõ",
        };
    });
}

// ======================================================
// API ERROR HANDLING
// ======================================================

function isAuthError(error) {
    return error?.response?.status === 401 ||
        error?.response?.status === 403 ||
        error?.status === 401 ||
        error?.status === 403;
}

function handleApiError(error) {
    if (isAuthError(error)) {
        clearToken();
        alert("Phiên đăng nhập hết hạn hoặc không có quyền truy cập. Vui lòng đăng nhập lại.");
        router.navigate("/login");
        return;
    }

    alert(
        error.response?.data?.message ||
        error.message ||
        "Đã có lỗi xảy ra"
    );
}

// ======================================================
// RESPONSE NORMALIZATION
// ======================================================

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
        history:
            customer.history ||
            customer.orderHistory ||
            customer.ordersHistory ||
            customer.purchaseHistory ||
            [],
    };
}

// ======================================================
// FORM HELPERS
// ======================================================

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

function validateCustomerForm(form, data, currentCustomerId = null) {
    clearErrors(form);

    let isValid = true;

    if (!data.name) {
        setError(form, "name", "Tên khách hàng không được rỗng");
        isValid = false;
    }

    if (!isValidEmail(data.email)) {
        setError(form, "email", "Email không hợp lệ");
        isValid = false;
    } else if (isEmailDuplicated(data.email, currentCustomerId)) {
        setError(form, "email", "Email này đã tồn tại");
        isValid = false;
    }

    if (!isValidPhone(data.phone)) {
        setError(form, "phone", "Số điện thoại phải có từ 9 đến 11 chữ số");
        isValid = false;
    } else if (isPhoneDuplicated(data.phone, currentCustomerId)) {
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

    groups.forEach((group) => {
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

// ======================================================
// FILTER / SORT / PAGINATION
// ======================================================

function getFilteredSortedCustomers() {
    const filteredCustomers = getFilteredCustomers();

    return getSortedCustomers(filteredCustomers);
}

function getFilteredCustomers() {
    const searchText = customerState.search;
    const normalizedSearchText = normalizeText(searchText);
    const normalizedSearchPhone = normalizePhone(searchText);

    return customerState.customers.filter((customer) => {
        const name = normalizeText(customer.name);
        const email = normalizeText(customer.email);
        const phoneText = normalizeText(customer.phone);
        const phoneDigits = normalizePhone(customer.phone);

        const tier = getCustomerTier(customer.totalSpent);

        const matchesTextSearch =
            !normalizedSearchText ||
            name.includes(normalizedSearchText) ||
            email.includes(normalizedSearchText) ||
            phoneText.includes(normalizedSearchText);

        const matchesPhoneSearch =
            !normalizedSearchPhone || phoneDigits.includes(normalizedSearchPhone);

        const matchesSearch = matchesTextSearch || matchesPhoneSearch;

        const matchesTier =
            customerState.tier === "all" || tier.value === customerState.tier;

        return matchesSearch && matchesTier;
    });
}

function getSortedCustomers(customers) {
    const clonedCustomers = [...customers];

    clonedCustomers.sort((a, b) => {
        switch (customerState.sort) {
            case "nameAsc":
                return a.name.localeCompare(b.name, "vi", {
                    sensitivity: "base",
                });

            case "totalSpentDesc":
                return Number(b.totalSpent) - Number(a.totalSpent);

            case "ordersDesc":
                return Number(b.orders) - Number(a.orders);

            case "newest":
            default:
                return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        }
    });

    return clonedCustomers;
}

function getPaginatedCustomers(customers) {
    const totalPages = Math.max(
        Math.ceil(customers.length / customerState.pageSize),
        1
    );

    if (customerState.page > totalPages) {
        customerState.page = totalPages;
    }

    const startIndex = (customerState.page - 1) * customerState.pageSize;
    const endIndex = startIndex + customerState.pageSize;

    return customers.slice(startIndex, endIndex);
}

// ======================================================
// DUPLICATE CHECK
// ======================================================

function isEmailDuplicated(email, currentCustomerId = null) {
    const normalizedEmail = normalizeEmail(email);

    return customerState.customers.some((customer) => {
        return (
            normalizeEmail(customer.email) === normalizedEmail &&
            String(customer.id) !== String(currentCustomerId)
        );
    });
}

function isPhoneDuplicated(phone, currentCustomerId = null) {
    const normalizedPhone = normalizePhone(phone);

    return customerState.customers.some((customer) => {
        return (
            normalizePhone(customer.phone) === normalizedPhone &&
            String(customer.id) !== String(currentCustomerId)
        );
    });
}

// ======================================================
// EXPORT PAGE OBJECT
// ======================================================

const customerPage = {
    mode: "list",
    customerId: null,
    render,
    init,
};

export default customerPage;