const API_BASE = 'http://localhost:20129';

// Navigation
document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', (e) => {
        e.preventDefault();
        const section = item.dataset.section;
        
        // Update active nav item
        document.querySelectorAll('.nav-item').forEach(nav => nav.classList.remove('active'));
        item.classList.add('active');
        
        // Show corresponding section
        document.querySelectorAll('.section').forEach(sec => sec.classList.remove('active'));
        document.getElementById(section).classList.add('active');
        
        // Update page title
        document.querySelector('.page-title').textContent = section.charAt(0).toUpperCase() + section.slice(1);
        
        // Load section data
        loadSectionData(section);
    });
});

// Load section data
function loadSectionData(section) {
    switch(section) {
        case 'overview':
            loadOverview();
            break;
        case 'combos':
            loadCombos();
            break;
        case 'accounts':
            loadAccounts();
            break;
        case 'quota':
            loadQuota();
            break;
        case 'logs':
            loadLogs();
            break;
        case 'sync':
            loadSyncStatus();
            break;
    }
}

// Load overview data
async function loadOverview() {
    try {
        // Load stats
        const [combos, accounts, quota, logs] = await Promise.all([
            fetch(`${API_BASE}/api/combos`).then(r => r.json()),
            fetch(`${API_BASE}/api/accounts`).then(r => r.json()),
            fetch(`${API_BASE}/api/quota`).then(r => r.json()),
            fetch(`${API_BASE}/api/logs?limit=5`).then(r => r.json())
        ]);
        
        // Update stats
        document.getElementById('stat-combos').textContent = combos.data.length;
        document.getElementById('stat-accounts').textContent = accounts.data.length;
        
        // Calculate total requests and cost
        const totalRequests = logs.data.length;
        const totalCost = quota.data.providers.reduce((sum, p) => sum + (p.cost || 0), 0);
        
        document.getElementById('stat-requests').textContent = totalRequests;
        document.getElementById('stat-cost').textContent = `$${totalCost.toFixed(2)}`;
        
        // Load recent logs
        const recentLogsContainer = document.getElementById('recent-logs');
        if (logs.data.length > 0) {
            recentLogsContainer.innerHTML = logs.data.map(log => `
                <div class="activity-item">
                    <span class="activity-icon">${getLogIcon(log.level)}</span>
                    <div class="activity-content">
                        <div class="activity-title">${log.provider || 'System'}</div>
                        <div class="activity-time">${new Date(log.timestamp).toLocaleString()}</div>
                    </div>
                </div>
            `).join('');
        } else {
            recentLogsContainer.innerHTML = '<p class="placeholder-text">No recent activity</p>';
        }
        
        // Load quota overview
        const quotaOverview = document.getElementById('quota-overview');
        if (quota.data.providers.length > 0) {
            quotaOverview.innerHTML = quota.data.providers.slice(0, 3).map(q => `
                <div class="quota-item">
                    <div class="quota-header">
                        <span class="quota-name">${q.provider}</span>
                        <span class="quota-stats">${q.percentageUsed.toFixed(1)}%</span>
                    </div>
                    <div class="quota-bar">
                        <div class="quota-fill ${getQuotaClass(q.percentageUsed)}" style="width: ${q.percentageUsed}%"></div>
                    </div>
                </div>
            `).join('');
        } else {
            quotaOverview.innerHTML = '<p class="placeholder-text">No quota data available</p>';
        }
    } catch (error) {
        console.error('Error loading overview:', error);
    }
}

// Load combos
async function loadCombos() {
    try {
        const response = await fetch(`${API_BASE}/api/combos`);
        const data = await response.json();
        
        const container = document.getElementById('combos-list');
        if (data.data.length > 0) {
            container.innerHTML = data.data.map(combo => `
                <div class="combo-item">
                    <div class="combo-info">
                        <h4>${combo.name}</h4>
                        <div class="combo-models">${combo.models.length} models • ${combo.fallbackStrategy}</div>
                    </div>
                    <div class="combo-actions">
                        <button class="btn btn-secondary" onclick="editCombo('${combo.id}')">Edit</button>
                        <button class="btn btn-danger" onclick="deleteCombo('${combo.id}')">Delete</button>
                    </div>
                </div>
            `).join('');
        } else {
            container.innerHTML = '<p class="placeholder-text">No combos configured. Create your first combo to get started.</p>';
        }
    } catch (error) {
        console.error('Error loading combos:', error);
    }
}

