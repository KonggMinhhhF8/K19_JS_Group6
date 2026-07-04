// src/views/customers.js
import customerService from '../services/customerService.js';
import orderService from '../services/orderService.js';
import { formatCurrency, removeVietnameseTones } from '../utils/helpers.js';

let allCustomers = [];
let allOrders = [];
let searchQuery = '';
let selectedTier = 'all';
let editingCustomerId = null;

// Lấy chữ cái đầu làm Avatar tạm thời
const getInitials = (name) => {
    if (!name) return 'NA';
    return name.trim().split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
};

// ==========================================================================
// LOGIC CẬP NHẬT: Tự động loại trừ đơn hủy khỏi tổng số đơn và chi tiêu
// ==========================================================================
const calculateCustomerStats = (customer, orders) => {
    // 1. Lọc ra toàn bộ đơn hàng của khách hàng này
    const customerOrders = orders.filter(o => String(o.customer?.id) === String(customer.id));

    // 2. CẬP NHẬT: Chỉ đếm các đơn hàng KHÔNG bị hủy (pending, approved, delivering, done)
    const validOrders = customerOrders.filter(o => o.status !== 'cancel');

    // 3. Tổng chi tiêu chỉ tính dựa trên các đơn hàng đã hoàn thành công ('done')
    const doneOrders = customerOrders.filter(o => o.status === 'done');
    const totalSpent = doneOrders.reduce((sum, o) => {
        const price = o.product?.price ?? 0;
        return sum + (price * (o.amount || 1));
    }, 0);

    // Tự động phân hạng danh mục dựa trên chi tiêu thực tế (đơn hoàn thành)
    let tierLabel = 'ĐỒNG';
    let tierClass = 'bronze';
    if (totalSpent >= 30000000) {
        tierLabel = 'VÀNG';
        tierClass = 'gold';
    } else if (totalSpent >= 10000000) {
        tierLabel = 'BẠC';
        tierClass = 'silver';
    }

    return {
        orderCount: validOrders.length, // Trả về số lượng đơn hàng hợp lệ (đã trừ đơn hủy)
        totalSpent,
        tierLabel,
        tierClass
    };
};

