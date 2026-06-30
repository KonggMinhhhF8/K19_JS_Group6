import router from "./router";
import loginPage from "./views/login";
import dashboardPage from "./views/dashboard";
import helpers from "./utils/helpers";
import { authGuard } from "./router/guards";



router
    .on("/", () => {
        helpers.loadPage(loginPage)
    })
    .on("/login", () => {
        helpers.loadPage(loginPage)
    })

    .on("/dashboard", () => {
        if (!authGuard()) return;
        helpers.loadPage(dashboardPage)
    })

    .resolve();