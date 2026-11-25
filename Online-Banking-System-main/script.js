// ==========================================
// STATE MANAGEMENT & LOCAL STORAGE SETUP
// ==========================================

// Prepopulate database with default user if empty
if (!localStorage.getItem("users")) {
    const defaultUsers = [
        {
            name: "Amit Parmar",
            email: "amit@gmail.com",
            password: "123",
            balance: 50000,
            accountNumber: "ACC20394857",
            avatar: "https://i.pravatar.cc/150?img=12",
            limit: 25000,
            transactions: [
                { type: "Deposit", amount: 12000, details: "Opening Balance Deposit", date: "May 20, 2026" },
                { type: "Withdraw", amount: 5000, details: "ATM Cash Withdrawal", date: "May 21, 2026" },
                { type: "Transfer", amount: 3000, details: "Sent to Rahul Roy", date: "May 22, 2026" }
            ]
        }
    ];
    localStorage.setItem("users", JSON.stringify(defaultUsers));
}

let users = JSON.parse(localStorage.getItem("users"));
let currentUser = JSON.parse(localStorage.getItem("currentUser")) || null;

// ==========================================
// CURRENCY EXCHANGE RATE CONVERSION ENGINE
// ==========================================
const EXCHANGE_RATES = {
    "₹": 1.0,      // INR Base
    "$": 83.33,    // USD (1 USD = 83.33 INR)
    "€": 90.91,    // EUR (1 EUR = 90.91 INR)
    "£": 106.38    // GBP (1 GBP = 106.38 INR)
};

function getDisplayCurrency() {
    return localStorage.getItem("currency") || "₹";
}

function formatCurrency(amountBase) {
    const currency = getDisplayCurrency();
    const rate = EXCHANGE_RATES[currency] || 1.0;
    const converted = amountBase / rate;
    
    if (currency === "₹") {
        return currency + " " + Math.round(converted).toLocaleString();
    } else {
        return currency + " " + converted.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }
}

function convertBaseToDisplayVal(amountBase) {
    const currency = getDisplayCurrency();
    const rate = EXCHANGE_RATES[currency] || 1.0;
    return amountBase / rate;
}

function convertDisplayToBaseVal(amountDisplay) {
    const currency = getDisplayCurrency();
    const rate = EXCHANGE_RATES[currency] || 1.0;
    return amountDisplay * rate;
}

// ==========================================
// SOUND SYNTHESISER (Web Audio API)
// ==========================================
function playClickSound() {
    try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!AudioContext) return;
        const ctx = new AudioContext();
        
        // Short digital click
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.type = "sine";
        osc.frequency.setValueAtTime(800, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.15);
        
        gain.gain.setValueAtTime(0.08, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        osc.start();
        osc.stop(ctx.currentTime + 0.15);
    } catch (e) {
        console.log("Audio play blocked by browser policies.");
    }
}

// Bind clicks to dynamically generated buttons on document load
document.addEventListener("click", function(e) {
    if (e.target.tagName === "BUTTON" || e.target.closest("button") || e.target.classList.contains("sidebar-item") || e.target.closest(".sidebar ul li")) {
        playClickSound();
    }
});

// ==========================================
// AUTHENTICATION & SESSIONS
// ==========================================

function registerUser(event) {
    event.preventDefault();
    const fullname = document.getElementById("fullname").value.trim();
    const email = document.getElementById("email").value.trim().toLowerCase();
    const password = document.getElementById("password").value;

    if (!fullname || !email || !password) {
        showToast("Please fill all details!");
        return;
    }

    // Check duplicate email
    if (users.some(u => u.email === email)) {
        showToast("Email already registered!");
        return;
    }

    const randomAccNum = "ACC" + Math.floor(10000000 + Math.random() * 90000000);
    const newUser = {
        name: fullname,
        email: email,
        password: password,
        balance: 50000, // Initial balance
        accountNumber: randomAccNum,
        avatar: `https://i.pravatar.cc/150?img=${Math.floor(Math.random() * 70) + 1}`,
        limit: 20000,
        transactions: [
            { type: "Deposit", amount: 50000, details: "Welcome Bonus Deposit", date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) }
        ]
    };

    users.push(newUser);
    localStorage.setItem("users", JSON.stringify(users));
    showToast("Registration Successful! Redirecting...");
    setTimeout(() => {
        window.location.href = "login.html";
    }, 1500);
}

