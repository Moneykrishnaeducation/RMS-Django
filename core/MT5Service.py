import logging
import os
import MT5Manager
import time
import json
import threading
from datetime import datetime
import django
from django.conf import settings

logger = logging.getLogger(__name__)

# Configure Django settings
if not settings.configured:
    settings.configure(
        DATABASES={
            'default': {
                'ENGINE': 'django.db.backends.postgresql',
                'NAME': 'RMS',
                'USER': 'postgres',
                'PASSWORD': 'Vtindex@123',
                'HOST': 'localhost',
                'PORT': '5432',
            }
        },
        INSTALLED_APPS=[
            'django.contrib.contenttypes',
            'django.contrib.auth',
            'core',
        ],
        USE_TZ=True,
    )
    django.setup()

from core.models import Groups

__all__ = ['MT5Service']


def _read_env(dotenv_path=None):
    env = {}
    path = dotenv_path or os.path.join(os.path.dirname(__file__), '.env')
    if not os.path.exists(path):
        return env
    with open(path, 'r', encoding='utf-8') as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith('#'):
                continue
            if '=' in line:
                k, v = line.split('=', 1)
                env[k.strip()] = v.strip()
    return env


class MT5Service:
    """Standalone, lightweight wrapper around MT5Manager for read-only operations.

    This avoids depending on Django models and provides simple helpers used by the
    RMS for listing accounts, reading account details and positions, and fetching groups.
    """

    _shared_manager = None
    _shared_lock = threading.Lock()

    def __init__(self, host=None, port=None, login=None, password=None,
             server_id=None, pump_mode=1, timeout=120000):

        env = _read_env()

        
        if server_id:
            try:
                from core.models import ServerSetting
                server = ServerSetting.objects.get(id=server_id)

                host = host or (server.server_ip.split(':')[0] if ':' in server.server_ip else server.server_ip)
                port = port or (server.server_ip.split(':')[1] if ':' in server.server_ip else '443')
                login = login or str(server.real_account_login)
                password = password or server.real_account_password

            except Exception as e:
                raise ValueError(f"Server ID {server_id} not found: {e}")

        else:
            
            host = host or env.get('MT5_HOST')
            port = port or env.get('MT5_PORT')
            login = login or env.get('MT5_MANAGER_USER')
            password = password or env.get('MT5_MANAGER_PASS')

           
            if host is None or port is None or login is None or password is None:
                try:
                    from core.models import ServerSetting
                    srv = ServerSetting.objects.latest('created_at')

                    host = host or (srv.server_ip.split(':')[0] if ':' in srv.server_ip else srv.server_ip)
                    port = port or (srv.server_ip.split(':')[1] if ':' in srv.server_ip else '443')
                    login = login or str(srv.real_account_login)
                    password = password or srv.real_account_password
                except:
                    pass

        if not host or not port or not login or not password:
            raise ValueError("Missing MT5 connection parameters.")

        self.address = f"{host}:{port}"
        try:
            self.login = int(login)
        except:
            self.login = login

        self.password = password
        self.pump_mode = pump_mode
        self.timeout = timeout

    
    # def __init__(self, host=None, port=None, login=None, password=None, pump_mode=1, timeout=120000):
        
    #     env = _read_env()
    #     host = host or env.get('MT5_HOST')
    #     port = port or env.get('MT5_PORT')
    #     login = login or env.get('MT5_MANAGER_USER')
    #     password = password or env.get('MT5_MANAGER_PASS')

        
    #     if host is None or port is None or login is None or password is None:
    #         try:
    #             from core.models import ServerSetting
    #             server_setting = ServerSetting.objects.latest('created_at')
    #             host = host or server_setting.server_ip.split(':')[0] if ':' in server_setting.server_ip else server_setting.server_ip
    #             port = port or (server_setting.server_ip.split(':')[1] if ':' in server_setting.server_ip else '443')
    #             login = login or str(server_setting.real_account_login)
    #             password = password or server_setting.real_account_password
    #         except Exception:
    #             pass

    #     if host is None or port is None or login is None or password is None:
    #         raise ValueError('MT5 connection parameters missing (host, port, login, password). Please configure server settings first.')

    #     self.address = f"{host}:{port}"
    #     try:
    #         self.login = int(login)
    #     except Exception:
    #         self.login = login
    #     self.password = password
    #     self.pump_mode = pump_mode
    #     self.timeout = timeout
    #     self.manager = None
    #     self._instance_dir = None
    #     self._lock = threading.Lock()

    def _init_manager(self):
        # create per-process instance directory for MT5 library
        pid = str(os.getpid())
        base = os.path.join(os.getcwd(), 'mt5_instances')
        os.makedirs(base, exist_ok=True)
        inst = os.path.join(base, pid)
        os.makedirs(inst, exist_ok=True)
        self._instance_dir = inst
        MT5Manager.InitializeManagerAPIPath(module_path=inst, work_path=inst)
        self.manager = MT5Manager.ManagerAPI()

    def connect(self):
        """Connect to MT5 Manager. Raises Exception on failure."""
        with MT5Service._shared_lock:
            if MT5Service._shared_manager and getattr(MT5Service._shared_manager, 'connected', False):
                return MT5Service._shared_manager
            self._init_manager()
            MT5Service._shared_manager = self.manager
            # Choose pump mode: prefer library constant if available, else use provided numeric
            pump = self.pump_mode
            try:
                # Try to use enum constant if present (safer than hardcoding numeric)
                pump_enum = getattr(MT5Manager.ManagerAPI, 'EnPumpModes', None)
                if pump_enum and hasattr(pump_enum, 'PUMP_MODE_FULL'):
                    pump = pump_enum.PUMP_MODE_FULL
            except Exception:
                # fallback to numeric pump_mode already set
                pump = self.pump_mode

            if not MT5Service._shared_manager.Connect(self.address, int(self.login), str(self.password), pump, int(self.timeout)):
                # try one more time with numeric fallback 1
                last = MT5Manager.LastError()
                try:
                    if pump != 1:
                        if MT5Service._shared_manager.Connect(self.address, int(self.login), str(self.password), 1, int(self.timeout)):
                            MT5Service._shared_manager.connected = True
                            return MT5Service._shared_manager
                except Exception:
                    pass
                raise Exception(f"Failed to connect to MT5 Manager: {last}")
            # mark connected
            try:
                MT5Service._shared_manager.connected = True
            except Exception:
                pass
            return MT5Service._shared_manager

    def close(self):
        try:
            if self.manager and getattr(self.manager, 'connected', False):
                # MT5 API doesn't provide explicit disconnect; try to mark disconnected
                self.manager.connected = False
        except Exception:
            pass

    def get_group_list(self):
        """Return list of group names from MT5."""
        mgr = self.connect()
        groups = []
        try:
            total = mgr.GroupTotal()
        except Exception:
            total = 0
        if not total:
            return groups
        for i in range(total):
            try:
                g = mgr.GroupNext(i)
                if not g:
                    continue
                name = None
                for attr in ('Group', 'Name', 'group', 'name', 'GroupName'):
                    if hasattr(g, attr):
                        name = getattr(g, attr)
                        break
                if name:
                    groups.append(name)
            except Exception:
                continue

        # Insert groups into PostgreSQL database using Django ORM
        try:
            for group_name in groups:
                Groups.objects.get_or_create(Groups=group_name)
        except Exception as e:
            # Log error but don't fail the method
            print(f"Error inserting groups into database: {e}")

        return groups

    def get_account_details(self, login_id):
        """Return detailed account dict or None."""
        mgr = self.connect()
        try:
            user = mgr.UserGet(int(login_id))
            account = mgr.UserAccountGet(int(login_id))
            if not user or not account:
                return None
            return {
                'login': getattr(user, 'Login', None),
                'name': f"{getattr(user, 'FirstName', '')} {getattr(user, 'LastName', '')}".strip(),
                'email': getattr(user, 'EMail', None),
                'balance': float(getattr(account, 'Balance', 0.0)),
                'equity': float(getattr(account, 'Equity', 0.0)),
                'margin': float(getattr(account, 'Margin', 0.0)),
                'margin_free': float(getattr(account, 'MarginFree', 0.0)),
                'margin_level': float(getattr(account, 'MarginLevel', 0.0)),
                'profit': float(getattr(account, 'Profit', 0.0)),
                'group': getattr(user, 'Group', None),
                'leverage': getattr(user, 'Leverage', None),
                'rights': getattr(user, 'Rights', None),
                'last_access': getattr(user, 'LastAccess', None),
                'registration': getattr(user, 'Registration', None),
            }
        except Exception:
            return None

    def get_open_positions(self, login_id):
        """Return list of open positions for the given login id."""
        mgr = self.connect()
        try:
            positions = mgr.PositionGet(int(login_id))
            if not positions:
                return []
            out = []
            for p in positions:
                out.append({
                    'date': getattr(p, 'TimeCreate', None),
                    'id': getattr(p, 'Position', None),
                    'symbol': getattr(p, 'Symbol', None),
                    'volume': round(getattr(p, 'Volume', 0) / 10000, 2),
                    'price': getattr(p, 'PriceOpen', None),
                    'profit': getattr(p, 'Profit', None),
                    'type': 'Buy' if getattr(p, 'Action', None) == 0 else 'Sell',
                })
            return out
        except Exception:
            return []

    def get_position_by_ticket(self, ticket):
        """Return position details for a specific ticket (position ID)."""
        mgr = self.connect()
        try:
            position = mgr.PositionGet(ticket=int(ticket))
            if not position:
                return None
            # PositionGet with ticket returns a single position or list, handle accordingly
            if isinstance(position, list):
                position = position[0] if position else None
            if not position:
                return None
            return {
                'date': getattr(position, 'TimeCreate', None),
                'id': getattr(position, 'Position', None),
                'symbol': getattr(position, 'Symbol', None),
                'volume': round(getattr(position, 'Volume', 0) / 10000, 2),
                'price': getattr(position, 'PriceOpen', None),
                'profit': getattr(position, 'Profit', None),
                'type': 'Buy' if getattr(position, 'Action', None) == 0 else 'Sell',
            }
        except Exception:
            return None

    def list_accounts_by_index(self):
        """Iterate accounts using UserTotal/UserGet (index based). Returns list of dicts."""
        mgr = self.connect()
        accounts = []
        try:
            total = mgr.UserTotal()
        except Exception:
            return accounts
        for i in range(total):
            try:
                user = mgr.UserGet(i)
                if not user:
                    continue
                acc = mgr.UserAccountGet(getattr(user, 'Login', None))
                account_data = {
                    'login': getattr(user, 'Login', None),
                    'name': getattr(user, 'Name', None) or f"{getattr(user, 'FirstName', '')} {getattr(user, 'LastName', '')}".strip(),
                    'email': getattr(user, 'EMail', None),
                    'group': getattr(user, 'Group', None),
                    'leverage': getattr(user, 'Leverage', None),
                    'balance': float(getattr(acc, 'Balance', 0.0)) if acc else 0.0,
                    'equity': float(getattr(acc, 'Equity', 0.0)) if acc else 0.0,
                    'profit': float(getattr(acc, 'Profit', 0.0)) if acc else 0.0,
                }
                accounts.append(account_data)
            except Exception:
                continue
        return accounts

    def list_accounts_by_range(self, start, end, workers=8, batch_size=100, output_file=None):
        """Scan numeric login IDs from start..end (inclusive) and return found accounts.

        This is a reliable fallback when index-based enumeration returns few results.
        """
        mgr = self.connect()
        from concurrent.futures import ThreadPoolExecutor, as_completed

        start = int(start)
        end = int(end)
        if end < start:
            start, end = end, start

        def check_login(login_id):
            try:
                user = mgr.UserGet(int(login_id))
                if not user:
                    return None
                acc = mgr.UserAccountGet(int(login_id))
                return {
                    'login': getattr(user, 'Login', None),
                    'name': getattr(user, 'Name', None) or f"{getattr(user, 'FirstName', '')} {getattr(user, 'LastName', '')}".strip(),
                    'email': getattr(user, 'EMail', None),
                    'group': getattr(user, 'Group', None),
                    'leverage': getattr(user, 'Leverage', None),
                    'balance': float(getattr(acc, 'Balance', 0.0)) if acc else 0.0,
                    'equity': float(getattr(acc, 'Equity', 0.0)) if acc else 0.0,
                }
            except Exception:
                return None

        accounts = []
        # optional streaming to file to avoid memory growth
        write_file = None
        if output_file:
            write_file = open(output_file, 'w', encoding='utf-8')

        try:
            with ThreadPoolExecutor(max_workers=int(workers)) as ex:
                futures = {ex.submit(check_login, lid): lid for lid in range(start, end + 1)}
                for fut in as_completed(futures):
                    res = fut.result()
                    if res:
                        accounts.append(res)
                        if write_file:
                            write_file.write(json.dumps(res, default=str) + '\n')
        finally:
            if write_file:
                write_file.close()

        return accounts

    def list_accounts_by_groups(self, output_file=None):
        """Enumerate users by group using UserGetByGroup. Returns list of account dicts.

        This method is useful when index-based enumeration doesn't return all users.
        """
        mgr = self.connect()
        accounts = []
        write_file = None
        if output_file:
            write_file = open(output_file, 'w', encoding='utf-8')

        try:
            try:
                total = mgr.GroupTotal()
            except Exception:
                total = 0
            for i in range(total):
                try:
                    g = mgr.GroupNext(i)
                    if not g:
                        continue
                    group_name = getattr(g, 'Group', None)
                    if not group_name:
                        continue
                    # UserGetByGroup may return iterable of user objects
                    try:
                        users = mgr.UserGetByGroup(group_name)
                    except Exception:
                        users = []
                    if not users:
                        continue
                    for u in users:
                        try:
                            login = getattr(u, 'Login', None)
                            acc = mgr.UserAccountGet(login)
                            account_data = {
                                'login': login,
                                'name': getattr(u, 'Name', None) or f"{getattr(u, 'FirstName', '')} {getattr(u, 'LastName', '')}".strip(),
                                'email': getattr(u, 'EMail', None),
                                'group': getattr(u, 'Group', None),
                                'leverage': getattr(u, 'Leverage', None),
                                'balance': float(getattr(acc, 'Balance', 0.0)) if acc else 0.0,
                                'equity': float(getattr(acc, 'Equity', 0.0)) if acc else 0.0,
                                'profit': float(getattr(acc, 'Profit', 0.0)) if acc else 0.0,
                            }
                            accounts.append(account_data)
                            if write_file:
                                write_file.write(json.dumps(account_data, default=str) + '\n')
                        except Exception:
                            continue
                except Exception:
                    continue
        finally:
            if write_file:
                write_file.close()

        return accounts

    def list_deals_by_login(self, login_id):
        """Return list of closed deals for the given login id."""
        mgr = self.connect()
        try:
            total = mgr.DealTotal()
            if not total:
                return []
            out = []
            for i in range(total):
                try:
                    d = mgr.DealNext(i)
                    if not d:
                        continue
                    if getattr(d, 'Login', None) != int(login_id):
                        continue
                    out.append({
                        'Deal': getattr(d, 'Deal', None),
                        'Login': getattr(d, 'Login', None),
                        'Symbol': getattr(d, 'Symbol', None),#
                        'Profit': getattr(d, 'Profit', None),#
                        'Volume': round(getattr(d, 'Volume', 0) / 10000, 2),#
                        'Price': getattr(d, 'Price', None),
                        'Time': getattr(d, 'Time', None),
                        'Type': getattr(d, 'Action', None),#
                        'Entry': getattr(d, 'Entry', None),
                    })
                except Exception:
                    continue
            return out
        except Exception:
            return []

    def search_accounts_by_name_email(self, name=None, email=None):
        """Search accounts by name or email. Returns list of matching accounts."""
        accounts = self.list_accounts_by_groups()
        if not accounts:
            return []

        results = []
        for acc in accounts:
            acc_name = acc.get('name', '').lower()
            acc_email = acc.get('email', '').lower()
            if name and name.lower() in acc_name:
                results.append(acc)
            elif email and email.lower() in acc_email:
                results.append(acc)
        return results
    
    def get_closed_trades(self, login_id, from_date=None, to_date=None, auto_process_commission=False):
        """
        Fetch closed trades (deals) for a given MT5 account login_id and date range.
        Returns a list of deal objects (Action == 2 is usually 'closed').
        Handles all error cases robustly.
        
        Args:
            login_id: MT5 account login ID
            from_date: Start date for trade search
            to_date: End date for trade search  
            auto_process_commission: If True, automatically process commissions for new closed trades
                                    DEFAULT: False to prevent duplicate processing
        """
        if not self.manager:
            raise Exception("MT5 Manager not connected")
        from datetime import datetime, timedelta
        if to_date is None:
            to_date = datetime.now()
        if from_date is None:
            # Get trades from 7 days ago to future (to catch any missed recent trades)
            from_date = datetime.now() - timedelta(days=1)
        
        # Validate that login_id is numeric before making MT5 call
        try:
            numeric_login_id = int(login_id)
        except (ValueError, TypeError):
            logger.warning(f"Skipping non-numeric account ID: {login_id}")
            return []
            
        deals = self.manager.DealRequest(numeric_login_id, from_date, to_date)
        # Debug print removed
        # Defensive: DealRequest can return False, None, empty list, or a list of deals
        if deals is False or deals is None:
            return []
        if isinstance(deals, bool):
            return []
        if not isinstance(deals, (list, tuple)):
            return []
        if not deals:
            return []
        closed_deals = []
        for idx, d in enumerate(deals):
            action = getattr(d, 'Action', None)
            entry = getattr(d, 'Entry', None)
            symbol = getattr(d, 'Symbol', None)
            volume_closed = getattr(d, 'VolumeClosed', 0)
            deal_id = getattr(d, 'Deal', None)
            position_id = getattr(d, 'PositionID', None)  # Use PositionID not Position
            
            # DEBUG: Log all available attributes for first deal
            if idx == 0 and auto_process_commission:
                logger.info(f"🔍 DEBUG: First deal attributes: {[attr for attr in dir(d) if not attr.startswith('_')]}")
                logger.info(f"🔍 DEBUG: Deal={deal_id}, PositionID={position_id}, Entry={entry}, Action={action}")
            
            # Keep original filter for actual closed_deals list - ONLY closing deals (Entry==1)
            if entry == 1 and symbol and str(symbol).strip() != '' and volume_closed and float(volume_closed) > 0 and action in (0, 1):
                closed_deals.append(d)
                logger.debug(f"Added closed deal: Deal={deal_id}, PositionID={position_id}, Entry={entry}")
        
        # Auto-process commissions for newly closed trades if requested
        if auto_process_commission and closed_deals:
            logger.info(f"Auto-processing commissions for {len(closed_deals)} closed trades for account {login_id}")
            try:
                self._auto_process_commissions_for_closed_trades(login_id, closed_deals)
                logger.info(f"✅ Auto-processing completed for account {login_id}")
            except Exception as e:
                logger.error(f"❌ Auto-processing failed for account {login_id}: {str(e)}")
                # Continue execution even if auto-processing fails
                pass
        
        return closed_deals


