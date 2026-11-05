/**
 * Petty Cash & Reimbursement Monitoring Application
 * Philippine Peso (PHP) Currency & Customizable Admin Account
 */

// Global App State
const AppState = {
  users: [
    {
      id: "admin-you",
      name: "Finance Admin",
      role: "manager",
      title: "Finance Controller & Approver",
      email: "admin@company.com",
      avatar: "FA",
      color: "#0f172a",
      dept: "Executive Finance"
    }
  ],
  categories: [
    "Meals & Representation",
    "Transportation/Travel",
    "Office Supplies",
    "Communication",
    "Miscellaneous"
  ],
  adminPasscode: "ADMIN2026",
  currentUser: null,
  claims: [],
  filters: {
    tab: "all",
    search: "",
    consultantId: "all",
    category: "all",
    clientRefund: "all",
    dateFrom: "",
    dateTo: ""
  },
  currentView: "consolidated",
  activeReceipt: null,
  receiptZoom: 1,
  receiptRotation: 0,
  editingClaim: null,
  claimToRelease: null,
  claimToEditAllocation: null,
  claimToDelete: null,
  claimToViewDetail: null,
  pendingUploadReceipt: null,
  currencySymbol: "₱", // Philippine Peso
  currencyCode: "PHP",
  pcfAmount: 5000.00, // Petty Cash Fund Authorized Base Float (PHP)
  replenishments: [], // Replenishment Batches submitted to Treasury
  isServerConnected: false,
  lanIp: null,
  serverPort: 8080,
  cloudConfig: {
    url: "",
    key: "",
    connected: false
  }
};

// Storage keys (v5 clean: zero dummy records & zero dummy consultants)
const STORAGE_KEY_CLAIMS = "PETTY_CASH_CLAIMS_V5_CLEAN";
const STORAGE_KEY_USER = "PETTY_CASH_USER_V5_CLEAN";
const STORAGE_KEY_USERS_LIST = "PETTY_CASH_USERS_LIST_V5_CLEAN";
const STORAGE_KEY_ADMIN_PROFILE = "PETTY_CASH_ADMIN_PROFILE_V5_CLEAN";
const STORAGE_KEY_ADMIN_PASSCODE = "PETTY_CASH_ADMIN_PASSCODE_V5_CLEAN";
const STORAGE_KEY_PCF_AMOUNT = "PETTY_CASH_PCF_AMOUNT_V5";
const STORAGE_KEY_REPLENISHMENTS = "PETTY_CASH_REPLENISHMENTS_V5";

// Initialize Application
function initApp() {
  loadAdminProfile();
  loadPcfSettings();
  loadUsersList();
  loadStoredUser();
  loadClaimsData();
  setupEventListeners();
  populateDropdowns();
  updateUserInterface();
  checkServerConnection();
  initCloudSync();
  initCentralApiSync();
}

// 1. Admin Account Customization
function loadAdminProfile() {
  const savedPasscode = localStorage.getItem(STORAGE_KEY_ADMIN_PASSCODE) || localStorage.getItem("PETTY_CASH_ADMIN_PASSCODE_V4_PHP");
  if (savedPasscode) {
    AppState.adminPasscode = savedPasscode;
  }

  const savedAdminJson = localStorage.getItem(STORAGE_KEY_ADMIN_PROFILE) || localStorage.getItem("PETTY_CASH_ADMIN_PROFILE_V4_PHP");
  if (savedAdminJson) {
    try {
      const savedAdmin = JSON.parse(savedAdminJson);
      if (savedAdmin && savedAdmin.name) {
        const adminIndex = AppState.users.findIndex(u => u.id === 'admin-you' || u.role === 'manager');
        if (adminIndex !== -1) {
          AppState.users[adminIndex] = { ...AppState.users[adminIndex], ...savedAdmin, role: 'manager' };
        } else {
          AppState.users.unshift({ id: 'admin-you', role: 'manager', ...savedAdmin });
        }
      }
    } catch (e) {
      console.warn("Could not load custom admin profile", e);
    }
  }
}

function openEditAdminModal() {
  if (!AppState.currentUser || AppState.currentUser.role !== 'manager') {
    return showToast("Access Denied: Admin profile configuration is restricted to Admin.", "danger");
  }

  const adminUser = AppState.users.find(u => u.id === 'admin-you') || AppState.users.find(u => u.role === 'manager') || AppState.users[0] || {
    name: "",
    email: "",
    title: "",
    dept: ""
  };

  const nameInput = document.getElementById('editAdminName');
  const emailInput = document.getElementById('editAdminEmail');
  const titleInput = document.getElementById('editAdminTitle');
  const deptInput = document.getElementById('editAdminDept');
  const passcodeInput = document.getElementById('editAdminPasscode');

  if (nameInput) nameInput.value = adminUser.name || "";
  if (emailInput) emailInput.value = adminUser.email || "";
  if (titleInput) titleInput.value = adminUser.title || "";
  if (deptInput) deptInput.value = adminUser.dept || "Executive Finance";
  if (passcodeInput) passcodeInput.value = AppState.adminPasscode || "ADMIN2026";
  
  openModal('editAdminModal');
}

function handleSaveAdminProfile(event) {
  if (event && event.preventDefault) event.preventDefault();

  if (!AppState.currentUser || AppState.currentUser.role !== 'manager') {
    closeModal('editAdminModal');
    return showToast("Access Denied: Only Admin can customize the admin account.", "danger");
  }

  const nameInput = document.getElementById('editAdminName');
  const emailInput = document.getElementById('editAdminEmail');
  const titleInput = document.getElementById('editAdminTitle');
  const deptInput = document.getElementById('editAdminDept');
  const passcodeInput = document.getElementById('editAdminPasscode');

  const name = nameInput ? nameInput.value.trim() : "";
  const email = emailInput ? emailInput.value.trim().toLowerCase() : "";
  const title = (titleInput && titleInput.value.trim()) || "Finance Controller & Approver";
  const dept = (deptInput && deptInput.value.trim()) || "Executive Finance";
  const passcode = passcodeInput ? passcodeInput.value.trim() : "";

  if (!name || !email) {
    return showToast("Please provide both your name and email.", "warning");
  }

  const initials = getConsultantInitials(name);
  const updatedAdmin = {
    id: "admin-you",
    name: name,
    email: email,
    title: title,
    dept: dept,
    avatar: initials,
    role: "manager",
    color: "#0f172a"
  };

  // Update in users array
  const adminIndex = AppState.users.findIndex(u => u.id === 'admin-you' || u.role === 'manager');
  if (adminIndex !== -1) {
    AppState.users[adminIndex] = updatedAdmin;
  } else {
    AppState.users.unshift(updatedAdmin);
  }

  // Update passcode
  if (passcode) {
    AppState.adminPasscode = passcode;
    localStorage.setItem(STORAGE_KEY_ADMIN_PASSCODE, passcode);
  }

  // Save to persistent storage
  localStorage.setItem(STORAGE_KEY_ADMIN_PROFILE, JSON.stringify(updatedAdmin));
  localStorage.setItem(STORAGE_KEY_USERS_LIST, JSON.stringify(AppState.users));
  apiSyncPush();

  // Always update active session to the updated admin
  AppState.currentUser = updatedAdmin;
  localStorage.setItem(STORAGE_KEY_USER, updatedAdmin.id);

  // Sync with default seed in memory
  if (window.DEFAULT_SEED_DATA && window.DEFAULT_SEED_DATA.users) {
    window.DEFAULT_SEED_DATA.users[0] = { ...updatedAdmin };
  }

  closeModal('editAdminModal');
  populateDropdowns();
  updateUserInterface();

  showToast(`Admin profile updated to "${name}" (${email})!`, "success");
}

// 2. Data Loading & Persistence
function loadUsersList() {
  const storedUsers = localStorage.getItem(STORAGE_KEY_USERS_LIST) || localStorage.getItem("PETTY_CASH_USERS_LIST_V4_PHP");
  if (storedUsers) {
    try {
      let parsed = JSON.parse(storedUsers);
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Remove dummy consultants completely (Sarah Jenkins, Alex Rivera, Marcus Brody)
        const dummyIds = ['c1', 'c2', 'c3'];
        const dummyNames = ['Sarah Jenkins', 'Alex Rivera', 'Marcus Brody'];
        parsed = parsed.filter(u => !dummyIds.includes(u.id) && !dummyNames.includes(u.name));

        // Ensure single Master Admin remains the sole manager, and all team accounts are kept
        const customAdmin = AppState.users.find(u => u.id === 'admin-you' || u.role === 'manager') || AppState.users[0];
        const consultants = [];
        parsed.forEach(u => {
          if (u.id === 'admin-you' || u.id === customAdmin.id) return;
          // Keep all registered team accounts safely
          consultants.push({
            ...u,
            role: 'consultant'
          });
        });
        AppState.users = [customAdmin, ...consultants];
      }
    } catch (e) {
      console.warn("Using default users list", e);
    }
  }
}

function saveUsersList() {
  localStorage.setItem(STORAGE_KEY_USERS_LIST, JSON.stringify(AppState.users));
  if (AppState.currentUser) {
    populateDropdowns();
  }
  apiSyncPush();
}

function loadStoredUser() {
  const savedUserId = localStorage.getItem(STORAGE_KEY_USER) || localStorage.getItem("PETTY_CASH_USER_V4_PHP");
  const foundUser = AppState.users.find(u => u.id === savedUserId);
  // Default to the Admin Account
  AppState.currentUser = foundUser || AppState.users[0];
}

function setCurrentUser(userId) {
  const user = AppState.users.find(u => u.id === userId);
  if (!user) return;
  AppState.currentUser = user;
  localStorage.setItem(STORAGE_KEY_USER, user.id);
  
  if (user.role === 'consultant') {
    AppState.filters.consultantId = "all";
    if (AppState.currentView === 'consolidated' || AppState.currentView === 'settings') {
      switchView('transactions');
    }
  }
  
  updateUserInterface();
  showToast(`Logged in as: ${user.name} (${user.role === 'manager' ? 'ADMIN (Full Access)' : 'CONSULTANT (Self-Service)'})`, "info");
}

function loadClaimsData() {
  const storedJson = localStorage.getItem(STORAGE_KEY_CLAIMS);
  if (storedJson) {
    try {
      let claims = JSON.parse(storedJson);
      if (Array.isArray(claims)) {
        // Strip out any dummy consultant claims
        const dummyIds = ['c1', 'c2', 'c3'];
        const dummyNames = ['Sarah Jenkins', 'Alex Rivera', 'Marcus Brody'];
        claims = claims.filter(c => !dummyIds.includes(c.consultantId) && !dummyNames.includes(c.consultantName));
        AppState.claims = claims;
        return;
      }
    } catch (e) {
      console.warn("Failed to parse stored claims", e);
    }
  }

  AppState.claims = [];
  saveClaimsToStorage();
}

function saveClaimsToStorage() {
  localStorage.setItem(STORAGE_KEY_CLAIMS, JSON.stringify(AppState.claims));
  apiSyncPush();
  if (AppState.isServerConnected) {
    fetch('/api/claims/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(AppState.claims)
    }).catch(err => console.debug("Server sync skipped", err));
  }
}

async function checkServerConnection() {
  try {
    const res = await fetch('/api/health', { method: 'GET' });
    if (res.ok) {
      const data = await res.json();
      AppState.isServerConnected = true;
      if (data.lanIp) AppState.lanIp = data.lanIp;
      if (data.port) AppState.serverPort = data.port;

      const statusEl = document.getElementById('serverSyncStatus');
      if (statusEl) {
        statusEl.innerHTML = `<span class="badge" style="background:#ecfdf5;color:#059669;border:1px solid #a7f3d0;font-weight:600;padding:4px 8px;border-radius:6px;">● Live Server (Port ${AppState.serverPort})</span>`;
      }
      updateLanShareInfo();
    }
  } catch (e) {
    AppState.isServerConnected = false;
    const statusEl = document.getElementById('serverSyncStatus');
    if (statusEl) {
      statusEl.innerHTML = `<span class="badge" style="background:#f1f5f9;color:#64748b;border:1px solid #e2e8f0;padding:4px 8px;border-radius:6px;">● Persistent Storage (PHP ₱)</span>`;
    }
  }
}

// ===================================================================
// CENTRALIZED MULTI-DEVICE SYNC (VERCEL KV & LOCAL SERVER /api/db)
// ===================================================================

function initCentralApiSync() {
  apiSyncPull(true);
  // Auto-sync every 4 seconds so updates across all team devices appear almost instantaneously
  setInterval(() => {
    apiSyncPull(true);
  }, 4000);

  // Instant sync when switching back to tab or device wakes up
  if (typeof window !== 'undefined') {
    window.addEventListener('focus', () => apiSyncPull(true));
    window.addEventListener('online', () => apiSyncPull(true));
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') apiSyncPull(true);
    });
  }
}

async function apiSyncPull(isSilent = false) {
  try {
    const res = await fetch('/api/db', { method: 'GET' });
    if (res.ok) {
      const data = await res.json();
      let changed = false;

      // 1. Sync claims across all laptops/units (with non-destructive team merge)
      if (Array.isArray(data.claims)) {
        if (data.claims.length > 0) {
          const remoteIds = new Set(data.claims.map(c => c.id));
          const localOnly = AppState.claims.filter(c => !remoteIds.has(c.id) && c.createdAt && (Date.now() - new Date(c.createdAt).getTime() < 300000));
          
          let mergedClaims = data.claims;
          if (localOnly.length > 0) {
            mergedClaims = [...localOnly, ...data.claims];
            setTimeout(apiSyncPush, 200);
          }

          if (JSON.stringify(AppState.claims) !== JSON.stringify(mergedClaims)) {
            AppState.claims = mergedClaims;
            localStorage.setItem(STORAGE_KEY_CLAIMS, JSON.stringify(AppState.claims));
            changed = true;
          }
        }
      }

      // 2. Sync consultants & single admin across all laptops/units
      if (Array.isArray(data.users)) {
        // Enforce: ONLY ONE ADMIN allowed (customized admin profile)
        const localAdmin = AppState.users.find(u => u.id === 'admin-you' || u.role === 'manager') || AppState.users[0];
        const cloudAdmin = data.users.find(u => u.id === 'admin-you' || u.role === 'manager');
        const activeAdmin = (cloudAdmin && cloudAdmin.email && cloudAdmin.email !== 'admin@company.com') ? cloudAdmin : localAdmin;

        // Build unified list of consultants (no duplicates, no lost accounts)
        const consultantMap = new Map();
        
        // 1. Add cloud consultants
        data.users.forEach(u => {
          if (u && u.id !== 'admin-you' && u.role !== 'manager') {
            const key = (u.email || u.id).toLowerCase();
            consultantMap.set(key, u);
          }
        });

        // 2. Add local consultants (so any consultant created locally is preserved and pushed)
        let localHasUnsynced = false;
        AppState.users.forEach(u => {
          if (u && u.id !== 'admin-you' && u.role !== 'manager') {
            const key = (u.email || u.id).toLowerCase();
            if (!consultantMap.has(key)) {
              consultantMap.set(key, u);
              localHasUnsynced = true;
            }
          }
        });

        const merged = [activeAdmin, ...Array.from(consultantMap.values())];

        if (JSON.stringify(AppState.users) !== JSON.stringify(merged)) {
          AppState.users = merged;
          localStorage.setItem(STORAGE_KEY_USERS_LIST, JSON.stringify(AppState.users));
          populateDropdowns();
          renderQuickLoginList();
          changed = true;
        }

        if (localHasUnsynced) {
          setTimeout(apiSyncPush, 150);
        }
      }

      // 3. Sync PCF float & replenishments across all units
      if (data.pcfAmount !== undefined && !isNaN(parseFloat(data.pcfAmount))) {
        const cloudPcf = parseFloat(data.pcfAmount);
        if (cloudPcf > 0 && cloudPcf !== AppState.pcfAmount) {
          AppState.pcfAmount = cloudPcf;
          localStorage.setItem(STORAGE_KEY_PCF_AMOUNT, AppState.pcfAmount.toString());
          changed = true;
        }
      }
      if (Array.isArray(data.replenishments)) {
        if (JSON.stringify(AppState.replenishments) !== JSON.stringify(data.replenishments) && data.replenishments.length > 0) {
          AppState.replenishments = data.replenishments;
          localStorage.setItem(STORAGE_KEY_REPLENISHMENTS, JSON.stringify(AppState.replenishments));
          changed = true;
        }
      }

      if (data.adminPasscode && typeof data.adminPasscode === 'string' && data.adminPasscode.trim()) {
        if (AppState.adminPasscode !== data.adminPasscode) {
          AppState.adminPasscode = data.adminPasscode;
          localStorage.setItem(STORAGE_KEY_ADMIN_PASSCODE, data.adminPasscode);
        }
      }

      // 4. Auto-Seed Cloud Database if it was newly connected and this browser has local records/accounts
      const isCloudEmpty = (!data.claims || data.claims.length === 0) && (!data.users || data.users.length <= 1) && (!data.replenishments || data.replenishments.length === 0);
      const hasLocalData = AppState.claims.length > 0 || (AppState.users && AppState.users.length > 1) || (AppState.pcfAmount && AppState.pcfAmount !== 5000);
      if (isCloudEmpty && hasLocalData) {
        console.log("Central database is newly connected and empty. Seeding with current accounts and records...");
        apiSyncPush();
      }

      if (changed) {
        renderAll();
      }

      const statusEl = document.getElementById('serverSyncStatus');
      if (statusEl && !AppState.cloudConfig.connected) {
        statusEl.innerHTML = `<span class="badge" style="background:#ecfdf5;color:#059669;border:1px solid #a7f3d0;font-weight:700;padding:4px 8px;border-radius:6px;" title="Connected to central database. All laptops share the same live data.">● Central Synced</span>`;
      }

      const cloudBadge = document.getElementById('settingCloudStateBadge');
      if (cloudBadge && !AppState.cloudConfig.connected) {
        cloudBadge.className = 'badge';
        cloudBadge.style.cssText = 'background:#ecfdf5; color:#059669; border:1px solid #a7f3d0; font-weight:700; padding:5px 12px;';
        cloudBadge.textContent = '🟢 Central Synced (Vercel Redis)';
      }
    }
  } catch (err) {
    console.debug("apiSyncPull skipped", err);
  }
}