const CustomersView = {
    render() {
        return `
            <header>
                <div class="search-bar">
                    <input type="text" id="customerSearchInput" placeholder="Tìm tên, email hoặc số điện thoại...">
                </div>
                <button class="btn-add" id="btnOpenCustomerModal">
                    <i class="fas fa-user-plus"></i> Thêm khách hàng
                </button>
            </header>

            <section class="stats" id="customerStatsArea">
                </section>

            <section class="table-container">
                <div class="table-header">
                    <h3>Danh sách khách hàng</h3>
                    <div class="filters">
                        <select id="customerTierFilter">
                            <option value="all">Hạng: Tất cả</option>
                            <option value="gold">Hạng: Vàng</option>
                            <option value="silver">Hạng: Bạc</option>
                            <option value="bronze">Hạng: Đồng</option>
                        </select>
                    </div>
                </div>
                
                <div class="table-wrapper">
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
                                    <i class="fas fa-spinner fa-spin"></i> Đang tải dữ liệu...
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </section>

            <div id="customerModal" class="modal">
                <div class="modal-content">
                    <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid var(--border); padding-bottom:15px; margin-bottom:20px;">
                        <h3 id="modalTitle" style="margin:0; font-size: 1.2rem; color: var(--dark-color);">Thêm khách hàng</h3>
                        <button id="btnCloseModal" style="background:none; border:none; font-size:1.5rem; cursor:pointer; color:var(--text-muted);">&times;</button>
                    </div>
                    <form id="customerForm">
                        <div class="form-group">
                            <label>Họ và tên</label>
                            <input type="text" id="cName" required placeholder="Ví dụ: Nguyễn Văn A">
                        </div>
                        <div class="form-group">
                            <label>Email</label>
                            <input type="email" id="cEmail" required placeholder="name@email.com">
                        </div>
                        <div class="form-group">
                            <label>Số điện thoại</label>
                            <input type="text" id="cPhone" required placeholder="0912345xxx">
                        </div>
                        <div class="form-actions">
                            <button type="button" class="btn-cancel" id="btnCancelModal">Hủy</button>
                            <button type="submit" class="btn-save" id="btnSaveCustomer">
                                <i class="fas fa-save"></i> Lưu
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        `;
    },

    async init() {
        document.getElementById('customerSearchInput')?.addEventListener('input', (e) => {
            searchQuery = e.target.value;
            this.filterAndRender();
        });

        document.getElementById('customerTierFilter')?.addEventListener('change', (e) => {
            selectedTier = e.target.value;
            this.filterAndRender();
        });

        document.getElementById('btnOpenCustomerModal')?.addEventListener('click', () => this.openModal());
        document.getElementById('btnCloseModal')?.addEventListener('click', () => this.closeModal());
        document.getElementById('btnCancelModal')?.addEventListener('click', () => this.closeModal());
        document.getElementById('customerForm')?.addEventListener('submit', (e) => this.handleSaveCustomer(e));

        document.getElementById('customerTableBody')?.addEventListener('click', (e) => {
            const btnEdit = e.target.closest('.btn-icon.edit');
            const btnDelete = e.target.closest('.btn-icon.delete');

            if (btnEdit) {
                this.openModal(btnEdit.dataset.id);
            } else if (btnDelete) {
                this.handleDeleteCustomer(btnDelete.dataset.id);
            }
        });

        await this.loadInitialData();
    },

    async loadInitialData() {
        try {
            const [customers, orders] = await Promise.all([
                customerService.getAll().catch(() => []),
                orderService.getAll().catch(() => [])
            ]);

            allCustomers = customers;
            allOrders = orders;

            this.filterAndRender();
        } catch (e) {
            console.error("Lỗi khởi tạo dữ liệu trang Khách hàng:", e);
        }
    },

    filterAndRender() {
        const tbody = document.getElementById('customerTableBody');
        const statsArea = document.getElementById('customerStatsArea');
        if (!tbody || !statsArea) return;

        const processedList = allCustomers.map(c => ({ ...c, stats: calculateCustomerStats(c, allOrders) }));
        const goldCount = processedList.filter(c => c.stats.tierClass === 'gold').length;
        const totalRevenue = processedList.reduce((sum, c) => sum + c.stats.totalSpent, 0);

        statsArea.innerHTML = `
            <div class="card">
                <h3>Tổng khách hàng</h3><p>${allCustomers.length}</p>
            </div>
            <div class="card green">
                <h3>Khách VIP (Vàng)</h3><p style="color:var(--gold);">${goldCount}</p>
            </div>
            <div class="card blue">
                <h3>Doanh thu LTV</h3><p style="color:var(--info);">${formatCurrency(totalRevenue)}</p>
            </div>
        `;

        let filtered = processedList;
        const q = removeVietnameseTones(searchQuery.trim().toLowerCase());

        if (q) {
            filtered = filtered.filter(c =>
                removeVietnameseTones(c.name.toLowerCase()).includes(q) ||
                (c.email && c.email.toLowerCase().includes(q)) ||
                (c.phone && c.phone.includes(q))
            );
        }

        if (selectedTier !== 'all') {
            filtered = filtered.filter(c => c.stats.tierClass === selectedTier);
        }

        tbody.innerHTML = '';
        if (filtered.length === 0) {
            tbody.innerHTML = `<tr><td colspan="6" class="empty-state">Không tìm thấy khách hàng nào.</td></tr>`;
            return;
        }

        const bgColors = ['#ebf5fb', '#fdf2e9', '#f4f6f7', '#e8f5e9'];
        const textColors = ['#3498db', '#e67e22', '#7f8c8d', '#27ae60'];

        filtered.forEach((customer, index) => {
            const stats = customer.stats;
            const rand = index % 4;

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>
                    <div class="cust-info">
                        <div class="avatar" style="background: ${bgColors[rand]}; color: ${textColors[rand]};">${getInitials(customer.name)}</div>
                        <div>
                            <strong>${customer.name}</strong><br>
                            <small>ID: CUST-${customer.id}</small>
                        </div>
                    </div>
                </td>
                <td>${customer.email || '—'}<br><small>${customer.phone || '—'}</small></td>
                <td><span class="tier ${stats.tierClass}">${stats.tierLabel}</span></td>
                <td>${stats.orderCount}</td>
                <td style="font-weight: 600; color: var(--dark-color);">${formatCurrency(stats.totalSpent)}</td>
                <td>
                    <button class="btn-icon edit" data-id="${customer.id}" title="Sửa"><i class="fas fa-user-edit"></i></button>
                    <button class="btn-icon delete" data-id="${customer.id}" title="Xóa" style="color: var(--danger);"><i class="fas fa-trash"></i></button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    },

    openModal(id = null) {
        editingCustomerId = id;
        document.getElementById('modalTitle').textContent = id ? 'Chỉnh sửa khách hàng' : 'Thêm khách hàng mới';

        const nameInput = document.getElementById('cName');
        const emailInput = document.getElementById('cEmail');
        const phoneInput = document.getElementById('cPhone');

        if (id) {
            const customer = allCustomers.find(c => String(c.id) === String(id));
            if (customer) {
                nameInput.value = customer.name || '';
                emailInput.value = customer.email || '';
                phoneInput.value = customer.phone || '';
            }
        } else {
            nameInput.value = '';
            emailInput.value = '';
            phoneInput.value = '';
        }

        document.getElementById('customerModal').style.display = 'flex';
    },

    closeModal() {
        document.getElementById('customerModal').style.display = 'none';
        editingCustomerId = null;
    },

    async handleSaveCustomer(e) {
        e.preventDefault();
        const btnSave = document.getElementById('btnSaveCustomer');
        btnSave.disabled = true;
        btnSave.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Đang lưu...';

        const payload = {
            name: document.getElementById('cName').value.trim(),
            email: document.getElementById('cEmail').value.trim(),
            phone: document.getElementById('cPhone').value.trim()
        };

        try {
            if (editingCustomerId) {
                await customerService.update(editingCustomerId, payload);
            } else {
                await customerService.create(payload);
            }

            allCustomers = await customerService.getAll(true);
            this.filterAndRender();
            this.closeModal();
            alert('Lưu thông tin thành công!');
        } catch (error) {
            alert('Lỗi lưu dữ liệu. Vui lòng thử lại!');
        } finally {
            btnSave.disabled = false;
            btnSave.innerHTML = '<i class="fas fa-save"></i> Lưu';
        }
    },

    async handleDeleteCustomer(id) {
        // Kiểm tra ràng buộc: xem khách hàng có đơn hàng NÀO KHÔNG BỊ HỦY không
        // (Nếu chỉ có toàn đơn hủy thì hệ thống vẫn hỗ trợ xóa nếu backend cho phép)
        const hasActiveOrders = allOrders.some(order => String(order.customer?.id) === String(id) && order.status !== 'cancel');

        if (hasActiveOrders) {
            alert('CẢNH BÁO: Không thể xóa khách hàng này vì họ đã có lịch sử mua hàng tích cực trong hệ thống. Hệ thống cần giữ lại dữ liệu đối soát!');
            return;
        }

        if (!confirm('Bạn có chắc chắn muốn xóa khách hàng này?')) return;

        try {
            await customerService.remove(id);
            allCustomers = await customerService.getAll(true);
            this.filterAndRender();
            alert('Đã xóa thành công!');
        } catch (error) {
            const errorMsg = error.response?.data?.message || 'Không thể xóa khách hàng. Thao tác bị từ chối từ máy chủ dữ liệu!';
            alert(errorMsg);
        }
    }
};

export default CustomersView;