// Load accounts
async function loadAccounts() {
    try {
        const response = await fetch(`${API_BASE}/api/accounts`);
        const data = await response.json();
        
        const container = document.getElementById('accounts-list');
        if (data.data.length > 0) {
            container.innerHTML = data.data.map(account => `
                <div class="account-item">
                    <div class="account-info">
                        <h4>${account.provider}</h4>
                        <div class="account-details">Priority: ${account.priority} • Status: ${account.status}</div>
                    </div>
                    <div class="account-actions">
                        <button class="btn btn-secondary" onclick="editAccount('${account.id}')">Edit</button>
                        <button class="btn btn-danger" onclick="deleteAccount('${account.id}')">Delete</button>
                    </div>
                </div>
            `).join('');
        } else {
            container.innerHTML = '<p class="placeholder-text">No accounts configured. Add your first API key to get started.</p>';
        }
    } catch (error) {
        console.error('Error loading accounts:', error);
    }
}

// Load quota
async function loadQuota() {
    try {
        const response = await fetch(`${API_BASE}/api/quota`);
        const data = await response.json();
        
        const container = document.getElementById('quota-details');
        if (data.data.providers.length > 0) {
            container.innerHTML = data.data.providers.map(q => `
                <div class="quota-item">
                    <div class="quota-header">
                        <span class="quota-name">${q.provider}</span>
                        <span class="quota-stats">${q.tokensUsed.toLocaleString()} / ${q.maxTokens.toLocaleString()} tokens</span>
                    </div>
                    <div class="quota-bar">
                        <div class="quota-fill ${getQuotaClass(q.percentageUsed)}" style="width: ${q.percentageUsed}%"></div>
                    </div>
                    <div class="quota-stats">
                        <span>Cost: $${(q.cost || 0).toFixed(4)}</span>
                        <span>${q.percentageUsed.toFixed(1)}% used</span>
                    </div>
                </div>
            `).join('');
        } else {
            container.innerHTML = '<p class="placeholder-text">No quota data available</p>';
        }
    } catch (error) {
        console.error('Error loading quota:', error);
    }
}

// Load logs
async function loadLogs() {
    try {
        const response = await fetch(`${API_BASE}/api/logs?limit=50`);
        const data = await response.json();
        
        const container = document.getElementById('logs-container');
        if (data.data.length > 0) {
            container.innerHTML = data.data.map(log => `
                <div class="log-item ${log.level}">
                    <div><strong>${log.timestamp}</strong> - ${log.provider || 'System'}</div>
                    <div>${log.message || log.model || 'Request processed'}</div>
                </div>
            `).join('');
        } else {
            container.innerHTML = '<p class="placeholder-text">No logs available</p>';
        }
    } catch (error) {
        console.error('Error loading logs:', error);
    }
}

// Load sync status
async function loadSyncStatus() {
    try {
        const response = await fetch(`${API_BASE}/api/sync/status`);
        const data = await response.json();
        
        const container = document.getElementById('sync-status');
        container.innerHTML = `
            <div class="sync-info">
                <div class="sync-item">
                    <span>Status:</span>
                    <span class="badge ${data.data.enabled ? 'success' : 'warning'}">${data.data.enabled ? 'Enabled' : 'Disabled'}</span>
                </div>
                <div class="sync-item">
                    <span>Last Sync:</span>
                    <span>${data.data.lastSync ? new Date(data.data.lastSync).toLocaleString() : 'Never'}</span>
                </div>
                <div class="sync-item">
                    <span>Machine ID:</span>
                    <span style="font-family: monospace; font-size: 0.75rem;">${data.data.machineId || 'N/A'}</span>
                </div>
            </div>
        `;
    } catch (error) {
        console.error('Error loading sync status:', error);
    }
}