async function apiSyncPush() {
  try {
    const payload = {
      claims: AppState.claims,
      users: AppState.users,
      pcfAmount: AppState.pcfAmount,
      replenishments: AppState.replenishments,
      adminPasscode: AppState.adminPasscode,
      updatedAt: new Date().toISOString()
    };
    await fetch('/api/db', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
  } catch (err) {
    console.debug("apiSyncPush skipped", err);
  }
}

// ===================================================================
// REMOTE TEAM CLOUD SYNC (SUPABASE POSTGRESQL + REST API)
// ===================================================================

function initCloudSync() {
  const cfgUrl = (window.APP_CONFIG && window.APP_CONFIG.supabaseUrl) || localStorage.getItem('PETTY_CASH_CLOUD_URL') || '';
  const cfgKey = (window.APP_CONFIG && window.APP_CONFIG.supabaseKey) || localStorage.getItem('PETTY_CASH_CLOUD_KEY') || '';

  if (cfgUrl && cfgKey) {
    AppState.cloudConfig.url = cfgUrl.trim().replace(/\/+$/, '');
    AppState.cloudConfig.key = cfgKey.trim();
    AppState.cloudConfig.connected = true;

    updateCloudStatusBadge(true);
    cloudSyncPull();

    const intervalSec = (window.APP_CONFIG && window.APP_CONFIG.autoSyncIntervalSec) || 15;
    setInterval(() => {
      cloudSyncPull(true); // silent background poll
    }, intervalSec * 1000);
  } else {
    AppState.cloudConfig.connected = false;
    updateCloudStatusBadge(false);
  }
}

async function cloudFetch(path, options = {}) {
  if (!AppState.cloudConfig.connected || !AppState.cloudConfig.url || !AppState.cloudConfig.key) return null;
  const baseUrl = AppState.cloudConfig.url.replace(/\/+$/, '');
  const url = `${baseUrl}/rest/v1/${path}`;
  const headers = {
    'apikey': AppState.cloudConfig.key,
    'Authorization': `Bearer ${AppState.cloudConfig.key}`,
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };
  return fetch(url, { ...options, headers });
}

async function cloudSyncPull(isSilent = false) {
  if (!AppState.cloudConfig.connected) return;
  try {
    // 1. Pull Users
    const usersRes = await cloudFetch('users?select=*');
    if (usersRes && usersRes.ok) {
      const cloudUsers = await usersRes.json();
      if (Array.isArray(cloudUsers) && cloudUsers.length > 0) {
        const adminUser = AppState.users.find(u => u.id === 'admin-you' || u.role === 'manager') || AppState.users[0];
        const cloudConsultants = cloudUsers.filter(u => u.id !== 'admin-you' && u.role !== 'manager');
        AppState.users = [adminUser, ...cloudConsultants];
        localStorage.setItem(STORAGE_KEY_USERS_LIST, JSON.stringify(AppState.users));
        populateDropdowns();
      }
    }

    // 2. Pull Claims
    const claimsRes = await cloudFetch('claims?select=*&order=submitted_at.desc');
    if (claimsRes && claimsRes.ok) {
      const cloudClaims = await claimsRes.json();
      if (Array.isArray(cloudClaims)) {
        AppState.claims = cloudClaims.map(c => ({
          id: c.id,
          date: c.date,
          consultantId: c.consultant_id,
          consultantName: c.consultant_name,
          amount: parseFloat(c.amount) || 0,
          description: c.description,
          category: c.category,
          isClientRefund: !!c.is_client_refund,
          clientName: c.client_name || '',
          status: c.status || 'Pending',
          replenishStatus: c.replenish_status || 'none',
          replenishBatchId: c.replenish_batch_id || null,
          receipt: (c.receipt_name && c.receipt_data) ? {
            name: c.receipt_name,
            type: c.receipt_type || 'image/jpeg',
            size: c.receipt_size || 0,
            dataUrl: c.receipt_data
          } : null,
          submittedAt: c.submitted_at || null,
          releasedAt: c.released_at || null,
          releasedBy: c.released_by || null,
          auditLog: Array.isArray(c.audit_log) ? c.audit_log : []
        }));
        localStorage.setItem(STORAGE_KEY_CLAIMS, JSON.stringify(AppState.claims));
      }
    }

    // 3. Pull PCF Float & Replenishments
    const pcfRes = await cloudFetch('pcf_settings?key=eq.default_pcf&select=*');
    if (pcfRes && pcfRes.ok) {
      const pcfData = await pcfRes.json();
      if (Array.isArray(pcfData) && pcfData.length > 0) {
        const row = pcfData[0];
        if (row.pcf_amount !== undefined && !isNaN(parseFloat(row.pcf_amount))) {
          AppState.pcfAmount = parseFloat(row.pcf_amount);
        }
        if (Array.isArray(row.replenishments)) {
          AppState.replenishments = row.replenishments;
        }
        localStorage.setItem(STORAGE_KEY_PCF_AMOUNT, AppState.pcfAmount.toString());
        localStorage.setItem(STORAGE_KEY_REPLENISHMENTS, JSON.stringify(AppState.replenishments));
      }
    }

    renderAll();
    updateCloudStatusBadge(true);
    if (!isSilent) showToast("Cloud Database: All remote consultant records synced successfully!", "success");
  } catch (err) {
    console.warn("Cloud sync pull error:", err);
    updateCloudStatusBadge(false);
  }
}

async function cloudSyncPushClaim(claim, action = 'upsert') {
  if (!AppState.cloudConfig.connected) return;
  try {
    if (action === 'delete') {
      await cloudFetch(`claims?id=eq.${encodeURIComponent(claim.id)}`, {
        method: 'DELETE'
      });
    } else {
      const payload = {
        id: claim.id,
        date: claim.date,
        consultant_id: claim.consultantId,
        consultant_name: claim.consultantName,
        amount: claim.amount,
        description: claim.description,
        category: claim.category,
        is_client_refund: claim.isClientRefund,
        client_name: claim.clientName || '',
        status: claim.status,
        replenish_status: claim.replenishStatus || 'none',
        replenish_batch_id: claim.replenishBatchId || null,
        receipt_name: claim.receipt ? claim.receipt.name : null,
        receipt_type: claim.receipt ? claim.receipt.type : null,
        receipt_size: claim.receipt ? claim.receipt.size : null,
        receipt_data: claim.receipt ? claim.receipt.dataUrl : null,
        submitted_at: claim.submittedAt || null,
        released_at: claim.releasedAt || null,
        released_by: claim.releasedBy || null,
        audit_log: claim.auditLog || []
      };

      await cloudFetch('claims', {
        method: 'POST',
        headers: { 'Prefer': 'resolution=merge-duplicates' },
        body: JSON.stringify(payload)
      });
    }
  } catch (e) {
    console.warn("Cloud sync push claim error:", e);
  }
}

async function cloudSyncPushUser(user) {
  if (!AppState.cloudConfig.connected) return;
  try {
    const payload = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      title: user.title || '',
      dept: user.dept || '',
      avatar: user.avatar || '',
      color: user.color || '#7c3aed'
    };
    await cloudFetch('users', {
      method: 'POST',
      headers: { 'Prefer': 'resolution=merge-duplicates' },
      body: JSON.stringify(payload)
    });
  } catch (e) {
    console.warn("Cloud sync push user error:", e);
  }
}

async function cloudSyncPushPcf() {
  if (!AppState.cloudConfig.connected) return;
  try {
    const payload = {
      key: 'default_pcf',
      pcf_amount: AppState.pcfAmount,
      replenishments: AppState.replenishments
    };
    await cloudFetch('pcf_settings', {
      method: 'POST',
      headers: { 'Prefer': 'resolution=merge-duplicates' },
      body: JSON.stringify(payload)
    });
  } catch (e) {
    console.warn("Cloud sync push PCF error:", e);
  }
}

async function syncPushInitialLocalData() {
  if (!AppState.cloudConfig.connected) return;
  for (const u of AppState.users) {
    await cloudSyncPushUser(u);
  }
  for (const c of AppState.claims) {
    await cloudSyncPushClaim(c, 'upsert');
  }
  await cloudSyncPushPcf();
}

async function handleSaveCloudConfig(event) {
  if (event && event.preventDefault) event.preventDefault();
  if (!AppState.currentUser || AppState.currentUser.role !== 'manager') {
    return showToast("Access Denied: Only Admin can configure Cloud Database settings.", "danger");
  }

  const urlInput = document.getElementById('settingCloudUrl');
  const keyInput = document.getElementById('settingCloudKey');
  if (!urlInput || !keyInput) return;

  const url = urlInput.value.trim().replace(/\/+$/, '');
  const key = keyInput.value.trim();

  if (!url || !key) {
    localStorage.removeItem('PETTY_CASH_CLOUD_URL');
    localStorage.removeItem('PETTY_CASH_CLOUD_KEY');
    AppState.cloudConfig.url = '';
    AppState.cloudConfig.key = '';
    AppState.cloudConfig.connected = false;
    updateCloudStatusBadge(false);
    return showToast("Cloud configuration cleared. Reverted to offline local storage.", "info");
  }

  AppState.cloudConfig.url = url;
  AppState.cloudConfig.key = key;
  AppState.cloudConfig.connected = true;
  localStorage.setItem('PETTY_CASH_CLOUD_URL', url);
  localStorage.setItem('PETTY_CASH_CLOUD_KEY', key);

  showToast("Testing connection to Supabase Cloud Database...", "info");

  try {
    const testRes = await cloudFetch('claims?select=id&limit=1');
    if (testRes && testRes.ok) {
      showToast("Connected to Supabase! Uploading current data and synchronizing...", "success");
      await syncPushInitialLocalData();
      await cloudSyncPull();
    } else {
      showToast("Connected to server, but tables were not found. Please run schema.sql in your Supabase SQL Editor!", "warning");
      updateCloudStatusBadge(false);
    }
  } catch (err) {
    showToast("Could not connect to Supabase. Check your Project URL and anon key.", "danger");
    updateCloudStatusBadge(false);
  }
}

function updateCloudStatusBadge(isOk) {
  const statusEl = document.getElementById('serverSyncStatus');
  if (statusEl) {
    if (AppState.cloudConfig.connected) {
      if (isOk) {
        statusEl.innerHTML = `<span class="badge" style="background:#ecfdf5;color:#059669;border:1px solid #a7f3d0;font-weight:700;padding:4px 8px;border-radius:6px;" title="Connected to Supabase Cloud Database. Syncing in real-time across all remote consultants.">☁️ Live Cloud Synced</span>`;
      } else {
        statusEl.innerHTML = `<span class="badge" style="background:#fef2f2;color:#dc2626;border:1px solid #fecaca;font-weight:600;padding:4px 8px;border-radius:6px;" title="Cloud sync offline. Using local storage.">⚠️ Cloud Offline</span>`;
      }
    }
  }

  const cloudUrlInput = document.getElementById('settingCloudUrl');
  const cloudKeyInput = document.getElementById('settingCloudKey');
  const cloudStateBadge = document.getElementById('settingCloudStateBadge');
  if (cloudUrlInput && !cloudUrlInput.value) cloudUrlInput.value = AppState.cloudConfig.url || '';
  if (cloudKeyInput && !cloudKeyInput.value) cloudKeyInput.value = AppState.cloudConfig.key || '';
  if (cloudStateBadge) {
    if (AppState.cloudConfig.connected && isOk) {
      cloudStateBadge.className = 'badge';
      cloudStateBadge.style.cssText = 'background:#ecfdf5; color:#059669; border:1px solid #a7f3d0; font-weight:700; padding:5px 12px;';
      cloudStateBadge.textContent = '🟢 Connected & Syncing';
    } else {
      cloudStateBadge.className = 'badge';
      cloudStateBadge.style.cssText = 'background:#f1f5f9; color:#64748b; border:1px solid #e2e8f0; font-weight:600; padding:5px 12px;';
      cloudStateBadge.textContent = '⚪ Offline / Local Mode';
    }
  }
}

function updateLanShareInfo() {
  const banner = document.getElementById('lanShareContainer');
  if (banner) {
    const ip = AppState.lanIp || 'localhost';
    const port = AppState.serverPort || 8080;
    const url = `http://${ip}:${port}`;
    banner.innerHTML = `
      <div class="share-lan-banner">
        <div>
          <div style="font-weight:700; font-size:1rem; display:flex; align-items:center; gap:8px;">
            <span>🌐</span> Multi-Consultant Team Access URL
          </div>
          <div style="font-size:0.85rem; color:#94a3b8; margin-top:4px;">
            Colleagues on your network can open this link on their phones or laptops to register accounts and submit claims:
          </div>
        </div>
        <div style="display:flex; align-items:center; gap:10px;">
          <span class="share-lan-code">${url}</span>
          <button class="btn btn-sm btn-secondary" onclick="copyLanUrl('${url}')" style="background:#fff; color:#0f172a;">Copy Link</button>
        </div>
      </div>
    `;
  }
}

function copyLanUrl(url) {
  navigator.clipboard.writeText(url).then(() => {
    showToast("Team access link copied to clipboard!", "success");
  }).catch(() => {
    showToast(`URL: ${url}`, "info");
  });
}

function resetToDefaultSeed() {
  if (confirm("Reset all claims to original sample seed data in Philippine Peso (₱)? Any new entries will be replaced.")) {
    if (window.DEFAULT_SEED_DATA && window.DEFAULT_SEED_DATA.claims) {
      AppState.claims = JSON.parse(JSON.stringify(window.DEFAULT_SEED_DATA.claims));
      saveClaimsToStorage();
      renderAll();
      showToast("Database restored to default sample records in Philippine Peso (₱).", "success");
    } else {
      showToast("Seed data not found.", "warning");
    }
  }
}

// ===================================================================
// PETTY CASH FUND (PCF) & REPLENISHMENT MANAGEMENT
// ===================================================================

function loadPcfSettings() {
  const savedPcf = localStorage.getItem(STORAGE_KEY_PCF_AMOUNT);
  if (savedPcf !== null && !isNaN(parseFloat(savedPcf))) {
    AppState.pcfAmount = parseFloat(savedPcf);
  } else {
    AppState.pcfAmount = 5000.00;
  }

  const savedReplenishments = localStorage.getItem(STORAGE_KEY_REPLENISHMENTS);
  if (savedReplenishments) {
    try {
      const parsed = JSON.parse(savedReplenishments);
      if (Array.isArray(parsed)) {
        AppState.replenishments = parsed;
      }
    } catch (e) {
      console.warn("Could not parse saved replenishment batches", e);
      AppState.replenishments = [];
    }
  }
}

function savePcfSettings() {
  localStorage.setItem(STORAGE_KEY_PCF_AMOUNT, AppState.pcfAmount.toString());
  localStorage.setItem(STORAGE_KEY_REPLENISHMENTS, JSON.stringify(AppState.replenishments));
  apiSyncPush();
  if (AppState.cloudConfig && AppState.cloudConfig.connected) {
    cloudSyncPushPcf();
  }
}

function openEditPcfModal() {
  if (!AppState.currentUser || AppState.currentUser.role !== 'manager') {
    return showToast("Access Denied: Only Admin can modify Petty Cash Fund limits.", "danger");
  }

  const input = document.getElementById('inputPcfAmount');
  if (input) {
    input.value = (AppState.pcfAmount || 5000).toFixed(2);
  }
  openModal('editPcfModal');
}

function setPcfPreset(val) {
  const input = document.getElementById('inputPcfAmount');
  if (input) {
    input.value = Number(val).toFixed(2);
  }
}

