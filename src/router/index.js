import Navigo from "navigo";

const router = new Navigo("/", {
    linksSelector: "a[data-navigo]",
});

export default router;