function loginUser(event) {
    event.preventDefault();
    const email = document.getElementById("loginEmail").value.trim().toLowerCase();
    const password = document.getElementById("loginPassword").value;

    const user = users.find(u => u.email === email && u.password === password);

    if (user) {
        localStorage.setItem("currentUser", JSON.stringify(user));
        showToast("Login Successful!");
        setTimeout(() => {
            window.location.href = "dashboard.html";
        }, 1200);
    } else {
        showToast("Invalid email or password!");
        const card = document.querySelector(".auth-card");
        if (card) {
            card.style.animation = "shake 0.4s ease";
            setTimeout(() => { card.style.animation = ""; }, 400);
        }
    }
}

function logoutUser() {
    showToast("Successfully logged out!");
    localStorage.removeItem("currentUser");
    setTimeout(() => {
        window.location.href = "login.html";
    }, 1200);
}

function checkSession() {
    const path = window.location.pathname;
    const page = path.substring(path.lastIndexOf('/') + 1);

    if (page === "dashboard.html") {
        if (!currentUser) {
            window.location.href = "login.html";
        }
    } else if (page === "login.html" || page === "register.html" || page === "") {
        if (currentUser) {
            window.location.href = "dashboard.html";
        }
    }
}

// Save local changes back to user database
function saveCurrentUserState() {
    localStorage.setItem("currentUser", JSON.stringify(currentUser));
    users = users.map(u => u.email === currentUser.email ? currentUser : u);
    localStorage.setItem("users", JSON.stringify(users));
}

// ==========================================
// TOAST NOTIFICATIONS
// ==========================================
function showToast(message) {
    const toast = document.getElementById("toast");
    if (!toast) return;
    toast.innerHTML = `<i class="lucide" data-lucide="info"></i> <span>${message}</span>`;
    if (window.lucide) window.lucide.createIcons();
    toast.style.display = "flex";
    
    setTimeout(() => {
        toast.style.display = "none";
    }, 3500);
}

// ==========================================
// DASHBOARD UI HANDLERS
// ==========================================

function showSection(sectionId) {
    const sections = [
        "dashboard-section",
        "transaction-section",
        "transfer-section",
        "profile-section",
        "settings-section"
    ];

    sections.forEach(section => {
        const el = document.getElementById(section);
        if (el) el.classList.add("hidden-section");
    });

    const activeEl = document.getElementById(sectionId);
    if (activeEl) {
        activeEl.classList.remove("hidden-section");
    }

    // Set active sidebar item class
    const menuItems = document.querySelectorAll(".sidebar ul li");
    menuItems.forEach(item => {
        item.classList.remove("active");
        const clickAttr = item.getAttribute("onclick");
        if (clickAttr && clickAttr.includes(sectionId)) {
            item.classList.add("active");
        }
    });
}

function toggleDarkMode() {
    const isDark = document.body.classList.toggle("dark-mode");
    localStorage.setItem("darkMode", isDark ? "enabled" : "disabled");
    
    // Update theme toggle icons if they exist
    const themeBtn = document.querySelector(".theme-toggle-btn i");
    if (themeBtn) {
        themeBtn.setAttribute("data-lucide", isDark ? "sun" : "moon");
        if (window.lucide) window.lucide.createIcons();
    }
}

function updateClock() {
    const clock = document.getElementById("liveClock");
    if (clock) {
        const options = { hour: '2-digit', minute: '2-digit', second: '2-digit' };
        clock.innerText = new Date().toLocaleTimeString(undefined, options);
    }
}

// ==========================================
// BANKING CORE FUNCTIONALITY
// ==========================================

function updateBalanceDisplay() {
    const balanceEl = document.getElementById("balance");
    if (balanceEl) {
        balanceEl.innerText = formatCurrency(currentUser.balance);
    }
}

