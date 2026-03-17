// admin_dashboard.js

let currentSortColumn = '';
let currentSortDirection = 'asc';
let currentActivityPage = 1;
const activitiesPerPage = 10;
let allActivities = [];

// Mobile menu toggle
document.addEventListener('DOMContentLoaded', function() {
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    const sidebar = document.getElementById('sidebar');
    
    if (mobileMenuBtn && sidebar) {
        mobileMenuBtn.addEventListener('click', function() {
            sidebar.classList.toggle('-translate-x-full');
            const icon = mobileMenuBtn.querySelector('i');
            icon.classList.toggle('fa-bars');
            icon.classList.toggle('fa-times');
        });

        document.addEventListener('click', function(e) {
            if (window.innerWidth < 768 && 
                !sidebar.contains(e.target) && 
                !mobileMenuBtn.contains(e.target) &&
                !sidebar.classList.contains('-translate-x-full')) {
                sidebar.classList.add('-translate-x-full');
                const icon = mobileMenuBtn.querySelector('i');
                icon.classList.add('fa-bars');
                icon.classList.remove('fa-times');
            }
        });
    }

    loadDashboardStats();
});

// Toggle dropdown menus
function toggleDropdown(id) {
    const menu = document.getElementById(id + '-menu');
    const icon = document.getElementById(id + '-icon');
    
    if (menu) {
        menu.classList.toggle('hidden');
    }
    
    if (icon) {
        icon.classList.toggle('rotate-180');
    }
}

// Show specific section
function showSection(sectionName) {
    const sections = document.querySelectorAll('.content-section');
    sections.forEach(section => section.classList.add('hidden'));
    
    const targetSection = document.getElementById(sectionName + '-section');
    if (targetSection) {
        targetSection.classList.remove('hidden');
    }

    const sidebar = document.getElementById('sidebar');
    if (window.innerWidth < 768 && sidebar) {
        sidebar.classList.add('-translate-x-full');
        const mobileMenuBtn = document.getElementById('mobile-menu-btn');
        const icon = mobileMenuBtn.querySelector('i');
        icon.classList.add('fa-bars');
        icon.classList.remove('fa-times');
    }

    if (sectionName === 'manage-customers') {
        loadCustomers();
    } else if (sectionName === 'pending-transfer') {
        loadPendingTransfers();
    } else if (sectionName === 'all-transfers') {
        loadAllTransfers();
    } else if (sectionName === 'history') {
        loadHistory();
    } else if (sectionName === 'dashboard') {
        loadDashboardStats();
        loadRecentActivity();
    }
}

// Load Dashboard Statistics
function loadDashboardStats() {
    database.ref('users').once('value', (snapshot) => {
        const users = snapshot.val();
        const totalUsers = users ? Object.keys(users).length : 0;
        document.getElementById('total-users').textContent = totalUsers;
    });

    database.ref('transfers').orderByChild('status').equalTo('pending').once('value', (snapshot) => {
        const pending = snapshot.val();
        const pendingCount = pending ? Object.keys(pending).length : 0;
        document.getElementById('pending-count').textContent = pendingCount;
    });

    database.ref('transfers').orderByChild('status').equalTo('approved').once('value', (snapshot) => {
        const transfers = snapshot.val();
        let totalRevenue = 0;
        if (transfers) {
            Object.values(transfers).forEach(transfer => {
                totalRevenue += parseFloat(transfer.amount) || 0;
            });
        }
        document.getElementById('total-revenue').textContent = '$' + totalRevenue.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2});
    });

    const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);
    database.ref('users').orderByChild('createdAt').startAt(oneDayAgo).once('value', (snapshot) => {
        const newUsers = snapshot.val();
        const newSignups = newUsers ? Object.keys(newUsers).length : 0;
        document.getElementById('new-signups').textContent = newSignups;
    });

    loadRecentActivity();
}

