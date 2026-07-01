import router from '../router/index.js'
import api from '../services/api.js'
import { refresh } from '../services/refreshService.js'
import Login from '../views/login.js'
import { logout } from '../services/authService.js'
import { getAccessToken, getRefreshToken, clearToken, saveToken } from '../utils/tokenStorage.js'

const API_URLS = {
    PRODUCTS: '/products',
    CATEGORIES: '/categories'
}


// Get products data
let allProducts = []
let uniqueCategories = []
let isDataFetched = false

const extractCategories = (products) => {
    const catMap = new Map()
    products.forEach(p => {
        if (p.category && p.category.id) catMap.set(p.category.id, p.category.name)
    })
    return Array.from(catMap, ([id, name]) => ({ id, name }))
}

const apiProducts = {
    getAll: async () => {
        try {
            const { data } = await api.get(API_URLS.PRODUCTS)
            const products = Array.isArray(data) ? data : (data.data || [])
            allProducts = products
            uniqueCategories = extractCategories(products)
            isDataFetched = true
            return products
        } catch (e) { throw e }
    },
    getById: async (id) => (await api.get(`${API_URLS.PRODUCTS}/${id}`)).data,
    create: async (payload) => await api.post(API_URLS.PRODUCTS, payload),
    update: async (id, payload) => await api.put(`${API_URLS.PRODUCTS}/${id}`, payload),
    delete: async (id) => await api.delete(`${API_URLS.PRODUCTS}/${id}`)
}


// Render DOM
const sidebarData = [
    { icon: 'fas fa-home', text: 'Tổng quan', path: '/dashboard' },
    { icon: 'fas fa-box', text: 'Sản phẩm', path: '/products' },
    { icon: 'fas fa-shopping-cart', text: 'Đơn hàng', path: '/orders' },
    { icon: 'fas fa-users', text: 'Khách hàng', path: '/customers' },
    { icon: 'fas fa-chart-line', text: 'Báo cáo', path: '/reports' }
]

const renderAdminLayout = () => {
    const appContainer = document.querySelector('.container')
    if (!document.getElementById('sidebar') || !getMainContent()) {
        appContainer.innerHTML = `<aside class="sidebar" id="sidebar"></aside><main class="main-content"></main>`
        renderSidebar(sidebarData, 'ShopAdmin')
    }
}

const getMainContent = () => document.querySelector('.main-content')

const renderSidebar = (data, name) => {
    const sidebar = document.getElementById('sidebar')
    if (!sidebar) return

    sidebar.style.display = 'flex'
    sidebar.style.flexDirection = 'column'
    sidebar.style.justifyContent = 'space-between'

    sidebar.innerHTML = `
        <div>
            <h2>${name}</h2>
            <ul>
                ${data.map(item => `<li data-path="${item.path}"><i class="${item.icon}"></i> ${item.text}</li>`).join('')}
            </ul>
        </div>
        
        <div class="sidebar-footer" style="margin-top: 20px; padding-top: 20px; border-top: 1px solid rgba(255,255,255,0.1);">
            <button id="btnLogout" style="width: 100%; padding: 12px; background-color: #ef4444; color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 600; display: flex; align-items: center; justify-content: center; gap: 8px; transition: 0.2s;">
                <i class="fas fa-sign-out-alt"></i> Đăng xuất
            </button>
        </div>
    `

    sidebar.querySelector('ul')?.addEventListener('click', (e) => {
        const li = e.target.closest('li')
        if (li && li.dataset.path) router.navigate(li.dataset.path)
    })

    const btnLogout = document.getElementById('btnLogout')
    if (btnLogout) {
        btnLogout.addEventListener('mouseover', () => btnLogout.style.backgroundColor = '#dc2626')
        btnLogout.addEventListener('mouseout', () => btnLogout.style.backgroundColor = '#ef4444')

        btnLogout.addEventListener('click', () => {
            if (confirm('Bạn có chắc chắn muốn đăng xuất khỏi hệ thống?')) {
                logout()
                router.navigate('/login')
            }
        })
    }
}