# Global variables to hold current MT5 connection
_mt5_instance = None
_current_server_setting = None
_mt5_lock = threading.Lock()


def ensure_connected(func):
    """
    Decorator to ensure the MT5 Service is connected before executing a function.
    """
    def wrapper(*args, **kwargs):
        global _mt5_instance
        if not _mt5_instance or not getattr(_mt5_instance, 'manager', None):
            raise Exception("MT5 Service is not connected. Please reconnect using `reset_mt5_instance()`.")
        return func(*args, **kwargs)
    return wrapper


def reset_mt5_instance(server_id=None):
    """
    Reset the global MT5Service instance to reload credentials from DB or a specific server_id.
    Call this after updating server settings.
    """
    global _mt5_instance, _current_server_setting
    with _mt5_lock:
        # Disconnect existing instance
        if _mt5_instance:
            try:
                if hasattr(_mt5_instance, 'manager') and _mt5_instance.manager:
                    # MT5Service might not have explicit disconnect
                    _mt5_instance.manager = None
                logger.info("Previous MT5Service instance disconnected successfully")
            except Exception as e:
                logger.warning(f"Error disconnecting previous MT5Service instance: {e}")

        # Load new server settings from DB
        try:
            if server_id:
                from core.models import ServerSetting
                server_setting = ServerSetting.objects.get(id=server_id)
            else:
                from core.models import ServerSetting
                server_setting = ServerSetting.objects.latest('created_at')
            _current_server_setting = server_setting
        except Exception as e:
            logger.error("No ServerSetting found to initialize MT5Service")
            _mt5_instance = None
            return None

        # Initialize MT5Service with DB credentials
        host = server_setting.server_ip.split(':')[0]
        port = int(server_setting.server_ip.split(':')[1]) if ':' in server_setting.server_ip else 443
        login = int(server_setting.real_account_login)
        password = server_setting.real_account_password

        try:
            _mt5_instance = MT5Service(host=host, port=port, login=login, password=password)
            _mt5_instance.connect()
            logger.info(f"MT5Service connected: {host}:{port}, login={login}")
        except Exception as e:
            _mt5_instance = None
            logger.error(f"Failed to connect MT5Service: {e}")
            cache.set('mt5_manager_error', str(e))

        # Clear cached MT5 groups
        try:
            from core.models import MT5GroupConfig
            MT5GroupConfig.objects.all().update(is_enabled=False, last_sync=None)
            cache.delete('mt5_groups_sync')
            cache.delete('mt5_connection_status')
            logger.info("Cleared cached MT5 trading groups")
        except Exception as e:
            logger.warning(f"Error clearing MT5 groups cache: {e}")

        return _mt5_instance


