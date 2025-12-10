// API base URL: points to the same domain, adjust if your API prefix is different
const API_BASE = window.location.origin; // e.g., https://example.com or http://127.0.0.1:8000

// Utility function to display results
function displayResult(elementId, data, isError = false) {
    const element = document.getElementById(elementId);
    element.className = 'result ' + (isError ? 'error' : 'success');
    element.innerHTML = typeof data === 'string' ? data : `<pre>${JSON.stringify(data, null, 2)}</pre>`;
}

// Fetch groups
async function fetchGroups() {
    try {
        const response = await fetch(`${API_BASE}/api/groups/`);
        const data = await response.json();
        if (response.ok) {
            displayResult('groups-result', data);
        } else {
            displayResult('groups-result', data.error || 'Failed to fetch groups', true);
        }
    } catch (error) {
        displayResult('groups-result', `Error: ${error.message}`, true);
    }
}

// Fetch all accounts
async function fetchAccounts() {
    try {
        const response = await fetch(`${API_BASE}/api/accounts/`);
        const data = await response.json();
        if (response.ok) {
            displayResult('accounts-result', data);
        } else {
            displayResult('accounts-result', data.error || 'Failed to fetch accounts', true);
        }
    } catch (error) {
        displayResult('accounts-result', `Error: ${error.message}`, true);
    }
}

// Fetch account details
async function fetchAccountDetails() {
    const loginId = document.getElementById('login-id').value;
    if (!loginId) {
        displayResult('account-details-result', 'Please enter a login ID', true);
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/api/accounts/${loginId}/`);
        const data = await response.json();
        if (response.ok) {
            displayResult('account-details-result', data);
        } else {
            displayResult('account-details-result', data.error || 'Failed to fetch account details', true);
        }
    } catch (error) {
        displayResult('account-details-result', `Error: ${error.message}`, true);
    }
}

// Fetch open positions
async function fetchOpenPositions() {
    const loginId = document.getElementById('position-login-id').value;
    if (!loginId) {
        displayResult('positions-result', 'Please enter a login ID', true);
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/api/positions/${loginId}/`);
        const data = await response.json();
        if (response.ok) {
            displayResult('positions-result', data);
        } else {
            displayResult('positions-result', data.error || 'Failed to fetch positions', true);
        }
    } catch (error) {
        displayResult('positions-result', `Error: ${error.message}`, true);
    }
}

async function fetchAllOpenPositions() {
    try {
        const response = await fetch(`${API_BASE}/api/positions/sync_all/`); // <-- add /api if needed
        const data = await response.json();

        if (response.ok) {
            displayResult('all-positions-result', data);
        } else {
            displayResult('all-positions-result', data.error || 'Failed to sync all positions', true);
        }
    } catch (error) {
        displayResult('all-positions-result', `Error: ${error.message}`, true);
    }
}

// Auto-load data on page load
window.addEventListener('DOMContentLoaded', function() {
    fetchGroups();
    fetchAccounts();
});