function animateBalance(targetBase) {
    const balanceEl = document.getElementById("balance");
    if (!balanceEl) return;
    
    const currency = getDisplayCurrency();
    const targetDisplay = convertBaseToDisplayVal(targetBase);
    
    let start = 0;
    const duration = 1000; // ms
    const stepTime = 15; // ms
    const steps = duration / stepTime;
    const increment = targetDisplay / steps;
    
    let timer = setInterval(() => {
        start += increment;
        if (start >= targetDisplay) {
            start = targetDisplay;
            clearInterval(timer);
        }
        if (currency === "₹") {
            balanceEl.innerText = currency + " " + Math.round(start).toLocaleString();
        } else {
            balanceEl.innerText = currency + " " + start.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        }
    }, stepTime);
}

function addTransactionRecord(type, amount, details) {
    const newTx = {
        type: type,
        amount: parseInt(amount),
        details: details,
        date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    };
    currentUser.transactions.unshift(newTx);
    saveCurrentUserState();
    
    // Re-render UI elements
    loadDashboardData();
}

function depositMoney() {
    const currency = getDisplayCurrency();
    const amountStr = prompt(`Enter deposit amount in ${currency}:`);
    if (amountStr === null) return;
    const amountDisplay = parseFloat(amountStr);
    
    if (isNaN(amountDisplay) || amountDisplay <= 0) {
        showToast("Invalid amount entered!");
        return;
    }

    const amountBase = convertDisplayToBaseVal(amountDisplay);

    currentUser.balance += amountBase;
    addTransactionRecord("Deposit", amountBase, "Cash Deposit");
    
    addNotification(`Deposit Confirmed: ${formatCurrency(amountBase)} credited successfully`);
    showToast(`Successfully deposited ${formatCurrency(amountBase)}`);
}

function withdrawMoney() {
    const currency = getDisplayCurrency();
    const amountStr = prompt(`Enter withdrawal amount in ${currency}:`);
    if (amountStr === null) return;
    const amountDisplay = parseFloat(amountStr);
    
    if (isNaN(amountDisplay) || amountDisplay <= 0) {
        showToast("Invalid amount entered!");
        return;
    }

    const amountBase = convertDisplayToBaseVal(amountDisplay);

    if (amountBase > currentUser.balance) {
        showToast("Insufficient balance!");
        return;
    }

    // Check budget warning
    const monthlySpent = calculateMonthlyExpenses();
    const budgetLimit = currentUser.limit || 20000;
    if (currentUser.limit && (monthlySpent + amountBase) > budgetLimit) {
        showToast("Warning: This transaction will exceed your monthly budget limit!");
        addNotification(`Budget Alert: Transaction of ${formatCurrency(amountBase)} exceeds your monthly limit!`);
    }

    currentUser.balance -= amountBase;
    addTransactionRecord("Withdraw", amountBase, "ATM Cash Withdrawal");
    addNotification(`Withdrawal Alert: ${formatCurrency(amountBase)} debited from account`);
    
    showToast(`Successfully withdrew ${formatCurrency(amountBase)}`);
}

// Transfer process storage variables
let pendingTransfer = null;
let generatedOtpCode = null;

function transferMoney() {
    // Collect receiver information
    const receiverName = document.getElementById("receiverName") ? document.getElementById("receiverName").value.trim() : "";
    const receiverAmountDisplay = document.getElementById("receiverAmount") ? parseFloat(document.getElementById("receiverAmount").value) : 0;

    if (!receiverName || isNaN(receiverAmountDisplay) || receiverAmountDisplay <= 0) {
        showToast("Please enter a valid receiver name and amount!");
        return;
    }

    const receiverAmountBase = convertDisplayToBaseVal(receiverAmountDisplay);

    if (receiverAmountBase > currentUser.balance) {
        showToast("Insufficient balance for transfer!");
        return;
    }

    pendingTransfer = {
        name: receiverName,
        amount: receiverAmountBase
    };

    // Simulated OTP generation
    generatedOtpCode = Math.floor(100000 + Math.random() * 900000);
    
    // Display OTP inside OTP Verification Modal
    const otpDisplay = document.getElementById("generatedOtp");
    if (otpDisplay) {
        otpDisplay.innerText = generatedOtpCode;
    }

    const otpModal = document.getElementById("otpModal");
    if (otpModal) {
        otpModal.style.display = "flex";
    }
}

function closeOtpModal() {
    const otpModal = document.getElementById("otpModal");
    if (otpModal) {
        otpModal.style.display = "none";
    }
    pendingTransfer = null;
    generatedOtpCode = null;
    const otpInput = document.getElementById("otpInput");
    if (otpInput) otpInput.value = "";
}

