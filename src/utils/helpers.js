import router from "../router/index.js";

const app = document.getElementById("app");
const sidebar = document.querySelector(".sidebar");

// ======================================================
// SET ACTIVE SIDEBAR
// ======================================================

const setActiveSidebar = () => {
    const currentPath = window.location.pathname;
    const links = document.querySelectorAll(".sidebar a[data-navigo]");

    links.forEach((link) => {
        const listItem = link.closest("li");
        const href = link.getAttribute("href");

        if (!listItem || !href) {
            return;
        }

        listItem.classList.toggle("active", currentPath.startsWith(href));
    });
};

// ======================================================
// LOAD PAGE
// ======================================================
// page cần có format:
// {
//   render: function,
//   init?: function
// }

const loadPage = async (page, showSidebar = true) => {
    if (!app) {
        return;
    }

    if (sidebar) {
        sidebar.style.display = showSidebar ? "flex" : "none";
    }

    app.innerHTML = page.render();

    router.updatePageLinks();
    setActiveSidebar();

    if (page.init) {
        await page.init();
    }

    router.updatePageLinks();
};

export default {
    loadPage,
    setActiveSidebar,
};