// Load Recent Activity with Pagination
function loadRecentActivity() {
    const container = document.getElementById('recent-activity-container');
    if (!container) return;
    
    container.innerHTML = '<div class="text-center py-4 text-gray-500"><i class="fas fa-spinner fa-spin mr-2"></i>Loading recent activity...</div>';
    
    allActivities = [];
    
    database.ref('transfers').limitToLast(50).once('value', (snapshot) => {
        const transfers = snapshot.val();
        if (transfers) {
            Object.keys(transfers).forEach(transferId => {
                const transfer = transfers[transferId];
                allActivities.push({
                    type: 'transfer',
                    icon: 'fa-exchange-alt',
                    iconBg: transfer.status === 'approved' ? 'bg-green-100 text-green-600' : 
                           transfer.status === 'pending' ? 'bg-yellow-100 text-yellow-600' : 'bg-red-100 text-red-600',
                    title: `Transfer ${transfer.status}`,
                    description: `${transfer.from} → ${transfer.to}`,
                    amount: `$${parseFloat(transfer.amount).toLocaleString('en-US', {minimumFractionDigits: 2})}`,
                    time: transfer.date,
                    status: transfer.status
                });
            });
        }
        
        database.ref('users').limitToLast(20).once('value', (snapshot) => {
            const users = snapshot.val();
            if (users) {
                Object.keys(users).forEach(userId => {
                    const user = users[userId];
                    allActivities.push({
                        type: 'user',
                        icon: 'fa-user-plus',
                        iconBg: 'bg-indigo-100 text-indigo-600',
                        title: 'New User Registration',
                        description: user.fullName,
                        amount: user.email,
                        time: user.createdAt,
                        status: user.status || 'pending'
                    });
                });
            }
            
            allActivities.sort((a, b) => b.time - a.time);
            displayActivitiesPage();
        });
    });
}

// Display Activities with Pagination
function displayActivitiesPage() {
    const container = document.getElementById('recent-activity-container');
    container.innerHTML = '';
    
    if (allActivities.length === 0) {
        container.innerHTML = '<div class="text-center py-8 text-gray-400"><i class="fas fa-inbox text-4xl mb-3 block"></i><p>No recent activity</p></div>';
        return;
    }
    
    const startIdx = (currentActivityPage - 1) * activitiesPerPage;
    const endIdx = startIdx + activitiesPerPage;
    const pageActivities = allActivities.slice(startIdx, endIdx);
    
    pageActivities.forEach(activity => {
        const activityItem = document.createElement('div');
        activityItem.className = 'flex items-start space-x-3 md:space-x-4 p-3 md:p-4 hover:bg-gray-50 rounded-xl transition-colors border-l-4 ' + 
            (activity.status === 'approved' || activity.status === 'active' ? 'border-green-500' : 
             activity.status === 'pending' ? 'border-yellow-500' : 
             activity.status === 'rejected' ? 'border-red-500' : 'border-indigo-500');
        
        activityItem.innerHTML = `
            <div class="flex-shrink-0">
                <div class="w-10 h-10 md:w-12 md:h-12 ${activity.iconBg} rounded-full flex items-center justify-center">
                    <i class="fas ${activity.icon} text-lg md:text-xl"></i>
                </div>
            </div>
            <div class="flex-1 min-w-0">
                <div class="flex items-start justify-between">
                    <div class="flex-1">
                        <p class="font-semibold text-gray-900 text-sm md:text-base">${activity.title}</p>
                        <p class="text-gray-600 text-xs md:text-sm mt-1 truncate">${activity.description}</p>
                        <p class="text-gray-500 text-xs md:text-sm mt-1">${activity.amount}</p>
                    </div>
                    <div class="text-right ml-2 flex-shrink-0">
                        <p class="text-xs text-gray-400">${getTimeAgo(activity.time)}</p>
                        <span class="inline-block mt-1 px-2 py-1 rounded-full text-xs ${
                            activity.status === 'approved' || activity.status === 'active' ? 'bg-green-100 text-green-700' :
                            activity.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-red-100 text-red-700'
                        }">${activity.status}</span>
                    </div>
                </div>
            </div>
        `;
        
        container.appendChild(activityItem);
    });
    
    // Add pagination controls
    const totalPages = Math.ceil(allActivities.length / activitiesPerPage);
    if (totalPages > 1) {
        const paginationDiv = document.createElement('div');
        paginationDiv.className = 'flex justify-center items-center gap-2 mt-4 pt-4 border-t';
        
        paginationDiv.innerHTML = `
            <button onclick="changeActivityPage(${currentActivityPage - 1})" 
                    ${currentActivityPage === 1 ? 'disabled' : ''} 
                    class="px-3 py-1 rounded ${currentActivityPage === 1 ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-indigo-600 text-white hover:bg-indigo-700'}">
                <i class="fas fa-chevron-left"></i>
            </button>
            <span class="text-sm text-gray-600">Page ${currentActivityPage} of ${totalPages}</span>
            <button onclick="changeActivityPage(${currentActivityPage + 1})" 
                    ${currentActivityPage === totalPages ? 'disabled' : ''} 
                    class="px-3 py-1 rounded ${currentActivityPage === totalPages ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-indigo-600 text-white hover:bg-indigo-700'}">
                <i class="fas fa-chevron-right"></i>
            </button>
        `;
        
        container.appendChild(paginationDiv);
    }
}