function handleSavePcfAmount(event) {
  if (event && event.preventDefault) event.preventDefault();

  if (!AppState.currentUser || AppState.currentUser.role !== 'manager') {
    closeModal('editPcfModal');
    return showToast("Access Denied: Only Admin can modify Petty Cash Fund limits.", "danger");
  }

  const input = document.getElementById('inputPcfAmount');
  if (!input) return;

  const newPcf = parseFloat(input.value);
  if (isNaN(newPcf) || newPcf < 100) {
    showToast("Please enter a valid Petty Cash Fund amount (minimum ₱100.00).", "warning");
    return;
  }

  AppState.pcfAmount = newPcf;
  savePcfSettings();
  closeModal('editPcfModal');
  renderAll();
  showToast(`Petty Cash Fund base float set to ${formatCurrency(newPcf)}. Net Cash on Hand recalculated.`, "success");
}

function getPcfBannerHTML(prefix) {
  return `
    <div class="pcf-control-banner">
      <!-- Section 1: PCF Base & Net Cash on Hand -->
      <div>
        <div class="pcf-section-header">
          <div class="pcf-section-title">
            <span>💵</span>
            <span>Petty Cash Fund (PCF) Float</span>
          </div>
          <button class="btn btn-sm btn-secondary pcf-admin-btn" id="${prefix}BtnSetPcf" onclick="openEditPcfModal()" title="Change authorized petty cash float limit">
            ✏️ Set PCF
          </button>
        </div>

        <div style="display:flex; align-items:baseline; gap:12px; margin-top:4px;">
          <div class="pcf-main-val" id="${prefix}NetCashOnHand">₱0.00</div>
          <span class="pcf-badge-healthy" id="${prefix}HealthBadge">🟢 Cash Healthy</span>
        </div>
        <div class="pcf-sub-text">
          <strong>Net Cash on Hand</strong> in drawer (out of <span id="${prefix}BaseFloatDisplay">₱5,000.00</span> authorized float)
        </div>

        <!-- Dual visual progress bar -->
        <div class="pcf-meter-container">
          <div style="display:flex; justify-content:space-between; font-size:0.75rem; color:var(--gray-500); margin-bottom:4px;">
            <span>Cash in Box: <strong id="${prefix}CashPercent">100%</strong></span>
            <span>Disbursed: <strong id="${prefix}DisbursedPercent">0%</strong></span>
          </div>
          <div class="pcf-progress-track" title="Green: Cash Available | Orange: Disbursed Vouchers">
            <div class="pcf-progress-fill-cash" id="${prefix}ProgressCash" style="width:100%;"></div>
            <div class="pcf-progress-fill-released" id="${prefix}ProgressReleased" style="width:0%;"></div>
          </div>
        </div>
      </div>

      <!-- Section 2: Released Disbursements (In Drawer) -->
      <div class="pcf-stat-card">
        <div class="pcf-stat-title">
          <span>Disbursed Vouchers</span>
          <span style="font-size:1rem;">🧾</span>
        </div>
        <div>
          <div class="pcf-stat-val" id="${prefix}DisbursedAmount" style="color:#d97706;">₱0.00</div>
          <div class="pcf-stat-sub" id="${prefix}DisbursedCount">0 released claims in drawer</div>
        </div>
        <div style="margin-top:10px;">
          <button class="btn btn-sm btn-primary pcf-admin-btn" onclick="openSubmitReplenishmentModal()" id="${prefix}BtnSubmitReplenish" style="width:100%; font-size:0.8rem; padding:6px 10px;">
            <span>📤</span> Submit for Replenishment
          </button>
          <div class="pcf-consultant-note" style="display:none; font-size:0.75rem; color:var(--gray-500); padding-top:4px;">
            Managed by Admin Custodian
          </div>
        </div>
      </div>

      <!-- Section 3: Submitted for Replenishment Monitoring -->
      <div class="pcf-stat-card">
        <div class="pcf-stat-title">
          <span>Awaiting Replenishment</span>
          <span style="font-size:1rem;">⏳</span>
        </div>
        <div>
          <div class="pcf-stat-val" id="${prefix}ReplenishAmount" style="color:#0284c7;">₱0.00</div>
          <div class="pcf-stat-sub" id="${prefix}ReplenishSub">0 claims submitted to Treasury</div>
        </div>
        <div style="margin-top:10px;">
          <button class="btn btn-sm btn-secondary pcf-admin-btn" onclick="openReceiveReplenishmentModal()" id="${prefix}BtnReceiveReplenish" style="width:100%; font-size:0.8rem; padding:6px 10px;">
            <span>📥</span> Receive Replenishment
          </button>
          <div class="pcf-consultant-note" style="display:none; font-size:0.75rem; color:var(--gray-500); padding-top:4px;">
            Treasury Reimbursement Status
          </div>
        </div>
      </div>
    </div>
  `;
}

function updatePcfDisplay() {
  const pcf = AppState.pcfAmount || 5000.00;
  const claims = AppState.claims;

  // 1. Released claims
  const releasedClaims = claims.filter(c => c.status === 'Released');
  
  // 2. In-Drawer Vouchers (released, but not yet submitted for replenishment and not replenished)
  const inDrawerClaims = releasedClaims.filter(c => !c.replenishStatus || c.replenishStatus === 'in-drawer');
  const inDrawerAmount = inDrawerClaims.reduce((sum, c) => sum + c.amount, 0);

  // 3. Submitted for Replenishment (in-transit with Treasury, waiting for check)
  const submittedClaims = releasedClaims.filter(c => c.replenishStatus === 'submitted');
  const submittedAmount = submittedClaims.reduce((sum, c) => sum + c.amount, 0);

  // 4. Replenished & Settled Vouchers
  const replenishedClaims = releasedClaims.filter(c => c.replenishStatus === 'replenished');
  const replenishedAmount = replenishedClaims.reduce((sum, c) => sum + c.amount, 0);

  // 5. Total Unreplenished Disbursements that reduce physical cash in drawer
  const totalUnreplenished = inDrawerAmount + submittedAmount;

  // 6. Net Cash on Hand in Drawer (Cannot drop below 0)
  const netCashOnHand = Math.max(0, pcf - totalUnreplenished);
  const isOverdrawn = totalUnreplenished > pcf;
  const cashPercent = Math.max(0, Math.min(100, Math.round((netCashOnHand / pcf) * 100)));
  const disbursedPercent = 100 - cashPercent;

  // Determine badge
  let badgeClass = 'pcf-badge-healthy';
  let badgeText = `🟢 Cash Healthy (${cashPercent}%)`;
  if (isOverdrawn) {
    badgeClass = 'pcf-badge-danger';
    badgeText = `⚠️ Overdrawn by ${formatCurrency(totalUnreplenished - pcf)}`;
  } else if (cashPercent < 20) {
    badgeClass = 'pcf-badge-danger';
    badgeText = `🔴 Low Cash Warning (${cashPercent}%)`;
  } else if (cashPercent < 50) {
    badgeClass = 'pcf-badge-warning';
    badgeText = `🟡 Replenish Soon (${cashPercent}%)`;
  }

  // Inject or update banners
  const prefixes = ['pcfConsolidated', 'pcfTransactions'];
  const containers = [
    document.getElementById('pcfBannerConsolidated'),
    document.getElementById('pcfBannerTransactions')
  ];

  containers.forEach((container, idx) => {
    if (!container) return;
    const prefix = prefixes[idx];
    if (!container.innerHTML.trim()) {
      container.innerHTML = getPcfBannerHTML(prefix);
    }

    const netCashEl = document.getElementById(`${prefix}NetCashOnHand`);
    const badgeEl = document.getElementById(`${prefix}HealthBadge`);
    const baseFloatEl = document.getElementById(`${prefix}BaseFloatDisplay`);
    const cashPercentEl = document.getElementById(`${prefix}CashPercent`);
    const disbursedPercentEl = document.getElementById(`${prefix}DisbursedPercent`);
    const progressCashEl = document.getElementById(`${prefix}ProgressCash`);
    const progressReleasedEl = document.getElementById(`${prefix}ProgressReleased`);

    const disbursedAmountEl = document.getElementById(`${prefix}DisbursedAmount`);
    const disbursedCountEl = document.getElementById(`${prefix}DisbursedCount`);
    const replenishAmountEl = document.getElementById(`${prefix}ReplenishAmount`);
    const replenishSubEl = document.getElementById(`${prefix}ReplenishSub`);

    if (netCashEl) netCashEl.textContent = formatCurrency(netCashOnHand);
    if (badgeEl) {
      badgeEl.className = badgeClass;
      badgeEl.textContent = badgeText;
    }
    if (baseFloatEl) baseFloatEl.textContent = formatCurrency(pcf);
    if (cashPercentEl) cashPercentEl.textContent = `${cashPercent}%`;
    if (disbursedPercentEl) disbursedPercentEl.textContent = `${disbursedPercent}%`;
    if (progressCashEl) progressCashEl.style.width = `${cashPercent}%`;
    if (progressReleasedEl) progressReleasedEl.style.width = `${disbursedPercent}%`;

    if (disbursedAmountEl) disbursedAmountEl.textContent = formatCurrency(inDrawerAmount);
    if (disbursedCountEl) {
      disbursedCountEl.textContent = `${inDrawerClaims.length} released voucher${inDrawerClaims.length === 1 ? '' : 's'} in drawer`;
    }

    if (replenishAmountEl) replenishAmountEl.textContent = formatCurrency(submittedAmount);
    if (replenishSubEl) {
      const pendingBatchesCount = AppState.replenishments.filter(r => r.status === 'submitted').length;
      replenishSubEl.textContent = `${submittedClaims.length} claim${submittedClaims.length === 1 ? '' : 's'} (${pendingBatchesCount} batch${pendingBatchesCount === 1 ? '' : 'es'}) in transit`;
    }
  });

  // Settings view displays
  const settingsPcfDisplay = document.getElementById('settingsPcfAmountDisplay');
  const settingsNetCashDisplay = document.getElementById('settingsNetCashDisplay');
  const settingsBaseFloatDisplay = document.getElementById('settingsBaseFloatDisplay');

  if (settingsPcfDisplay) settingsPcfDisplay.textContent = formatCurrency(pcf);
  if (settingsNetCashDisplay) settingsNetCashDisplay.textContent = formatCurrency(netCashOnHand);
  if (settingsBaseFloatDisplay) settingsBaseFloatDisplay.textContent = formatCurrency(pcf);

  // Tab Badges
  const tabInDrawerBadge = document.getElementById('tabBadgeInDrawer');
  const tabSubmittedBadge = document.getElementById('tabBadgeSubmitted');
  const tabReplenishedBadge = document.getElementById('tabBadgeReplenished');

  if (tabInDrawerBadge) tabInDrawerBadge.textContent = inDrawerClaims.length;
  if (tabSubmittedBadge) tabSubmittedBadge.textContent = submittedClaims.length;
  if (tabReplenishedBadge) tabReplenishedBadge.textContent = replenishedClaims.length;

  // Toggle PCF admin action buttons vs consultant informational view
  const isManager = AppState.currentUser && AppState.currentUser.role === 'manager';
  document.querySelectorAll('.pcf-admin-btn').forEach(btn => {
    btn.style.display = isManager ? '' : 'none';
  });
  document.querySelectorAll('.pcf-consultant-note').forEach(note => {
    note.style.display = isManager ? 'none' : 'block';
  });
}

function openSubmitReplenishmentModal() {
  if (!AppState.currentUser || AppState.currentUser.role !== 'manager') {
    return showToast("Access Denied: Only Admin can submit replenishment batches.", "danger");
  }

  const inDrawerClaims = AppState.claims.filter(c => c.status === 'Released' && (!c.replenishStatus || c.replenishStatus === 'in-drawer'));

  if (inDrawerClaims.length === 0) {
    const submittedCount = AppState.claims.filter(c => c.replenishStatus === 'submitted').length;
    if (submittedCount > 0) {
      showToast(`All released vouchers are already submitted for replenishment (${submittedCount} in transit). Click "Receive Replenishment" when Treasury check arrives.`, "info");
    } else {
      showToast("No released vouchers in cash drawer to submit for replenishment yet.", "warning");
    }
    return;
  }

  const now = new Date();
  const year = now.getFullYear();
  const nextSeq = String(AppState.replenishments.length + 1).padStart(3, '0');
  const batchId = `REP-${year}-${nextSeq}`;

  const batchIdInput = document.getElementById('replenishBatchId');
  const dateInput = document.getElementById('replenishDate');
  const notesInput = document.getElementById('replenishNotes');

  if (batchIdInput) batchIdInput.value = batchId;
  if (dateInput) dateInput.value = now.toISOString().split('T')[0];
  if (notesInput) notesInput.value = `Petty Cash replenishment batch for ${inDrawerClaims.length} released vouchers`;

  const totalAmount = inDrawerClaims.reduce((sum, c) => sum + c.amount, 0);
  const totalAmountEl = document.getElementById('submitReplenishTotalAmount');
  const voucherCountEl = document.getElementById('submitReplenishVoucherCount');

  if (totalAmountEl) totalAmountEl.textContent = formatCurrency(totalAmount);
  if (voucherCountEl) voucherCountEl.textContent = `${inDrawerClaims.length} Vouchers Included`;

  const listContainer = document.getElementById('submitReplenishClaimsList');
  if (listContainer) {
    listContainer.innerHTML = inDrawerClaims.map(c => `
      <div style="display:flex; justify-content:space-between; align-items:center; padding:10px 14px; border-bottom:1px solid var(--gray-100); background:var(--card-bg);">
        <div>
          <div style="font-weight:700; color:var(--gray-900); font-size:0.88rem;">${escapeHtml(c.description)}</div>
          <div style="font-size:0.75rem; color:var(--gray-500); margin-top:2px;">
            ${c.id} • ${escapeHtml(c.consultantName)} • ${c.date} • ${escapeHtml(c.category)}
          </div>
        </div>
        <div style="font-weight:800; color:#0284c7; font-size:0.95rem;">
          ${formatCurrency(c.amount)}
        </div>
      </div>
    `).join('');
  }

  openModal('submitReplenishModal');
}

function handleExecuteSubmitReplenishment(event) {
  if (event && event.preventDefault) event.preventDefault();

  if (!AppState.currentUser || AppState.currentUser.role !== 'manager') {
    closeModal('submitReplenishModal');
    return showToast("Access Denied: Only Admin can submit replenishment batches.", "danger");
  }

  const inDrawerClaims = AppState.claims.filter(c => c.status === 'Released' && (!c.replenishStatus || c.replenishStatus === 'in-drawer'));
  if (inDrawerClaims.length === 0) {
    showToast("No vouchers to submit.", "warning");
    closeModal('submitReplenishModal');
    return;
  }

  const batchIdInput = document.getElementById('replenishBatchId');
  const dateInput = document.getElementById('replenishDate');
  const notesInput = document.getElementById('replenishNotes');

  const batchId = (batchIdInput && batchIdInput.value.trim()) || `REP-${Date.now()}`;
  const submitDate = (dateInput && dateInput.value) || new Date().toISOString().split('T')[0];
  const notes = notesInput ? notesInput.value.trim() : '';
  const totalAmount = inDrawerClaims.reduce((sum, c) => sum + c.amount, 0);

  const timestamp = new Date().toISOString();
  const user = AppState.currentUser || { name: "Finance Admin" };

  // Tag claims
  inDrawerClaims.forEach(claim => {
    claim.replenishStatus = 'submitted';
    claim.replenishBatchId = batchId;
    claim.replenishSubmittedAt = timestamp;
    if (!claim.auditLog) claim.auditLog = [];
    claim.auditLog.push({
      timestamp: timestamp,
      user: `${user.name} (Manager)`,
      action: "Submitted for Replenishment",
      notes: `Voucher bundled into Replenishment Batch ${batchId} for ${formatCurrency(totalAmount)} submitted to Treasury.`
    });
  });

  // Create batch
  const batchRecord = {
    id: batchId,
    date: submitDate,
    amount: totalAmount,
    claimIds: inDrawerClaims.map(c => c.id),
    status: 'submitted',
    notes: notes,
    submittedBy: user.name,
    submittedAt: timestamp,
    receivedAt: null,
    checkRef: null
  };

  AppState.replenishments.unshift(batchRecord);

  saveClaimsToStorage();
  savePcfSettings();
  closeModal('submitReplenishModal');
  renderAll();

  showToast(`Success! Batch ${batchId} for ${formatCurrency(totalAmount)} submitted to Treasury.`, "success");
}

