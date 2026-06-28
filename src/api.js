const CUSTOMER_STORAGE_KEY = "shopadmin_customers";

const defaultCustomers = [
    {
        id: "CUST-001",
        name: "Nguyễn Anh",
        email: "anh.nguyen@email.com",
        phone: "0912.345.678",
        orders: 25,
        totalSpent: 45200000,
        createdAt: "2026-06-01T08:00:00.000Z",
        updatedAt: "2026-06-01T08:00:00.000Z",
    },
    {
        id: "CUST-002",
        name: "Trần Lan",
        email: "lan.tran@email.com",
        phone: "0988.777.666",
        orders: 12,
        totalSpent: 18500000,
        createdAt: "2026-06-12T08:00:00.000Z",
        updatedAt: "2026-06-12T08:00:00.000Z",
    },
    {
        id: "CUST-003",
        name: "Vũ Duy",
        email: "duy.vu@email.com",
        phone: "0355.999.888",
        orders: 3,
        totalSpent: 2100000,
        createdAt: "2026-05-20T08:00:00.000Z",
        updatedAt: "2026-05-20T08:00:00.000Z",
    },
];

function initCustomers() {
    const rawCustomers = localStorage.getItem(CUSTOMER_STORAGE_KEY);

    if (!rawCustomers) {
        localStorage.setItem(
            CUSTOMER_STORAGE_KEY,
            JSON.stringify(defaultCustomers)
        );
    }
}

function readCustomers() {
    initCustomers();

    try {
        const customers = JSON.parse(localStorage.getItem(CUSTOMER_STORAGE_KEY));

        return Array.isArray(customers) ? customers : [];
    } catch {
        return [];
    }
}

function writeCustomers(customers) {
    localStorage.setItem(CUSTOMER_STORAGE_KEY, JSON.stringify(customers));
}

function generateCustomerId(customers) {
    if (customers.length === 0) {
        return "CUST-001";
    }

    const maxNumber = customers.reduce(function (max, customer) {
        const currentNumber = Number(String(customer.id).replace("CUST-", ""));

        return Number.isNaN(currentNumber)
            ? max
            : Math.max(max, currentNumber);
    }, 0);

    return "CUST-" + String(maxNumber + 1).padStart(3, "0");
}

export function getCustomers() {
    return readCustomers();
}

export function getCustomerById(customerId) {
    const customers = readCustomers();

    return customers.find(function (customer) {
        return customer.id === customerId;
    });
}

export function createCustomer(payload) {
    const customers = readCustomers();
    const now = new Date().toISOString();

    const newCustomer = {
        id: generateCustomerId(customers),
        name: payload.name,
        email: payload.email,
        phone: payload.phone,
        orders: Number(payload.orders),
        totalSpent: Number(payload.totalSpent),
        createdAt: now,
        updatedAt: now,
    };

    customers.push(newCustomer);

    writeCustomers(customers);

    return newCustomer;
}

export function updateCustomer(customerId, payload) {
    const customers = readCustomers();

    const updatedCustomers = customers.map(function (customer) {
        if (customer.id !== customerId) {
            return customer;
        }

        return {
            ...customer,
            name: payload.name,
            email: payload.email,
            phone: payload.phone,
            orders: Number(payload.orders),
            totalSpent: Number(payload.totalSpent),
            updatedAt: new Date().toISOString(),
        };
    });

    writeCustomers(updatedCustomers);

    return getCustomerById(customerId);
}

export function deleteCustomer(customerId) {
    const customers = readCustomers();

    const updatedCustomers = customers.filter(function (customer) {
        return customer.id !== customerId;
    });

    writeCustomers(updatedCustomers);
}

export function resetCustomers() {
    writeCustomers(defaultCustomers);
}