const updateSidebarActiveState = (currentPath) => {
    document.querySelectorAll('#sidebar ul li').forEach(li => {
        const tabPath = li.getAttribute('data-path')
        const isActive = tabPath === '/dashboard' ? currentPath === '/dashboard' : currentPath.startsWith(tabPath)
        li.classList.toggle('active', isActive)
    })
}


// Router hook
router.hooks({
    before: async (done, match) => {
        if (match.url === 'login') {
            done()
            return
        }

        let token = getAccessToken()
        const rToken = getRefreshToken()

        if (!token && rToken) {
            try {
                const response = await refresh(rToken)
                saveToken({
                    accessToken: response.accessToken || response,
                    refreshToken: response.refreshToken || rToken
                })

                token = getAccessToken()
            } catch (error) {
                console.error("Refresh token ngầm thất bại:", error)
                clearToken()
                router.navigate('/login')
                done(false)
                return
            }
        }

        if (token) {
            renderAdminLayout()
            done()
        } else {
            clearToken()
            router.navigate('/login')
            done(false)
        }
    }
})


// Navigation
router.on('/dashboard', () => {
    renderAdminLayout()
    updateSidebarActiveState('/dashboard')
    renderEmptyPage('Tổng quan Dashboard')
})

router.on('/products/add', () => {
    updateSidebarActiveState('/products/add')
    if (!isDataFetched) {
        apiProducts.getAll().then(() => renderProductFormPage(null))
    } else {
        renderProductFormPage(null)
    }
})

router.on('/products/edit/:id', async (match) => {
    updateSidebarActiveState('/products/edit')
    const mainContent = getMainContent()
    if (mainContent) mainContent.innerHTML = '<div style="padding:40px; text-align:center;"><i class="fas fa-spinner fa-spin fa-2x"></i></div>'

    try {
        if (!isDataFetched) await apiProducts.getAll()
        const productData = await apiProducts.getById(match?.data?.id)
        if (productData) renderProductFormPage(productData)
    } catch (e) {
        if (mainContent) mainContent.innerHTML = '<div style="padding:40px;color:red;">Không tìm thấy sản phẩm!</div>'
    }
})

router.on('/products', async () => {
    updateSidebarActiveState('/products')
    renderProductsLayout()

    if (isDataFetched && allProducts.length >= 0) {
        renderProductTableData(allProducts)
        return
    }

    const tbody = document.getElementById('productTableBody')
    if (tbody) tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding:40px;"><i class="fas fa-spinner fa-spin fa-2x" style="color:var(--primary);"></i></td></tr>'

    try {
        await apiProducts.getAll()
        renderProductTableData(allProducts)
    } catch (e) {
        if (tbody) tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: red;">Lỗi tải dữ liệu.</td></tr>'
    }
})

router.on('/orders', () => {
    updateSidebarActiveState('/orders')
    renderEmptyPage('Quản lý Đơn hàng')
})

router.on('/customers', () => {
    updateSidebarActiveState('/customers')
    renderEmptyPage('Quản lý Khách hàng')
})

router.on('/reports', () => {
    updateSidebarActiveState('/reports')
    renderEmptyPage('Báo cáo thống kê')
})

router.on("/login", () => {
    const appContainer = document.querySelector('.container')
    appContainer.innerHTML = Login.render()
    if (Login.init) Login.init()
})



// Render products layout
const renderProductsLayout = () => {
    const mainContent = getMainContent()
    if (!mainContent) return

    mainContent.innerHTML = `
        <header>
          <div class="search-bar"><input type="text" id="searchInput" placeholder="Tìm tên sản phẩm, mã SKU..."></div>
          <div class="user-actions"><button class="btn-add" id="btnAddProduct"><i class="fas fa-plus"></i> Thêm sản phẩm</button></div>
        </header>
        <section class="stats" id="statsArea"></section>
        <section class="table-container">
          <div class="table-header" style="display: flex; justify-content: space-between; align-items: center;">
            <h3>Danh mục sản phẩm</h3>
            <div class="filters">
                <select id="categoryFilter" style="padding: 6px 12px; border-radius: 6px; border: 1px solid var(--border);">
                    <option value="all">Tất cả danh mục</option>
                </select>
            </div>
          </div>
          <table>
            <thead><tr><th>Hình</th><th>Thông tin sản phẩm</th><th>Danh mục</th><th>Giá bán</th><th>Tồn kho</th><th>Thao tác</th></tr></thead>
            <tbody id="productTableBody"></tbody>
          </table>
        </section>
    `
    document.getElementById('btnAddProduct').addEventListener('click', () => router.navigate('/products/add'))
    document.getElementById('searchInput').addEventListener('input', handleFilterAndSearch)
    document.getElementById('categoryFilter').addEventListener('change', handleFilterAndSearch)
    document.getElementById('productTableBody').addEventListener('click', handleTableClicks)
}