function openReceiveReplenishmentModal() {
  if (!AppState.currentUser || AppState.currentUser.role !== 'manager') {
    return showToast("Access Denied: Only Admin can acknowledge replenishment.", "danger");
  }

  const pendingBatches = AppState.replenishments.filter(r => r.status === 'submitted');
  const select = document.getElementById('receiveBatchSelect');

  if (pendingBatches.length === 0) {
    showToast("No pending replenishment batches waiting for reimbursement check.", "info");
    return;
  }

  if (select) {
    select.innerHTML = pendingBatches.map(b => `
      <option value="${b.id}">${b.id} — ${formatCurrency(b.amount)} (${b.claimIds.length} vouchers, submitted ${b.date})</option>
    `).join('');
  }

  const checkInput = document.getElementById('receiveCheckRef');
  const dateInput = document.getElementById('receiveDate');
  const notesInput = document.getElementById('receiveNotes');

  if (checkInput) checkInput.value = "";
  if (dateInput) dateInput.value = new Date().toISOString().split('T')[0];
  if (notesInput) notesInput.value = "Check reimbursement deposited to petty cash drawer, cash float restored.";

  onReceiveBatchSelectChange();
  openModal('receiveReplenishModal');
}

function onReceiveBatchSelectChange() {
  const select = document.getElementById('receiveBatchSelect');
  const display = document.getElementById('receiveRestoreAmountDisplay');
  if (!select || !display) return;

  const batchId = select.value;
  const batch = AppState.replenishments.find(r => r.id === batchId);
  if (batch) {
    display.textContent = formatCurrency(batch.amount);
  } else {
    display.textContent = "₱0.00";
  }
}

function handleExecuteReceiveReplenishment(event) {
  if (event && event.preventDefault) event.preventDefault();

  if (!AppState.currentUser || AppState.currentUser.role !== 'manager') {
    closeModal('receiveReplenishModal');
    return showToast("Access Denied: Only Admin can acknowledge replenishment.", "danger");
  }

  const select = document.getElementById('receiveBatchSelect');
  const checkInput = document.getElementById('receiveCheckRef');
  const dateInput = document.getElementById('receiveDate');
  const notesInput = document.getElementById('receiveNotes');

  if (!select || !select.value) {
    showToast("Please select a batch to replenish.", "warning");
    return;
  }

  const batchId = select.value;
  const checkRef = (checkInput && checkInput.value.trim()) || "TREASURY-CHK";
  const receiveDate = (dateInput && dateInput.value) || new Date().toISOString().split('T')[0];
  const notes = notesInput ? notesInput.value.trim() : '';

  const batch = AppState.replenishments.find(r => r.id === batchId);
  if (!batch) return;

  const timestamp = new Date().toISOString();
  const user = AppState.currentUser || { name: "Finance Admin" };

  batch.status = 'received';
  batch.receivedAt = timestamp;
  batch.checkRef = checkRef;
  batch.receivedDate = receiveDate;
  batch.receivedNotes = notes;

  // Update associated claims
  const targetClaims = AppState.claims.filter(c => c.replenishBatchId === batchId || batch.claimIds.includes(c.id));
  targetClaims.forEach(claim => {
    claim.replenishStatus = 'replenished';
    claim.replenishedAt = timestamp;
    claim.replenishCheckRef = checkRef;
    if (!claim.auditLog) claim.auditLog = [];
    claim.auditLog.push({
      timestamp: timestamp,
      user: `${user.name} (Manager)`,
      action: "Replenishment Check Received",
      notes: `Reimbursement received via Check/Ref #${checkRef}. Cash drawer float fully restored.`
    });
  });

  saveClaimsToStorage();
  savePcfSettings();
  closeModal('receiveReplenishModal');
  renderAll();

  showToast(`Replenishment of ${formatCurrency(batch.amount)} received (Ref: ${checkRef})! Net Cash on Hand restored.`, "success");
}

// 3. Self-Service Account Creation & Login
function openAuthModal(initialTab = 'register') {
  switchAuthTab(initialTab);
  renderQuickLoginList();
  openModal('authModal');
}

function switchAuthTab(tab) {
  const btnLogin = document.getElementById('authTabBtnLogin');
  const btnRegister = document.getElementById('authTabBtnRegister');
  const formLogin = document.getElementById('authFormLogin');
  const formRegister = document.getElementById('authFormRegister');

  if (tab === 'login') {
    if (btnLogin) btnLogin.classList.add('active');
    if (btnRegister) btnRegister.classList.remove('active');
    if (formLogin) formLogin.style.display = 'block';
    if (formRegister) formRegister.style.display = 'none';
    const emailInput = document.getElementById('loginEmail');
    if (emailInput) onLoginEmailChange(emailInput.value);
  } else {
    if (btnRegister) btnRegister.classList.add('active');
    if (btnLogin) btnLogin.classList.remove('active');
    if (formRegister) formRegister.style.display = 'block';
    if (formLogin) formLogin.style.display = 'none';
  }
}

function selectRegRole(role) {
  const cardConsultant = document.getElementById('roleCardConsultant');
  const cardManager = document.getElementById('roleCardManager');
  const adminCodeBox = document.getElementById('adminPasscodeBox');
  const inputRole = document.getElementById('regRole');

  if (role === 'manager') {
    if (cardManager) cardManager.classList.add('selected');
    if (cardConsultant) cardConsultant.classList.remove('selected');
    if (adminCodeBox) adminCodeBox.style.display = 'block';
    if (inputRole) inputRole.value = 'manager';
  } else {
    if (cardConsultant) cardConsultant.classList.add('selected');
    if (cardManager) cardManager.classList.remove('selected');
    if (adminCodeBox) adminCodeBox.style.display = 'none';
    if (inputRole) inputRole.value = 'consultant';
  }
}

function handleRegister(e) {
  e.preventDefault();

  const name = document.getElementById('regName').value.trim();
  const email = document.getElementById('regEmail').value.trim().toLowerCase();
  const role = document.getElementById('regRole').value || 'consultant';
  const title = document.getElementById('regTitle').value.trim() || (role === 'manager' ? 'Manager' : 'Consultant');
  const dept = document.getElementById('regDept').value.trim() || 'Client Consulting';
  const adminCode = document.getElementById('regAdminCode').value.trim();

  if (!name || !email) {
    return showToast("Please provide your full name and email.", "warning");
  }

  // Validate Manager Passcode
  if (role === 'manager') {
    if (adminCode !== AppState.adminPasscode) {
      return showToast("Incorrect Admin Passcode! Admin authorization required to register manager account.", "danger");
    }
  }

  // Check email collision
  const existing = AppState.users.find(u => u.email.toLowerCase() === email);
  if (existing) {
    return showToast(`An account with email "${email}" already exists. Please log in instead.`, "warning");
  }

  const colors = ["#7c3aed", "#059669", "#d97706", "#2563eb", "#db2777", "#4f46e5", "#0891b2"];
  const randomColor = (role === 'manager') ? '#0f172a' : colors[Math.floor(Math.random() * colors.length)];
  const initials = getConsultantInitials(name);
  const newId = `usr_${Date.now()}`;

  const newUser = {
    id: newId,
    name: name,
    email: email,
    role: role,
    title: title,
    dept: dept,
    avatar: initials,
    color: randomColor
  };

  AppState.users.push(newUser);
  saveUsersList();
  if (AppState.cloudConfig && AppState.cloudConfig.connected) {
    cloudSyncPushUser(newUser);
  }
  closeModal('authModal');
  setCurrentUser(newId);

  showToast(`Welcome, ${name}! Your account has been registered.`, "success");
}

function onLoginEmailChange(val) {
  const email = (val || '').trim().toLowerCase();
  const pwdGroup = document.getElementById('loginPasswordGroup');
  const pwdInput = document.getElementById('loginPassword');
  if (!pwdGroup) return;

  const admin = AppState.users.find(u => u.id === 'admin-you' || u.role === 'manager') || AppState.users[0];
  const isAdmin = admin && admin.email && admin.email.toLowerCase() === email;

  if (isAdmin) {
    pwdGroup.style.display = 'block';
    if (pwdInput) pwdInput.required = true;
  } else {
    pwdGroup.style.display = 'none';
    if (pwdInput) {
      pwdInput.required = false;
      pwdInput.value = '';
    }
  }
}

async function handleLogin(e) {
  e.preventDefault();
  const emailInput = document.getElementById('loginEmail');
  const pwdInput = document.getElementById('loginPassword');
  const email = emailInput ? emailInput.value.trim().toLowerCase() : '';

  if (!email) {
    return showToast("Please enter your registered work email.", "warning");
  }

  // 1. Check local users list
  let user = AppState.users.find(u => u.email && u.email.toLowerCase() === email);

  // 2. If not found in local browser, pull latest accounts from central cloud database
  if (!user) {
    await apiSyncPull(true);
    user = AppState.users.find(u => u.email && u.email.toLowerCase() === email);
  }

  if (!user) {
    return showToast("Account not found with this email. Please ensure your cloud database is deployed or create an account.", "warning");
  }

  // 3. Password Verification for Admin Account
  const isAdmin = (user.role === 'manager' || user.id === 'admin-you');
  if (isAdmin) {
    const pwdGroup = document.getElementById('loginPasswordGroup');
    if (pwdGroup) pwdGroup.style.display = 'block';

    const enteredPwd = pwdInput ? pwdInput.value.trim() : '';
    if (!enteredPwd) {
      if (pwdInput) pwdInput.focus();
      return showToast("Admin account selected. Please enter your Admin Password.", "info");
    }

    if (enteredPwd !== AppState.adminPasscode) {
      if (pwdInput) {
        pwdInput.focus();
        pwdInput.select();
      }
      return showToast("Incorrect Admin Password! Access Denied.", "danger");
    }
  }

  closeModal('authModal');
  setCurrentUser(user.id);
  if (isAdmin) {
    showToast(`Welcome back, ${user.name}! Admin authorization verified.`, "success");
  } else {
    showToast(`Welcome back, ${user.name}!`, "success");
  }
}

function handleLogout() {
  openAuthModal('login');
  showToast("You have been signed out.", "info");
}

function renderQuickLoginList() {
  const container = document.getElementById('quickLoginContainer');
  if (!container) return;

  container.innerHTML = AppState.users.map(u => `
    <div class="quick-user-card" onclick="quickLoginAs('${u.id}')">
      <div class="avatar-circle" style="width:30px; height:30px; font-size:0.75rem; background-color:${u.color};">
        ${u.avatar}
      </div>
      <div style="overflow:hidden;">
        <div class="quick-user-name">${escapeHtml(u.name)}${u.role === 'manager' ? ' 🔒' : ''}</div>
        <div class="quick-user-role">${u.role.toUpperCase()}</div>
      </div>
    </div>
  `).join('');
}

function quickLoginAs(userId) {
  const user = AppState.users.find(u => u.id === userId);
  if (!user) return;

  const isAdmin = (user.role === 'manager' || user.id === 'admin-you');
  if (isAdmin) {
    const entered = prompt("🔐 Admin Password Required\nPlease enter the Admin Password to access the Admin account:");
    if (entered === null) return;
    if (entered.trim() !== AppState.adminPasscode) {
      return showToast("Incorrect Admin Password! Access Denied.", "danger");
    }
  }

  closeModal('authModal');
  setCurrentUser(userId);
  showToast(`Welcome back, ${user.name}!`, "success");
}

function promptSwitchToAdmin() {
  const entered = prompt("🔐 Admin Authentication Required\nPlease enter the Admin Passcode to switch to Admin account:");
  if (entered === null) return;
  if (entered.trim() === AppState.adminPasscode) {
    const adminUser = AppState.users.find(u => u.id === 'admin-you') || AppState.users.find(u => u.role === 'manager') || AppState.users[0];
    if (adminUser) {
      setCurrentUser(adminUser.id);
      showToast(`Welcome back, ${adminUser.name}! Admin privileges unlocked.`, "success");
    }
  } else {
    showToast("Incorrect Admin Passcode! Access Denied.", "danger");
  }
}

function handleSidebarUserClick() {
  if (AppState.currentUser && AppState.currentUser.role === 'manager') {
    openEditAdminModal();
  } else {
    showToast(`Logged in as Consultant: ${AppState.currentUser.name} (${AppState.currentUser.email})`, "info");
  }
}

// 4. Dropdowns & User Selection UI
function populateDropdowns() {
  const userSelect = document.getElementById('topUserSelect');
  if (userSelect) {
    let html = '';
    const admins = AppState.users.filter(u => u.role === 'manager');
    const consultants = AppState.users.filter(u => u.role === 'consultant');
    const currentId = AppState.currentUser ? AppState.currentUser.id : (admins[0] ? admins[0].id : 'admin-you');

    html += `<optgroup label="👑 Admin / Approver">`;
    admins.forEach(u => {
      html += `<option value="${u.id}" ${u.id === currentId ? 'selected' : ''}>${u.name} (Admin)</option>`;
    });
    html += `</optgroup>`;

    if (consultants.length > 0) {
      html += `<optgroup label="💼 Active Consultants">`;
      consultants.forEach(u => {
        html += `<option value="${u.id}" ${u.id === currentId ? 'selected' : ''}>${u.name} (Consultant)</option>`;
      });
      html += `</optgroup>`;
    }

    userSelect.innerHTML = html;
  }

  const filterConsultant = document.getElementById('filterConsultant');
  if (filterConsultant) {
    let opts = '<option value="all">All Consultants</option>';
    opts += AppState.users
      .filter(u => u.role === 'consultant')
      .map(c => `<option value="${c.id}">${c.name}</option>`)
      .join('');
    filterConsultant.innerHTML = opts;
  }

  const expenseCategory = document.getElementById('expenseCategory');
  if (expenseCategory) {
    expenseCategory.innerHTML = '<option value="" disabled selected>Select an expense account...</option>' +
      AppState.categories.map(cat => `<option value="${cat}">${cat}</option>`).join('');
  }

  const editAccountCategory = document.getElementById('managerEditCategory');
  if (editAccountCategory) {
    editAccountCategory.innerHTML = AppState.categories.map(cat => `<option value="${cat}">${cat}</option>`).join('');
  }

  const filterCategory = document.getElementById('filterCategory');
  if (filterCategory) {
    filterCategory.innerHTML = '<option value="all">All Expense Accounts</option>' +
      AppState.categories.map(cat => `<option value="${cat}">${cat}</option>`).join('');
  }
}