function verifyOtp() {
    const otpInput = document.getElementById("otpInput") ? document.getElementById("otpInput").value.trim() : "";
    
    if (otpInput === String(generatedOtpCode)) {
        // Complete transfer
        currentUser.balance -= pendingTransfer.amount;
        addTransactionRecord("Transfer", pendingTransfer.amount, `Transferred to ${pendingTransfer.name}`);
        
        const currency = localStorage.getItem("currency") || "₹";
        addNotification(`Transfer Successful: Sent ${currency}${pendingTransfer.amount.toLocaleString()} to ${pendingTransfer.name}`);
        
        // Show success toast
        showToast(`Transferred ${currency}${pendingTransfer.amount} successfully!`);
        
        // Clear transfer forms
        if (document.getElementById("receiverName")) document.getElementById("receiverName").value = "";
        if (document.getElementById("receiverAmount")) document.getElementById("receiverAmount").value = "";
        
        closeOtpModal();
    } else {
        showToast("Invalid OTP code. Please try again.");
    }
}

// Calculate total withdrawals & transfers
function calculateMonthlyExpenses() {
    if (!currentUser.transactions) return 0;
    return currentUser.transactions
        .filter(t => t.type === "Withdraw" || t.type === "Transfer")
        .reduce((sum, t) => sum + t.amount, 0);
}

// Calculate total deposits
function calculateMonthlyDeposits() {
    if (!currentUser.transactions) return 0;
    return currentUser.transactions
        .filter(t => t.type === "Deposit")
        .reduce((sum, t) => sum + t.amount, 0);
}

// ==========================================
// PROFILE & AVATAR EDITOR
// ==========================================

function openAvatarModal() {
    const modal = document.getElementById("avatarModal");
    if (!modal) return;
    
    const grid = document.getElementById("avatarGrid");
    if (grid) {
        grid.innerHTML = "";
        // Populate modal with 16 distinct pravatars
        for (let i = 1; i <= 16; i++) {
            const url = `https://i.pravatar.cc/150?img=${i + 10}`;
            const div = document.createElement("div");
            div.className = "avatar-item" + (currentUser.avatar === url ? " selected" : "");
            div.innerHTML = `<img src="${url}" alt="Avatar ${i}">`;
            div.onclick = function() {
                // Remove previous selected
                document.querySelectorAll(".avatar-item").forEach(item => item.classList.remove("selected"));
                div.classList.add("selected");
                updateUserAvatar(url);
            };
            grid.appendChild(div);
        }
    }
    
    modal.style.display = "flex";
}

function closeAvatarModal() {
    const modal = document.getElementById("avatarModal");
    if (modal) modal.style.display = "none";
}

function updateUserAvatar(url) {
    currentUser.avatar = url;
    saveCurrentUserState();
    
    // Update visual elements
    const avatars = document.querySelectorAll(".profile-img");
    avatars.forEach(img => img.src = url);
    
    showToast("Profile avatar updated!");
    closeAvatarModal();
}

function saveProfileSettings() {
    const newName = document.getElementById("newName") ? document.getElementById("newName").value.trim() : "";
    const newPassword = document.getElementById("newPassword") ? document.getElementById("newPassword").value : "";
    const newLimit = document.getElementById("newLimit") ? parseInt(document.getElementById("newLimit").value) : 0;
    const currency = document.getElementById("currencySelect") ? document.getElementById("currencySelect").value : "₹";
    
    if (newName) {
        currentUser.name = newName;
    }
    
    if (newPassword) {
        currentUser.password = newPassword;
    }
    
    if (!isNaN(newLimit) && newLimit > 0) {
        currentUser.limit = convertDisplayToBaseVal(newLimit);
    }

    localStorage.setItem("currency", currency);
    saveCurrentUserState();
    
    loadDashboardData();
    showToast("Profile Settings Saved Successfully!");
}

// ==========================================
// CHART GENERATION (Chart.js)
// ==========================================
let financialChart = null;

