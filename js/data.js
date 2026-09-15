/* =========================================
   HassleFree Admin - Data Management
   ========================================= */

const StorageKeys = {
    DRIVERS: 'hasslefree_drivers',
    RIDES: 'hasslefree_rides',
    STATS: 'hasslefree_stats',
    REVENUE: 'hasslefree_revenue'
};

// --- Initial Mock Data ---
const INITIAL_DRIVERS = [
    {
        id: 'DVR-001',
        name: 'Rajesh Kumar',
        phone: '+91 98765 43210',
        experience: '8 Years',
        license: 'MH-12-AB-1234',
        status: 'Verified',
        vehicle: 'Swift Dzire'
    },
    {
        id: 'DVR-002',
        name: 'Priya Sharma',
        phone: '+91 87654 32109',
        experience: '5 Years',
        license: 'MH-14-CD-5678',
        status: 'Background Check',
        vehicle: 'Hyundai Aura'
    },
    {
        id: 'DVR-003',
        name: 'Amit Patel',
        phone: '+91 76543 21098',
        experience: '12 Years',
        license: 'GJ-01-EF-9012',
        status: 'Registration Received',
        vehicle: 'Ertiga'
    },
    {
        id: 'DVR-004',
        name: 'Sneha Desai',
        phone: '+91 65432 10987',
        experience: '3 Years',
        license: 'MH-02-GH-3456',
        status: 'Police Verification',
        vehicle: 'Honda Amaze'
    }
];

const INITIAL_RIDES = [
    {
        id: 'RID-1049',
        customer: 'Rahul Verma',
        driver: 'Rajesh Kumar',
        date: '2023-10-27 14:30',
        amount: '₹1,200',
        location: 'Airport to City Center',
        status: 'Completed'
    },
    {
        id: 'RID-1050',
        customer: 'Anjali Gupta',
        driver: 'Sneha Desai',
        date: '2023-10-27 15:45',
        amount: '₹850',
        location: 'Bandra to Juhu',
        status: 'Completed'
    },
    {
        id: 'RID-1051',
        customer: 'Vikram Singh',
        driver: 'Priya Sharma',
        date: '2023-10-27 16:15',
        amount: '₹2,000',
        location: 'Mumbai to Pune',
        status: 'Pending'
    },
    {
        id: 'RID-1052',
        customer: 'Neha Reddy',
        driver: 'Rajesh Kumar',
        date: '2023-10-27 17:00',
        amount: '₹500',
        location: 'Local Trip',
        status: 'Rejected'
    },
    {
        id: 'RID-1053',
        customer: 'Rohan Mehta',
        driver: 'Sneha Desai',
        date: '2023-10-28 09:00',
        amount: '₹1,500',
        location: 'Colaba to Worli',
        status: 'Accepted'
    }
];

// --- Initialization ---
function initData() {
    if (!localStorage.getItem(StorageKeys.DRIVERS)) {
        localStorage.setItem(StorageKeys.DRIVERS, JSON.stringify(INITIAL_DRIVERS));
    }
    if (!localStorage.getItem(StorageKeys.RIDES)) {
        localStorage.setItem(StorageKeys.RIDES, JSON.stringify(INITIAL_RIDES));
    }
    if (!localStorage.getItem(StorageKeys.STATS)) {
        localStorage.setItem(StorageKeys.STATS, JSON.stringify({
            totalDrivers: INITIAL_DRIVERS.length,
            pendingVerifications: 2,
            activeServices: 1,
            monthlyRevenue: 2050
        }));
    }
}

// --- Data Fetching & CRUD ---

// DRIVERS
function getDrivers() {
    return JSON.parse(localStorage.getItem(StorageKeys.DRIVERS)) || [];
}

function saveDrivers(drivers) {
    localStorage.setItem(StorageKeys.DRIVERS, JSON.stringify(drivers));
}

function addDriver(driver) {
    const drivers = getDrivers();
    const newId = `DVR-${String(drivers.length + 1).padStart(3, '0')}`;
    const newDriver = { id: newId, ...driver };
    drivers.push(newDriver);
    saveDrivers(drivers);
    return newDriver;
}

function updateDriver(updatedDriver) {
    const drivers = getDrivers();
    const index = drivers.findIndex(d => d.id === updatedDriver.id);
    if (index !== -1) {
        drivers[index] = { ...drivers[index], ...updatedDriver };
        saveDrivers(drivers);
    }
}

function deleteDriver(id) {
    const drivers = getDrivers();
    const filtered = drivers.filter(d => d.id !== id);
    saveDrivers(filtered);
}

// RIDES
function getRides() {
    return JSON.parse(localStorage.getItem(StorageKeys.RIDES)) || [];
}

function saveRides(rides) {
    localStorage.setItem(StorageKeys.RIDES, JSON.stringify(rides));
}

function addRide(ride) {
    const rides = getRides();
    const newId = `RID-${1000 + rides.length + 1}`;
    const newRide = { id: newId, ...ride };
    rides.push(newRide);
    saveRides(rides);
    return newRide;
}

function updateRide(updatedRide) {
    const rides = getRides();
    const index = rides.findIndex(r => r.id === updatedRide.id);
    if (index !== -1) {
        rides[index] = { ...rides[index], ...updatedRide };
        saveRides(rides);
    }
}

// STATS
function getStats() {
    return JSON.parse(localStorage.getItem(StorageKeys.STATS)) || {
        totalDrivers: 0,
        pendingVerifications: 0,
        activeServices: 0,
        monthlyRevenue: 0
    };
}

// Run init on load
initData();