// Change Activity Page
function changeActivityPage(page) {
    const totalPages = Math.ceil(allActivities.length / activitiesPerPage);
    if (page >= 1 && page <= totalPages) {
        currentActivityPage = page;
        displayActivitiesPage();
    }
}

function getTimeAgo(timestamp) {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return Math.floor(seconds / 60) + 'm ago';
    if (seconds < 86400) return Math.floor(seconds / 3600) + 'h ago';
    if (seconds < 604800) return Math.floor(seconds / 86400) + 'd ago';
    
    return new Date(timestamp).toLocaleDateString();
}

// Create New Customer
document.getElementById('new-customer-form').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const firstName = document.getElementById('firstName').value;
    const middleName = document.getElementById('middleName').value;
    const lastName = document.getElementById('lastName').value;
    const username = document.getElementById('username').value;
    const email = document.getElementById('email').value;
    const phone = document.getElementById('phone').value;
    const country = document.getElementById('country').value;
    const accountNumber = document.getElementById('accountNumber').value;
    const accountType = document.getElementById('accountType').value;
    const currency = document.getElementById('currency').value;
    const balance = document.getElementById('balance').value;
    const pin = document.getElementById('pin').value;
    const password = document.getElementById('password').value;
    
    const fullName = `${firstName}${middleName ? ' ' + middleName : ''} ${lastName}`;
    
    const newUser = {
        fullName: fullName,
        firstName: firstName,
        middleName: middleName,
        lastName: lastName,
        username: username,
        email: email,
        phone: phone,
        country: country,
        accountNumber: accountNumber,
        accountType: accountType,
        currency: currency,
        balance: parseFloat(balance),
        pin: pin,
        password: password,
        status: 'active',
        createdAt: Date.now(),
        createdBy: 'admin'
    };
    
    database.ref('users/' + accountNumber).set(newUser)
        .then(() => {
            alert('Customer account created successfully!');
            document.getElementById('new-customer-form').reset();
            showSection('manage-customers');
        })
        .catch((error) => {
            alert('Error creating account: ' + error.message);
        });
});