// Helper functions
function getLogIcon(level) {
    const icons = {
        info: 'ℹ️',
        warn: '⚠️',
        error: '❌',
        debug: '🔍'
    };
    return icons[level] || '📝';
}

function getQuotaClass(percentage) {
    if (percentage >= 80) return 'danger';
    if (percentage >= 50) return 'warning';
    return '';
}

// Modal functions
function showModal(title, content) {
    document.getElementById('modal-title').textContent = title;
    document.getElementById('modal-body').innerHTML = content;
    document.getElementById('modal').classList.add('active');
}

function closeModal() {
    document.getElementById('modal').classList.remove('active');
}

// Create combo modal
function showCreateCombo() {
    const content = `
        <div class="settings-form">
            <div class="form-group">
                <label for="combo-name">Combo Name</label>
                <input type="text" id="combo-name" placeholder="my-coding-stack">
            </div>
            <div class="form-group">
                <label for="combo-provider1">Provider 1</label>
                <select id="combo-provider1">
                    <option value="openai">OpenAI</option>
                    <option value="anthropic">Anthropic</option>
                    <option value="gemini">Gemini</option>
                    <option value="deepseek">DeepSeek</option>
                    <option value="groq">Groq</option>
                </select>
            </div>
            <div class="form-group">
                <label for="combo-model1">Model 1</label>
                <input type="text" id="combo-model1" placeholder="gpt-4">
            </div>
            <div class="form-group">
                <label for="combo-provider2">Provider 2 (Fallback)</label>
                <select id="combo-provider2">
                    <option value="anthropic">Anthropic</option>
                    <option value="openai">OpenAI</option>
                    <option value="gemini">Gemini</option>
                    <option value="deepseek">DeepSeek</option>
                    <option value="groq">Groq</option>
                </select>
            </div>
            <div class="form-group">
                <label for="combo-model2">Model 2 (Fallback)</label>
                <input type="text" id="combo-model2" placeholder="claude-3-opus">
            </div>
            <button class="btn btn-primary" onclick="createCombo()">Create Combo</button>
        </div>
    `;
    showModal('Create Combo', content);
}

// Create account modal
function showCreateAccount() {
    const content = `
        <div class="settings-form">
            <div class="form-group">
                <label for="account-provider">Provider</label>
                <select id="account-provider">
                    <option value="openai">OpenAI</option>
                    <option value="anthropic">Anthropic</option>
                    <option value="gemini">Gemini</option>
                    <option value="deepseek">DeepSeek</option>
                    <option value="groq">Groq</option>
                </select>
            </div>
            <div class="form-group">
                <label for="account-apikey">API Key</label>
                <input type="password" id="account-apikey" placeholder="sk-...">
            </div>
            <div class="form-group">
                <label for="account-priority">Priority</label>
                <input type="number" id="account-priority" value="1" min="1">
            </div>
            <div class="form-group">
                <label for="account-maxtokens">Max Tokens</label>
                <input type="number" id="account-maxtokens" value="1000000">
            </div>
            <button class="btn btn-primary" onclick="createAccount()">Create Account</button>
        </div>
    `;
    showModal('Add Account', content);
}

// Create combo
async function createCombo() {
    const name = document.getElementById('combo-name').value;
    const provider1 = document.getElementById('combo-provider1').value;
    const model1 = document.getElementById('combo-model1').value;
    const provider2 = document.getElementById('combo-provider2').value;
    const model2 = document.getElementById('combo-model2').value;
    
    if (!name || !model1 || !model2) {
        alert('Please fill in all fields');
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE}/api/combos`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name,
                models: [
                    { provider: provider1, model: model1, priority: 1 },
                    { provider: provider2, model: model2, priority: 2 }
                ],
                fallbackStrategy: 'sequential'
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            alert('Combo created successfully!');
            closeModal();
            loadCombos();
        } else {
            alert('Failed to create combo: ' + data.error);
        }
    } catch (error) {
        alert('Error: ' + error.message);
    }
}

// Create account
async function createAccount() {
    const provider = document.getElementById('account-provider').value;
    const apiKey = document.getElementById('account-apikey').value;
    const priority = parseInt(document.getElementById('account-priority').value);
    const maxTokens = parseInt(document.getElementById('account-maxtokens').value);
    
    if (!apiKey) {
        alert('Please enter API key');
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE}/api/accounts`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                provider,
                apiKey,
                priority,
                maxTokens,
                resetAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            alert('Account created successfully!');
            closeModal();
            loadAccounts();
        } else {
            alert('Failed to create account: ' + data.error);
        }
    } catch (error) {
        alert('Error: ' + error.message);
    }
}