function updateUserInterface() {
  const user = AppState.currentUser;
  if (!user) return;

  const isManager = user.role === 'manager';

  // Sidebar User Info
  const sidebarAvatar = document.getElementById('sidebarUserAvatar');
  const sidebarName = document.getElementById('sidebarUserName');
  const sidebarRole = document.getElementById('sidebarUserRole');
  if (sidebarAvatar) {
    sidebarAvatar.textContent = user.avatar;
    sidebarAvatar.style.backgroundColor = user.color || (isManager ? '#0f172a' : '#7c3aed');
  }
  if (sidebarName) sidebarName.textContent = user.name;
  if (sidebarRole) {
    sidebarRole.textContent = isManager ? 'ADMIN (APPROVER)' : 'CONSULTANT';
    sidebarRole.className = `user-role-tag ${isManager ? 'role-tag-manager' : 'role-tag-consultant'}`;
  }

  // Sidebar Navigation Items
  const navSectionAdmin = document.getElementById('navSectionAdmin');
  const navConsolidated = document.getElementById('nav-consolidated');
  const navTransactionsLabel = document.getElementById('navTransactionsLabel');
  const navSectionConfig = document.getElementById('navSectionConfig');
  const navCreateAccount = document.getElementById('nav-create-account');
  const navAdminProfile = document.getElementById('nav-admin-profile');
  const navSettings = document.getElementById('nav-settings');

  if (navSectionAdmin) navSectionAdmin.style.display = isManager ? 'block' : 'none';
  if (navConsolidated) navConsolidated.style.display = isManager ? 'flex' : 'none';
  if (navTransactionsLabel) navTransactionsLabel.textContent = isManager ? 'All Transactions' : 'My Dashboard & Claims';
  if (navSectionConfig) navSectionConfig.style.display = isManager ? 'block' : 'none';
  if (navCreateAccount) navCreateAccount.style.display = isManager ? 'flex' : 'none';
  if (navAdminProfile) navAdminProfile.style.display = isManager ? 'flex' : 'none';
  if (navSettings) navSettings.style.display = isManager ? 'flex' : 'none';

  // Topbar Controls Visibility
  const topbarRoleSwitch = document.getElementById('topbarRoleSwitchContainer');
  const topbarConsultantPill = document.getElementById('topbarConsultantPill');
  const consultantPillAvatar = document.getElementById('consultantPillAvatar');
  const consultantPillName = document.getElementById('consultantPillName');
  const btnTopAdminProfile = document.getElementById('btnTopAdminProfile');
  const btnTopCreateAccount = document.getElementById('btnTopCreateAccount');

  if (topbarRoleSwitch) topbarRoleSwitch.style.display = isManager ? 'flex' : 'none';
  if (topbarConsultantPill) {
    topbarConsultantPill.style.display = isManager ? 'none' : 'flex';
    if (!isManager) {
      if (consultantPillAvatar) {
        consultantPillAvatar.textContent = user.avatar;
        consultantPillAvatar.style.backgroundColor = user.color || '#7c3aed';
      }
      if (consultantPillName) consultantPillName.textContent = user.name;
    }
  }

  if (btnTopAdminProfile) btnTopAdminProfile.style.display = isManager ? 'inline-flex' : 'none';
  if (btnTopCreateAccount) btnTopCreateAccount.style.display = isManager ? 'inline-flex' : 'none';

  const topSelect = document.getElementById('topUserSelect');
  if (topSelect) topSelect.value = user.id;

  // New Expense form prefilled consultant name
  const formConsultantName = document.getElementById('expenseConsultantName');
  if (formConsultantName) {
    formConsultantName.value = user.name;
  }

  // Filter consultant in table
  const filterConsultant = document.getElementById('filterConsultant');
  if (filterConsultant) {
    filterConsultant.style.display = isManager ? 'inline-block' : 'none';
  }

  // Admin Profile quick card in settings
  const adminNameDisplay = document.getElementById('settingsAdminNameDisplay');
  const adminEmailDisplay = document.getElementById('settingsAdminEmailDisplay');
  const adminTitleDisplay = document.getElementById('settingsAdminTitleDisplay');
  const adminUser = AppState.users.find(u => u.id === 'admin-you') || AppState.users.find(u => u.role === 'manager') || user;

  if (adminNameDisplay) adminNameDisplay.textContent = adminUser.name;
  if (adminEmailDisplay) adminEmailDisplay.textContent = adminUser.email;
  if (adminTitleDisplay) adminTitleDisplay.textContent = adminUser.title || "Finance Controller";

  // Role Banner
  const roleHelpBanner = document.getElementById('roleHelpBanner');
  if (roleHelpBanner) {
    if (isManager) {
      roleHelpBanner.innerHTML = `
        <div style="background:#0f172a; color:#fff; border-radius:12px; padding:16px 20px; display:flex; align-items:center; justify-content:space-between; margin-bottom:24px; box-shadow:0 4px 12px rgba(15,23,42,0.15); flex-wrap:wrap; gap:12px;">
          <div style="display:flex; align-items:center; gap:14px;">
            <div style="width:42px; height:42px; border-radius:10px; background:rgba(255,255,255,0.1); display:flex; align-items:center; justify-content:center; font-size:1.4rem;">
              👑
            </div>
            <div>
              <div style="font-weight:700; font-size:0.95rem; color:#f8fafc;">
                Admin Controller Workspace: <span style="color:#38bdf8;">${escapeHtml(user.name)}</span> (${escapeHtml(user.email)})
              </div>
              <div style="font-size:0.8rem; color:#94a3b8; margin-top:2px;">
                Petty cash values in Philippine Peso (₱ PHP). You have master authorization to manage PCF float, release funds, and submit replenishments.
              </div>
            </div>
          </div>
          <div style="display:flex; gap:10px;">
            <button class="btn btn-sm btn-secondary" onclick="openEditAdminModal()" style="background:#fff; color:#0f172a; font-weight:700;">
              ✏️ Edit Admin Profile
            </button>
            <button class="btn btn-sm btn-secondary" onclick="openAuthModal('register')" style="background:rgba(255,255,255,0.1); border-color:rgba(255,255,255,0.2); color:#fff;">
              ➕ Create Account
            </button>
          </div>
        </div>
      `;
    } else {
      roleHelpBanner.innerHTML = `
        <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:12px; padding:16px 20px; display:flex; align-items:center; justify-content:space-between; margin-bottom:24px; flex-wrap:wrap; gap:12px;">
          <div style="display:flex; align-items:center; gap:12px;">
            <span style="font-size:1.4rem;">💼</span>
            <div>
              <strong style="color:#0f172a; font-size:0.92rem;">Consultant Dashboard: Welcome, ${escapeHtml(user.name)}</strong>
              <div style="color:#64748b; font-size:0.8rem; margin-top:2px;">
                View your claims dashboard, submit reimbursement expenses in ₱ PHP, and edit or delete pending requests before they are released.
              </div>
            </div>
          </div>
          <div style="display:flex; gap:8px;">
            <button class="btn btn-sm btn-primary" onclick="openSubmitExpenseModal()">➕ Submit New Expense</button>
          </div>
        </div>
      `;
    }
  }

  // If consultant attempts to stay on consolidated or settings, redirect to transactions
  if (!isManager && (AppState.currentView === 'consolidated' || AppState.currentView === 'settings')) {
    switchView('transactions');
    return;
  }

  renderAll();
}

// 5. Filtering & Search Engine
function getFilteredClaims() {
  const user = AppState.currentUser;
  const isManager = user && user.role === 'manager';
  
  return AppState.claims.filter(claim => {
    if (AppState.currentView === 'my-claims') {
      if (claim.consultantId !== user.id) return false;
    } else if (!isManager && AppState.currentView === 'transactions') {
      if (claim.consultantId !== user.id) return false;
    }

    if (AppState.filters.tab === 'pending' && claim.status !== 'Pending') return false;
    if (AppState.filters.tab === 'released' && claim.status !== 'Released') return false;
    if (AppState.filters.tab === 'in-drawer' && (claim.status !== 'Released' || claim.replenishStatus === 'submitted' || claim.replenishStatus === 'replenished')) return false;
    if (AppState.filters.tab === 'submitted' && claim.replenishStatus !== 'submitted') return false;
    if (AppState.filters.tab === 'replenished' && claim.replenishStatus !== 'replenished') return false;

    if (isManager && AppState.filters.consultantId !== 'all') {
      if (claim.consultantId !== AppState.filters.consultantId) return false;
    }

    if (AppState.filters.category !== 'all') {
      if (claim.category !== AppState.filters.category) return false;
    }

    if (AppState.filters.clientRefund === 'yes' && !claim.isClientRefund) return false;
    if (AppState.filters.clientRefund === 'no' && claim.isClientRefund) return false;

    if (AppState.filters.dateFrom && claim.date < AppState.filters.dateFrom) return false;
    if (AppState.filters.dateTo && claim.date > AppState.filters.dateTo) return false;

    if (AppState.filters.search.trim()) {
      const q = AppState.filters.search.toLowerCase().trim();
      const matchId = claim.id.toLowerCase().includes(q);
      const matchDesc = claim.description.toLowerCase().includes(q);
      const matchConsultant = claim.consultantName.toLowerCase().includes(q);
      const matchClient = (claim.clientName || "").toLowerCase().includes(q);
      const matchCategory = claim.category.toLowerCase().includes(q);
      const matchAmount = claim.amount.toString().includes(q);
      const matchBatch = (claim.replenishBatchId || "").toLowerCase().includes(q);
      if (!matchId && !matchDesc && !matchConsultant && !matchClient && !matchCategory && !matchAmount && !matchBatch) {
        return false;
      }
    }

    return true;
  });
}

// 6. KPI Calculations in Philippine Peso (₱)
function updateKPICards() {
  const user = AppState.currentUser;
  const isManager = user && user.role === 'manager';

  const scopeClaims = (isManager && AppState.currentView !== 'my-claims')
    ? AppState.claims
    : AppState.claims.filter(c => c.consultantId === user.id);

  let pendingAmount = 0;
  let pendingCount = 0;
  let releasedAmount = 0;
  let releasedCount = 0;
  let refundAmount = 0;
  let refundCount = 0;
  let totalAmount = 0;
  let totalCount = scopeClaims.length;

  scopeClaims.forEach(claim => {
    totalAmount += claim.amount;
    if (claim.status === 'Pending') {
      pendingAmount += claim.amount;
      pendingCount += 1;
    } else if (claim.status === 'Released') {
      releasedAmount += claim.amount;
      releasedCount += 1;
    }
    if (claim.isClientRefund) {
      refundAmount += claim.amount;
      refundCount += 1;
    }
  });

  const kpiPendingEl = document.getElementById('kpiPendingAmount');
  const kpiPendingCountEl = document.getElementById('kpiPendingCount');
  const kpiReleasedEl = document.getElementById('kpiReleasedAmount');
  const kpiReleasedCountEl = document.getElementById('kpiReleasedCount');
  const kpiRefundEl = document.getElementById('kpiRefundAmount');
  const kpiRefundCountEl = document.getElementById('kpiRefundCount');
  const kpiTotalEl = document.getElementById('kpiTotalAmount');
  const kpiTotalCountEl = document.getElementById('kpiTotalCount');

  if (kpiPendingEl) kpiPendingEl.textContent = formatCurrency(pendingAmount);
  if (kpiPendingCountEl) kpiPendingCountEl.textContent = `${pendingCount} request${pendingCount === 1 ? '' : 's'}`;
  
  if (kpiReleasedEl) kpiReleasedEl.textContent = formatCurrency(releasedAmount);
  if (kpiReleasedCountEl) kpiReleasedCountEl.textContent = `${releasedCount} claim${releasedCount === 1 ? '' : 's'}`;
  
  if (kpiRefundEl) kpiRefundEl.textContent = formatCurrency(refundAmount);
  if (kpiRefundCountEl) kpiRefundCountEl.textContent = `${refundCount} tagged claim${refundCount === 1 ? '' : 's'}`;

  if (kpiTotalEl) kpiTotalEl.textContent = formatCurrency(totalAmount);
  if (kpiTotalCountEl) kpiTotalCountEl.textContent = `${totalCount} total`;

  const tabPendingBadge = document.getElementById('tabBadgePending');
  const tabReleasedBadge = document.getElementById('tabBadgeReleased');
  const tabAllBadge = document.getElementById('tabBadgeAll');

  if (tabPendingBadge) tabPendingBadge.textContent = pendingCount;
  if (tabReleasedBadge) tabReleasedBadge.textContent = releasedCount;
  if (tabAllBadge) tabAllBadge.textContent = totalCount;

  // Refresh Petty Cash Fund banner & replenishment telemetry
  updatePcfDisplay();
}

// 7. Consolidated Reports & Executive Overview
function renderConsolidatedReports() {
  const container = document.getElementById('consolidatedReportsContainer');
  if (!container) return;

  const claims = AppState.claims;
  const consultants = AppState.users.filter(u => u.role === 'consultant');

  let totalSpend = 0;
  let totalPending = 0;
  let totalReleased = 0;
  let totalRefundable = 0;

  claims.forEach(c => {
    totalSpend += c.amount;
    if (c.status === 'Pending') totalPending += c.amount;
    if (c.status === 'Released') totalReleased += c.amount;
    if (c.isClientRefund) totalRefundable += c.amount;
  });

  const consultantRows = consultants.length === 0
    ? `
      <tr>
        <td colspan="7" style="text-align:center; padding:36px 20px; background:var(--gray-50); border-radius:8px;">
          <div style="font-size:2rem; margin-bottom:8px;">👥</div>
          <div style="font-weight:700; color:var(--gray-800); font-size:1.05rem; margin-bottom:6px;">No Real Consultants Registered Yet</div>
          <p style="font-size:0.85rem; color:var(--gray-500); max-width:500px; margin:0 auto 16px;">
            All dummy test profiles have been cleared. Have your real-time consultants click <strong>"+ Create Account"</strong> in the top navigation to register their account. All their submitted petty cash claims will consolidate right here automatically in Philippine Peso (₱).
          </p>
          <button class="btn btn-sm btn-primary" onclick="openAuthModal('register')">
            <span>👤</span> + Register First Real Consultant
          </button>
        </td>
      </tr>
    `
    : consultants.map(c => {
    const cClaims = claims.filter(item => item.consultantId === c.id || item.consultantName === c.name);
    const count = cClaims.length;
    const pendingSum = cClaims.filter(i => i.status === 'Pending').reduce((acc, cur) => acc + cur.amount, 0);
    const releasedSum = cClaims.filter(i => i.status === 'Released').reduce((acc, cur) => acc + cur.amount, 0);
    const refundSum = cClaims.filter(i => i.isClientRefund).reduce((acc, cur) => acc + cur.amount, 0);
    const totalC = pendingSum + releasedSum;

    return `
      <tr>
        <td>
          <div style="display:flex; align-items:center; gap:10px;">
            <div class="avatar-circle" style="width:32px; height:32px; font-size:0.8rem; background-color:${c.color};">
              ${c.avatar}
            </div>
            <div>
              <div style="font-weight:700; color:#0f172a; font-size:0.9rem;">${escapeHtml(c.name)}</div>
              <div style="font-size:0.75rem; color:#64748b;">${escapeHtml(c.title || 'Consultant')} • ${escapeHtml(c.email)}</div>
            </div>
          </div>
        </td>
        <td style="font-weight:600; text-align:center;">${count}</td>
        <td style="font-weight:700; color:#d97706;">${formatCurrency(pendingSum)}</td>
        <td style="font-weight:700; color:#059669;">${formatCurrency(releasedSum)}</td>
        <td style="font-weight:700; color:#0284c7;">${formatCurrency(refundSum)}</td>
        <td style="font-weight:800; color:#0f172a; font-size:0.95rem;">${formatCurrency(totalC)}</td>
        <td>
          <button class="btn btn-sm btn-secondary" onclick="filterByConsultant('${c.id}')">
            View Claims
          </button>
        </td>
      </tr>
    `;
  }).join('');

  const clientMap = {};
  claims.filter(c => c.isClientRefund).forEach(c => {
    const client = c.clientName || 'Unspecified Client';
    if (!clientMap[client]) {
      clientMap[client] = { count: 0, pending: 0, released: 0, total: 0 };
    }
    clientMap[client].count += 1;
    clientMap[client].total += c.amount;
    if (c.status === 'Pending') clientMap[client].pending += c.amount;
    if (c.status === 'Released') clientMap[client].released += c.amount;
  });

  const clientRows = Object.entries(clientMap).map(([client, stat]) => `
    <tr>
      <td style="font-weight:700; color:#0f172a;">${escapeHtml(client)}</td>
      <td style="text-align:center; font-weight:600;">${stat.count} claims</td>
      <td style="color:#d97706; font-weight:600;">${formatCurrency(stat.pending)}</td>
      <td style="color:#059669; font-weight:600;">${formatCurrency(stat.released)}</td>
      <td style="font-weight:800; color:#0284c7; font-size:0.95rem;">${formatCurrency(stat.total)}</td>
      <td>
        <span class="badge" style="background:#f0f9ff; color:#0369a1; border:1px solid #bae6fd; font-weight:700; padding:3px 8px; border-radius:4px;">
          Billable (PHP)
        </span>
      </td>
    </tr>
  `).join('');

  const allEvents = [];
  claims.forEach(c => {
    (c.auditLog || []).forEach(log => {
      allEvents.push({
        claimId: c.id,
        claimDesc: c.description,
        amount: c.amount,
        consultantName: c.consultantName,
        ...log
      });
    });
  });

  allEvents.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  const recentEvents = allEvents.slice(0, 10);

  const feedItems = recentEvents.map(ev => {
    let iconClass = 'activity-icon-edit';
    let icon = '📝';
    let actionBadge = `<span class="activity-feed-tag" style="background:#e0f2fe; color:#0369a1;">Updated</span>`;

    if (ev.action.toLowerCase().includes('submit')) {
      iconClass = 'activity-icon-submit';
      icon = '➕';
      actionBadge = `<span class="activity-feed-tag" style="background:#fef3c7; color:#92400e;">Submitted</span>`;
    } else if (ev.action.toLowerCase().includes('release')) {
      iconClass = 'activity-icon-release';
      icon = '💰';
      actionBadge = `<span class="activity-feed-tag" style="background:#ecfdf5; color:#065f46;">Released & Closed</span>`;
    }

    return `
      <div class="activity-feed-item">
        <div class="activity-feed-icon ${iconClass}">${icon}</div>
        <div class="activity-feed-content">
          <div class="activity-feed-title">
            <strong>${escapeHtml(ev.user)}</strong> — ${escapeHtml(ev.action)}
            ${actionBadge}
          </div>
          <div style="font-size:0.82rem; color:#334155; margin-top:2px;">
            ${ev.claimId}: "${escapeHtml(ev.claimDesc)}" • <strong>${formatCurrency(ev.amount)}</strong> (${escapeHtml(ev.consultantName)})
          </div>
          <div class="activity-feed-meta">
            ${formatDateTime(ev.timestamp)} ${ev.notes ? '• ' + escapeHtml(ev.notes) : ''}
          </div>
        </div>
      </div>
    `;
  }).join('');

  const replenishmentBatches = AppState.replenishments || [];
  const batchesRows = replenishmentBatches.length === 0
    ? `
      <tr>
        <td colspan="6" style="text-align:center; padding:28px 16px; color:var(--gray-500); font-size:0.85rem; background:var(--gray-50);">
          <div style="font-size:1.6rem; margin-bottom:6px;">📦</div>
          <div style="font-weight:700; color:var(--gray-800); margin-bottom:4px;">No Replenishment Batches Submitted Yet</div>
          <p style="font-size:0.8rem; color:var(--gray-500); max-width:440px; margin:0 auto 12px;">
            When vouchers in your cash box build up or cash runs low, click <strong>"Submit for Replenishment"</strong> to package them into an audit batch for Treasury reimbursement.
          </p>
          <button class="btn btn-sm btn-primary" onclick="openSubmitReplenishmentModal()">
            <span>📤</span> Submit Released Vouchers for Replenishment
          </button>
        </td>
      </tr>
    `
    : replenishmentBatches.map(b => {
      const isPending = b.status === 'submitted';
      const statusBadge = isPending
        ? `<span class="badge" style="background:#eff6ff; color:#1d4ed8; border:1px solid #bfdbfe; font-weight:700;">⏳ Awaiting Reimbursement Check</span>`
        : `<span class="badge" style="background:#f0fdf4; color:#15803d; border:1px solid #bbf7d0; font-weight:700;">✅ Restored & Settled (${escapeHtml(b.checkRef || 'Received')})</span>`;

      const actionBtn = isPending
        ? `<button class="btn btn-sm btn-success" onclick="openReceiveReplenishmentModal()" title="Acknowledge reimbursement check">📥 Receive Check</button>`
        : `<span style="font-size:0.75rem; color:#64748b; font-weight:600;">Float Restored</span>`;

      return `
        <tr>
          <td style="font-weight:700; color:var(--gray-900);">${escapeHtml(b.id)}</td>
          <td>${b.date}</td>
          <td style="text-align:center; font-weight:600;">${b.claimIds.length} vouchers</td>
          <td style="font-weight:800; color:#0284c7; font-size:0.95rem;">${formatCurrency(b.amount)}</td>
          <td>${statusBadge}</td>
          <td>${actionBtn}</td>
        </tr>
      `;
    }).join('');

  container.innerHTML = `
    <div class="consolidated-kpi-bar">
      <div class="consolidated-metric-card" style="border-top:4px solid #4f46e5;">
        <span class="consolidated-metric-title">Consolidated Spend (PHP)</span>
        <div class="consolidated-metric-val">${formatCurrency(totalSpend)}</div>
        <div class="consolidated-metric-sub">${claims.length} total claims monitored</div>
      </div>

      <div class="consolidated-metric-card" style="border-top:4px solid #f59e0b;">
        <span class="consolidated-metric-title">Pending Authorizations</span>
        <div class="consolidated-metric-val" style="color:#d97706;">${formatCurrency(totalPending)}</div>
        <div class="consolidated-metric-sub">Awaiting your approval</div>
      </div>

      <div class="consolidated-metric-card" style="border-top:4px solid #10b981;">
        <span class="consolidated-metric-title">Total Disbursed / Closed</span>
        <div class="consolidated-metric-val" style="color:#059669;">${formatCurrency(totalReleased)}</div>
        <div class="consolidated-metric-sub">Successfully released funds</div>
      </div>

      <div class="consolidated-metric-card" style="border-top:4px solid #0284c7;">
        <span class="consolidated-metric-title">Client Billing Recovery</span>
        <div class="consolidated-metric-val" style="color:#0284c7;">${formatCurrency(totalRefundable)}</div>
        <div class="consolidated-metric-sub">Billable client reimbursements</div>
      </div>
    </div>

    <div class="card" style="margin-bottom:28px;">
      <div class="card-header">
        <div>
          <h3 class="card-title">👥 Consolidated Consultant Spend Matrix</h3>
          <div style="font-size:0.8rem; color:#64748b;">Consolidated ledger of reimbursement claims categorized per consultant in Philippine Peso (₱)</div>
        </div>
        <div style="display:flex; gap:10px; flex-wrap:wrap;">
          <button class="btn btn-sm btn-secondary" onclick="openEditAdminModal()">✏️ Edit Admin Profile</button>
          <button class="btn btn-sm btn-secondary" onclick="openAuthModal('register')">➕ Create Account</button>
          <button class="btn btn-sm btn-primary" onclick="printExecutiveReport()">🖨️ Print Executive Report</button>
        </div>
      </div>
      <div class="table-responsive">
        <table class="data-table">
          <thead>
            <tr>
              <th>Consultant Name & Details</th>
              <th style="text-align:center;">Claims</th>
              <th>Pending Amount</th>
              <th>Released Amount</th>
              <th>For Client Refund</th>
              <th>Total Spend</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            ${consultantRows}
          </tbody>
        </table>
      </div>
    </div>

    <!-- Petty Cash Fund & Replenishment Monitor Card -->
    <div class="card" style="margin-bottom:28px;">
      <div class="card-header">
        <div>
          <h3 class="card-title">🔄 Petty Cash Fund & Replenishment Monitor</h3>
          <div style="font-size:0.8rem; color:#64748b;">
            Track vouchers submitted to Treasury/Finance for reimbursement and monitor cash drawer restitution
          </div>
        </div>
        <div style="display:flex; gap:10px; flex-wrap:wrap;">
          <button class="btn btn-sm btn-primary" onclick="openSubmitReplenishmentModal()">
            <span>📤</span> Submit for Replenishment
          </button>
          <button class="btn btn-sm btn-secondary" onclick="openReceiveReplenishmentModal()">
            <span>📥</span> Receive Replenishment
          </button>
          <button class="btn btn-sm btn-secondary" onclick="openEditPcfModal()">
            <span>✏️</span> Set PCF Float
          </button>
        </div>
      </div>
      <div class="table-responsive">
        <table class="data-table">
          <thead>
            <tr>
              <th>Batch Reference</th>
              <th>Date Submitted</th>
              <th style="text-align:center;">Vouchers Count</th>
              <th>Reimbursement Amount</th>
              <th>Treasury Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            ${batchesRows}
          </tbody>
        </table>
      </div>
    </div>

    <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(420px, 1fr)); gap:24px;">
      <div class="card" style="margin-bottom:0;">
        <div class="card-header">
          <div>
            <h3 class="card-title">💼 Client Billing Reconciliation</h3>
            <div style="font-size:0.8rem; color:#64748b;">Recoverable amounts grouped by corporate client (PHP ₱)</div>
          </div>
          <button class="btn btn-sm btn-secondary" onclick="exportToCSV()">Export CSV</button>
        </div>
        <div class="table-responsive">
          <table class="data-table">
            <thead>
              <tr>
                <th>Client Account</th>
                <th style="text-align:center;">Claims</th>
                <th>Pending</th>
                <th>Released</th>
                <th>Total Recoverable</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${clientRows || '<tr><td colspan="6" style="text-align:center;color:#94a3b8;padding:24px;">No client-refundable claims yet.</td></tr>'}
            </tbody>
          </table>
        </div>
      </div>

      <div class="card" style="margin-bottom:0; padding:20px;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px;">
          <div>
            <h3 class="card-title">⚡ Real-Time Activity & Audit Feed</h3>
            <div style="font-size:0.8rem; color:#64748b;">Live chronological log of all claim updates & actions</div>
          </div>
          <span class="badge" style="background:#ecfdf5; color:#059669; border:1px solid #a7f3d0; font-weight:700;">Live Feed</span>
        </div>
        <div class="activity-feed-list">
          ${feedItems || '<div style="color:#94a3b8; text-align:center; padding:20px;">No recent activity.</div>'}
        </div>
      </div>
    </div>
  `;

  // Render and update Petty Cash Fund & Replenishment Banner
  updatePcfDisplay();
}