def force_refresh_trading_groups():
    """
    Force refresh trading groups from the currently connected MT5Service instance.
    """
    global _mt5_instance
    if not _mt5_instance or not getattr(_mt5_instance, 'manager', None):
        logger.error("MT5Service is not connected. Cannot refresh trading groups.")
        return False

    try:
        # Clear cached groups
        from core.models import MT5GroupConfig
        MT5GroupConfig.objects.all().update(is_enabled=False, last_sync=None)
        # Sync trading groups from MT5
        result = _mt5_instance.sync_groups()  # Assumes your MT5Service has a method `sync_groups()`
        if result:
            logger.info("Trading groups refreshed from MT5")
            return True
        else:
            logger.error("Failed to sync trading groups from MT5")
            return False
    except Exception as e:
        logger.error(f"Error refreshing trading groups: {e}")
        return False


if __name__ == '__main__':
    import argparse
    parser = argparse.ArgumentParser(description='MT5Service quick test')
    parser.add_argument('--action', choices=['groups', 'list', 'detail', 'positions'], default='groups')
    parser.add_argument('--login', help='login id for detail/positions')
    args = parser.parse_args()

    svc = MT5Service()
    if args.action == 'groups':
        print(json.dumps(svc.get_group_list(), indent=2, default=str))
    elif args.action == 'list':
        lst = svc.list_accounts_by_index()
        print(json.dumps({'count': len(lst)}, indent=2))
    elif args.action == 'detail':
        print(json.dumps(svc.get_account_details(args.login), indent=2, default=str))
    elif args.action == 'positions':
        print(json.dumps(svc.get_open_positions(args.login), indent=2, default=str))