function renderFinancialChart() {
    const ctx = document.getElementById("miniChart");
    if (!ctx) return;

    if (financialChart) {
        financialChart.destroy();
    }

    // Dynamic extraction of recent transactions for charts (Grouped)
    const deposits = calculateMonthlyDeposits();
    const expenses = calculateMonthlyExpenses();

    // Create stylish gradient curves
    const isDark = document.body.classList.contains("dark-mode");
    const gridColor = isDark ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.05)";
    const labelColor = isDark ? "#94a3b8" : "#475569";

    financialChart = new Chart(ctx, {
        type: "bar",
        data: {
            labels: ["Income (Deposits)", "Expenses (Withdraws + Transfers)"],
            datasets: [{
                label: "Amount",
                data: [deposits, expenses],
                backgroundColor: [
                    "rgba(16, 185, 129, 0.75)", // Emerald
                    "rgba(244, 63, 94, 0.75)"   // Rose
                ],
                borderColor: [
                    "#10b981",
                    "#f43f5e"
                ],
                borderWidth: 2,
                borderRadius: 12,
                barPercentage: 0.5
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    padding: 12,
                    cornerRadius: 12,
                    fontFamily: "Plus Jakarta Sans"
                }
            },
            scales: {
                x: {
                    grid: {
                        display: false
                    },
                    ticks: {
                        color: labelColor,
                        font: {
                            family: "Plus Jakarta Sans",
                            weight: "600"
                        }
                    }
                },
                y: {
                    grid: {
                        color: gridColor
                    },
                    ticks: {
                        color: labelColor,
                        font: {
                            family: "Plus Jakarta Sans"
                        }
                    }
                }
            }
        }
    });
}

// ==========================================
// DYNAMIC DASHBOARD DATA LOADER
// ==========================================