// Load Customers
function loadCustomers() {
    const tableBody = document.getElementById('customers-table-body');
    tableBody.innerHTML = '<tr><td colspan="8" class="text-center py-4">Loading...</td></tr>';
    
    database.ref('users').once('value', (snapshot) => {
        const users = snapshot.val();
        tableBody.innerHTML = '';
        
        if (!users) {
            tableBody.innerHTML = '<tr><td colspan="8" class="text-center py-4 text-gray-500">No customers found</td></tr>';
            return;
        }
        
        Object.keys(users).forEach(userId => {
            const user = users[userId];
            const row = document.createElement('tr');
            row.className = 'border-b hover:bg-gray-50';
            row.innerHTML = `
                <td class="py-3 px-2 md:px-4 text-xs md:text-sm">${user.fullName}</td>
                <td class="py-3 px-2 md:px-4 text-xs md:text-sm">${user.username}</td>
                <td class="py-3 px-2 md:px-4 text-xs md:text-sm truncate max-w-xs">${user.email}</td>
                <td class="py-3 px-2 md:px-4 text-xs md:text-sm">${user.accountNumber}</td>
                <td class="py-3 px-2 md:px-4 text-xs md:text-sm">${user.accountType || 'N/A'}</td>
                <td class="py-3 px-2 md:px-4 text-xs md:text-sm">$${parseFloat(user.balance).toLocaleString('en-US', {minimumFractionDigits: 2})}</td>
                <td class="py-3 px-2 md:px-4">
                    <span class="px-2 py-1 rounded-full text-xs ${
                        user.status === 'active' ? 'bg-green-100 text-green-700' : 
                        user.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-red-100 text-red-700'}">
                        ${user.status}
                    </span>
                </td>
                <td class="py-3 px-2 md:px-4">
                    <button onclick="openFundModal('${userId}', '${user.fullName}', '${user.accountNumber}')" class="text-green-600 hover:text-green-800 mr-2 text-sm md:text-base" title="Fund Account">
                        <i class="fas fa-dollar-sign"></i>
                    </button>
                    ${user.status === 'pending' ? `
                        <button onclick="approveUser('${userId}')" class="bg-green-500 text-white px-2 py-1 rounded hover:bg-green-600 mr-1 text-xs">
                            <i class="fas fa-check"></i>
                        </button>
                        <button onclick="rejectUser('${userId}')" class="bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600 mr-1 text-xs">
                            <i class="fas fa-times"></i>
                        </button>
                    ` : `
                        <button onclick="toggleUserStatus('${userId}', '${user.status}')" class="text-blue-600 hover:text-blue-800 mr-2 text-sm md:text-base">
                            <i class="fas fa-${user.status === 'active' ? 'ban' : 'check'}"></i>
                        </button>
                    `}
                    <button onclick="deleteUser('${userId}')" class="text-red-600 hover:text-red-800 text-sm md:text-base">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            `;
            tableBody.appendChild(row);
        });
    });
}

// Open Fund Account Modal
function openFundModal(userId, fullName, accountNumber) {
    document.getElementById('fund-user-id').value = userId;
    document.getElementById('fund-user-name').textContent = fullName;
    document.getElementById('fund-account-number').textContent = accountNumber;
    document.getElementById('fund-amount').value = '';
    document.getElementById('fund-description').value = '';
    document.getElementById('fund-modal').classList.remove('hidden');
    document.getElementById('fund-modal').classList.add('flex');
}

// Close Fund Account Modal
function closeFundModal() {
    document.getElementById('fund-modal').classList.add('hidden');
    document.getElementById('fund-modal').classList.remove('flex');
}

// Submit Fund Account
function submitFundAccount() {
    const userId = document.getElementById('fund-user-id').value;
    const amount = parseFloat(document.getElementById('fund-amount').value);
    const description = document.getElementById('fund-description').value;
    
    if (!amount || amount <= 0) {
        alert('Please enter a valid amount');
        return;
    }
    
    if (!description.trim()) {
        alert('Please enter a description');
        return;
    }
    
    const submitBtn = document.getElementById('fund-submit-btn');
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Processing...';
    submitBtn.disabled = true;
    
    // Update user balance
    database.ref('users/' + userId + '/balance').transaction((currentBalance) => {
        return (currentBalance || 0) + amount;
    })
    .then(() => {
        // Create transaction record
        return database.ref('transactions').push({
            userId: userId,
            type: 'credit',
            amount: amount,
            description: description,
            fundedBy: 'admin',
            date: Date.now(),
            status: 'completed'
        });
    })
    .then(() => {
        alert('Account funded successfully!');
        closeFundModal();
        loadCustomers();
        loadDashboardStats();
        
        submitBtn.innerHTML = '<i class="fas fa-check mr-2"></i>Fund Account';
        submitBtn.disabled = false;
    })
    .catch((error) => {
        alert('Error funding account: ' + error.message);
        submitBtn.innerHTML = '<i class="fas fa-check mr-2"></i>Fund Account';
        submitBtn.disabled = false;
    });
}

