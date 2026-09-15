document.addEventListener('DOMContentLoaded', () => {

    /* =========================================
       DOM Elements
       ========================================= */
    const sidebar = document.getElementById('sidebar');
    const menuToggle = document.getElementById('menuToggle');
    const closeSidebar = document.getElementById('closeSidebar');
    const navLinks = document.querySelectorAll('.nav-link[data-view]');
    const viewSections = document.querySelectorAll('.view-section');

    const dashboardStats = document.getElementById('dashboardStats');
    const driversTableBody = document.getElementById('driversTableBody');
    const ridesTableBody = document.getElementById('ridesTableBody');

    // Modal Elements
    const driverModal = document.getElementById('driverModal');
    const addDriverBtn = document.getElementById('addDriverBtn');
    const closeModalBtns = document.querySelectorAll('.close-modal-btn, #cancelModalBtn');
    const driverForm = document.getElementById('driverForm');
    const modalTitle = document.getElementById('modalTitle');

    // Form Inputs
    const driverIdInput = document.getElementById('driverId');
    const driverNameInput = document.getElementById('driverName');
    const driverPhoneInput = document.getElementById('driverPhone');
    const driverExperienceInput = document.getElementById('driverExperience');
    const driverLicenseInput = document.getElementById('driverLicense');
    const driverStatusInput = document.getElementById('driverStatus');

    // Filters
    const searchDriverInput = document.getElementById('searchDriverInput');
    const filterDriverStatus = document.getElementById('filterDriverStatus');

    /* =========================================
       Navigation & Layout
       ========================================= */

    // --- Mobile Sidebar & Overlay Logic ---
    const sidebarOverlay = document.getElementById('sidebarOverlay');

    function openSidebar() {
        sidebar.classList.add('active');
        sidebarOverlay.style.display = 'block';
        requestAnimationFrame(() => sidebarOverlay.classList.add('active'));
        document.body.style.overflow = 'hidden';
    }

    function closeSidebarFn() {
        sidebar.classList.remove('active');
        sidebarOverlay.classList.remove('active');
        sidebarOverlay.addEventListener('transitionend', () => {
            sidebarOverlay.style.display = '';
        }, { once: true });
        document.body.style.overflow = '';
    }

    function closeAllModals() {
        document.querySelectorAll('.modal-overlay').forEach(modal => {
            modal.classList.remove('active');
        });
        document.body.style.overflow = '';
    }

    // Individual close buttons
    document.querySelectorAll('.close-modal-btn, #cancelModalBtn, #cancelRequestBtn, #closeViewModalBtn, #closeRequestModalBtn, #closeInvoiceModalBtn, #closeSimModalBtn').forEach(btn => {
        btn.addEventListener('click', closeAllModals);
    });

    // Overlay click to close
    document.querySelectorAll('.modal-overlay').forEach(overlay => {
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                closeAllModals();
            }
        });
    });

    menuToggle.addEventListener('click', openSidebar);
    closeSidebar.addEventListener('click', closeSidebarFn);
    sidebarOverlay.addEventListener('click', closeSidebarFn);

    // View Routing
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            if (link.classList.contains('logout')) return;
            e.preventDefault();

            // Remove active from all links and sections
            navLinks.forEach(nav => nav.classList.remove('active'));
            viewSections.forEach(section => section.classList.remove('active'));

            // Add active to clicked link and corresponding section
            link.classList.add('active');
            const targetViewId = link.getAttribute('data-view');
            const targetSection = document.getElementById(targetViewId);
            if (targetSection) {
                targetSection.classList.add('active');

                // If switching views, render their specific charts if needed
                if (targetViewId === 'dashboard') {
                    renderChart();
                } else if (targetViewId === 'reports') {
                    renderReports();
                }
            }

            // Close sidebar on mobile after click (also fades the overlay)
            if (window.innerWidth <= 768) {
                closeSidebarFn();
            }
        });
    });

    // Admin Dropdown Logic
    const userProfileBtn = document.getElementById('userProfileBtn');
    const adminDropdown = document.getElementById('adminDropdown');

    userProfileBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        adminDropdown.classList.toggle('active');
    });

    document.addEventListener('click', () => {
        adminDropdown.classList.remove('active');
    });

    // Logout logic in dropdown
    adminDropdown.querySelector('.logout').addEventListener('click', (e) => {
        e.preventDefault();
        alert('Logging out...');
    });


    /* =========================================
       Dashboard Render Functions
       ========================================= */

    function renderDashboardStats() {
        const drivers = getDrivers();
        const rides = getRides();

        const totalDrivers = drivers.length;
        const pendingVerifications = drivers.filter(d => !['Verified', 'Rejected'].includes(d.status)).length;
        const activeServices = rides.filter(r => ['Pending', 'Accepted', 'In Progress', 'Scheduled', 'Reassigned'].includes(r.status)).length;

        let monthlyRevenue = 0;
        rides.forEach(r => {
            if (r.status === 'Completed') {
                const amountNum = parseInt(r.amount.replace(/[^0-9.-]+/g, ""));
                if (!isNaN(amountNum)) monthlyRevenue += amountNum;
            }
        });

        const formattedRevenue = '₹' + monthlyRevenue.toLocaleString('en-IN');

        dashboardStats.innerHTML = `
            <div class="stat-card">
                <div class="stat-icon blue">
                    <i class="fa-solid fa-users"></i>
                </div>
                <div class="stat-details">
                    <h3>Total Drivers</h3>
                    <div class="value">${totalDrivers}</div>
                </div>
            </div>
            <div class="stat-card">
                <div class="stat-icon purple">
                    <i class="fa-solid fa-id-card"></i>
                </div>
                <div class="stat-details">
                    <h3>Pending Verifications</h3>
                    <div class="value">${pendingVerifications}</div>
                </div>
            </div>
            <div class="stat-card">
                <div class="stat-icon green">
                    <i class="fa-solid fa-car-on"></i>
                </div>
                <div class="stat-details">
                    <h3>Active Services</h3>
                    <div class="value">${activeServices}</div>
                </div>
            </div>
            <div class="stat-card">
                <div class="stat-icon orange">
                    <i class="fa-solid fa-indian-rupee-sign"></i>
                </div>
                <div class="stat-details">
                    <h3>Monthly Revenue</h3>
                    <div class="value">${formattedRevenue}</div>
                </div>
            </div>
        `;
    }

    const recentRequestsList = document.getElementById('recentRequestsList');
    const recentApprovalsList = document.getElementById('recentApprovalsList');

    function renderRecentRequests() {
        if (!recentRequestsList) return;
        const rides = getRides().reverse().slice(0, 5); // Get latest 5

        if (rides.length === 0) {
            recentRequestsList.innerHTML = '<p class="text-muted">No recent requests found.</p>';
            return;
        }

        recentRequestsList.innerHTML = rides.map(ride => `
            <div class="activity-item">
                <div class="activity-avatar" style="background:#e0f2fe; color:#0284c7;">
                    <i class="fa-solid fa-car"></i>
                </div>
                <div class="activity-info">
                    <p>${ride.customer}</p>
                    <span>${ride.date} • Driver: ${ride.driver || 'Unassigned'}</span>
                </div>
                <div class="activity-amount" style="font-size:0.85rem;">
                    ${getRideStatusBadge(ride.status)}
                </div>
            </div>
        `).join('');
    }

    function renderRecentApprovals() {
        if (!recentApprovalsList) return;
        const approvals = getDrivers()
            .filter(d => d.status === 'Verified')
            .reverse()
            .slice(0, 5);

        if (approvals.length === 0) {
            recentApprovalsList.innerHTML = '<p class="text-muted">No recent approvals found.</p>';
            return;
        }

        recentApprovalsList.innerHTML = approvals.map(driver => `
            <div class="activity-item">
                <div class="activity-avatar" style="background:#dcfce7; color:#16a34a;">
                    <i class="fa-solid fa-check"></i>
                </div>
                <div class="activity-info">
                    <p>${driver.name}</p>
                    <span>${driver.experience} • ${driver.license}</span>
                </div>
                <div class="activity-amount" style="font-size:0.85rem;">
                    <span class="badge badge-success">Verified</span>
                </div>
            </div>
        `).join('');
    }

    let revenueChartInstance = null;
    let tripsChartInstance = null;

    function renderChart() {
        const revenueCtx = document.getElementById('revenueChart');
        const tripsCtx = document.getElementById('tripsChart');
        if (!revenueCtx || !tripsCtx) return;

        const rides = getRides();

        // --- Aggregate Revenue Data ---
        let revenueByDate = {};
        rides.forEach(r => {
            if (r.status === 'Completed') {
                const dateStr = r.date.split(' ')[0];
                const amt = parseInt(r.amount.replace(/[^0-9.-]+/g, "")) || 0;
                revenueByDate[dateStr] = (revenueByDate[dateStr] || 0) + amt;
            }
        });

        const revLabels = Object.keys(revenueByDate).sort().slice(-7);
        const revData = revLabels.map(d => revenueByDate[d]);

        if (revenueChartInstance) revenueChartInstance.destroy();
        revenueChartInstance = new Chart(revenueCtx, {
            type: 'line',
            data: {
                labels: revLabels.length ? revLabels : ['No Data'],
                datasets: [{
                    label: 'Revenue (₹)',
                    data: revData.length ? revData : [0],
                    backgroundColor: 'rgba(15, 157, 88, 0.1)',
                    borderColor: '#0F9D58',
                    borderWidth: 2,
                    pointBackgroundColor: '#ffffff',
                    pointBorderColor: '#0F9D58',
                    pointBorderWidth: 2,
                    pointRadius: 4,
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        mode: 'index', intersect: false, backgroundColor: '#1e293b', padding: 10,
                        callbacks: {
                            label: function (context) {
                                return '₹' + context.parsed.y.toLocaleString('en-IN');
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        grid: { display: false, drawBorder: false },
                        ticks: { font: { family: 'Inter' }, color: '#64748b' }
                    },
                    y: {
                        grid: { color: '#e2e8f0', drawBorder: false, borderDash: [5, 5] },
                        ticks: {
                            font: { family: 'Inter' }, color: '#64748b',
                            callback: function (value) { return '₹' + value; }
                        }
                    }
                },
                interaction: { mode: 'nearest', axis: 'x', intersect: false }
            }
        });

        // --- Aggregate Trips per Driver Data ---
        let tripsByDriver = {};
        rides.forEach(r => {
            if (['Completed', 'Accepted', 'In Progress'].includes(r.status) && r.driver) {
                tripsByDriver[r.driver] = (tripsByDriver[r.driver] || 0) + 1;
            }
        });

        // Sort drivers by trips to see top performers
        const sortedDrivers = Object.entries(tripsByDriver).sort((a, b) => b[1] - a[1]).slice(0, 5);
        const tripLabels = sortedDrivers.map(d => d[0]);
        const tripData = sortedDrivers.map(d => d[1]);

        if (tripsChartInstance) tripsChartInstance.destroy();
        tripsChartInstance = new Chart(tripsCtx, {
            type: 'bar',
            data: {
                labels: tripLabels.length ? tripLabels : ['No Data'],
                datasets: [{
                    label: 'Total Trips',
                    data: tripData.length ? tripData : [0],
                    backgroundColor: '#0F9D58',
                    borderRadius: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        backgroundColor: '#1e293b', padding: 10,
                        titleFont: { family: 'Inter', size: 13 },
                    }
                },
                scales: {
                    x: {
                        grid: { display: false },
                        ticks: { font: { family: 'Inter' }, color: '#64748b' }
                    },
                    y: {
                        beginAtZero: true,
                        grid: { color: '#e2e8f0', drawBorder: false, borderDash: [5, 5] },
                        ticks: { precision: 0, font: { family: 'Inter' }, color: '#64748b' }
                    }
                }
            }
        });
    }


    /* =========================================
       Drivers Management
       ========================================= */

    function getStatusBadge(status) {
        switch (status) {
            case 'Registration Received': return '<span class="badge badge-warning" style="background:#fef3c7; color:#b45309;">Reg. Received</span>';
            case 'Police Verification': return '<span class="badge" style="background:#e0f2fe; color:#0284c7;">Police Ver.</span>';
            case 'Background Check': return '<span class="badge" style="background:#f3e8ff; color:#9333ea;">Bg. Check</span>';
            case 'Verified': return '<span class="badge badge-success">Verified</span>';
            case 'Rejected': return '<span class="badge" style="background:#fee2e2; color:#ef4444;">Rejected</span>';
            case 'active': return '<span class="badge badge-success">Active</span>';
            case 'inactive': return '<span class="badge badge-warning">Inactive</span>';
            default: return `<span class="badge">${status}</span>`;
        }
    }

    function renderDriversTable(filterText = '', filterStatus = 'all') {
        let drivers = getDrivers();

        // Apply filters
        if (filterStatus !== 'all') {
            drivers = drivers.filter(d => d.status === filterStatus);
        }
        if (filterText) {
            const lowerText = filterText.toLowerCase();
            drivers = drivers.filter(d =>
                d.name.toLowerCase().includes(lowerText) ||
                d.id.toLowerCase().includes(lowerText) ||
                d.vehicle.toLowerCase().includes(lowerText)
            );
        }

        if (drivers.length === 0) {
            driversTableBody.innerHTML = '<tr><td colspan="6" style="text-align:center; color: var(--text-muted); padding: 2rem;">No drivers found.</td></tr>';
            return;
        }

        driversTableBody.innerHTML = drivers.map(driver => `
            <tr>
                <td>
                    <div class="driver-info-cell">
                        <img src="https://ui-avatars.com/api/?name=${encodeURIComponent(driver.name)}&background=random" class="avatar" alt="${driver.name}">
                        <div>
                            <span style="font-weight: 500;">${driver.name}</span>
                            <span class="email">${driver.id}</span>
                        </div>
                    </div>
                </td>
                <td>${driver.phone}</td>
                <td>${driver.experience}</td>
                <td>${driver.license}</td>
                <td>${getStatusBadge(driver.status)}</td>
                <td>
                    <div class="action-btns-container">
                        <button class="actions-btn view-driver-btn" data-id="${driver.id}" title="View & Process"><i class="fa-solid fa-eye"></i></button>
                        <button class="actions-btn edit-driver-btn" data-id="${driver.id}" title="Edit"><i class="fa-solid fa-pen"></i></button>
                        <button class="actions-btn delete delete-driver-btn" data-id="${driver.id}" title="Delete"><i class="fa-solid fa-trash"></i></button>
                    </div>
                </td>
            </tr>
        `).join('');

        // Attach Event Listeners to newborn buttons
        document.querySelectorAll('.view-driver-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.currentTarget.getAttribute('data-id');
                openViewDriverModal(id);
            });
        });

        document.querySelectorAll('.edit-driver-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.currentTarget.getAttribute('data-id');
                openDriverModal(id);
            });
        });

        document.querySelectorAll('.delete-driver-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.currentTarget.getAttribute('data-id');
                if (confirm('Are you sure you want to delete this driver?')) {
                    deleteDriver(id);
                    renderDriversTable(searchDriverInput.value, filterDriverStatus.value);
                    renderDashboardStats(); // Update total drivers count on dashboard
                }
            });
        });
    }

    // Driver Modal Logic
    function openDriverModal(driverId = null) {
        modalTitle.textContent = driverId ? 'Edit Driver' : 'Add New Driver';
        driverForm.reset();
        driverIdInput.value = '';

        if (driverId) {
            const drivers = getDrivers();
            const driver = drivers.find(d => d.id === driverId);
            if (driver) {
                driverIdInput.value = driver.id;
                driverNameInput.value = driver.name;
                driverPhoneInput.value = driver.phone;
                driverExperienceInput.value = driver.experience;
                driverLicenseInput.value = driver.license;
                driverStatusInput.value = driver.status;
            }
        }

        driverModal.classList.add('active');
        document.body.style.overflow = 'hidden'; // Prevent background scroll
    }

    function closeDriverModal() {
        driverModal.classList.remove('active');
        document.body.style.overflow = '';
    }

    addDriverBtn.addEventListener('click', () => openDriverModal());
    closeModalBtns.forEach(btn => btn.addEventListener('click', closeDriverModal));

    // Handle Form Submit
    driverForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const driverData = {
            name: driverNameInput.value.trim(),
            phone: driverPhoneInput.value.trim(),
            experience: driverExperienceInput.value.trim(),
            license: driverLicenseInput.value.trim(),
            status: driverStatusInput.value
        };

        const currentId = driverIdInput.value;

        if (currentId) {
            // Edit mode
            driverData.id = currentId;
            updateDriver(driverData);
        } else {
            // Add mode
            addDriver(driverData);

            // Update total drivers stat
            const stats = getStats();
            stats.totalDrivers++;
            localStorage.setItem(StorageKeys.STATS, JSON.stringify(stats));
        }

        closeDriverModal();
        renderDriversTable(searchDriverInput.value, filterDriverStatus.value);
        renderDashboardStats(); // Update dashboard count
    });

    // Driver Search and Filter
    searchDriverInput.addEventListener('input', (e) => {
        renderDriversTable(e.target.value, filterDriverStatus.value);
    });

    filterDriverStatus.addEventListener('change', (e) => {
        renderDriversTable(searchDriverInput.value, e.target.value);
    });

    /* =========================================
       View / Verification Modal Logic
       ========================================= */
    const viewDriverModal = document.getElementById('viewDriverModal');
    const closeViewModalBtn = document.getElementById('closeViewModalBtn');
    const viewDriverName = document.getElementById('viewDriverName');
    const viewDriverPhone = document.getElementById('viewDriverPhone');
    const viewDriverExperience = document.getElementById('viewDriverExperience');
    const viewDriverLicense = document.getElementById('viewDriverLicense');
    const viewDriverStatusBadge = document.getElementById('viewDriverStatusBadge');
    const verificationStepper = document.getElementById('verificationStepper');
    const rejectDriverBtn = document.getElementById('rejectDriverBtn');
    const nextVerificationBtn = document.getElementById('nextVerificationBtn');
    const downloadPdfBtn = document.getElementById('downloadPdfBtn');
    let currentViewingDriverId = null;

    const WORKFLOW_STEPS = [
        'Registration Received',
        'Police Verification',
        'Background Check',
        'Verified'
    ];

    function openViewDriverModal(driverId) {
        currentViewingDriverId = driverId;
        const drivers = getDrivers();
        const driver = drivers.find(d => d.id === driverId);
        if (!driver) return;

        // Populate details
        viewDriverName.textContent = driver.name;
        viewDriverPhone.textContent = driver.phone;
        viewDriverExperience.textContent = driver.experience;
        viewDriverLicense.textContent = driver.license;
        viewDriverStatusBadge.innerHTML = getStatusBadge(driver.status);

        // Render Stepper
        renderVerificationStepper(driver.status);

        // Handle action buttons
        if (driver.status === 'Verified' || driver.status === 'Rejected') {
            document.getElementById('verificationActionBtns').style.display = 'none';
        } else {
            document.getElementById('verificationActionBtns').style.display = 'flex';
            if (driver.status === 'Registration Received') {
                nextVerificationBtn.textContent = 'Initiate Police Verification';
            } else if (driver.status === 'Police Verification') {
                nextVerificationBtn.textContent = 'Initiate Background Check';
            } else if (driver.status === 'Background Check') {
                nextVerificationBtn.textContent = 'Mark as Verified';
            } else {
                nextVerificationBtn.textContent = 'Proceed to Next Step';
            }
        }

        viewDriverModal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    function renderVerificationStepper(currentStatus) {
        const steps = verificationStepper.querySelectorAll('.step');
        const lines = verificationStepper.querySelectorAll('.step-line');

        let statusIndex = WORKFLOW_STEPS.indexOf(currentStatus);
        const isRejected = currentStatus === 'Rejected';

        steps.forEach((step, index) => {
            step.className = 'step'; // Reset
            if (isRejected) {
                if (index === 0) step.classList.add('rejected'); // Mark first step rejected
            } else {
                if (index < statusIndex) {
                    step.classList.add('completed');
                } else if (index === statusIndex) {
                    step.classList.add('current');
                }
            }
        });

        lines.forEach((line, index) => {
            line.className = 'step-line';
            if (!isRejected && index < statusIndex) {
                line.classList.add('completed');
            }
        });
    }

    closeViewModalBtn.addEventListener('click', () => {
        viewDriverModal.classList.remove('active');
        document.body.style.overflow = '';
    });

    rejectDriverBtn.addEventListener('click', () => {
        if (confirm('Are you sure you want to reject this driver?')) {
            updateDriverStatus(currentViewingDriverId, 'Rejected');
            openViewDriverModal(currentViewingDriverId);
            renderDriversTable(searchDriverInput.value, filterDriverStatus.value);
        }
    });

    nextVerificationBtn.addEventListener('click', () => {
        const drivers = getDrivers();
        const driver = drivers.find(d => d.id === currentViewingDriverId);
        let currentIndex = WORKFLOW_STEPS.indexOf(driver.status);
        if (currentIndex !== -1 && currentIndex < WORKFLOW_STEPS.length - 1) {
            updateDriverStatus(currentViewingDriverId, WORKFLOW_STEPS[currentIndex + 1]);
            openViewDriverModal(currentViewingDriverId);
            renderDriversTable(searchDriverInput.value, filterDriverStatus.value);
        }
    });

    function updateDriverStatus(id, newStatus) {
        const drivers = getDrivers();
        const index = drivers.findIndex(d => d.id === id);
        if (index !== -1) {
            drivers[index].status = newStatus;
            saveDrivers(drivers);
        }
    }

    downloadPdfBtn.addEventListener('click', () => {
        const drivers = getDrivers();
        const driver = drivers.find(d => d.id === currentViewingDriverId);
        if (!driver) return;

        // Simulate PDF layout via text download
        const textContent = `
=========================================
      DRIVER REGISTRATION DETAILS
=========================================
ID:           ${driver.id}
Name:         ${driver.name}
Phone:        ${driver.phone}
Email:        ${driver.email}
Experience:   ${driver.experience}
License:      ${driver.license}
Status:       ${driver.status}
=========================================
Downloaded at: ${new Date().toLocaleString()}
`;
        const blob = new Blob([textContent], { type: "text/plain" });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = `Driver_Registration_${driver.id}.txt`;
        link.click();
        URL.revokeObjectURL(link.href);
    });

    /* =========================================
       Rides Management
       ========================================= */

    function getRideStatusBadge(status) {
        switch (status) {
            case 'Completed': return '<span class="badge badge-success">Completed</span>';
            case 'In Progress': return '<span class="badge badge-primary">In Progress</span>';
            case 'Cancelled': return '<span class="badge badge-warning" style="background:#fee2e2; color:#ef4444;">Cancelled</span>';
            case 'Scheduled': return '<span class="badge badge-warning" style="background:#fef3c7; color:#b45309;">Scheduled</span>';
            case 'Pending': return '<span class="badge badge-warning" style="background:#fef3c7; color:#b45309;">Pending</span>';
            case 'Accepted': return '<span class="badge badge-success">Accepted</span>';
            case 'Rejected': return '<span class="badge" style="background:#fee2e2; color:#ef4444;">Rejected</span>';
            case 'Reassigned': return '<span class="badge badge-primary" style="background:#e0f2fe; color:#0284c7;">Reassigned</span>';
            default: return `<span class="badge">${status}</span>`;
        }
    }

    function renderRidesTable() {
        const rides = getRides();

        if (rides.length === 0) {
            ridesTableBody.innerHTML = '<tr><td colspan="6" style="text-align:center; color: var(--text-muted); padding: 2rem;">No rides history available.</td></tr>';
            return;
        }

        ridesTableBody.innerHTML = rides.map(ride => `
            <tr>
                <td style="font-weight: 500;">${ride.id}</td>
                <td>${ride.customer}</td>
                <td>${ride.driver}</td>
                <td style="color: var(--text-muted); font-size: 0.85rem;">${ride.date}</td>
                <td style="font-weight: 600;">${ride.amount}</td>
                <td>${getRideStatusBadge(ride.status)}</td>
                <td>
                    <div class="action-btns-container">
                        <button class="actions-btn generate-bill-btn" data-id="${ride.id}" title="Generate Bill" style="color:var(--primary-color);"><i class="fa-solid fa-file-invoice"></i></button>
                    </div>
                </td>
            </tr>
        `).join('');

        // Attach listeners for bill buttons
        document.querySelectorAll('.generate-bill-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.currentTarget.getAttribute('data-id');
                openGenerateInvoiceModal(id);
            });
        });
    }

    /* =========================================
       Create Service Request & Simulation
       ========================================= */
    const createRequestBtn = document.getElementById('createRequestBtn');
    const createRequestModal = document.getElementById('createRequestModal');
    const closeRequestModalBtn = document.getElementById('closeRequestModalBtn');
    const cancelRequestBtn = document.getElementById('cancelRequestBtn');
    const requestForm = document.getElementById('requestForm');
    const reqDriverAssign = document.getElementById('reqDriverAssign');

    const driverSimulationModal = document.getElementById('driverSimulationModal');
    const simRejectBtn = document.getElementById('simRejectBtn');
    const simAcceptBtn = document.getElementById('simAcceptBtn');

    let currentPendingRideId = null;

    function populateVerifiedDriversDropdown() {
        const drivers = getDrivers().filter(d => d.status === 'Verified');
        if (drivers.length === 0) {
            reqDriverAssign.innerHTML = '<option value="">No Verified Drivers Available</option>';
            return;
        }
        reqDriverAssign.innerHTML = drivers.map(d => `<option value="${d.name}">${d.name} (${d.vehicle})</option>`).join('');
    }

    function openCreateRequestModal() {
        requestForm.reset();
        populateVerifiedDriversDropdown();

        // Default Set Date to today and minimum Time
        const now = new Date();
        reqDate.value = now.toISOString().split('T')[0];
        reqDate.min = reqDate.value;

        createRequestModal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    function closeCreateRequestModal() {
        createRequestModal.classList.remove('active');
        document.body.style.overflow = '';
    }

    createRequestBtn?.addEventListener('click', openCreateRequestModal);
    closeRequestModalBtn?.addEventListener('click', closeCreateRequestModal);
    cancelRequestBtn?.addEventListener('click', closeCreateRequestModal);

    requestForm.addEventListener('submit', (e) => {
        e.preventDefault();

        // Validate time is at least 2 hours from now
        const reqDateVal = document.getElementById('reqDate').value;
        const reqTimeVal = document.getElementById('reqTime').value;

        const requestDateTime = new Date(`${reqDateVal}T${reqTimeVal}`);
        const now = new Date();
        const diffMs = requestDateTime - now;
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

        if (diffHours < 2) {
            alert('Service request must be at least 2 hours before the start time.');
            return;
        }

        const driverName = reqDriverAssign.value;
        if (!driverName) {
            alert('Please assign a verified driver');
            return;
        }

        // Add Ride as Pending
        const newRide = {
            customer: document.getElementById('reqClientName').value.trim(),
            driver: driverName,
            date: `${reqDateVal} ${reqTimeVal}`,
            amount: `₹${document.getElementById('reqAmount').value}`,
            location: document.getElementById('reqLocation').value.trim(),
            status: 'Pending'
        };

        const addedRide = addRide(newRide);
        currentPendingRideId = addedRide.id;

        closeCreateRequestModal();
        renderRidesTable();

        // Simulate driver notification
        triggerDriverSimulation(addedRide);
    });

    function triggerDriverSimulation(ride) {
        document.getElementById('simDriverName').textContent = ride.driver;
        document.getElementById('simClient').textContent = ride.customer;
        document.getElementById('simDateTime').textContent = ride.date;
        document.getElementById('simLocation').textContent = ride.location;
        document.getElementById('simAmount').textContent = ride.amount;

        driverSimulationModal.classList.add('active');
    }

    function closeSimulationModal() {
        driverSimulationModal.classList.remove('active');
    }

    simAcceptBtn.addEventListener('click', () => {
        const rides = getRides();
        const index = rides.findIndex(r => r.id === currentPendingRideId);
        if (index !== -1) {
            rides[index].status = 'Accepted';
            saveRides(rides);
            renderRidesTable();
            renderMonthlyRevenueTable(); // auto-update revenue table
        }
        closeSimulationModal();
        alert('Driver has ACCEPTED the request!');
    });

    simRejectBtn.addEventListener('click', () => {
        const rides = getRides();
        const ride = rides.find(r => r.id === currentPendingRideId);
        if (!ride) return;

        // Find next verified driver
        const verifiedDrivers = getDrivers().filter(d => d.status === 'Verified');
        const otherDriver = verifiedDrivers.find(d => d.name !== ride.driver);

        if (otherDriver) {
            alert(`Driver ${ride.driver} rejected. Auto-reassigning to ${otherDriver.name}...`);
            ride.driver = otherDriver.name;
            ride.status = 'Reassigned';
            updateRide(ride);
            renderRidesTable();

            // Re-trigger simulation for new driver
            triggerDriverSimulation(ride);
        } else {
            alert(`Driver ${ride.driver} rejected. No other verified drivers available.`);
            ride.status = 'Rejected';
            updateRide(ride);
            renderRidesTable();
            closeSimulationModal();
        }
    });

    /* =========================================
       Generate Invoice Logic
       ========================================= */
    const generateInvoiceModal = document.getElementById('generateInvoiceModal');
    const closeInvoiceModalBtn = document.getElementById('closeInvoiceModalBtn');
    const invClientName = document.getElementById('invClientName');
    const invRideDate = document.getElementById('invRideDate');
    const invNumber = document.getElementById('invNumber');

    const invDistance = document.getElementById('invDistance');
    const invRate = document.getElementById('invRate');
    const invTax = document.getElementById('invTax');

    const invSubtotal = document.getElementById('invSubtotal');
    const invTaxLabel = document.getElementById('invTaxLabel');
    const invTaxAmount = document.getElementById('invTaxAmount');
    const invTotalAmount = document.getElementById('invTotalAmount');

    const printInvoiceBtn = document.getElementById('printInvoiceBtn');
    const downloadInvoiceBtn = document.getElementById('downloadInvoiceBtn');

    function calculateInvoice() {
        const distance = parseFloat(invDistance.value) || 0;
        const rate = parseFloat(invRate.value) || 0;
        const taxRate = parseFloat(invTax.value) || 0;

        const subtotal = distance * rate;
        const taxVal = subtotal * (taxRate / 100);
        const total = subtotal + taxVal;

        invSubtotal.textContent = subtotal.toFixed(2);
        invTaxLabel.textContent = `Tax Amount (${taxRate}%):`;
        invTaxAmount.textContent = taxVal.toFixed(2);
        invTotalAmount.textContent = total.toFixed(2);
    }

    [invDistance, invRate, invTax].forEach(input => {
        input.addEventListener('input', calculateInvoice);
    });

    // Make it global so the button generated in innerHTML can call it
    window.openGenerateInvoiceModal = function (rideId) {
        const rides = getRides();
        const ride = rides.find(r => r.id === rideId);
        if (!ride) return;

        invClientName.textContent = ride.customer;
        invRideDate.textContent = `Date: ${ride.date}`;
        invNumber.textContent = `INV-${Math.floor(10000 + Math.random() * 90000)}`;

        // Reset inputs to trigger fresh calculation
        invDistance.value = "10";
        invRate.value = "15";
        invTax.value = "18";
        calculateInvoice();

        generateInvoiceModal.classList.add('active');
        document.body.style.overflow = 'hidden';
    };

    closeInvoiceModalBtn.addEventListener('click', () => {
        generateInvoiceModal.classList.remove('active');
        document.body.style.overflow = '';
    });

    printInvoiceBtn.addEventListener('click', () => {
        // Simple window print (CSS handles hiding nav/sidebar)
        window.print();
    });

    downloadInvoiceBtn.addEventListener('click', () => {
        const textContent = `
=========================================
      HASSLEFREE DRIVE - INVOICE RECEIPT
=========================================
Invoice No:   ${invNumber.textContent}
Billed To:    ${invClientName.textContent}
Date:         ${invRideDate.textContent.replace('Date: ', '')}
=========================================
Distance:     ${invDistance.value} KM
Rate/KM:      ₹${invRate.value}
-----------------------------------------
Subtotal:     ₹${invSubtotal.textContent}
Tax (${invTax.value}%):   ₹${invTaxAmount.textContent}
=========================================
TOTAL AMOUNT: ₹${invTotalAmount.textContent}
=========================================
Thank you for choosing HassleFreeDrive!
`;
        const blob = new Blob([textContent], { type: "text/plain" });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = `Invoice_${invNumber.textContent}.txt`;
        link.click();
        URL.revokeObjectURL(link.href);
        renderMonthlyRevenueTable(); // auto-update revenue table after invoice
    });

    /* =========================================
       Reports Module Render Logic
       ========================================= */

    let reportsRevenueChartInstance = null;

    function renderReports() {
        renderSalesReport();
        renderDriverDatabaseReport();
        renderReportsRevenueChart();
    }

    // 1. Monthly Sales Report
    function renderSalesReport() {
        const salesTbody = document.getElementById('salesReportTableBody');
        if (!salesTbody) return;

        const rides = getRides();
        const drivers = getDrivers();
        const driverStats = {};

        // Map driver base
        drivers.forEach(d => {
            driverStats[d.name] = { id: d.id, sales: 0, trips: 0 };
        });

        // Tabulate rides
        rides.forEach(r => {
            if (['Completed', 'Accepted', 'In Progress'].includes(r.status) && r.driver && driverStats[r.driver]) {
                driverStats[r.driver].trips += 1;
                const amt = parseInt(r.amount.replace(/[^0-9.-]+/g, "")) || 0;
                driverStats[r.driver].sales += amt;
            }
        });

        const sortedDrivers = Object.values(driverStats).sort((a, b) => b.sales - a.sales);

        salesTbody.innerHTML = sortedDrivers.map(d => `
            <tr>
                <td style="font-weight: 500;">${d.id}</td>
                <td>${Object.keys(driverStats).find(name => driverStats[name].id === d.id)}</td>
                <td style="font-weight: 600; color:var(--primary-color);">₹${d.sales.toLocaleString('en-IN')}</td>
                <td>${d.trips}</td>
            </tr>
        `).join('');
    }

    // 2. Driver Database Report
    const reportSearchInput = document.getElementById('reportSearchDriverInput');
    const reportFilterStatus = document.getElementById('reportFilterDriverStatus');
    const exportCsvBtn = document.getElementById('exportCsvBtn');

    if (reportSearchInput && reportFilterStatus) {
        reportSearchInput.addEventListener('input', renderDriverDatabaseReport);
        reportFilterStatus.addEventListener('change', renderDriverDatabaseReport);
    }

    function renderDriverDatabaseReport() {
        const tBody = document.getElementById('driverReportTableBody');
        if (!tBody) return;

        let drivers = getDrivers();
        const searchTerm = reportSearchInput ? reportSearchInput.value.toLowerCase() : '';
        const statusFilter = reportFilterStatus ? reportFilterStatus.value : 'all';

        // Filter
        if (statusFilter !== 'all') {
            drivers = drivers.filter(d => d.status === statusFilter);
        }
        if (searchTerm) {
            drivers = drivers.filter(d =>
                d.name.toLowerCase().includes(searchTerm) ||
                d.phone.includes(searchTerm) ||
                d.vehicle.toLowerCase().includes(searchTerm) ||
                d.id.toLowerCase().includes(searchTerm)
            );
        }

        tBody.innerHTML = drivers.map(d => `
            <tr>
                <td style="font-weight: 500;">${d.id}</td>
                <td>
                    <div style="display: flex; align-items: center; gap: 0.75rem;">
                        <img src="https://ui-avatars.com/api/?name=${encodeURIComponent(d.name)}&background=random" alt="Avatar" style="width: 32px; height: 32px; border-radius: 50%;">
                        <div>
                            <div style="font-weight: 500;">${d.name}</div>
                            <div style="font-size: 0.8rem; color: var(--text-muted);">${d.phone}</div>
                        </div>
                    </div>
                </td>
                <td>${d.experience}</td>
                <td>${d.license}</td>
                <td>${getStatusBadge(d.status)}</td>
            </tr>
        `).join('');
    }

    // Export CSV
    if (exportCsvBtn) {
        exportCsvBtn.addEventListener('click', () => {
            const drivers = getDrivers();
            let csvContent = "data:text/csv;charset=utf-8,";
            csvContent += "Driver ID,Driver Name,Phone,Email,Vehicle,License No,Status\\n";

            drivers.forEach(d => {
                const row = [d.id, d.name, d.phone, d.email || 'N/A', d.experience, d.license, d.status].join(",");
                csvContent += row + "\\n";
            });

            const encodedUri = encodeURI(csvContent);
            const link = document.createElement("a");
            link.setAttribute("href", encodedUri);
            link.setAttribute("download", "driver_database_report.csv");
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        });
    }

    // 3. Monthly Revenue Report
    function renderReportsRevenueChart() {
        const ctx = document.getElementById('reportsRevenueChart');
        if (!ctx) return;

        const rides = getRides();
        let currentMonthRevenue = 0;
        let previousMonthRevenue = 0; // Mock comparative

        let revenueByDate = {};
        rides.forEach(r => {
            if (r.status === 'Completed') {
                const dateStr = r.date.split(' ')[0];
                const amt = parseInt(r.amount.replace(/[^0-9.-]+/g, "")) || 0;
                revenueByDate[dateStr] = (revenueByDate[dateStr] || 0) + amt;
                currentMonthRevenue += amt;
            }
        });

        // Mock a previous month based off 85% of current
        previousMonthRevenue = Math.floor(currentMonthRevenue * 0.85);
        const delta = currentMonthRevenue - previousMonthRevenue;
        const deltaPercent = previousMonthRevenue ? ((delta / previousMonthRevenue) * 100).toFixed(1) : 100;

        const revSummaryDiv = document.getElementById('revenueReportSummary');
        if (revSummaryDiv) {
            revSummaryDiv.innerHTML = `
                <div style="font-size:1.5rem; font-weight:700; color:var(--text-dark);">₹${currentMonthRevenue.toLocaleString('en-IN')}</div>
                <div style="font-size:0.85rem; color: ${delta >= 0 ? 'var(--success)' : 'var(--danger)'}; font-weight:500;">
                    <i class="fa-solid fa-arrow-${delta >= 0 ? 'trend-up' : 'trend-down'}"></i> ${Math.abs(deltaPercent)}% vs last month
                </div>
            `;
        }

        const revLabels = Object.keys(revenueByDate).sort().slice(-14); // Last 14 days
        const revData = revLabels.map(d => revenueByDate[d]);

        if (reportsRevenueChartInstance) reportsRevenueChartInstance.destroy();
        reportsRevenueChartInstance = new Chart(ctx, {
            type: 'bar', // Using Bar for contrast against dashboard line chart
            data: {
                labels: revLabels.length ? revLabels : ['No Data'],
                datasets: [{
                    label: 'Daily Revenue (₹)',
                    data: revData.length ? revData : [0],
                    backgroundColor: '#0F9D58',
                    borderRadius: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        backgroundColor: '#1e293b', padding: 10,
                        callbacks: {
                            label: function (context) {
                                return '₹' + context.parsed.y.toLocaleString('en-IN');
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        grid: { display: false },
                        ticks: { font: { family: 'Inter' } }
                    },
                    y: {
                        grid: { color: '#e2e8f0', borderDash: [5, 5] },
                        ticks: {
                            font: { family: 'Inter' },
                            callback: function (value) { return '₹' + value; }
                        }
                    }
                }
            }
        });
    }

    /* =========================================
       All Users & Drivers Table
       ========================================= */

    const ALL_USERS_DRIVERS_DATA = [
        { id: 'u-1', name: 'Rajesh Kumar', joinDate: '2023-01-15', gender: 'Male', role: 'Driver' },
        { id: 'u-2', name: 'Priya Sharma', joinDate: '2023-02-20', gender: 'Female', role: 'Driver' },
        { id: 'u-3', name: 'Amit Patel', joinDate: '2023-03-05', gender: 'Male', role: 'Driver' },
        { id: 'u-4', name: 'Sneha Desai', joinDate: '2023-04-11', gender: 'Female', role: 'Driver' },
        { id: 'u-5', name: 'Rahul Verma', joinDate: '2023-05-03', gender: 'Male', role: 'Customer' },
        { id: 'u-6', name: 'Anjali Gupta', joinDate: '2023-05-18', gender: 'Female', role: 'Customer' },
        { id: 'u-7', name: 'Vikram Singh', joinDate: '2023-06-09', gender: 'Male', role: 'Customer' },
        { id: 'u-8', name: 'Neha Reddy', joinDate: '2023-07-22', gender: 'Female', role: 'Customer' },
        { id: 'u-9', name: 'Rohan Mehta', joinDate: '2023-08-14', gender: 'Male', role: 'Customer' },
        { id: 'u-10', name: 'Kavya Nair', joinDate: '2023-09-01', gender: 'Female', role: 'Driver' }
    ];

    const UD_STORAGE_KEY = 'hasslefree_ud_active_states';

    function getUDActiveStates() {
        try {
            return JSON.parse(localStorage.getItem(UD_STORAGE_KEY)) || {};
        } catch (e) {
            return {};
        }
    }

    function setUDActiveState(id, isActive) {
        const states = getUDActiveStates();
        states[id] = isActive;
        localStorage.setItem(UD_STORAGE_KEY, JSON.stringify(states));
    }

    function formatJoinDate(dateStr) {
        const d = new Date(dateStr);
        return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    }

    function renderUsersDriversTable() {
        const tbody = document.getElementById('usersDriversTableBody');
        if (!tbody) return;

        const activeStates = getUDActiveStates();

        tbody.innerHTML = ALL_USERS_DRIVERS_DATA.map(user => {
            // Default new entries to active
            const isActive = activeStates[user.id] !== undefined ? activeStates[user.id] : true;
            const roleClass = user.role === 'Driver' ? 'driver' : 'customer';

            return `
            <tr>
                <td>
                    <div class="driver-info-cell">
                        <img src="https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=random&size=40" class="avatar" alt="${user.name}">
                        <span style="font-weight: 500; color: var(--text-dark);">${user.name}</span>
                    </div>
                </td>
                <td style="color: var(--text-muted); font-size: 0.875rem;">${formatJoinDate(user.joinDate)}</td>
                <td style="color: var(--text-muted);">${user.gender}</td>
                <td><span class="role-badge ${roleClass}">${user.role}</span></td>
                <td class="toggle-cell">
                    <label class="toggle-switch" title="${isActive ? 'Active' : 'Inactive'}">
                        <input type="checkbox" class="ud-toggle" data-id="${user.id}" ${isActive ? 'checked' : ''}>
                        <span class="toggle-slider"></span>
                    </label>
                </td>
            </tr>`;
        }).join('');

        // Attach toggle listeners
        tbody.querySelectorAll('.ud-toggle').forEach(checkbox => {
            checkbox.addEventListener('change', function () {
                const id = this.getAttribute('data-id');
                const active = this.checked;
                setUDActiveState(id, active);
                // Update tooltip title on parent label
                this.closest('label').title = active ? 'Active' : 'Inactive';
            });
        });
    }

    /* =========================================
       Monthly Revenue Report Table
       ========================================= */

    const MONTH_NAMES = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];

    function buildMonthlyRevenueData() {
        const rides = getRides();
        const map = {}; // key: "YYYY-MM"

        rides.forEach(ride => {
            if (ride.status !== 'Completed') return;

            // Support both "YYYY-MM-DD HH:mm" and "YYYY-MM-DD" date formats
            const datePart = ride.date ? ride.date.split(' ')[0] : null;
            if (!datePart) return;

            const [year, month] = datePart.split('-');
            if (!year || !month) return;

            const key = `${year}-${month}`;
            const amount = parseInt((ride.amount || '0').replace(/[^0-9.-]+/g, '')) || 0;

            if (!map[key]) {
                map[key] = { year: parseInt(year), month: parseInt(month), revenue: 0, trips: 0 };
            }
            map[key].revenue += amount;
            map[key].trips += 1;
        });

        // Sort chronologically
        return Object.values(map).sort((a, b) =>
            a.year !== b.year ? a.year - b.year : a.month - b.month
        );
    }

    function renderMonthlyRevenueTable() {
        const tbody = document.getElementById('revenueReportTableBody');
        const summaryEl = document.getElementById('revSummaryStats');
        if (!tbody) return;

        const data = buildMonthlyRevenueData();

        // --- Populate summary stats in card header ---
        if (summaryEl) {
            if (data.length === 0) {
                summaryEl.innerHTML = '';
            } else {
                const totalRev = data.reduce((s, r) => s + r.revenue, 0);
                const totalTrips = data.reduce((s, r) => s + r.trips, 0);
                summaryEl.innerHTML = `
                    <div class="rev-summary-item">
                        <span class="label">Total Revenue</span>
                        <span class="val green">₹${totalRev.toLocaleString('en-IN')}</span>
                    </div>
                    <div class="rev-summary-item">
                        <span class="label">Total Trips</span>
                        <span class="val">${totalTrips}</span>
                    </div>`;
            }
        }

        // --- Empty state ---
        if (data.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="5" style="text-align:center; color:var(--text-muted); padding:2.5rem;">
                        <i class="fa-solid fa-chart-column" style="font-size:1.5rem; margin-bottom:0.5rem; display:block; opacity:0.3;"></i>
                        No completed rides yet. Revenue data will appear here automatically.
                    </td>
                </tr>`;
            return;
        }

        // --- Table rows ---
        tbody.innerHTML = data.map((row, i) => {
            const prev = data[i - 1];
            let growthHtml = '<span class="growth-badge neutral">—</span>';

            if (prev && prev.revenue > 0) {
                const pct = ((row.revenue - prev.revenue) / prev.revenue * 100).toFixed(1);
                const isPos = parseFloat(pct) > 0;
                const isZero = parseFloat(pct) === 0;
                const cls = isZero ? 'neutral' : (isPos ? 'positive' : 'negative');
                const icon = isZero ? '' : (isPos
                    ? '<i class="fa-solid fa-arrow-trend-up"></i>'
                    : '<i class="fa-solid fa-arrow-trend-down"></i>');
                const sign = isPos ? '+' : '';
                growthHtml = `<span class="growth-badge ${cls}">${icon} ${sign}${pct}%</span>`;
            }

            const revenueFormatted = '₹' + row.revenue.toLocaleString('en-IN');

            return `
            <tr>
                <td style="font-weight:500;">${MONTH_NAMES[row.month - 1]}</td>
                <td style="color:var(--text-muted);">${row.year}</td>
                <td class="num-cell" style="font-weight:600; color:var(--primary-color);">${revenueFormatted}</td>
                <td class="num-cell" style="color:var(--text-muted);">${row.trips}</td>
                <td class="num-cell">${growthHtml}</td>
            </tr>`;
        }).join('');
    }

    /* =========================================
       Smart App Download Routing (iOS / Android / Fallback)
       ========================================= */
    const APP_DOWNLOAD_CONFIG = {
        playStoreUrl: 'https://play.google.com/store/apps/details?id=com.hasslefreedrive.app',
        appStoreUrl: '', // Add iOS App Store link here once published (e.g. 'https://apps.apple.com/app/...')
    };

    function getDevicePlatform() {
        const ua = navigator.userAgent || navigator.vendor || (window.opera ? window.opera : '') || '';
        const isIOS =
            /iPad|iPhone|iPod/.test(ua) ||
            (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
        const isAndroid = /Android/i.test(ua);

        if (isIOS) return 'ios';
        if (isAndroid) return 'android';
        return 'desktop';
    }

    function getSmartDownloadUrl() {
        const platform = getDevicePlatform();
        if (platform === 'ios') {
            // If iOS App Store link is configured, open it; otherwise fallback to Google Play link
            return APP_DOWNLOAD_CONFIG.appStoreUrl || APP_DOWNLOAD_CONFIG.playStoreUrl;
        }
        return APP_DOWNLOAD_CONFIG.playStoreUrl;
    }

    function handleAppDownloadClick(e) {
        if (e) e.preventDefault();
        const targetUrl = getSmartDownloadUrl();
        window.open(targetUrl, '_blank', 'noopener,noreferrer');
    }

    function initAppDownloadButtons() {
        const downloadBtnIds = ['headerDownloadApp', 'sidebarDownloadApp', 'dropdownDownloadApp'];
        downloadBtnIds.forEach(id => {
            const btn = document.getElementById(id);
            if (btn) {
                btn.addEventListener('click', handleAppDownloadClick);
            }
        });
    }

    /* =========================================
       Initialize Application
       ========================================= */

    function init() {
        renderDashboardStats();
        renderRecentRequests();
        renderRecentApprovals();
        renderChart(); // Initial chart render
        renderDriversTable();
        renderRidesTable();
        renderReports(); // Pre-render reports data to ensure charts are prepped
        renderUsersDriversTable(); // Render Users & Drivers table
        renderMonthlyRevenueTable(); // Render Monthly Revenue table
        initAppDownloadButtons(); // Initialize Smart Download buttons
    }

    // Run init
    init();

});