function loadDashboardData() {
    if (!currentUser) return;

    // Update balance text
    updateBalanceDisplay();

    // 1. Text elements
    const welcomeEl = document.getElementById("welcome");
    if (welcomeEl) welcomeEl.innerText = `Welcome, ${currentUser.name}`;

    const profileName = document.getElementById("profileName");
    if (profileName) profileName.innerText = currentUser.name;

    const profileEmail = document.getElementById("profileEmail");
    if (profileEmail) profileEmail.innerText = currentUser.email;

    const profileAcc = document.getElementById("profileAcc");
    if (profileAcc) profileAcc.innerText = currentUser.accountNumber;

    const cardHolder = document.getElementById("cardHolderName");
    if (cardHolder) cardHolder.innerText = currentUser.name.toUpperCase();

    const cardNum = document.getElementById("cardNumberDisplay");
    if (cardNum) {
        // Format acc number to space separated 4 digit groups like credit cards
        const lastDigits = currentUser.accountNumber.replace(/\D/g, "");
        cardNum.innerText = `**** **** **** ${lastDigits.substring(Math.max(0, lastDigits.length - 4)) || "2045"}`;
    }

    // 2. Settings form elements
    const newNameInput = document.getElementById("newName");
    if (newNameInput) newNameInput.value = currentUser.name;

    const newLimitInput = document.getElementById("newLimit");
    if (newLimitInput) newLimitInput.value = currentUser.limit || 20000;

    const currencySelect = document.getElementById("currencySelect");
    if (currencySelect) currencySelect.value = localStorage.getItem("currency") || "₹";

    // 3. Avatar elements
    const avatars = document.querySelectorAll(".profile-img");
    avatars.forEach(img => img.src = currentUser.avatar);

    // 4. Update ledger stats
    const depositsTotal = calculateMonthlyDeposits();
    const expensesTotal = calculateMonthlyExpenses();
    const currency = localStorage.getItem("currency") || "₹";

    const depEl = document.getElementById("totalDepositsText");
    if (depEl) depEl.innerText = currency + " " + depositsTotal.toLocaleString();

    const wthEl = document.getElementById("totalWithdrawalsText");
    if (wthEl) wthEl.innerText = currency + " " + expensesTotal.toLocaleString();

    const trfEl = document.getElementById("totalTransfersText");
    if (trfEl) {
        const trfs = currentUser.transactions
            .filter(t => t.type === "Transfer")
            .reduce((sum, t) => sum + t.amount, 0);
        trfEl.innerText = currency + " " + trfs.toLocaleString();
    }

    const totalTxCount = document.getElementById("totalTransactions");
    if (totalTxCount) totalTxCount.innerText = currentUser.transactions.length;

    // 5. Budget Progress calculations
    const budgetLimit = currentUser.limit || 20000;
    const progressPercent = Math.min(100, (expensesTotal / budgetLimit) * 100);
    
    const progressFill = document.getElementById("budgetProgressBarFill");
    if (progressFill) {
        progressFill.style.width = progressPercent + "%";
        progressFill.className = "progress-bar-fill"; // reset
        if (progressPercent >= 100) {
            progressFill.classList.add("danger");
        } else if (progressPercent >= 80) {
            progressFill.classList.add("warning");
        }
    }

    const budgetLimitText = document.getElementById("budgetLimitText");
    if (budgetLimitText) budgetLimitText.innerText = currency + " " + budgetLimit.toLocaleString();

    const budgetSpentText = document.getElementById("budgetSpentText");
    if (budgetSpentText) budgetSpentText.innerText = currency + " " + expensesTotal.toLocaleString();

    const budgetWarning = document.getElementById("budgetWarningText");
    if (budgetWarning) {
        if (expensesTotal > budgetLimit) {
            budgetWarning.innerText = "Monthly limit exceeded!";
            budgetWarning.className = "budget-info-text alert";
        } else if (progressPercent >= 80) {
            budgetWarning.innerText = "Approaching spending limit!";
            budgetWarning.className = "budget-info-text warning-text"; // style custom mapping
            budgetWarning.style.color = "var(--warning)";
        } else {
            budgetWarning.innerText = "Monthly spend tracker is active";
            budgetWarning.className = "budget-info-text";
            budgetWarning.style.color = "";
        }
    }

    // 6. Timeline list
    const timelineEl = document.getElementById("timeline");
    if (timelineEl) {
        timelineEl.innerHTML = "";
        const recents = currentUser.transactions.slice(0, 4);
        if (recents.length === 0) {
            timelineEl.innerHTML = `<div class="timeline-item"><p style="color:var(--text-secondary)">No recent actions logged</p></div>`;
        } else {
            recents.forEach(tx => {
                const item = document.createElement("div");
                let typeClass = tx.type.toLowerCase();
                let icon = "arrow-down-left";
                if (tx.type === "Withdraw") icon = "arrow-up-right";
                if (tx.type === "Transfer") icon = "send";
                
                item.className = `timeline-item ${typeClass}`;
                item.innerHTML = `
                    <div class="timeline-icon">
                        <i data-lucide="${icon}"></i>
                    </div>
                    <div class="timeline-details">
                        <p>${tx.details || (tx.type + " Operation")}</p>
                        <span>${tx.date} • ${currency}${tx.amount.toLocaleString()}</span>
                    </div>
                `;
                timelineEl.appendChild(item);
            });
        }
    }

    // 7. Transaction table view
    const txTable = document.getElementById("transaction-table");
    if (txTable) {
        // Clear rows except header
        txTable.innerHTML = `
            <tr>
                <th>Type</th>
                <th>Details</th>
                <th>Date</th>
                <th>Amount</th>
            </tr>
        `;
        
        currentUser.transactions.forEach(tx => {
            const row = document.createElement("tr");
            const isIncoming = tx.type === "Deposit";
            
            row.innerHTML = `
                <td><span class="status-badge ${isIncoming ? 'in' : 'out'}">${tx.type}</span></td>
                <td>${tx.details || "Bank Operation"}</td>
                <td>${tx.date}</td>
                <td style="font-weight: 700; color: ${isIncoming ? 'var(--success)' : 'var(--danger)'}">
                    ${isIncoming ? '+' : '-'}${currency}${tx.amount.toLocaleString()}
                </td>
            `;
            txTable.appendChild(row);
        });
    }

    // Re-render charts & icons
    renderFinancialChart();
    if (window.lucide) window.lucide.createIcons();
}

// Search utility
document.addEventListener("DOMContentLoaded", () => {
    const searchInput = document.getElementById("searchInput");
    if (searchInput) {
        searchInput.addEventListener("keyup", function() {
            const query = this.value.toLowerCase();
            const rows = document.querySelectorAll("#transaction-table tr");
            rows.forEach((row, idx) => {
                if (idx === 0) return; // skip header
                const text = row.textContent.toLowerCase();
                row.style.display = text.includes(query) ? "" : "none";
            });
        });
    }
});

