import Chart from "chart.js/auto";

import { getOrder } from "../services/reportService.js";
import { getProducts } from "../services/productService.js";

let revenueChartInstance = null;
let categoryChartInstance = null;

// ======================================================
// RENDER REPORT PAGE
// ======================================================

const render = () => {
    return `
    <div class="page-header">
      <h2>Báo cáo kinh doanh</h2>

      <div class="filter-group">
        <select>
          <option>Tháng này</option>
          <option>Tháng trước</option>
          <option>Quý này</option>
        </select>

        <input type="date">
      </div>
    </div>

    <section class="stats-grid">
      <div class="stat-card">
        <h4>Doanh thu</h4>
        <div class="value" id="total-revenue">0đ</div>
        <div class="trend up">12% so với tháng trước</div>
      </div>

      <div class="stat-card">
        <h4>Đơn hàng</h4>
        <div class="value" id="total-orders">0</div>
        <div class="trend up">5%</div>
      </div>

      <div class="stat-card">
        <h4>Lợi nhuận</h4>
        <div class="value" id="total-profit">0đ</div>
        <div class="trend down">2%</div>
      </div>

      <div class="stat-card">
        <h4>Khách mới</h4>
        <div class="value" id="total-customers">0</div>
        <div class="trend up">18%</div>
      </div>
    </section>

    <section class="charts-container">
      <div class="chart-box">
        <h3>Biểu đồ doanh thu 7 ngày gần nhất</h3>
        <canvas id="revenueChart"></canvas>
      </div>

      <div class="chart-box">
        <h3>Cơ cấu sản phẩm</h3>
        <canvas id="categoryChart"></canvas>
      </div>
    </section>

    <section class="top-products">
      <h3>Sản phẩm bán chạy nhất</h3>

      <table>
        <thead>
          <tr>
            <th>Sản phẩm</th>
            <th>Số lượng bán</th>
            <th>Doanh thu</th>
            <th>Tình trạng</th>
          </tr>
        </thead>

        <tbody id="top-products-body">
          <tr>
            <td colspan="4" class="empty-state">Đang tải dữ liệu...</td>
          </tr>
        </tbody>
      </table>
    </section>
  `;
};

// ======================================================
// INIT REPORT PAGE
// ======================================================

const init = async () => {
    try {
        const orders = await getOrder();
        const products = await getProducts();

        const safeOrders = Array.isArray(orders) ? orders : [];
        const safeProducts = Array.isArray(products) ? products : [];

        renderReportStats(safeOrders);
        renderTopProducts(safeOrders);
        renderRevenueChart(safeOrders);
        renderCategoryChart(safeProducts);
    } catch (error) {
        console.log(error);
    }
};

// ======================================================
// REPORT HELPERS
// ======================================================

function renderReportStats(orders) {
    const revenue = orders.reduce((sum, order) => {
        return sum + Number(order.amount || 0) * Number(order.product?.price || 0);
    }, 0);

    const totalOrders = orders.length;

    const customers = new Set(
        orders
            .map((order) => order.customer?.id)
            .filter(Boolean)
    );

    const totalCustomers = customers.size;
    const profit = 0;

    document.getElementById("total-revenue").textContent =
        revenue.toLocaleString("vi-VN") + "đ";

    document.getElementById("total-orders").textContent = totalOrders;

    document.getElementById("total-customers").textContent = totalCustomers;

    document.getElementById("total-profit").textContent =
        profit.toLocaleString("vi-VN") + "đ";
}

function renderTopProducts(orders) {
    const productMap = {};

    orders.forEach((order) => {
        const product = order.product;

        if (!product?.id) {
            return;
        }

        const id = product.id;

        if (!productMap[id]) {
            productMap[id] = {
                name: product.name,
                quantity: 0,
                revenue: 0,
                stock: product.remaining || 0,
            };
        }

        productMap[id].quantity += Number(order.amount || 0);
        productMap[id].revenue += Number(order.amount || 0) * Number(product.price || 0);
    });

    const topProducts = Object.values(productMap).sort((a, b) => {
        return b.quantity - a.quantity;
    });

    const tbody = document.getElementById("top-products-body");

    if (!tbody) {
        return;
    }

    if (topProducts.length === 0) {
        tbody.innerHTML = `
      <tr>
        <td colspan="4" class="empty-state">Chưa có dữ liệu sản phẩm</td>
      </tr>
    `;
        return;
    }

    tbody.innerHTML = topProducts
        .slice(0, 3)
        .map((product) => {
            return `
        <tr>
          <td>${product.name}</td>
          <td>${product.quantity}</td>
          <td>${product.revenue.toLocaleString("vi-VN")}đ</td>
          <td>
            <span class="${product.stock > 10 ? "success" : "danger"}">
              ${product.stock > 10 ? "Còn hàng" : "Sắp hết"}
            </span>
          </td>
        </tr>
      `;
        })
        .join("");
}

function renderRevenueChart(orders) {
    const revenueByDate = {};

    orders.forEach((order) => {
        const date = order.date || order.createdAt || "Không rõ";
        const revenue = Number(order.amount || 0) * Number(order.product?.price || 0);

        revenueByDate[date] = (revenueByDate[date] || 0) + revenue;
    });

    const labels = Object.keys(revenueByDate).sort();
    const values = labels.map((date) => revenueByDate[date]);

    const canvas = document.getElementById("revenueChart");

    if (!canvas) {
        return;
    }

    if (revenueChartInstance) {
        revenueChartInstance.destroy();
    }

    revenueChartInstance = new Chart(canvas, {
        type: "line",
        data: {
            labels,
            datasets: [
                {
                    label: "Doanh thu",
                    data: values,
                    borderColor: "#3498db",
                    backgroundColor: "rgba(52,152,219,.15)",
                    fill: true,
                    tension: 0.4,
                },
            ],
        },
    });
}

function renderCategoryChart(products) {
    const categoryMap = {};

    products.forEach((product) => {
        const categoryName = product.category?.name || "Khác";

        categoryMap[categoryName] = (categoryMap[categoryName] || 0) + 1;
    });

    const categoryLabels = Object.keys(categoryMap);
    const categoryValues = Object.values(categoryMap);

    const canvas = document.getElementById("categoryChart");

    if (!canvas) {
        return;
    }

    if (categoryChartInstance) {
        categoryChartInstance.destroy();
    }

    categoryChartInstance = new Chart(canvas, {
        type: "doughnut",
        data: {
            labels: categoryLabels,
            datasets: [
                {
                    data: categoryValues,
                    backgroundColor: [
                        "#3498db",
                        "#2ecc71",
                        "#f1c40f",
                        "#9b59b6",
                        "#e74c3c",
                        "#1abc9c",
                        "#34495e",
                    ],
                },
            ],
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: "bottom",
                },
            },
        },
    });
}

export default {
    render,
    init,
};