function filterByConsultant(consultantId) {
  AppState.filters.consultantId = consultantId;
  const select = document.getElementById('filterConsultant');
  if (select) select.value = consultantId;
  switchView('transactions');
  showToast("Filtered transaction table by selected consultant.", "info");
}

function printExecutiveReport() {
  window.print();
}

// 8. Main Transaction Table Rendering
function renderTransactionTable() {
  const tableBody = document.getElementById('claimsTableBody');
  if (!tableBody) return;

  const filtered = getFilteredClaims();
  const user = AppState.currentUser;
  const isManager = user && user.role === 'manager';

  if (filtered.length === 0) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="10">
          <div class="empty-state">
            <div class="empty-state-icon">📂</div>
            <div class="empty-state-title">No reimbursement claims found</div>
            <div class="empty-state-sub">No matching records found for the selected tab and filter criteria.</div>
            <button class="btn btn-sm btn-secondary" onclick="resetFilters()">Reset All Filters</button>
          </div>
        </td>
      </tr>
    `;
    return;
  }

  filtered.sort((a, b) => new Date(b.date) - new Date(a.date));

  tableBody.innerHTML = filtered.map(claim => {
    const isOwner = user && (claim.consultantId === user.id || claim.consultantName === user.name);
    const isPending = claim.status === 'Pending';

    let statusBadge = '';
    if (isPending) {
      statusBadge = `<span class="status-badge status-pending">⏳ Pending</span>`;
    } else {
      if (claim.replenishStatus === 'replenished') {
        statusBadge = `<span class="status-badge status-replenished" title="Replenished by Treasury via ${escapeHtml(claim.replenishCheckRef || 'Check')}">✅ Replenished (${escapeHtml(claim.replenishBatchId || 'Settled')})</span>`;
      } else if (claim.replenishStatus === 'submitted') {
        statusBadge = `<span class="status-badge status-replenish-submitted" title="Submitted for replenishment in Batch ${escapeHtml(claim.replenishBatchId || '')}">📤 Submitted (${escapeHtml(claim.replenishBatchId || 'In Transit')})</span>`;
      } else {
        statusBadge = `<span class="status-badge status-released" title="Cash disbursed; voucher stored in drawer">💵 Released (In Drawer)</span>`;
      }
    }

    const refundBadge = claim.isClientRefund
      ? `<span class="refund-badge refund-yes">✓ Yes (Refundable)</span>`
      : `<span class="refund-badge refund-no">No (Internal)</span>`;

    let receiptBtn = `<span style="color:#94a3b8; font-size:0.75rem;">None</span>`;
    if (claim.receipt && (claim.receipt.dataUrl || claim.receipt.name)) {
      const isPdf = claim.receipt.name && claim.receipt.name.toLowerCase().endsWith('.pdf');
      const icon = isPdf ? '📄' : '🖼️';
      receiptBtn = `
        <button class="receipt-btn" onclick="openReceiptViewer('${claim.id}')" title="View attached receipt">
          <span>${icon}</span>
          <span>View Receipt</span>
        </button>
      `;
    }

    let actionButtons = ``;

    // 1. Release Fund (Manager only, for Pending claims)
    if (isManager && isPending) {
      actionButtons += `
        <button class="btn-release-fund" onclick="openReleaseModal('${claim.id}')" title="Release Fund and Mark as Closed">
          <span>✓</span> Release Fund
        </button>
      `;
    }

    // Determine whether user has permission to edit or delete:
    // Admin can edit/delete any claim for audit corrections.
    // Consultant can ONLY edit/delete their OWN request when it was NOT YET RELEASED or SUBMITTED FOR REPLENISHMENT!
    const isUnreleasedAndUnsubmitted = isPending && (!claim.replenishStatus || claim.replenishStatus === 'none');
    const canConsultantModify = isOwner && isUnreleasedAndUnsubmitted;
    const canEdit = isManager || canConsultantModify;
    const canDelete = isManager || canConsultantModify;

    // 2. Edit Button
    if (canEdit) {
      actionButtons += `
        <button class="btn btn-sm btn-secondary" onclick="openEditClaimModal('${claim.id}')" title="Edit date, amount, description, or receipt">
          <span>✏️</span> Edit
        </button>
      `;
    }

    // 3. Delete Button
    if (canDelete) {
      actionButtons += `
        <button class="btn btn-sm btn-danger-outline" onclick="confirmDeleteClaim('${claim.id}')" title="Permanently delete this entry">
          <span>🗑️</span> Delete
        </button>
      `;
    }

    // 4. View Details Button
    actionButtons += `
      <button class="btn btn-sm btn-secondary btn-icon-only" onclick="openClaimDetailModal('${claim.id}')" title="View Full Audit Log & Details">
        🔍
      </button>
    `;

    const rowClass = isPending ? 'highlight-pending' : '';

    return `
      <tr class="${rowClass}">
        <td style="font-weight:600; font-size:0.85rem; color:#334155;">
          ${claim.date}
        </td>
        <td>
          <div style="display:flex; align-items:center; gap:8px;">
            <div class="avatar-circle" style="width:28px; height:28px; font-size:0.75rem; background-color:${getConsultantColor(claim.consultantId)};">
              ${getConsultantInitials(claim.consultantName)}
            </div>
            <div>
              <div style="font-weight:600; color:#0f172a; font-size:0.85rem;">${escapeHtml(claim.consultantName)}</div>
              <div style="font-size:0.72rem; color:#94a3b8;">${claim.id}</div>
            </div>
          </div>
        </td>
        <td style="max-width:240px;">
          <div style="color:#334155; font-size:0.85rem; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;" title="${escapeHtml(claim.description)}">
            ${escapeHtml(claim.description)}
          </div>
        </td>
        <td>
          <span class="category-pill">${escapeHtml(claim.category)}</span>
        </td>
        <td>
          <div class="amount-text">${formatCurrency(claim.amount)}</div>
        </td>
        <td>
          ${receiptBtn}
        </td>
        <td>
          ${refundBadge}
        </td>
        <td>
          <div style="font-size:0.85rem; font-weight:600; color:#334155;">
            ${escapeHtml(claim.clientName || '—')}
          </div>
        </td>
        <td>
          ${statusBadge}
        </td>
        <td>
          <div class="actions-cell">
            ${actionButtons}
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

// 9. Expense Submission Logic
function handleExpenseSubmit(event) {
  event.preventDefault();

  const user = AppState.currentUser;
  const isEditing = !!AppState.editingClaim;

  const dateVal = document.getElementById('expenseDate').value;
  const amountVal = parseFloat(document.getElementById('expenseAmount').value);
  const categoryVal = document.getElementById('expenseCategory').value;
  const descVal = document.getElementById('expenseDescription').value.trim();
  const isRefundVal = document.getElementById('expenseClientRefundToggle').checked;
  const clientNameVal = document.getElementById('expenseClientName').value.trim();

  if (!dateVal) return showToast("Please select the date of expense.", "warning");
  if (isNaN(amountVal) || amountVal <= 0) return showToast("Please enter a valid amount in Philippine Peso (₱).", "warning");
  if (!categoryVal) return showToast("Please choose an Expense Account / Category.", "warning");
  if (!descVal) return showToast("Please provide a description of the expense.", "warning");
  if (isRefundVal && !clientNameVal) return showToast("Please enter the Client Name for client refund claims.", "warning");

  if (isEditing) {
    const claim = AppState.editingClaim;

    if (user.role !== 'manager') {
      const isOwner = claim && (claim.consultantId === user.id || claim.consultantName === user.name);
      if (!isOwner) {
        closeModal('submitExpenseModal');
        AppState.editingClaim = null;
        return showToast("Access Denied: You can only edit your own claims.", "danger");
      }
      if (claim.status === 'Released' || claim.replenishStatus === 'submitted' || claim.replenishStatus === 'replenished') {
        closeModal('submitExpenseModal');
        AppState.editingClaim = null;
        return showToast("Access Denied: Claims that have already been released or submitted for replenishment cannot be modified.", "warning");
      }
    }

    claim.date = dateVal;
    claim.amount = amountVal;
    claim.category = categoryVal;
    claim.description = descVal;
    claim.isClientRefund = isRefundVal;
    claim.clientName = clientNameVal || "Internal Ops";

    if (AppState.pendingUploadReceipt) {
      claim.receipt = AppState.pendingUploadReceipt;
    }

    // Manager can update consultant name if needed
    const consultantNameInput = document.getElementById('expenseConsultantName');
    if (user.role === 'manager' && consultantNameInput && consultantNameInput.value.trim()) {
      claim.consultantName = consultantNameInput.value.trim();
    }

    claim.auditLog.push({
      timestamp: new Date().toISOString(),
      user: user.name,
      action: "Edited claim details",
      notes: `Updated amount to ${formatCurrency(amountVal)}, category: ${categoryVal}`
    });

    saveClaimsToStorage();
    if (AppState.cloudConfig && AppState.cloudConfig.connected) {
      cloudSyncPushClaim(claim, 'upsert');
    }
    renderAll();
    showToast(`Claim ${claim.id} updated successfully!`, "success");
    closeModal('submitExpenseModal');
    AppState.editingClaim = null;
    AppState.pendingUploadReceipt = null;
  } else {
    const newId = generateClaimId();
    const newClaim = {
      id: newId,
      date: dateVal,
      consultantId: user.id,
      consultantName: user.name,
      amount: amountVal,
      description: descVal,
      category: categoryVal,
      isClientRefund: isRefundVal,
      clientName: clientNameVal || (isRefundVal ? "Client Account" : "Internal Operations"),
      status: "Pending",
      submittedAt: new Date().toISOString(),
      releasedAt: null,
      releasedBy: null,
      receipt: AppState.pendingUploadReceipt || null,
      auditLog: [
        {
          timestamp: new Date().toISOString(),
          user: user.name,
          action: "Submitted new reimbursement request",
          notes: "Initial submission in PHP (₱)"
        }
      ]
    };

    AppState.claims.unshift(newClaim);
    saveClaimsToStorage();
    if (AppState.cloudConfig && AppState.cloudConfig.connected) {
      cloudSyncPushClaim(newClaim, 'upsert');
    }
    showToast(`Reimbursement request ${newId} submitted for review!`, "success");
    closeModal('submitExpenseModal');
    AppState.pendingUploadReceipt = null;
  }

  resetExpenseForm();
  renderAll();
}

function openSubmitExpenseModal() {
  AppState.editingClaim = null;
  AppState.pendingUploadReceipt = null;
  resetExpenseForm();

  const titleEl = document.getElementById('submitModalTitle');
  if (titleEl) titleEl.textContent = "Submit New Reimbursement Request (₱ PHP)";

  const consultantNameInput = document.getElementById('expenseConsultantName');
  if (consultantNameInput) {
    consultantNameInput.value = AppState.currentUser.name;
    consultantNameInput.disabled = true;
  }

  const dateInput = document.getElementById('expenseDate');
  if (dateInput) dateInput.value = new Date().toISOString().split('T')[0];

  const submitBtn = document.getElementById('btnSubmitExpense');
  if (submitBtn) {
    submitBtn.innerHTML = `<span>🚀</span> Submit Claim (₱ PHP)`;
  }

  openModal('submitExpenseModal');
}

function openEditClaimModal(claimId) {
  const claim = AppState.claims.find(c => c.id === claimId);
  if (!claim) return;

  const user = AppState.currentUser;
  const isManager = user && user.role === 'manager';
  const isOwner = user && (claim.consultantId === user.id || claim.consultantName === user.name);

  if (!isManager) {
    if (!isOwner) {
      return showToast("Access Denied: You can only edit your own claims.", "danger");
    }
    if (claim.status === 'Released' || claim.replenishStatus === 'submitted' || claim.replenishStatus === 'replenished') {
      return showToast("Access Denied: Claims that have already been released or submitted for replenishment cannot be modified.", "warning");
    }
  }

  AppState.editingClaim = claim;
  AppState.pendingUploadReceipt = claim.receipt ? { ...claim.receipt } : null;

  const titleEl = document.getElementById('submitModalTitle');
  if (titleEl) titleEl.textContent = `Edit Claim ${claim.id} (₱ PHP)`;

  document.getElementById('expenseDate').value = claim.date;

  const consultantInput = document.getElementById('expenseConsultantName');
  if (consultantInput) {
    consultantInput.value = claim.consultantName;
    consultantInput.disabled = !isManager; // Admin can change or fix consultant name
  }

  document.getElementById('expenseAmount').value = claim.amount;
  document.getElementById('expenseCategory').value = claim.category;
  document.getElementById('expenseDescription').value = claim.description;
  
  const refundToggle = document.getElementById('expenseClientRefundToggle');
  refundToggle.checked = claim.isClientRefund;
  toggleClientRefundField(claim.isClientRefund);

  document.getElementById('expenseClientName').value = claim.clientName || '';

  const submitBtn = document.getElementById('btnSubmitExpense');
  if (submitBtn) {
    submitBtn.innerHTML = `<span>💾</span> Save Changes`;
  }

  renderDropzonePreview();
  openModal('submitExpenseModal');
}

function confirmDeleteClaim(claimId) {
  const claim = AppState.claims.find(c => c.id === claimId);
  if (!claim) return;

  const user = AppState.currentUser;
  const isManager = user && user.role === 'manager';
  const isOwner = user && (claim.consultantId === user.id || claim.consultantName === user.name);

  if (!isManager) {
    if (!isOwner) {
      return showToast("Access Denied: You can only delete your own claims.", "danger");
    }
    if (claim.status === 'Released' || claim.replenishStatus === 'submitted' || claim.replenishStatus === 'replenished') {
      return showToast("Access Denied: Claims that have already been released or submitted for replenishment cannot be deleted.", "warning");
    }
  }

  AppState.claimToDelete = claim;
  const descEl = document.getElementById('deleteClaimDesc');
  if (descEl) {
    const isReleased = claim.status === 'Released';
    const warning = isReleased
      ? `<div style="margin-top:8px; padding:8px 12px; background:#fef2f2; border:1px solid #fecaca; border-radius:6px; color:#b91c1c; font-weight:700; font-size:0.85rem;">⚠️ Notice: This claim was already marked as RELEASED (${formatCurrency(claim.amount)}). Deleting it will permanently adjust your accounting ledger totals.</div>`
      : '';
    descEl.innerHTML = `
      <div><strong>${escapeHtml(claim.id)}</strong>: "${escapeHtml(claim.description)}"</div>
      <div style="margin-top:6px; font-size:0.85rem; color:var(--gray-600);">
        Amount: <strong style="color:var(--gray-900);">${formatCurrency(claim.amount)}</strong> • Consultant: <strong>${escapeHtml(claim.consultantName)}</strong> (${escapeHtml(claim.category)})
      </div>
      ${warning}
    `;
  }
  openModal('deleteConfirmModal');
}

function executeDeleteClaim() {
  if (!AppState.claimToDelete) return;
  const claim = AppState.claimToDelete;
  const user = AppState.currentUser;
  const isManager = user && user.role === 'manager';
  const isOwner = user && (claim.consultantId === user.id || claim.consultantName === user.name);

  if (!isManager) {
    if (!isOwner || claim.status === 'Released' || claim.replenishStatus === 'submitted' || claim.replenishStatus === 'replenished') {
      closeModal('deleteConfirmModal');
      AppState.claimToDelete = null;
      return showToast("Access Denied: Released or submitted claims cannot be deleted.", "danger");
    }
  }

  const id = claim.id;

  AppState.claims = AppState.claims.filter(c => c.id !== id);
  saveClaimsToStorage();
  if (AppState.cloudConfig && AppState.cloudConfig.connected) {
    cloudSyncPushClaim(claim, 'delete');
  }
  closeModal('deleteConfirmModal');
  AppState.claimToDelete = null;

  renderAll();
  showToast(`Claim ${id} permanently deleted. Totals updated!`, "info");
}

// 10. Manager Actions: Release Fund & Edit Allocation
function openReleaseModal(claimId) {
  if (!AppState.currentUser || AppState.currentUser.role !== 'manager') {
    return showToast("Access Denied: Only Admin can authorize and release petty cash funds.", "danger");
  }

  const claim = AppState.claims.find(c => c.id === claimId);
  if (!claim) return;

  if (claim.status !== 'Pending') {
    return showToast("This claim is already released.", "info");
  }

  AppState.claimToRelease = claim;

  document.getElementById('releaseModalClaimId').textContent = claim.id;
  document.getElementById('releaseModalAmount').textContent = formatCurrency(claim.amount);
  document.getElementById('releaseModalConsultant').textContent = claim.consultantName;
  document.getElementById('releaseModalCategory').textContent = claim.category;
  document.getElementById('releaseModalClient').textContent = claim.clientName || 'Internal Ops';
  document.getElementById('releaseModalDesc').textContent = claim.description;

  openModal('releaseFundModal');
}

function executeReleaseFund() {
  if (!AppState.currentUser || AppState.currentUser.role !== 'manager') {
    closeModal('releaseFundModal');
    return showToast("Access Denied: Only Admin can authorize and release petty cash funds.", "danger");
  }

  const claim = AppState.claimToRelease;
  if (!claim) return;

  const user = AppState.currentUser;
  const timestamp = new Date().toISOString();

  claim.status = "Released";
  claim.replenishStatus = "in-drawer";
  claim.releasedAt = timestamp;
  claim.releasedBy = `${user.name} (Manager)`;

  claim.auditLog.push({
    timestamp: timestamp,
    user: `${user.name} (Manager)`,
    action: "Closed & Released Fund",
    notes: `Petty cash released and voucher stored in cash drawer at ${formatDateTime(timestamp)}`
  });

  saveClaimsToStorage();
  if (AppState.cloudConfig && AppState.cloudConfig.connected) {
    cloudSyncPushClaim(claim, 'upsert');
    cloudSyncPushPcf();
  }
  closeModal('releaseFundModal');
  AppState.claimToRelease = null;

  renderAll();
  showToast(`Success! Fund of ${formatCurrency(claim.amount)} released for ${claim.consultantName}. Claim is now Closed.`, "success");
}

function openManagerEditModal(claimId) {
  if (!AppState.currentUser || AppState.currentUser.role !== 'manager') {
    return showToast("Access Denied: Only Admin can adjust expense allocations.", "danger");
  }

  const claim = AppState.claims.find(c => c.id === claimId);
  if (!claim) return;

  AppState.claimToEditAllocation = claim;

  document.getElementById('managerEditModalTitle').textContent = `Adjust Allocations for ${claim.id}`;
  document.getElementById('managerEditCategory').value = claim.category;
  document.getElementById('managerEditClientName').value = claim.clientName || '';
  document.getElementById('managerEditRefundToggle').checked = claim.isClientRefund;
  document.getElementById('managerEditNotes').value = '';

  openModal('managerEditModal');
}

function executeManagerEditAllocation(event) {
  event.preventDefault();

  if (!AppState.currentUser || AppState.currentUser.role !== 'manager') {
    closeModal('managerEditModal');
    return showToast("Access Denied: Only Admin can adjust expense allocations.", "danger");
  }

  const claim = AppState.claimToEditAllocation;
  if (!claim) return;

  const user = AppState.currentUser;
  const newCategory = document.getElementById('managerEditCategory').value;
  const newClient = document.getElementById('managerEditClientName').value.trim();
  const newRefund = document.getElementById('managerEditRefundToggle').checked;
  const notes = document.getElementById('managerEditNotes').value.trim();

  const prevCategory = claim.category;
  const prevClient = claim.clientName;

  claim.category = newCategory;
  claim.clientName = newClient || (newRefund ? "Client Account" : "Internal Operations");
  claim.isClientRefund = newRefund;

  claim.auditLog.push({
    timestamp: new Date().toISOString(),
    user: `${user.name} (Manager)`,
    action: "Updated Expense Allocations",
    notes: `Category: "${prevCategory}" → "${newCategory}", Client: "${prevClient}" → "${claim.clientName}". ${notes ? 'Note: ' + notes : ''}`
  });

  saveClaimsToStorage();
  closeModal('managerEditModal');
  AppState.claimToEditAllocation = null;

  renderAll();
  showToast(`Allocations updated for ${claim.id}`, "success");
}

// 11. Receipt Attachment Handling
function handleFileSelect(file) {
  if (!file) return;

  const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'application/pdf'];
  const ext = file.name.split('.').pop().toLowerCase();
  const isExtValid = ['png', 'jpg', 'jpeg', 'pdf'].includes(ext);

  if (!validTypes.includes(file.type) && !isExtValid) {
    return showToast("Unsupported file type! Please upload a PDF, PNG, or JPG receipt.", "danger");
  }

  if (file.size > 10 * 1024 * 1024) {
    return showToast("File is too large! Maximum receipt file size is 10MB.", "warning");
  }

  const reader = new FileReader();
  reader.onload = function(e) {
    AppState.pendingUploadReceipt = {
      name: file.name,
      type: file.type || (ext === 'pdf' ? 'application/pdf' : 'image/jpeg'),
      size: file.size,
      dataUrl: e.target.result
    };
    renderDropzonePreview();
    showToast(`Receipt "${file.name}" attached successfully!`, "info");
  };
  reader.readAsDataURL(file);
}