// Approve User
function approveUser(userId) {
    if (!confirm('Are you sure you want to approve this user?')) return;
    
    database.ref('users/' + userId).once('value', (snapshot) => {
        const user = snapshot.val();
        
        database.ref('users/' + userId + '/status').set('active')
            .then(() => {
                // Send approval email
                sendApprovalEmail(user);
                alert('User approved successfully! An email notification has been stored.');
                loadCustomers();
                loadDashboardStats();
            })
            .catch((error) => {
                alert('Error approving user: ' + error.message);
            });
    });
}

// Reject User
function rejectUser(userId) {
    if (!confirm('Are you sure you want to reject this user?')) return;
    
    database.ref('users/' + userId + '/status').set('rejected')
        .then(() => {
            alert('User rejected!');
            loadCustomers();
            loadDashboardStats();
        })
        .catch((error) => {
            alert('Error rejecting user: ' + error.message);
        });
}

// Send Approval Email (Stores notification in Firebase)
function sendApprovalEmail(user) {
    const emailData = {
        to: user.email,
        subject: 'Your HB Global Bank Account Has Been Approved!',
        body: `
Dear ${user.fullName},

Congratulations! Your HB Global Bank account has been approved and is now active.

Your Account Details:
- Full Name: ${user.fullName}
- Username: ${user.username}
- Account Number: ${user.accountNumber}
- Account Type: ${user.accountType}
- Currency: ${user.currency}

You can now log in to your account and start using our banking services.

Thank you for choosing HB Global Bank!

Best regards,
HB Global Bank Team
        `
    };
    
    // Store email notification in Firebase
    database.ref('notifications').push({
        userId: user.accountNumber,
        email: emailData.to,
        subject: emailData.subject,
        message: emailData.body,
        status: 'pending',
        type: 'approval',
        createdAt: Date.now()
    });
    
    console.log('Email notification stored:', emailData);
}

// Toggle User Status
function toggleUserStatus(userId, currentStatus) {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    database.ref('users/' + userId + '/status').set(newStatus)
        .then(() => {
            alert('User status updated successfully!');
            loadCustomers();
        })
        .catch((error) => {
            alert('Error updating status: ' + error.message);
        });
}

// Delete User
function deleteUser(userId) {
    if (confirm('Are you sure you want to delete this user?')) {
        database.ref('users/' + userId).remove()
            .then(() => {
                alert('User deleted successfully!');
                loadCustomers();
            })
            .catch((error) => {
                alert('Error deleting user: ' + error.message);
            });
    }
}

// Load Pending Transfers
function loadPendingTransfers() {
    const tableBody = document.getElementById('pending-transfers-body');
    tableBody.innerHTML = '<tr><td colspan="5" class="text-center py-4">Loading...</td></tr>';
    
    database.ref('transfers').orderByChild('status').equalTo('pending').once('value', (snapshot) => {
        const transfers = snapshot.val();
        tableBody.innerHTML = '';
        
        if (!transfers) {
            tableBody.innerHTML = '<tr><td colspan="5" class="text-center py-4 text-gray-500">No pending transfers</td></tr>';
            return;
        }
        
        Object.keys(transfers).forEach(transferId => {
            const transfer = transfers[transferId];
            const row = document.createElement('tr');
            row.className = 'border-b hover:bg-gray-50';
            row.innerHTML = `
                <td class="py-3 px-2 md:px-4 text-xs md:text-sm">${transfer.from}</td>
                <td class="py-3 px-2 md:px-4 text-xs md:text-sm">${transfer.to}</td>
                <td class="py-3 px-2 md:px-4 text-xs md:text-sm">$${parseFloat(transfer.amount).toLocaleString('en-US', {minimumFractionDigits: 2})}</td>
                <td class="py-3 px-2 md:px-4 text-xs md:text-sm">${new Date(transfer.date).toLocaleDateString()}</td>
                <td class="py-3 px-2 md:px-4">
                    <button onclick="approveTransfer('${transferId}')" class="bg-green-500 text-white px-2 md:px-3 py-1 rounded hover:bg-green-600 mr-1 md:mr-2 text-xs md:text-sm">
                        <i class="fas fa-check"></i><span class="hidden md:inline ml-1">Approve</span>
                    </button>
                    <button onclick="rejectTransfer('${transferId}')" class="bg-red-500 text-white px-2 md:px-3 py-1 rounded hover:bg-red-600 text-xs md:text-sm">
                        <i class="fas fa-times"></i><span class="hidden md:inline ml-1">Reject</span>
                    </button>
                </td>
            `;
            tableBody.appendChild(row);
        });
    });
}

