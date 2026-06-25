const ReportsView = {
    render() {
        return `
            <header>
                <button class="menu-btn" id="menuToggle"><i class="fas fa-bars"></i></button>
                <div class="user"><strong>Admin</strong> <i class="fas fa-user-circle"></i></div>
            </header>
            <section style="padding: 20px;">
                <h2>Báo cáo doanh thu</h2>
                <p>Tính năng này đang được phát triển ở nhánh khác.</p>
            </section>
        `;
    },
    init() {
        console.log('ReportsView initialized');
    }
};

export default ReportsView;