function renderDropzonePreview() {
  const container = document.getElementById('dropzonePreviewContainer');
  const dropzonePrompt = document.getElementById('dropzoneDefaultPrompt');
  if (!container || !dropzonePrompt) return;

  if (AppState.pendingUploadReceipt) {
    dropzonePrompt.style.display = 'none';
    const r = AppState.pendingUploadReceipt;
    const isPdf = r.name.toLowerCase().endsWith('.pdf');
    container.innerHTML = `
      <div class="file-preview-card">
        <div class="file-preview-info">
          <span style="font-size:1.5rem;">${isPdf ? '📄' : '🖼️'}</span>
          <div>
            <div class="file-preview-name">${escapeHtml(r.name)}</div>
            <div class="file-preview-size">${formatFileSize(r.size)}</div>
          </div>
        </div>
        <button type="button" class="btn btn-sm btn-danger-outline" onclick="removeAttachedReceipt(event)">Remove</button>
      </div>
    `;
    container.style.display = 'block';
  } else {
    dropzonePrompt.style.display = 'block';
    container.innerHTML = '';
    container.style.display = 'none';
  }
}

function removeAttachedReceipt(e) {
  if (e) e.stopPropagation();
  AppState.pendingUploadReceipt = null;
  renderDropzonePreview();
}

function openReceiptViewer(claimId) {
  const claim = AppState.claims.find(c => c.id === claimId);
  if (!claim || !claim.receipt) {
    return showToast("No receipt attached to this claim.", "warning");
  }

  AppState.activeReceipt = claim.receipt;
  AppState.receiptZoom = 1;
  AppState.receiptRotation = 0;

  document.getElementById('receiptModalClaimId').textContent = `${claim.id} • ${claim.consultantName}`;
  document.getElementById('receiptModalFileName').textContent = claim.receipt.name;
  document.getElementById('receiptModalFileSize').textContent = formatFileSize(claim.receipt.size);

  const container = document.getElementById('receiptViewerDisplay');
  const isPdf = claim.receipt.name.toLowerCase().endsWith('.pdf') || claim.receipt.type === 'application/pdf';

  if (isPdf) {
    container.innerHTML = `
      <div style="width:100%; height:500px; display:flex; flex-direction:column; align-items:center; justify-content:center; background:#f8fafc; border-radius:10px; border:1px solid #cbd5e1;">
        <span style="font-size:3.5rem; margin-bottom:12px;">📄</span>
        <div style="font-weight:700; color:#1e293b; font-size:1.1rem; margin-bottom:4px;">${escapeHtml(claim.receipt.name)}</div>
        <div style="color:#64748b; font-size:0.85rem; margin-bottom:20px;">Adobe PDF Document • ${formatFileSize(claim.receipt.size)}</div>
        <div style="display:flex; gap:12px;">
          <a class="btn btn-primary" href="${claim.receipt.dataUrl}" target="_blank" download="${claim.receipt.name}">
            <span>⬇️</span> Download & Open PDF
          </a>
          <button class="btn btn-secondary" onclick="printReceipt()">
            <span>🖨️</span> Print
          </button>
        </div>
        <iframe src="${claim.receipt.dataUrl}" style="width:100%; height:320px; margin-top:20px; border:none; border-top:1px solid #e2e8f0;"></iframe>
      </div>
    `;
  } else {
    container.innerHTML = `
      <img id="receiptModalImage" class="receipt-img-preview" src="${claim.receipt.dataUrl}" alt="Receipt Attachment" />
    `;
    updateReceiptTransform();
  }

  openModal('receiptViewerModal');
}

function zoomReceipt(factor) {
  AppState.receiptZoom = Math.max(0.4, Math.min(3.0, AppState.receiptZoom + factor));
  updateReceiptTransform();
}

function resetReceiptZoom() {
  AppState.receiptZoom = 1;
  AppState.receiptRotation = 0;
  updateReceiptTransform();
}

function rotateReceipt() {
  AppState.receiptRotation = (AppState.receiptRotation + 90) % 360;
  updateReceiptTransform();
}

function updateReceiptTransform() {
  const img = document.getElementById('receiptModalImage');
  if (img) {
    img.style.transform = `scale(${AppState.receiptZoom}) rotate(${AppState.receiptRotation}deg)`;
  }
}

function downloadCurrentReceipt() {
  if (!AppState.activeReceipt) return;
  const a = document.createElement('a');
  a.href = AppState.activeReceipt.dataUrl;
  a.download = AppState.activeReceipt.name || 'receipt-attachment.png';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  showToast("Receipt download started.", "info");
}

function printReceipt() {
  window.print();
}