// Approve Transfer
function approveTransfer(transferId) {
    database.ref('transfers/' + transferId).once('value', (snapshot) => {
        const transfer = snapshot.val();
        
        database.ref('transfers/' + transferId + '/status').set('approved')
            .then(() => {
                return Promise.all([
                    database.ref('users/' + transfer.from + '/balance').transaction((balance) => {
                        return (balance || 0) - parseFloat(transfer.amount);
                    }),
                    database.ref('users/' + transfer.to + '/balance').transaction((balance) => {
                        return (balance || 0) + parseFloat(transfer.amount);
                    })
                ]);
            })
            .then(() => {
                alert('Transfer approved successfully!');
                loadPendingTransfers();
                loadDashboardStats();
            })
            .catch((error) => {
                alert('Error approving transfer: ' + error.message);
            });
    });
}

// Reject Transfer
function rejectTransfer(transferId) {
    database.ref('transfers/' + transferId + '/status').set('rejected')
        .then(() => {
            alert('Transfer rejected!');
            loadPendingTransfers();
            loadDashboardStats();
        })
        .catch((error) => {
            alert('Error rejecting transfer: ' + error.message);
        });
}

// Load All Transfers
function loadAllTransfers() {
    const tableBody = document.getElementById('all-transfers-body');
    tableBody.innerHTML = '<tr><td colspan="5" class="text-center py-4">Loading...</td></tr>';
    
    database.ref('transfers').once('value', (snapshot) => {
        const transfers = snapshot.val();
        tableBody.innerHTML = '';
        
        if (!transfers) {
            tableBody.innerHTML = '<tr><td colspan="5" class="text-center py-4 text-gray-500">No transfers found</td></tr>';
            return;
        }
        
        window.allTransfersData = transfers;
        displayTransfers(transfers);
    });
}

// Display Transfers
function displayTransfers(transfers) {
    const tableBody = document.getElementById('all-transfers-body');
    tableBody.innerHTML = '';
    
    Object.keys(transfers).forEach(transferId => {
        const transfer = transfers[transferId];
        const row = document.createElement('tr');
        row.className = 'border-b hover:bg-gray-50';
        
        let statusColor = 'bg-yellow-100 text-yellow-700';
        if (transfer.status === 'approved') statusColor = 'bg-green-100 text-green-700';
        if (transfer.status === 'rejected') statusColor = 'bg-red-100 text-red-700';
        
        row.innerHTML = `
            <td class="py-3 px-2 md:px-4 text-xs md:text-sm">${transfer.from}</td>
            <td class="py-3 px-2 md:px-4 text-xs md:text-sm">${transfer.to}</td>
            <td class="py-3 px-2 md:px-4 text-xs md:text-sm">$${parseFloat(transfer.amount).toLocaleString('en-US', {minimumFractionDigits: 2})}</td>
            <td class="py-3 px-2 md:px-4 text-xs md:text-sm">${new Date(transfer.date).toLocaleDateString()}</td>
            <td class="py-3 px-2 md:px-4">
                <span class="px-2 py-1 rounded-full text-xs ${statusColor}">
                    ${transfer.status}
                </span>
            </td>
        `;
        tableBody.appendChild(row);
    });
}

// Filter Transfers
document.getElementById('status-filter').addEventListener('change', function() {
    filterTransfers();
});

document.getElementById('search-transfer').addEventListener('input', function() {
    filterTransfers();
});

function filterTransfers() {
    const searchTerm = document.getElementById('search-transfer').value.toLowerCase();
    const statusFilter = document.getElementById('status-filter').value;
    
    if (!window.allTransfersData) return;
    
    let filtered = {};
    Object.keys(window.allTransfersData).forEach(transferId => {
        const transfer = window.allTransfersData[transferId];
        const matchesSearch = transfer.from.toLowerCase().includes(searchTerm) || 
                            transfer.to.toLowerCase().includes(searchTerm);
        const matchesStatus = statusFilter === 'all' || transfer.status === statusFilter;
        
        if (matchesSearch && matchesStatus) {
            filtered[transferId] = transfer;
        }
    });
    
    displayTransfers(filtered);
}