// Delete combo
async function deleteCombo(id) {
    if (!confirm('Are you sure you want to delete this combo?')) return;
    
    try {
        const response = await fetch(`${API_BASE}/api/combos/${id}`, {
            method: 'DELETE'
        });
        
        const data = await response.json();
        
        if (data.success) {
            alert('Combo deleted successfully!');
            loadCombos();
        } else {
            alert('Failed to delete combo: ' + data.error);
        }
    } catch (error) {
        alert('Error: ' + error.message);
    }
}

// Delete account
async function deleteAccount(id) {
    if (!confirm('Are you sure you want to delete this account?')) return;
    
    try {
        const response = await fetch(`${API_BASE}/api/accounts/${id}`, {
            method: 'DELETE'
        });
        
        const data = await response.json();
        
        if (data.success) {
            alert('Account deleted successfully!');
            loadAccounts();
        } else {
            alert('Failed to delete account: ' + data.error);
        }
    } catch (error) {
        alert('Error: ' + error.message);
    }
}

// Export logs
async function exportLogs() {
    try {
        const response = await fetch(`${API_BASE}/api/logs/export?format=json`);
        const data = await response.json();
        
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'golden-router-logs.json';
        a.click();
        URL.revokeObjectURL(url);
    } catch (error) {
        alert('Error exporting logs: ' + error.message);
    }
}

// Clear logs
async function clearLogs() {
    if (!confirm('Are you sure you want to clear all logs?')) return;
    
    try {
        const response = await fetch(`${API_BASE}/api/logs`, {
            method: 'DELETE'
        });
        
        const data = await response.json();
        
        if (data.success) {
            alert('Logs cleared successfully!');
            loadLogs();
        } else {
            alert('Failed to clear logs: ' + data.error);
        }
    } catch (error) {
        alert('Error: ' + error.message);
    }
}

// Refresh data
function refreshData() {
    const activeSection = document.querySelector('.section.active').id;
    loadSectionData(activeSection);
}

// Open dashboard
function openDashboard() {
    window.open(`${API_BASE}/dashboard.html`, '_blank');
}

// Save settings
async function saveSettings() {
    const settings = {
        rtkEnabled: document.getElementById('setting-rtk').value === 'true',
        cavemanEnabled: document.getElementById('setting-caveman').value === 'true',
        logLevel: document.getElementById('setting-loglevel').value,
        cloudSyncEnabled: document.getElementById('setting-cloudsync').value === 'true'
    };
    
    try {
        const response = await fetch(`${API_BASE}/api/settings`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(settings)
        });
        
        const data = await response.json();
        
        if (data.success) {
            alert('Settings saved successfully!');
        } else {
            alert('Failed to save settings: ' + data.error);
        }
    } catch (error) {
        alert('Error: ' + error.message);
    }
}

// Show translation test
function showTranslationTest() {
    alert('Translation test feature coming soon!');
}

// Show OAuth authorize
function showOAuthAuthorize() {
    alert('OAuth authorization feature coming soon!');
}

// Show add provider
function showAddProvider() {
    alert('Add provider feature coming soon!');
}

// Edit combo
function editCombo(id) {
    alert('Edit combo feature coming soon!');
}

// Edit account
function editAccount(id) {
    alert('Edit account feature coming soon!');
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadOverview();
});