// ==========================================
// AI CHATBOT SYSTEM
// ==========================================

function toggleAiChat() {
    const chat = document.getElementById("aiChat");
    if (!chat) return;
    
    if (chat.style.display === "flex") {
        chat.style.display = "none";
    } else {
        chat.style.display = "flex";
        scrollToBottomChat();
    }
}

function scrollToBottomChat() {
    const body = document.getElementById("aiMessages");
    if (body) {
        body.scrollTop = body.scrollHeight;
    }
}

function sendAiMessage() {
    const input = document.getElementById("aiInput");
    if (!input || !input.value.trim()) return;

    const messageText = input.value.trim();
    input.value = "";

    const msgBody = document.getElementById("aiMessages");
    if (!msgBody) return;

    // Append user bubble
    msgBody.innerHTML += `
        <div class="ai-msg user">
            ${messageText}
        </div>
    `;
    scrollToBottomChat();

    // Context Analysis to simulate authentic LLM responses
    setTimeout(() => {
        const query = messageText.toLowerCase();
        let botResponse = "I'm your AI Banking assistant. You can ask me details about your balance, transaction history, limits, or general banking advice!";

        const currency = localStorage.getItem("currency") || "₹";

        if (query.includes("balance") || query.includes("how much money")) {
            botResponse = `Your current account balance is **${currency}${currentUser.balance.toLocaleString()}**. Keep it up!`;
        } else if (query.includes("transaction") || query.includes("last payment") || query.includes("history")) {
            if (currentUser.transactions && currentUser.transactions.length > 0) {
                const latest = currentUser.transactions[0];
                botResponse = `Your most recent transaction was a **${latest.type}** of **${currency}${latest.amount.toLocaleString()}** (${latest.details}) on **${latest.date}**. You have logged ${currentUser.transactions.length} total transactions.`;
            } else {
                botResponse = `You don't have any recorded transactions yet. Try depositing or withdrawing!`;
            }
        } else if (query.includes("limit") || query.includes("budget")) {
            const spent = calculateMonthlyExpenses();
            const limit = currentUser.limit || 20000;
            const remaining = limit - spent;
            if (remaining < 0) {
                botResponse = `You have spent **${currency}${spent.toLocaleString()}** which exceeds your monthly budget of **${currency}${limit.toLocaleString()}** by **${currency}${Math.abs(remaining).toLocaleString()}**! Consider scaling back your spending.`;
            } else {
                botResponse = `Your monthly budget is **${currency}${limit.toLocaleString()}**. You've spent **${currency}${spent.toLocaleString()}** so far, leaving you with **${currency}${remaining.toLocaleString()}** for the rest of the month.`;
            }
        } else if (query.includes("advice") || query.includes("save") || query.includes("spending")) {
            const spent = calculateMonthlyExpenses();
            const balance = currentUser.balance;
            if (spent > balance * 0.5) {
                botResponse = `💡 **Financial Advice:** Your expenses this month are relatively high compared to your balance. Try utilizing the 50/30/20 rule: allocate 50% for Needs, 30% for Wants, and 20% for Savings.`;
            } else {
                botResponse = `💡 **Financial Advice:** Excellent job! Your spending is well within safe thresholds. You might want to allocate some funds to auto-investment buckets or savings goals.`;
            }
        } else if (query.includes("account") || query.includes("number")) {
            botResponse = `Your account number is **${currentUser.accountNumber}**. Keep this credential safe and private.`;
        } else if (query.includes("hello") || query.includes("hi") || query.includes("hey")) {
            botResponse = `Hello ${currentUser.name}! 👋 How can I assist you with your banking needs today?`;
        }

        msgBody.innerHTML += `
            <div class="ai-msg bot">
                ${botResponse}
            </div>
        `;
        scrollToBottomChat();
    }, 850);
}

// Bind enter key on chatbot input
document.addEventListener("DOMContentLoaded", () => {
    const input = document.getElementById("aiInput");
    if (input) {
        input.addEventListener("keypress", (e) => {
            if (e.key === "Enter") {
                sendAiMessage();
            }
        });
    }
});