// Sort Transfers
function sortTransfers(column) {
    if (currentSortColumn === column) {
        currentSortDirection = currentSortDirection === 'asc' ? 'desc' : 'asc';
    } else {
        currentSortColumn = column;
        currentSortDirection = 'asc';
    }
    
    if (!window.allTransfersData) return;
    
    const transfersArray = Object.keys(window.allTransfersData).map(key => ({
        id: key,
        ...window.allTransfersData[key]
    }));
    
    transfersArray.sort((a, b) => {
        let valA = a[column];
        let valB = b[column];
        
        if (column === 'amount') {
            valA = parseFloat(valA);
            valB = parseFloat(valB);
        } else if (column === 'date') {
            valA = new Date(valA).getTime();
            valB = new Date(valB).getTime();
        } else {
            valA = valA.toLowerCase();
            valB = valB.toLowerCase();
        }
        
        if (currentSortDirection === 'asc') {
            return valA > valB ? 1 : -1;
        } else {
            return valA < valB ? 1 : -1;
        }
    });
    
    const sorted = {};
    transfersArray.forEach(item => {
        const id = item.id;
        delete item.id;
        sorted[id] = item;
    });
    
    displayTransfers(sorted);
}

// Load History
function loadHistory() {
    const container = document.getElementById('history-container');
    container.innerHTML = '<p class="text-center py-4">Loading...</p>';
    
    database.ref('users').once('value', (snapshot) => {
        const users = snapshot.val();
        container.innerHTML = '';
        
        if (!users) {
            container.innerHTML = '<p class="text-center py-4 text-gray-500">No user history found</p>';
            return;
        }
        
        Object.keys(users).forEach(userId => {
            const user = users[userId];
            const card = document.createElement('div');
            card.className = 'bg-white rounded-2xl shadow-lg p-4 md:p-6 mb-4';
            card.innerHTML = `
                <div class="flex flex-col md:flex-row md:items-center justify-between mb-4 gap-4">
                    <div class="flex items-center space-x-3 md:space-x-4">
                        <div class="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0">
                            <i class="fas fa-user text-indigo-600 text-lg"></i>
                        </div>
                        <div>
                            <h3 class="font-bold text-gray-900 text-sm md:text-base">${user.fullName}</h3>
                            <p class="text-xs md:text-sm text-gray-500 truncate">${user.email}</p>
                        </div>
                    </div>
                    <span class="px-3 py-1 rounded-full text-xs self-start md:self-center ${user.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}">
                        ${user.status}
                    </span>
                </div>
                <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs md:text-sm">
                    <div>
                        <p class="text-gray-500">Account No.</p>
                        <p class="font-semibold">${user.accountNumber}</p>
                    </div>
                    <div>
                        <p class="text-gray-500">Balance</p>
                        <p class="font-semibold">${parseFloat(user.balance).toLocaleString('en-US', {minimumFractionDigits: 2})}</p>
                    </div>
                    <div>
                        <p class="text-gray-500">Phone</p>
                        <p class="font-semibold truncate">${user.phone}</p>
                    </div>
                    <div>
                        <p class="text-gray-500">Created</p>
                        <p class="font-semibold">${new Date(user.createdAt).toLocaleDateString()}</p>
                    </div>
                </div>
            `;
            container.appendChild(card);
        });
    });
}

// Logout
function logout() {
    if (confirm('Are you sure you want to logout?')) {
        // Sign out from Firebase
        firebase.auth().signOut().then(() => {
            // Clear session storage
            sessionStorage.removeItem('adminLoggedIn');
            sessionStorage.removeItem('adminEmail');
            
            // Redirect to login page
            window.location.href = 'admin_login.html';
        }).catch((error) => {
            console.error('Logout error:', error);
            alert('Error logging out. Please try again.');
        });
    }
}