const renderProductTableData = (products) => {
    const tbody = document.getElementById('productTableBody')
    const statsArea = document.getElementById('statsArea')
    const categoryFilter = document.getElementById('categoryFilter')
    if (!tbody || !statsArea) return

    statsArea.innerHTML = `
        <div class="card"><h3>Tổng sản phẩm</h3><p>${allProducts.length}</p></div>
        <div class="card"><h3>Sắp hết hàng</h3><p style="color: #e74c3c;">${allProducts.filter(p => p.remaining < 15).length}</p></div>
        <div class="card"><h3>Danh mục</h3><p style="color: #2563eb;">${uniqueCategories.length}</p></div>
    `
    if (categoryFilter.options.length <= 1) {
        categoryFilter.innerHTML = `<option value="all">Tất cả danh mục</option>` + uniqueCategories.map(c => `<option value="${c.id}">${c.name}</option>`).join('')
    }
    tbody.innerHTML = products.length === 0 ? `<tr><td colspan="6" style="text-align: center; padding: 20px;">Không tìm thấy sản phẩm nào.</td></tr>` : products.map(p => `
        <tr>
          <td><img src="${p.imageUrl || 'https://placehold.co/50x50?text=No+Image'}" style="width:50px; height:50px; object-fit:cover; border-radius:4px; border:1px solid #e5e7eb;"></td>
          <td><strong>${p.name}</strong><br><small style="color: #6b7280;">SKU: ${p.sku || 'N/A'}</small></td>
          <td><span style="background: #eff6ff; color: #2563eb; padding: 4px 8px; border-radius: 4px; font-size: 12px;">${p.category?.name || 'Chưa phân loại'}</span></td>
          <td style="font-weight: 500;">${Number(p.price).toLocaleString('vi-VN')}đ</td>
          <td><span style="color: ${p.remaining < 15 ? '#e74c3c' : 'inherit'}; font-weight: ${p.remaining < 15 ? 'bold' : 'normal'}">${p.remaining}</span></td>
          <td>
            <button class="btn-icon edit" data-id="${p.id}"><i class="fas fa-edit"></i></button>
            <button class="btn-icon delete" data-id="${p.id}"><i class="fas fa-trash"></i></button>
          </td>
        </tr>
    `).join('')
}

const handleFilterAndSearch = () => {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase()
    const selectedCat = document.getElementById('categoryFilter').value
    const filtered = allProducts.filter(p => {
        const matchSearch = p.name.toLowerCase().includes(searchTerm) || (p.sku && p.sku.toLowerCase().includes(searchTerm))
        const matchCat = selectedCat === 'all' || p.category?.id.toString() === selectedCat
        return matchSearch && matchCat
    })
    renderProductTableData(filtered)
}

const handleTableClicks = async (e) => {
    const btnEdit = e.target.closest('.btn-icon.edit')
    const btnDelete = e.target.closest('.btn-icon.delete')

    if (btnEdit) router.navigate(`/products/edit/${btnEdit.dataset.id}`)
    if (btnDelete) {
        if (confirm('Bạn có chắc chắn muốn xóa?')) {
            try {
                btnDelete.innerHTML = '<i class="fas fa-spinner fa-spin"></i>'
                await apiProducts.delete(btnDelete.dataset.id)
                alert('Đã xóa thành công!')
                isDataFetched = false
                await apiProducts.getAll()
                handleFilterAndSearch()
            } catch (error) {
                alert('Xóa thất bại! Lỗi server.')
                btnDelete.innerHTML = '<i class="fas fa-trash"></i>'
            }
        }
    }
}

