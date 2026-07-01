
import { getProducts } from "../services/productService";

const render = () => {
    return `
         <div class="page-header">
      <h2>Tổng quan</h2>
    </div>

    <section class="card">
      <h3>Dashboard</h3>
      <p>Trang này của thành viên khác.</p>
    </section>
    `;
};

const init = async () => {
    try {
        const products = await getProducts();
        console.log(products);
    } catch (error) {
        console.log(error);
    }
};

export default {
    render,
    init
};