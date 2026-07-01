

const app = document.getElementById('app')
const loadPage = (page) => {
    app.innerHTML = page.render();
    if (page.init) {
        page.init();
    }
}


export default { loadPage };