const renderProductFormPage = (product = null) => {
    const mainContent = getMainContent()
    if (!mainContent) return
    const isEdit = !!product
    const formVals = {
        name: product?.name || '', description: product?.description || '', price: product?.price || '',
        costPrice: product?.costPrice || '', remaining: product?.remaining || '', sku: product?.sku || '',
        categoryId: product?.category?.id || '', imageUrl: product?.imageUrl || ''
    }

    const categoryOptions = uniqueCategories.map(c => `<option value="${c.id}" ${formVals.categoryId === c.id ? 'selected' : ''}>${c.name}</option>`).join('')

    mainContent.innerHTML = `
        <div class="header-actions">
          <a href="javascript:void(0)" id="btnBack" class="btn-back"><i class="fas fa-arrow-left"></i> Quay lại</a>
          <h2>${isEdit ? 'Chỉnh sửa sản phẩm' : 'Thêm sản phẩm mới'}</h2>
        </div>
        <form id="productForm" data-mode="${isEdit ? 'edit' : 'add'}" data-id="${product?.id || ''}">
          <div class="product-grid">
            <div class="left-col">
              <div class="form-card">
                <h3>Thông tin chung</h3>
                <div class="form-group"><label>Tên sản phẩm</label><input type="text" id="fName" required value="${formVals.name}"></div>
                <div class="form-group"><label>Mô tả</label><textarea id="fDescription" rows="5">${formVals.description}</textarea></div>
              </div>
              <div class="form-card">
                <h3>Giá cả & Kho hàng</h3>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                  <div class="form-group"><label>Giá bán (VNĐ)</label><input type="number" id="fPrice" required value="${formVals.price}"></div>
                  <div class="form-group"><label>Giá vốn (VNĐ)</label><input type="number" id="fCostPrice" value="${formVals.costPrice}"></div>
                  <div class="form-group"><label>Mã SKU</label><input type="text" id="fSku" value="${formVals.sku}"></div>
                  <div class="form-group"><label>Tồn kho</label><input type="number" id="fRemaining" required value="${formVals.remaining}"></div>
                </div>
              </div>
            </div>
            <div class="right-col">
              <div class="form-card">
                <h3>Hình ảnh sản phẩm</h3>
                <div class="image-upload" id="uploadArea" style="cursor: pointer;">
                  <i class="fas fa-cloud-upload-alt"></i><p>Tải ảnh lên</p>
                  <input type="file" id="fileInput" hidden accept="image/*">
                  <img id="imgPreview" class="preview-img" src="${formVals.imageUrl || '#'}" style="display: ${formVals.imageUrl ? 'block' : 'none'}; max-width: 100%; border-radius: 6px;">
                </div>
              </div>
              <div class="form-card">
                <h3>Phân loại</h3>
                <div class="form-group">
                  <label>Danh mục</label>
                  <div style="display: flex; gap: 8px;">
                    <select id="fCategoryId" required style="flex: 1; padding: 8px;">
                      <option value="" disabled ${!formVals.categoryId ? 'selected' : ''}>Chọn danh mục...</option>
                      ${categoryOptions}
                    </select>
                    <button type="button" id="btnToggleNewCat" class="btn" style="padding: 0 12px; background: #e2e8f0; border-radius: 6px;"><i class="fas fa-plus"></i></button>
                  </div>
                </div>
                <div class="form-group" id="newCategoryArea" style="display: none; background: #f8fafc; padding: 12px; border-radius: 6px; border: 1px dashed #cbd5e1; margin-top: 10px;">
                    <div style="display: flex; gap: 6px; margin-top: 4px;">
                        <input type="text" id="fNewCategoryName" placeholder="Tên danh mục..." style="padding: 6px; flex: 1;">
                        <button type="button" id="btnSaveQuickCategory" style="padding: 6px 12px; background: #2563eb; color: #fff; border: none; border-radius: 4px;">Tạo</button>
                    </div>
                </div>
              </div>
            </div>
          </div>
          <div class="form-footer">
            <button type="button" class="btn btn-cancel" id="btnCancel">Hủy bỏ</button>
            <button type="submit" class="btn btn-save" id="btnSubmitForm"><i class="fas fa-save"></i> Lưu</button>
          </div>
        </form>
    `
    setupProductFormEvents()
}

