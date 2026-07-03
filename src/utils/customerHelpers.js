// ======================================================
// NORMALIZE HELPERS
// ======================================================

const normalizeEmail = (email) => {
    return String(email).trim().toLowerCase();
};

const normalizeText = (value) => {
    return String(value)
        .toLowerCase()
        .trim()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[\s.\-_]/g, "");
};

const normalizePhone = (phone) => {
    return String(phone).replace(/\D/g, "");
};

// ======================================================
// VALIDATION HELPERS
// ======================================================

const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    return emailRegex.test(email);
};

const isValidPhone = (phone) => {
    const digits = normalizePhone(phone);

    return digits.length >= 9 && digits.length <= 11;
};

// ======================================================
// FORMAT HELPERS
// ======================================================

const formatCurrency = (value) => {
    return new Intl.NumberFormat("vi-VN").format(Number(value) || 0) + "đ";
};

const formatDate = (value) => {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return "Không rõ";
    }

    return new Intl.DateTimeFormat("vi-VN").format(date);
};

// ======================================================
// UI HELPERS
// ======================================================

const debounce = (callback, delay = 300) => {
    let timerId = null;

    return function (...args) {
        clearTimeout(timerId);

        timerId = setTimeout(() => {
            callback(...args);
        }, delay);
    };
};

const escapeHTML = (value) => {
    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
};

const getInitials = (name) => {
    const words = String(name).trim().split(/\s+/);

    if (words.length === 1) {
        return words[0].slice(0, 2).toUpperCase();
    }

    return words
        .map((word) => word[0])
        .join("")
        .slice(0, 2)
        .toUpperCase();
};

// ======================================================
// CUSTOMER TIER
// ======================================================

const getCustomerTier = (totalSpent) => {
    const spent = Number(totalSpent);

    if (spent >= 30000000) {
        return {
            label: "VÀNG",
            className: "gold",
            value: "gold",
        };
    }

    if (spent >= 10000000) {
        return {
            label: "BẠC",
            className: "silver",
            value: "silver",
        };
    }

    return {
        label: "ĐỒNG",
        className: "bronze",
        value: "bronze",
    };
};

const isCurrentMonth = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();

    if (Number.isNaN(date.getTime())) {
        return false;
    }

    return (
        date.getMonth() === now.getMonth() &&
        date.getFullYear() === now.getFullYear()
    );
};

export {
    normalizeEmail,
    normalizeText,
    normalizePhone,
    isValidEmail,
    isValidPhone,
    formatCurrency,
    formatDate,
    debounce,
    escapeHTML,
    getInitials,
    getCustomerTier,
    isCurrentMonth,
};