// Close panel/chat when clicking outside
document.addEventListener("click", function(event) {
    // AI Chat
    const chat = document.getElementById("aiChat");
    const chatBtn = document.querySelector(".ai-btn");
    if (chat && chatBtn && chat.style.display === "flex" && !chat.contains(event.target) && !chatBtn.contains(event.target)) {
        chat.style.display = "none";
    }

    // Notifications Dropdown
    const notif = document.getElementById("notifDropdown");
    const bellBtn = document.querySelector(".notification-bell");
    if (notif && bellBtn && notif.style.display === "flex" && !notif.contains(event.target) && !bellBtn.contains(event.target)) {
        notif.style.display = "none";
    }
});

// ==========================================
// NOTIFICATIONS SYSTEM
// ==========================================

function toggleNotifications(event) {
    event.stopPropagation();
    const dropdown = document.getElementById("notifDropdown");
    if (!dropdown) return;
    
    if (dropdown.style.display === "flex") {
        dropdown.style.display = "none";
    } else {
        dropdown.style.display = "flex";
        // Close AI chat if open
        const chat = document.getElementById("aiChat");
        if (chat) chat.style.display = "none";
    }
}

function loadNotifications() {
    if (!currentUser) return;
    
    // Set default notifications if none exist
    if (!currentUser.notifications) {
        currentUser.notifications = [
            { title: "Security Alert: Successful Login from Chrome", date: "Just now" },
            { title: "Deposit Confirmed: ₹50,000 Welcome Balance credited", date: "1 hour ago" },
            { title: "System Notice: Spend limits and budgets are active", date: "1 hour ago" }
        ];
        saveCurrentUserState();
    }

    const notifMessages = document.getElementById("notifMessages");
    const badge = document.getElementById("notifBadge");
    
    if (!notifMessages) return;
    notifMessages.innerHTML = "";

    const count = currentUser.notifications.length;
    
    if (badge) {
        if (count > 0) {
            badge.innerText = count;
            badge.style.display = "flex";
        } else {
            badge.style.display = "none";
        }
    }

    if (count === 0) {
        notifMessages.innerHTML = `
            <div class="notif-empty">
                <i class="lucide" data-lucide="bell-off" style="width: 24px; height: 24px; color: var(--text-secondary);"></i>
                <p>No new alerts</p>
            </div>
        `;
    } else {
        currentUser.notifications.forEach(notif => {
            const item = document.createElement("div");
            item.className = "notif-item";
            item.innerHTML = `
                <p>${notif.title}</p>
                <span>${notif.date}</span>
            `;
            notifMessages.appendChild(item);
        });
    }

    if (window.lucide) window.lucide.createIcons();
}

function clearNotifications() {
    if (!currentUser) return;
    currentUser.notifications = [];
    saveCurrentUserState();
    loadNotifications();
    showToast("Notifications cleared!");
}

function addNotification(title) {
    if (!currentUser) return;
    if (!currentUser.notifications) {
        currentUser.notifications = [];
    }
    
    const now = new Date();
    const timeStr = now.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
    
    currentUser.notifications.unshift({
        title: title,
        date: timeStr
    });
    
    saveCurrentUserState();
    loadNotifications();
}

// ==========================================
// SYSTEM LIFE-CYCLE LOADER
// ==========================================

window.onload = function() {
    // 1. Session integrity check
    checkSession();
    
    // 2. Dark mode load
    const savedTheme = localStorage.getItem("darkMode");
    if (savedTheme === "enabled") {
        document.body.classList.add("dark-mode");
        const themeBtn = document.querySelector(".theme-toggle-btn i");
        if (themeBtn) {
            themeBtn.setAttribute("data-lucide", "sun");
        }
    }

    // 3. Dashboard visual population
    if (currentUser) {
        // Run balance counter entry animation
        animateBalance(currentUser.balance);
        
        // Load rest of fields
        loadDashboardData();

        // Load notifications dropdown
        loadNotifications();
        
        // Clock loop
        setInterval(updateClock, 1000);
        updateClock();
        
        // Welcome notification
        setTimeout(() => {
            showToast(`Welcome back, ${currentUser.name}! 👋`);
        }, 1000);
    }
    
    // Hide visual loader if it exists
    const loader = document.getElementById("loader");
    if (loader) {
        loader.style.opacity = "0";
        setTimeout(() => loader.style.display = "none", 400);
    }
    
    // Icons build
    if (window.lucide) window.lucide.createIcons();
};