const setupProductFormEvents = () => {
    const goBack = () => router.navigate('/products')
    document.getElementById('btnBack')?.addEventListener('click', goBack)
    document.getElementById('btnCancel')?.addEventListener('click', goBack)

    const btnToggleNewCat = document.getElementById('btnToggleNewCat')
    const newCategoryArea = document.getElementById('newCategoryArea')
    const btnSaveQuickCategory = document.getElementById('btnSaveQuickCategory')
    const fNewCategoryName = document.getElementById('fNewCategoryName')
    const fCategoryId = document.getElementById('fCategoryId')

    btnToggleNewCat?.addEventListener('click', () => {
        newCategoryArea.style.display = newCategoryArea.style.display === 'none' ? 'block' : 'none'
        if (newCategoryArea.style.display === 'block') fNewCategoryName.focus()
    })

    btnSaveQuickCategory?.addEventListener('click', async () => {
        const catName = fNewCategoryName.value.trim()
        if (!catName) return alert('Vui lòng nhập tên danh mục!')

        try {
            btnSaveQuickCategory.disabled = true; btnSaveQuickCategory.innerText = '...'
            const response = await api.post(API_URLS.CATEGORIES, { name: catName })
            const createdCategory = response.data?.data || response.data || { id: Date.now(), name: catName }

            uniqueCategories.push(createdCategory)
            const newOpt = document.createElement('option')
            newOpt.value = createdCategory.id; newOpt.textContent = createdCategory.name; newOpt.selected = true
            fCategoryId.appendChild(newOpt)

            fNewCategoryName.value = ''; newCategoryArea.style.display = 'none'
        } catch (err) {
            console.error(err)
            alert('Lỗi API tạo danh mục.')
        } finally {
            btnSaveQuickCategory.disabled = false; btnSaveQuickCategory.innerText = 'Tạo'
        }
    })

    const uploadArea = document.getElementById('uploadArea')
    const fileInput = document.getElementById('fileInput')
    const imgPreview = document.getElementById('imgPreview')

    uploadArea?.addEventListener('click', () => fileInput.click())
    fileInput?.addEventListener('change', (e) => {
        const file = e.target.files[0]
        if (file) {
            const reader = new FileReader()
            reader.onload = (event) => { imgPreview.src = event.target.result; imgPreview.style.display = 'block' }
            reader.readAsDataURL(file)
        }
    })

    document.getElementById('productForm')?.addEventListener('submit', async (e) => {
        e.preventDefault()
        const mode = e.target.dataset.mode; const id = e.target.dataset.id
        const btnSubmit = document.getElementById('btnSubmitForm')
        btnSubmit.disabled = true; btnSubmit.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Đang xử lý...'

        const payload = {
            categoryId: Number(document.getElementById('fCategoryId').value),
            imageId: "", name: document.getElementById('fName').value,
            sku: document.getElementById('fSku').value || "", price: Number(document.getElementById('fPrice').value),
            remaining: Number(document.getElementById('fRemaining').value)
        }

        try {
            if (mode === 'edit') await apiProducts.update(id, payload)
            else await apiProducts.create(payload)
            isDataFetched = false
            router.navigate('/products')
        } catch (error) {
            alert(`Lỗi! (${error.response?.status || 'Network Error'})`)
            btnSubmit.disabled = false; btnSubmit.innerHTML = `<i class="fas fa-save"></i> Thử lại`
        }
    })
}

// Empty pages (waiting for merging)
const renderEmptyPage = (title) => {
    const mainContent = getMainContent()
    if (!mainContent) return
    mainContent.innerHTML = `
        <div style="padding: 40px;">
            <h2>${title}</h2>
            <div style="margin-top: 20px; padding: 40px; text-align: center; color: #666;">
                <i class="fas fa-tools fa-3x" style="margin-bottom: 16px; color: #cbd5e1;"></i>
                <p>Nội dung <strong>${title}</strong> đang được xây dựng...</p>
            </div>
        </div>
    `
}


const initApp = () => {
    router.resolve()
}

initApp()