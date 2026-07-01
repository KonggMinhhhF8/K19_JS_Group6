// ── Định dạng tiền tệ VND ─────────────────────────────────────────────────
const formatCurrency = (value) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' })
        .format(Math.round(value))
        .replace(/\s?₫/, 'đ');
};

// ── Chuẩn hóa ngày tháng về YYYY-MM-DD ───────────────────────────────────
const normalizeDate = (str) => {
    if (!str) return '';
    if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str;
    const parts = str.split('/');
    if (parts.length === 3) {
        const [d, m, y] = parts;
        return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
    }
    const p = new Date(str);
    return isNaN(p) ? str : p.toISOString().split('T')[0];
};

// ── Render view vào #app ───────────────────────────────────────────────────
const app = document.getElementById('app');
const loadPage = (page) => {
    if (!app) return;
    app.innerHTML = page.render();
    if (page.init) {
        page.init();
    }
};

export { formatCurrency, normalizeDate, loadPage };