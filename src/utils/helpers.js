const app = document.getElementById('app')
const sidebar = document.querySelector(".sidebar");

const loadPage = (page, showSidebar = true) => {
    if (sidebar) {
        sidebar.style.display = showSidebar ? "block" : "none";
    }

    app.innerHTML = page.render();

    if (page.init) {
        page.init();
    }
};


export default { loadPage };