// 12. Claim Detail Modal
function openClaimDetailModal(claimId) {
  const claim = AppState.claims.find(c => c.id === claimId);
  if (!claim) return;

  AppState.claimToViewDetail = claim;

  document.getElementById('detailClaimId').textContent = claim.id;
  
  let detailBadge = `<span class="status-badge status-pending">⏳ Pending Review</span>`;
  if (claim.status === 'Released') {
    if (claim.replenishStatus === 'replenished') {
      detailBadge = `<span class="status-badge status-replenished">✅ Replenished & Settled (${escapeHtml(claim.replenishBatchId || 'Settled')})</span>`;
    } else if (claim.replenishStatus === 'submitted') {
      detailBadge = `<span class="status-badge status-replenish-submitted">📤 Submitted for Replenishment (${escapeHtml(claim.replenishBatchId || 'In Transit')})</span>`;
    } else {
      detailBadge = `<span class="status-badge status-released">💵 Released (In Drawer)</span>`;
    }
  }
  document.getElementById('detailStatusBadge').innerHTML = detailBadge;

  document.getElementById('detailAmount').textContent = formatCurrency(claim.amount);
  document.getElementById('detailConsultant').textContent = claim.consultantName;
  document.getElementById('detailDate').textContent = claim.date;
  document.getElementById('detailCategory').textContent = claim.category;
  document.getElementById('detailClient').textContent = claim.clientName || 'Internal Ops';
  document.getElementById('detailRefundable').textContent = claim.isClientRefund ? 'Yes (For Client Refund)' : 'No (Internal Expense)';
  document.getElementById('detailDescription').textContent = claim.description;

  const releaseInfoCard = document.getElementById('detailReleaseInfoCard');
  if (claim.status === 'Released') {
    releaseInfoCard.style.display = 'block';
    document.getElementById('detailReleasedAt').textContent = formatDateTime(claim.releasedAt);
    document.getElementById('detailReleasedBy').textContent = claim.releasedBy || 'Manager';
  } else {
    releaseInfoCard.style.display = 'none';
  }

  const timelineEl = document.getElementById('detailAuditTimeline');
  if (timelineEl) {
    const logs = claim.auditLog || [];
    timelineEl.innerHTML = logs.map(entry => {
      const isReleaseAction = entry.action.toLowerCase().includes('release');
      return `
        <div class="timeline-item">
          <div class="timeline-dot ${isReleaseAction ? 'released' : ''}"></div>
          <div class="timeline-title">${escapeHtml(entry.action)}</div>
          <div class="timeline-time">${formatDateTime(entry.timestamp)} by <strong>${escapeHtml(entry.user)}</strong></div>
          <div class="timeline-desc">${escapeHtml(entry.notes || '')}</div>
        </div>
      `;
    }).join('');
  }

  // Populate detail action buttons (Edit, Delete, Release)
  const user = AppState.currentUser;
  const isManager = user && user.role === 'manager';
  const isOwner = user && (claim.consultantId === user.id || claim.consultantName === user.name);
  const isUnreleasedAndUnsubmitted = claim.status === 'Pending' && (!claim.replenishStatus || claim.replenishStatus === 'none');
  const canConsultantModify = isOwner && isUnreleasedAndUnsubmitted;

  const detailActionsEl = document.getElementById('detailActionButtons');
  if (detailActionsEl) {
    let btns = '';
    if (isManager && claim.status === 'Pending') {
      btns += `<button class="btn-release-fund" onclick="closeModal('claimDetailModal'); openReleaseModal('${claim.id}')"><span>✓</span> Release Fund</button>`;
    }
    if (isManager || canConsultantModify) {
      btns += `<button class="btn btn-secondary btn-sm" onclick="closeModal('claimDetailModal'); openEditClaimModal('${claim.id}')"><span>✏️</span> Edit Entry</button>`;
      btns += `<button class="btn btn-danger-outline btn-sm" style="background:#dc2626; color:#fff;" onclick="closeModal('claimDetailModal'); confirmDeleteClaim('${claim.id}')"><span>🗑️</span> Delete Entry</button>`;
    }
    detailActionsEl.innerHTML = btns;
  }

  openModal('claimDetailModal');
}

// 13. Export to CSV & JSON (in PHP ₱)
function exportToCSV() {
  const filtered = (AppState.currentView === 'consolidated') ? AppState.claims : getFilteredClaims();
  if (filtered.length === 0) {
    return showToast("No claims available to export.", "warning");
  }

  const headers = [
    "Claim ID",
    "Date",
    "Consultant Name",
    "Description",
    "Expense Account",
    "Amount (PHP)",
    "Status",
    "For Client Refund",
    "Client Name",
    "Submitted At",
    "Released At",
    "Released By"
  ];

  const rows = filtered.map(c => [
    c.id,
    c.date,
    `"${c.consultantName.replace(/"/g, '""')}"`,
    `"${c.description.replace(/"/g, '""')}"`,
    `"${c.category.replace(/"/g, '""')}"`,
    c.amount.toFixed(2),
    c.status,
    c.isClientRefund ? "Yes" : "No",
    `"${(c.clientName || '').replace(/"/g, '""')}"`,
    c.submittedAt || "",
    c.releasedAt || "",
    `"${(c.releasedBy || '').replace(/"/g, '""')}"`
  ]);

  const csvContent = "data:text/csv;charset=utf-8," + 
    [headers.join(","), ...rows.map(e => e.join(","))].join("\n");

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", `petty-cash-php-${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  showToast(`Exported ${filtered.length} claims to CSV successfully in Philippine Peso (PHP)!`, "success");
}

function exportToJSON() {
  if (!AppState.currentUser || AppState.currentUser.role !== 'manager') {
    return showToast("Access Denied: Full database backup export is restricted to Admin accounts.", "danger");
  }
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(AppState.claims, null, 2));
  const link = document.createElement("a");
  link.setAttribute("href", dataStr);
  link.setAttribute("download", `petty-cash-database-php-${new Date().toISOString().split('T')[0]}.json`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  showToast("Database exported as JSON backup.", "success");
}

// 14. UI Navigation & Rendering
function renderAll() {
  updateKPICards();
  renderTransactionTable();
  if (AppState.currentView === 'consolidated') {
    renderConsolidatedReports();
  }
}

function switchView(viewName) {
  const isManager = AppState.currentUser && AppState.currentUser.role === 'manager';
  if (!isManager && (viewName === 'consolidated' || viewName === 'dashboard' || viewName === 'settings')) {
    showToast("Access Restricted: Only Admin accounts can access settings or consolidated views.", "warning");
    viewName = 'transactions';
  }

  AppState.currentView = viewName;

  document.querySelectorAll('.nav-link').forEach(link => {
    link.classList.remove('active');
  });

  const activeNavLink = document.getElementById(`nav-${viewName}`);
  if (activeNavLink) activeNavLink.classList.add('active');

  const viewConsolidated = document.getElementById('view-consolidated');
  const viewTransactions = document.getElementById('view-transactions');
  const viewSettings = document.getElementById('view-settings');

  if (viewConsolidated) viewConsolidated.style.display = (viewName === 'consolidated' || viewName === 'dashboard') ? 'block' : 'none';
  if (viewTransactions) viewTransactions.style.display = (viewName === 'transactions' || viewName === 'my-claims') ? 'block' : 'none';
  if (viewSettings) viewSettings.style.display = (viewName === 'settings') ? 'block' : 'none';

  const pageTitle = document.getElementById('headerPageTitle');
  const pageSubtitle = document.getElementById('headerPageSubtitle');
  if (pageTitle && pageSubtitle) {
    const curName = AppState.currentUser ? AppState.currentUser.name : "Finance Admin";
    switch (viewName) {
      case 'consolidated':
      case 'dashboard':
        pageTitle.textContent = "Executive Consolidated Reports (₱ PHP)";
        pageSubtitle.textContent = `Managed by ${curName} • Master financial exposure and live updates`;
        break;
      case 'transactions':
        pageTitle.textContent = "Reimbursement Transactions (₱ PHP)";
        pageSubtitle.textContent = "Review, manage, and release petty cash claims";
        break;
      case 'my-claims':
        pageTitle.textContent = "My Claims";
        pageSubtitle.textContent = `All submitted claims for ${curName}`;
        break;
      case 'settings':
        pageTitle.textContent = "Settings & Team Management";
        pageSubtitle.textContent = "Customize Admin account, manage consultants, and data backups";
        break;
    }
  }

  closeMobileSidebar();
  renderAll();
}

function setTab(tabName) {
  AppState.filters.tab = tabName;
  document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
  const activeBtn = document.getElementById(`tab-${tabName}`);
  if (activeBtn) activeBtn.classList.add('active');
  renderAll();
}

function resetFilters() {
  AppState.filters = {
    tab: "all",
    search: "",
    consultantId: "all",
    category: "all",
    clientRefund: "all",
    dateFrom: "",
    dateTo: ""
  };

  const searchInput = document.getElementById('tableSearchInput');
  const filterCat = document.getElementById('filterCategory');
  const filterConsultant = document.getElementById('filterConsultant');
  const filterRefund = document.getElementById('filterClientRefund');
  const filterFrom = document.getElementById('filterDateFrom');
  const filterTo = document.getElementById('filterDateTo');

  if (searchInput) searchInput.value = '';
  if (filterCat) filterCat.value = 'all';
  if (filterConsultant) filterConsultant.value = 'all';
  if (filterRefund) filterRefund.value = 'all';
  if (filterFrom) filterFrom.value = '';
  if (filterTo) filterTo.value = '';

  setTab('all');
  showToast("Filters reset to default view.", "info");
}

function toggleClientRefundField(isChecked) {
  const wrapper = document.getElementById('clientNameGroup');
  const helper = document.getElementById('clientRefundHelper');
  if (wrapper) {
    if (isChecked) {
      wrapper.style.borderColor = '#0284c7';
      if (helper) helper.textContent = "Required: Specify the client account to be invoiced for this expense reimbursement.";
    } else {
      wrapper.style.borderColor = '#e2e8f0';
      if (helper) helper.textContent = "Optional: Specify client name if recoverable.";
    }
  }
}

function resetExpenseForm() {
  const form = document.getElementById('expenseSubmitForm');
  if (form) form.reset();
  AppState.pendingUploadReceipt = null;
  renderDropzonePreview();
  toggleClientRefundField(false);
}

function openModal(modalId) {
  const m = document.getElementById(modalId);
  if (m) {
    m.style.display = 'flex';
    document.body.style.overflow = 'hidden';
  }
}

function closeModal(modalId) {
  const m = document.getElementById(modalId);
  if (m) {
    m.style.display = 'none';
    document.body.style.overflow = '';
  }
}

function toggleMobileSidebar() {
  const sidebar = document.getElementById('appSidebar');
  if (sidebar) sidebar.classList.toggle('open');
}

function closeMobileSidebar() {
  const sidebar = document.getElementById('appSidebar');
  if (sidebar) sidebar.classList.remove('open');
}

function showToast(message, type = 'info') {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;

  const icons = {
    success: '✅',
    warning: '⚠️',
    danger: '❌',
    info: 'ℹ️'
  };

  toast.innerHTML = `
    <span style="font-size:1.25rem;">${icons[type] || 'ℹ️'}</span>
    <div>
      <div class="toast-title">${type.toUpperCase()}</div>
      <div class="toast-desc">${escapeHtml(message)}</div>
    </div>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.transition = 'opacity 0.3s, transform 0.3s';
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(20px)';
    setTimeout(() => {
      if (toast.parentNode) toast.parentNode.removeChild(toast);
    }, 300);
  }, 4000);
}

function formatCurrency(amount) {
  const num = typeof amount === 'number' ? amount : parseFloat(amount) || 0;
  return `${AppState.currencySymbol}${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatDateTime(isoString) {
  if (!isoString) return '—';
  try {
    const d = new Date(isoString);
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (e) {
    return isoString;
  }
}

function formatFileSize(bytes) {
  if (!bytes) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

function generateClaimId() {
  const count = AppState.claims.length + 1;
  return `CLM-2026-${String(count).padStart(3, '0')}`;
}

function getConsultantColor(consultantId) {
  const u = AppState.users.find(user => user.id === consultantId);
  return u ? u.color : '#64748b';
}

function getConsultantInitials(name) {
  if (!name) return '??';
  const parts = name.trim().split(' ');
  if (parts.length >= 2) return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// 15. Event Listeners Setup
function setupEventListeners() {
  const userSelect = document.getElementById('topUserSelect');
  if (userSelect) {
    userSelect.addEventListener('change', (e) => {
      const targetUser = AppState.users.find(u => u.id === e.target.value);
      if (targetUser && targetUser.role === 'manager' && AppState.currentUser && AppState.currentUser.role !== 'manager') {
        const entered = prompt("🔐 Admin Authentication Required\nPlease enter the Admin Passcode to switch to Admin account:");
        if (!entered || entered.trim() !== AppState.adminPasscode) {
          showToast("Incorrect Admin Passcode! Access Denied.", "danger");
          userSelect.value = AppState.currentUser.id;
          return;
        }
      }
      setCurrentUser(e.target.value);
    });
  }

  const searchInput = document.getElementById('tableSearchInput');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      AppState.filters.search = e.target.value;
      renderAll();
    });
  }

  const filterCat = document.getElementById('filterCategory');
  if (filterCat) {
    filterCat.addEventListener('change', (e) => {
      AppState.filters.category = e.target.value;
      renderAll();
    });
  }

  const filterConsultant = document.getElementById('filterConsultant');
  if (filterConsultant) {
    filterConsultant.addEventListener('change', (e) => {
      AppState.filters.consultantId = e.target.value;
      renderAll();
    });
  }

  const filterRefund = document.getElementById('filterClientRefund');
  if (filterRefund) {
    filterRefund.addEventListener('change', (e) => {
      AppState.filters.clientRefund = e.target.value;
      renderAll();
    });
  }

  const dateFrom = document.getElementById('filterDateFrom');
  if (dateFrom) {
    dateFrom.addEventListener('change', (e) => {
      AppState.filters.dateFrom = e.target.value;
      renderAll();
    });
  }
  const dateTo = document.getElementById('filterDateTo');
  if (dateTo) {
    dateTo.addEventListener('change', (e) => {
      AppState.filters.dateTo = e.target.value;
      renderAll();
    });
  }

  const refundToggle = document.getElementById('expenseClientRefundToggle');
  if (refundToggle) {
    refundToggle.addEventListener('change', (e) => {
      toggleClientRefundField(e.target.checked);
    });
  }

  const dropzone = document.getElementById('receiptDropzone');
  const fileInput = document.getElementById('receiptFileInput');

  if (dropzone && fileInput) {
    dropzone.addEventListener('click', () => fileInput.click());

    fileInput.addEventListener('change', (e) => {
      if (e.target.files && e.target.files[0]) {
        handleFileSelect(e.target.files[0]);
      }
    });

    ['dragenter', 'dragover'].forEach(eventName => {
      dropzone.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropzone.classList.add('dragover');
      }, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
      dropzone.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropzone.classList.remove('dragover');
      }, false);
    });

    dropzone.addEventListener('drop', (e) => {
      const dt = e.dataTransfer;
      if (dt && dt.files && dt.files[0]) {
        handleFileSelect(dt.files[0]);
      }
    }, false);
  }

  document.querySelectorAll('.modal-overlay').forEach(modal => {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        closeModal(modal.id);
      }
    });
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      document.querySelectorAll('.modal-overlay').forEach(m => {
        m.style.display = 'none';
      });
      document.body.style.overflow = '';
    }
  });
}

document.addEventListener('DOMContentLoaded', initApp);

// 16. Dark Mode & Theme Toggle Logic
function loadTheme() {
  const savedTheme = localStorage.getItem('PETTY_CASH_THEME') || 'light';
  document.documentElement.setAttribute('data-theme', savedTheme);
  updateThemeToggleIcon(savedTheme);
}

function toggleTheme() {
  const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', newTheme);
  localStorage.setItem('PETTY_CASH_THEME', newTheme);
  updateThemeToggleIcon(newTheme);
  showToast(newTheme === 'dark' ? "Dark mode activated 🌙" : "Light mode activated ☀️", "info");
}

function updateThemeToggleIcon(theme) {
  const btn = document.getElementById('themeToggleBtn');
  if (btn) {
    btn.innerHTML = theme === 'dark' ? '☀️' : '🌙';
    btn.setAttribute('title', theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode');
  }
}

// Clear all claims function (wipe transactions)
function clearAllClaims() {
  if (!AppState.currentUser || AppState.currentUser.role !== 'manager') {
    return showToast("Access Denied: Only Admin can clear transaction data.", "danger");
  }
  if (confirm("Are you sure you want to delete all transaction entries? This will leave your petty cash ledger completely fresh and empty.")) {
    AppState.claims = [];
    AppState.replenishments = [];
    saveClaimsToStorage();
    savePcfSettings();
    renderAll();
    showToast("All sample transaction entries have been removed. Ledger is now fresh!", "info");
  }
}

// 17. User Guide Modal Logic
function openUserGuideModal(initialTab = null) {
  const isManager = AppState.currentUser && AppState.currentUser.role === 'manager';
  const defaultTab = initialTab || (isManager ? 'admin' : 'consultant');
  switchGuideTab(defaultTab);
  openModal('userGuideModal');
}

function switchGuideTab(tab) {
  const btnC = document.getElementById('guideTabConsultant');
  const btnA = document.getElementById('guideTabAdmin');
  const btnF = document.getElementById('guideTabFAQ');
  const secC = document.getElementById('guideSectionConsultant');
  const secA = document.getElementById('guideSectionAdmin');
  const secF = document.getElementById('guideSectionFAQ');

  if (btnC) btnC.classList.toggle('active', tab === 'consultant');
  if (btnA) btnA.classList.toggle('active', tab === 'admin');
  if (btnF) btnF.classList.toggle('active', tab === 'faq');

  if (secC) secC.style.display = (tab === 'consultant') ? 'block' : 'none';
  if (secA) secA.style.display = (tab === 'admin') ? 'block' : 'none';
  if (secF) secF.style.display = (tab === 'faq') ? 'block' : 'none';
}

function printUserGuide() {
  window.print();
}

// Call loadTheme on script initialization
loadTheme();
