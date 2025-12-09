// API base URL
const API_BASE = window.location.origin + '/api';

// Utility function to display results
function displayResult(elementId, data, isError = false) {
    const element = document.getElementById(elementId);
    element.className = 'result ' + (isError ? 'error' : 'success');
    element.textContent = typeof data === 'string' ? data : JSON.stringify(data, null, 2);
}

// Fetch groups from MT5
async function fetchGroups() {
    try {
        const response = await fetch(`${API_BASE}/groups/`);
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
        const response = await fetch(`${API_BASE}/accounts/`);
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
        const response = await fetch(`${API_BASE}/accounts/${loginId}/`);
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
        const response = await fetch(`${API_BASE}/positions/${loginId}/`);
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

// Add event listeners for Enter key on input fields
document.getElementById('login-id').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        fetchAccountDetails();
    }
});

document.getElementById('position-login-id').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        fetchOpenPositions();
    }
});
