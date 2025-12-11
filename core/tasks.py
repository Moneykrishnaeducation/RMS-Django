# myapp/tasks.py
import threading
import time
import requests
from django.conf import settings

# Set your API base URL
API_BASE = getattr(settings, 'API_BASE_URL', 'http://127.0.0.1:8000')  # Change if needed
FETCH_INTERVAL = 10  # seconds

def fetch_data_periodically():
    """Fetch groups, accounts, open positions, and closed positions periodically."""
    while True:
        try:
            # Fetch Groups
            groups_resp = requests.get(f"{API_BASE}/api/groups/")
            groups = groups_resp.json() if groups_resp.ok else {"error": groups_resp.text}
            
            # Fetch Accounts
            accounts_resp = requests.get(f"{API_BASE}/api/accounts/")
            accounts = accounts_resp.json() if accounts_resp.ok else {"error": accounts_resp.text}

            # Fetch All Open Positions
            open_positions_resp = requests.get(f"{API_BASE}/api/positions/sync_all/")
            open_positions = open_positions_resp.json() if open_positions_resp.ok else {"error": open_positions_resp.text}

            # Fetch All Closed Positions
            closed_positions_resp = requests.get(f"{API_BASE}/api/closepositions/sync_all/")
            closed_positions = closed_positions_resp.json() if closed_positions_resp.ok else {"error": closed_positions_resp.text}

            # Print or store the results (for demonstration)
            print("="*50)
            print("Groups:", groups)
            print("Accounts:", accounts)
            print("Open Positions:", open_positions)
            print("Closed Positions:", closed_positions)
            print("="*50)

        except Exception as e:
            print("Error fetching data:", e)

        time.sleep(FETCH_INTERVAL)


def start_background_thread():
    """Start the background thread as a daemon."""
    thread = threading.Thread(target=fetch_data_periodically, daemon=True)
    thread.start()
