import time
from django.http import JsonResponse
from django.shortcuts import render
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
import json
from .MT5Service import MT5Service
import os
from django.http import FileResponse
from django.conf import settings
from .MT5Service import MT5Service
from datetime import datetime, timedelta
from django.http import JsonResponse
from django.core.management import call_command

from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from django.utils import timezone
import threading

from .models import Accounts, OpenPositions
from datetime import datetime
from django.utils import timezone
from .models import Accounts, OpenPositions
from django.db.models import Sum
from .models import Accounts, OpenPositions, ClosedPositions
from .models import ServerSetting


from datetime import datetime, timezone
def normalize_date(date_value):
    """Ensure date_value is a valid datetime object."""
    if date_value is None:
        return datetime.now(timezone.utc)  # Use datetime.timezone.utc here
    elif isinstance(date_value, str):
        try:
            # If the date ends with 'Z', replace it with '+00:00' (for UTC time)
            if date_value.endswith('Z'):
                date_value = date_value[:-1] + '+00:00'  # Convert 'Z' to UTC offset
            # Attempt to parse the string as a datetime
            return datetime.fromisoformat(date_value)
        except Exception as e:
            print(f"Error parsing date {date_value}: {e}. Returning current time.")
            return datetime.now(timezone.utc)  # Use datetime.timezone.utc here
    elif isinstance(date_value, datetime):
        # If it's already a datetime object, return it
        return date_value
    elif isinstance(date_value, int):
        # If it's an integer (Unix timestamp), convert it to a datetime object
        try:
            return datetime.fromtimestamp(date_value, tz=timezone.utc)  # Convert to UTC time
        except Exception as e:
            print(f"Error converting timestamp {date_value}: {e}. Returning current time.")
            return datetime.now(timezone.utc)  # Use datetime.timezone.utc here
    else:
        # If it's any other type, return the current time
        print(f"Unexpected date type: {type(date_value)}. Returning current time.")
        return datetime.now(timezone.utc)  # Use datetime.timezone.ut
    
    
@csrf_exempt
@require_http_methods(["GET"])
def get_open_positions_from_db(request, login_id=None):
    """Get open positions from DB after updating with fresh MT5 data, optionally filtered by login_id."""
    try:
        svc = MT5Service()
        from .models import Accounts, OpenPositions
        from django.utils import timezone
        if login_id:
            # Update DB for specific login_id
            positions = svc.get_open_positions(login_id)
            account = Accounts.objects.get(login=login_id)
            existing_positions = set(OpenPositions.objects.filter(login=account).values_list('position_id', flat=True))
            fetched_positions = set()
            for pos in positions:
                pos_id = pos.get('id')
                if pos_id is None:
                    continue
                # Skip if required fields are None
                symbol = pos.get('symbol')
                volume = pos.get('volume')
                price = pos.get('price')
                position_type = pos.get('type')
                if symbol is None or volume is None or price is None or position_type is None:
                    continue
                fetched_positions.add(pos_id)
                OpenPositions.objects.update_or_create(
                    login=account,
                    position_id=pos_id,
                    defaults={
                        'symbol': symbol,
                        'volume': volume,
                        'price': price,
                        'profit': pos.get('profit') or 0,
                        'position_type': position_type,
                        'date_created': pos.get('date') or timezone.now(),
                    }
                )
            # Delete positions that are no longer open
            to_delete = existing_positions - fetched_positions
            OpenPositions.objects.filter(login=account, position_id__in=to_delete).delete()
            # Retrieve updated positions from DB
            positions = OpenPositions.objects.filter(login__login=login_id).values(
                'position_id', 'symbol', 'volume', 'price', 'profit', 'position_type', 'date_created', 'last_updated'
            )
        else:
            # Update DB for all login_ids
            login_ids = Accounts.objects.values_list('login', flat=True)
            for lid in login_ids:
                positions = svc.get_open_positions(lid)
                account = Accounts.objects.get(login=lid)
                existing_positions = set(OpenPositions.objects.filter(login=account).values_list('position_id', flat=True))
                fetched_positions = set()
                for pos in positions:
                    pos_id = pos.get('id')
                    if pos_id is None:
                        continue
                    # Skip if required fields are None
                    symbol = pos.get('symbol')
                    volume = pos.get('volume')
                    price = pos.get('price')
                    position_type = pos.get('type')
                    if symbol is None or volume is None or price is None or position_type is None:
                        continue
                    fetched_positions.add(pos_id)
                    OpenPositions.objects.update_or_create(
                        login=account,
                        position_id=pos_id,
                        defaults={
                            'symbol': symbol,
                            'volume': volume,
                            'price': price,
                            'profit': pos.get('profit') or 0,
                            'position_type': position_type,
                            'date_created': pos.get('date') or timezone.now(),
                        }
                    )
                # Delete positions that are no longer open
                to_delete = existing_positions - fetched_positions
                OpenPositions.objects.filter(login=account, position_id__in=to_delete).delete()
            # Retrieve all updated positions from DB
            positions = OpenPositions.objects.all().values(
                'login__login', 'position_id', 'symbol', 'volume', 'price', 'profit', 'position_type', 'date_created', 'last_updated'
            )
        return JsonResponse({'positions': list(positions)}, safe=False)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)
    

  # make sure this import works


@csrf_exempt
@require_http_methods(["GET"])
def sync_all_closed_positions(request):
    """
    Sync closed positions for all accounts via MT5 and store in the DB.
    Can be triggered via URL.
    """
    try:
        svc = MT5Service()
        svc.connect()

        accounts = Accounts.objects.all()
        total_stored = 0
        from_date = datetime.now() - timedelta(days=30)
        to_date = datetime.now()

        results = []

        for account in accounts:
            closed_positions = svc.get_closed_trades(account.login, from_date=from_date, to_date=to_date)
            stored_count = store_closed_positions(account, closed_positions)
            total_stored += stored_count
            results.append({
                "account": account.login,
                "fetched": len(closed_positions),
                "stored": stored_count
            })

        return JsonResponse({
            "status": "success",
            "total_accounts": accounts.count(),
            "total_stored": total_stored,
            "details": results
        })

    except Exception as e:
        import traceback
        traceback.print_exc()
        return JsonResponse({"status": "error", "message": str(e)}, status=500)
    
    
@csrf_exempt
@require_http_methods(["GET"])
def get_lots_for_account(request, login_id):
    """Fetch and calculate the total 'lot' (volume) for each symbol for a given login ID."""
    try:
        # Get the account object for the given login_id
        account = Accounts.objects.get(login=login_id)

        # Get all open positions for the account
        positions = OpenPositions.objects.filter(login=account)

        # Group the positions by symbol and calculate the total volume (lot) for each symbol
        lot_data = positions.values('symbol').annotate(total_volume=Sum('volume')).order_by('symbol')

        # Prepare the response data
        result = [{"symbol": item['symbol'], "lot": item['total_volume']} for item in lot_data]

        # Return the data as a JSON response
        return JsonResponse({"data": result}, safe=False)

    except Accounts.DoesNotExist:
        return JsonResponse({"error": "Account not found"}, status=404)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)

def sync_positions_for_account(account):
    """Fetch and store positions for a single account."""
    svc = MT5Service()
    login_id = account.login

    try:
        positions = svc.get_open_positions(login_id)
        existing_positions = set(
            OpenPositions.objects.filter(login=account)
            .values_list('position_id', flat=True)
        )
        fetched_positions = set()

        for pos in positions:
            pos_id = pos.get("id")
            if not pos_id:
                continue

            symbol = pos.get("symbol")
            volume = pos.get("volume")
            price = pos.get("price")
            position_type = pos.get("type")

            if any(v is None for v in [symbol, volume, price, position_type]):
                continue

            fetched_positions.add(pos_id)

            OpenPositions.objects.update_or_create(
                login=account,
                position_id=pos_id,
                defaults={
                    "symbol": symbol,
                    "volume": volume,
                    "price": price,
                    "profit": pos.get("profit") or 0,
                    "position_type": position_type,
                    "date_created": normalize_date(pos.get("date")),
                },
            )

        # Delete closed positions
        to_delete = existing_positions - fetched_positions
        if to_delete:
            OpenPositions.objects.filter(login=account, position_id__in=to_delete).delete()

    except Exception as e:
        print(f"Error syncing account {login_id}: {e}")

@csrf_exempt  # Only use if necessary; remove in production
@require_http_methods(["GET"])
def get_all_lots(request):
    """
    Fetch total lot (volume) per symbol for each account,
    combining OpenPositions + ClosedPositions.
    """
    try:
        # ----- OPEN POSITIONS -----
        open_data = (
            OpenPositions.objects
            .values('login__login', 'symbol')
            .annotate(total_open=Sum('volume'))
        )

        # Convert to dictionary for easy merging
        open_dict = {
            (item['login__login'], item['symbol']): item['total_open']
            for item in open_data
        }

        # ----- CLOSED POSITIONS -----
        closed_data = (
            ClosedPositions.objects
            .values('login__login', 'symbol')
            .annotate(total_closed=Sum('volume'))
        )

        closed_dict = {
            (item['login__login'], item['symbol']): item['total_closed']
            for item in closed_data
        }

        # ----- MERGE BOTH -----
        combined_keys = set(open_dict.keys()) | set(closed_dict.keys())

        all_lots = []
        for key in combined_keys:
            login, symbol = key
            total_open = open_dict.get(key, 0)
            total_closed = closed_dict.get(key, 0)

            all_lots.append({
                "login_id": login,
                "symbol": symbol,
                "open_lot": total_open,
                "closed_lot": total_closed,
                "net_lot": total_open + total_closed
            })

        return JsonResponse({"data": all_lots})

    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)


@csrf_exempt  # Only use if necessary, consider removing for production
@require_http_methods(["GET"])
def get_all_lots_by_login(request, login_id):
    """Fetch and calculate the total 'lot' (volume) for each symbol for a specific account."""
    try:
        # Fetch and aggregate positions for the given login_id
        lot_data = (
            OpenPositions.objects
            .filter(login__login=login_id)  # Filter by the login_id
            .values('symbol')  # Group by symbol
            .annotate(total_volume=Sum('volume'))  # Sum the volume for each symbol
            .order_by('symbol')  # Order results by symbol
        )

        # Prepare the response data
        all_lots = [
            {
                "login_id": login_id,  # The login_id provided in the URL
                "symbol": item['symbol'],
                "lot": item['total_volume']
            }
            for item in lot_data
        ]

        # Return the data as a JSON response
        return JsonResponse({"data": all_lots})

    except Exception as e:
        # Log the exception for debugging purposes (optional)
        return JsonResponse({"error": str(e)}, status=500)

@csrf_exempt  # Use only if necessary; avoid in production without proper security
@require_http_methods(["GET"])
def get_user_profile(request, login_id):
    """Fetch user profile data including account details and open positions."""
    try:
        # Fetch account details based on login_id
        account = get_object_or_404(Accounts, login=login_id)

        # Fetch open positions associated with this account
        open_positions = OpenPositions.objects.filter(login=account)

        # Serialize account data
        account_data = {
            "login": account.login,
            "name": account.name,
            "email": account.email,
            "group": account.group,
            "leverage": account.leverage,
            "balance": str(account.balance),
            "equity": str(account.equity),
            "profit": str(account.profit),
            "margin": str(account.margin),
            "margin_free": str(account.margin_free),
            "margin_level": str(account.margin_level),
            "last_access": account.last_access,
            "registration": account.registration
        }

        # Serialize open positions data
        open_positions_data = [
            {
                "position_id": pos.position_id,
                "symbol": pos.symbol,
                "volume": str(pos.volume),
                "price": str(pos.price),
                "profit": str(pos.profit),
                "position_type": pos.position_type,
                "date_created": pos.date_created,
                "last_updated": pos.last_updated
            }
            for pos in open_positions
        ]

        # Combine account data and open positions data
        response_data = {
            "account": account_data,
            "open_positions": open_positions_data
        }

        # Return as JSON response
        return JsonResponse(response_data, safe=False)

    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)

@csrf_exempt
@require_http_methods(["GET"])
def sync_all_open_positions(request):
    """Start background sync for all accounts."""
    accounts = Accounts.objects.all()

    # Run the sync in a background thread
    thread = threading.Thread(
        target=lambda: [sync_positions_for_account(a) for a in accounts]
    )
    thread.start()

    # Immediately return response
    return JsonResponse(
        {"status": "success", "message": "Sync started in background"}, status=200
    )

@csrf_exempt
@require_http_methods(["GET"])
def get_open_positions_from_db(request):
    """Fetch open positions from the database."""
    try:
        # Fetch open positions from the database
        positions = OpenPositions.objects.all().values(
            'login__login', 'position_id', 'symbol', 'volume', 'price', 'profit', 'position_type', 'date_created', 'last_updated'
        )

        # Return the data as JSON
        return JsonResponse({'positions': list(positions)}, safe=False)

    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)

@csrf_exempt
@require_http_methods(["GET"])
def get_closed_positions_from_db(request):
    """Fetch closed positions from the database."""
    try:
        # Fetch closed positions from the database
        positions = ClosedPositions.objects.all().values(
            'login__login', 'deal_id', 'symbol', 'volume', 'price', 'profit', 'position_type', 'date_closed', 'last_updated'
        )

        # Process the positions to format volume, price, and profit
        processed_positions = []
        for pos in positions:
            processed_pos = pos.copy()
            # Process volume
            try:
                volume_val = float(pos['volume']) / 10000
                processed_pos['volume'] = f"{volume_val:.2f}"
            except (ValueError, TypeError):
                processed_pos['volume'] = pos['volume']  # Keep original if conversion fails

            # Process price
            try:
                price_val = float(pos['price']) / 10000
                processed_pos['price'] = f"{price_val:.2f}"
            except (ValueError, TypeError):
                processed_pos['price'] = pos['price']  # Keep original if conversion fails

            # Process profit
            try:
                profit_val = float(pos['profit']) / 10000
                processed_pos['profit'] = f"{profit_val:.2f}"
            except (ValueError, TypeError):
                processed_pos['profit'] = pos['profit']  # Keep original if conversion fails

            processed_positions.append(processed_pos)

        # Return the data as JSON
        return JsonResponse({'closed_positions': processed_positions}, safe=False)

    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)


def sync_mt5_data(request):
    try:
        call_command("sync_mt5")   # or the exact name of your command file
        return JsonResponse({"message": "Sync started successfully"})
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)

def index(request):
    file_path = os.path.join(settings.BASE_DIR, 'static', 'index.html')
    return FileResponse(open(file_path, 'rb'))

@csrf_exempt
@require_http_methods(["GET"])
def get_groups(request):
    """Get list of groups from MT5 and store in DB."""
    try:
        svc = MT5Service()
        groups = svc.get_group_list()
        # Explicitly save groups to database
        from .models import Groups
        for group_name in groups:
            Groups.objects.get_or_create(Groups=group_name)
        return JsonResponse({'groups': groups, 'stored': True}, safe=False)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)

@csrf_exempt
@require_http_methods(["GET"])
def get_account_details(request, login_id):
    """Get account details for a specific login ID."""
    try:
        svc = MT5Service()
        details = svc.get_account_details(login_id)
        if details:
            return JsonResponse(details)
        else:
            return JsonResponse({'error': 'Account not found'}, status=404)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)

@csrf_exempt
@require_http_methods(["GET"])
def get_open_positions(request, login_id):
    """Get open positions for a specific login ID from MT5 and store in DB."""
    try:
        # Start the background thread for auto-sync
        sync_thread = threading.Thread(target=sync_open_positions_periodically, args=(login_id,))
        sync_thread.daemon = True  # Daemonize the thread so it stops when the main program stops
        sync_thread.start()

        # Fetch and return the current positions
        svc = MT5Service()
        positions = svc.get_open_positions(login_id)
        print(f"Fetched {len(positions)} positions from MT5 for login {login_id}")

        # Store positions in the database
        account = Accounts.objects.get(login=login_id)
        existing_positions = set(OpenPositions.objects.filter(login=account).values_list('position_id', flat=True))
        fetched_positions = set()
        stored_count = 0
        for pos in positions:
            pos_id = pos.get('id')
            if pos_id is None:
                print(f"Warning: Position missing 'id' field: {pos}")
                continue
            symbol = pos.get('symbol')
            volume = pos.get('volume')
            price = pos.get('price')
            position_type = pos.get('type')
            if symbol is None or volume is None or price is None or position_type is None:
                print(f"Warning: Position {pos_id} has None values for required fields: symbol={symbol}, volume={volume}, price={price}, type={position_type}")
                continue
            fetched_positions.add(pos_id)
            try:
                obj, created = OpenPositions.objects.update_or_create(
                    login=account,
                    position_id=pos_id,
                    defaults={
                        'symbol': symbol,
                        'volume': volume,
                        'price': price,
                        'profit': pos.get('profit') or 0,
                        'position_type': position_type,
                        'date_created': normalize_date(pos.get('date')),
                    }
                )
                stored_count += 1
                print(f"Stored position {pos_id}: created={created}")
            except Exception as e:
                print(f"Error storing position {pos_id}: {e}")
                continue

        # Delete positions that are no longer open
        to_delete = existing_positions - fetched_positions
        if to_delete:
            deleted_count = OpenPositions.objects.filter(login=account, position_id__in=to_delete).delete()[0]
            print(f"Deleted {deleted_count} closed positions")

        print(f"Successfully stored {stored_count} positions for login {login_id}")
        return JsonResponse({'positions': positions, 'stored': True, 'stored_count': stored_count}, safe=False)

    except Exception as e:
        print(f"Error in get_open_positions: {e}")
        return JsonResponse({'error': str(e)}, status=500)

# Function to perform the sync periodically in a background thread
def sync_open_positions_periodically(login_id):
    """Background thread to sync open positions periodically for a specific login_id."""
    while True:
        try:
            svc = MT5Service()
            positions = svc.get_open_positions(login_id)
            print(f"Fetched {len(positions)} positions from MT5 for login {login_id}")
            # Store positions in the database
            account = Accounts.objects.get(login=login_id)
            existing_positions = set(OpenPositions.objects.filter(login=account).values_list('position_id', flat=True))
            fetched_positions = set()
            stored_count = 0
            for pos in positions:
                pos_id = pos.get('id')
                if pos_id is None:
                    print(f"Warning: Position missing 'id' field: {pos}")
                    continue
                # Skip if required fields are None
                symbol = pos.get('symbol')
                volume = pos.get('volume')
                price = pos.get('price')
                position_type = pos.get('type')
                if symbol is None or volume is None or price is None or position_type is None:
                    print(f"Warning: Position {pos_id} has None values for required fields: symbol={symbol}, volume={volume}, price={price}, type={position_type}")
                    continue
                fetched_positions.add(pos_id)
                try:
                    obj, created = OpenPositions.objects.update_or_create(
                        login=account,
                        position_id=pos_id,
                        defaults={
                            'symbol': symbol,
                            'volume': volume,
                            'price': price,
                            'profit': pos.get('profit') or 0,
                            'position_type': position_type,
                            'date_created': normalize_date(pos.get('date')),
                        }
                    )
                    stored_count += 1
                    print(f"Stored position {pos_id}: created={created}")
                except Exception as e:
                    print(f"Error storing position {pos_id}: {e}")
                    continue

            # Delete positions that are no longer open
            to_delete = existing_positions - fetched_positions
            if to_delete:
                deleted_count = OpenPositions.objects.filter(login=account, position_id__in=to_delete).delete()[0]
                print(f"Deleted {deleted_count} closed positions")

            print(f"Successfully stored {stored_count} positions for login {login_id}")
        except Exception as e:
            print(f"Error in sync_open_positions_periodically for login {login_id}: {str(e)}")

        # Sleep for the desired period before syncing again (e.g., every 60 seconds)
        time.sleep(60)  # Adjust the interval as needed

@csrf_exempt
@require_http_methods(["GET"])
def fetch_all_open_positions(request):
    """Fetch all open positions from MT5 for all login IDs and store/update in DB."""
    try:
        svc = MT5Service()
        from .models import Accounts, OpenPositions
        from django.utils import timezone
        login_ids = Accounts.objects.values_list('login', flat=True)
        all_positions = []
        stored_count = 0
        for login_id in login_ids:
            positions = svc.get_open_positions(login_id)
            account = Accounts.objects.get(login=login_id)
            # Get current positions in DB for this login
            existing_positions = set(OpenPositions.objects.filter(login=account).values_list('position_id', flat=True))
            fetched_positions = set()
            for pos in positions:
                pos_id = pos.get('id')
                if pos_id is None:
                    continue
                # Skip if required fields are None
                symbol = pos.get('symbol')
                volume = pos.get('volume')
                price = pos.get('price')
                position_type = pos.get('type')
                if symbol is None or volume is None or price is None or position_type is None:
                    continue
                fetched_positions.add(pos_id)
                OpenPositions.objects.update_or_create(
                    login=account,
                    position_id=pos_id,
                    defaults={
                        'symbol': symbol,
                        'volume': volume,
                        'price': price,
                        'profit': pos.get('profit') or 0,
                        'position_type': position_type,
                        'date_created': pos.get('date') or timezone.now(),
                    }
                )
                stored_count += 1
            # Delete positions that are no longer open
            to_delete = existing_positions - fetched_positions
            OpenPositions.objects.filter(login=account, position_id__in=to_delete).delete()
            all_positions.extend(positions)
        return JsonResponse({'positions': all_positions, 'stored_count': stored_count}, safe=False)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)



@csrf_exempt
@require_http_methods(["GET"])
def list_accounts(request):
    """List all accounts and store in DB."""
    try:
        svc = MT5Service()
        accounts = svc.list_accounts_by_groups()
        print(f"Fetched {len(accounts)} accounts from MT5")
        
        # Store accounts in database
        from .models import Accounts
        from datetime import datetime
        
        stored_count = 0
        for acc in accounts:
            try:
                last_access = None
                registration = None
                
                # Handle last_access (either string, datetime, or timestamp)
                if acc.get('last_access'):
                    last_access = normalize_date(acc['last_access'])

                # Handle registration (either string, datetime, or timestamp)
                if acc.get('registration'):
                    registration = normalize_date(acc['registration'])
                
                account_obj, created = Accounts.objects.update_or_create(
                    login=acc['login'],
                    defaults={
                        'name': acc.get('name'),
                        'email': acc.get('email'),
                        'group': acc.get('group'),
                        'leverage': acc.get('leverage'),
                        'balance': acc.get('balance', 0),
                        'equity': acc.get('equity', 0),
                        'profit': acc.get('profit', 0),
                        'margin': acc.get('margin', 0),
                        'margin_free': acc.get('margin_free', 0),
                        'margin_level': acc.get('margin_level', 0),
                        'last_access': last_access,
                        'registration': registration,
                    }
                )
                stored_count += 1
                # print(f"Stored account {acc['login']}: created={created}")
            except Exception as e:
                print(f"Error storing account {acc.get('login')}: {e}")
                continue
        
        print(f"Successfully stored {stored_count} accounts in database")
        return JsonResponse({'accounts': accounts, 'stored': True, 'stored_count': stored_count}, safe=False)
    
    except Exception as e:
        print(f"Error in list_accounts: {e}")
        return JsonResponse({'error': str(e)}, status=500)


@csrf_exempt
@require_http_methods(["GET"])
def get_groups_from_db(request):
    """Get list of groups from database."""
    try:
        from .models import Groups
        groups = list(Groups.objects.values_list('Groups', flat=True))
        return JsonResponse({'groups': groups}, safe=False)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)
    
    
    
@csrf_exempt
@require_http_methods(["GET"])
def get_accounts_from_db(request):
    """Get list of accounts from database."""
    try:
        from .models import Accounts
        accounts = list(Accounts.objects.values())
        return JsonResponse({'accounts': accounts}, safe=False)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)

@csrf_exempt
@require_http_methods(["GET"])
def get_all_account_details(request):
    """Get detailed account information for all accounts."""
    try:
        svc = MT5Service()
        from .models import Accounts
        # Get all login IDs from database
        login_ids = Accounts.objects.values_list('login', flat=True)
        all_details = []
        for login_id in login_ids:
            details = svc.get_account_details(login_id)
            if details:
                all_details.append(details)
        return JsonResponse({'accounts': all_details}, safe=False)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)
 

@csrf_exempt
@require_http_methods(["GET"])
def sync_closed_positions(request, login_id):
    """Fetch closed positions for a specific login ID from MT5 and store in DB."""
    try:
        # Fetch closed positions from MT5
        svc = MT5Service()
        closed_positions = svc.list_deals_by_login(login_id)  # Get closed deals from MT5
        print(f"Fetched {len(closed_positions)} closed positions from MT5 for login {login_id}")

        # Fetch account object from DB
        account = Accounts.objects.get(login=login_id)
        stored_count = 0

        for deal in closed_positions:
            deal_id = deal.get('Deal')
            if deal_id is None:
                print(f"Warning: Deal missing 'Deal' field: {deal}")
                continue

            # Only store closing deals (Entry == 1)
            entry = deal.get('Entry')
            if entry != 1:
                continue

            symbol = deal.get('Symbol')
            volume = deal.get('Volume')
            price = deal.get('Price')
            profit = deal.get('Profit')
            action = deal.get('Type')
            position_type = 'Buy' if action == 0 else 'Sell' if action == 1 else None
            date_closed = deal.get('Time')

            if any(v is None for v in [symbol, volume, price, position_type]):
                print(f"Warning: Deal {deal_id} has None values for required fields: symbol={symbol}, volume={volume}, price={price}, type={position_type}")
                continue

            try:
                # Store the closed position in DB
                obj, created = ClosedPositions.objects.update_or_create(
                    login=account,
                    deal_id=deal_id,
                    defaults={
                        'symbol': symbol,
                        'volume': volume,
                        'price': price,
                        'profit': profit or 0,
                        'position_type': position_type,
                        'date_closed': normalize_date(date_closed),
                    }
                )
                stored_count += 1
                print(f"Stored closed position {deal_id}: created={created}")
            except Exception as e:
                print(f"Error storing deal {deal_id}: {e}")
                continue

        print(f"Successfully stored {stored_count} closed positions for login {login_id}")
        return JsonResponse({'deals': closed_positions, 'stored_count': stored_count}, safe=False)

    except Exception as e:
        print(f"Error in sync_closed_positions: {e}")
        return JsonResponse({'error': str(e)}, status=500)


@csrf_exempt
@require_http_methods(["GET"])
def sync_all_close_positions(request):
    """Start background sync for all closed positions."""
    # For debugging, run synchronously
    try:
        sync_closed_positions_for_all_accounts()
        return JsonResponse(
            {"status": "success", "message": "Sync completed synchronously"},
            status=200
        )
    except Exception as e:
        return JsonResponse(
            {"status": "error", "message": str(e)},
            status=500
        )



def store_open_positions(account, positions):
    """Store the open positions for a given account."""
    stored_count = 0
    existing_positions = set(OpenPositions.objects.filter(login=account).values_list('position_id', flat=True))
    fetched_positions = set()

    for pos in positions:
        pos_id = pos.get("id")
        if not pos_id:
            continue

        symbol = pos.get("symbol")
        volume = pos.get("volume")
        price = pos.get("price")
        position_type = pos.get("type")

        if any(v is None for v in [symbol, volume, price, position_type]):
            continue

        fetched_positions.add(pos_id)

        try:
            # Store the open position in DB
            OpenPositions.objects.update_or_create(
                login=account,
                position_id=pos_id,
                defaults={
                    "symbol": symbol,
                    "volume": volume,
                    "price": price,
                    "profit": pos.get("profit", 0),
                    "position_type": position_type,
                    "date_created": normalize_date(pos.get("date"))
                }
            )
            stored_count += 1
        except Exception as e:
            print(f"Error storing position {pos_id}: {e}")

    # Delete closed positions that no longer exist
    to_delete = existing_positions - fetched_positions
    if to_delete:
        OpenPositions.objects.filter(login=account, position_id__in=to_delete).delete()

    return stored_count


from datetime import datetime, timedelta

def sync_closed_positions_for_all_accounts():
    print("Starting background sync for closed positions.")
    try:
        svc = MT5Service()
        svc.connect()  # Make sure MT5 Manager is connected
        accounts = Accounts.objects.all()
        total_stored = 0
        from_date = datetime.now() - timedelta(days=30)
        to_date = datetime.now()

        for account in accounts:
            login_id = account.login
            

            closed_positions = svc.get_closed_trades(login_id, from_date=from_date, to_date=to_date)
            

            stored_closed_positions = store_closed_positions(account, closed_positions)
            

            total_stored += stored_closed_positions

        print(f"Synced {total_stored} closed positions across all accounts.")

    except Exception as e:
        import traceback
        print(f"Error in sync_closed_positions_for_all_accounts: {e}")
        traceback.print_exc()


def store_closed_positions(account, deals):
    """Store the closed positions for a given account."""
    stored_count = 0

    for deal in deals:
        position_id = getattr(deal, "PositionID", None)  # <-- Unique per account
        deal_id = getattr(deal, "Deal", None)
        if not position_id:
            continue  # Skip if PositionID missing

        entry = getattr(deal, "Entry", None)
        if entry != 1:
            continue

        symbol = getattr(deal, "Symbol", None)
        volume = getattr(deal, "Volume", getattr(deal, "VolumeClosed", None))
        volume= round(getattr(deal, 'Volume', 0) / 10000, 2)
        price = getattr(deal, "Price", None)
        profit = getattr(deal, "Profit", 0)
        action = getattr(deal, "Action", None)
        position_type = 'Buy' if action == 0 else 'Sell' if action == 1 else None
        date_closed = getattr(deal, "Time", None)

        if any(v is None for v in [symbol, volume, price, position_type, position_id]):
            print(f"Missing data for deal {deal_id}. Skipping.")
            continue

        try:
            ClosedPositions.objects.update_or_create(
                login=account,
                position=position_id,  # <-- use position as unique
                defaults={
                    "deal_id": deal_id,
                    "symbol": symbol,
                    "volume": str(volume),
                    "price": str(price),
                    "profit": str(profit or 0),
                    "position_type": position_type,
                    "date_closed": normalize_date(date_closed),
                }
            )
            stored_count += 1
        except Exception as e:
            print(f"Error storing position {position_id}: {e}")

    return stored_count


import logging
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny
from .models import ServerSetting
class ServerDetailsView(APIView):

    def get(self, request):
        latest_server = ServerSetting.objects.latest('created_at')  
        server_details = {
            "ip_address": latest_server.server_ip,
            "real_login": latest_server.real_account_login,
            "password": latest_server.real_account_password
        }
        return Response(server_details, status=status.HTTP_200_OK)

@csrf_exempt  # Only use csrf_exempt for testing or APIs without CSRF tokens
def add_server_setting(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            server_ip = data.get('server_ip')
            real_account_login = data.get('real_account_login')
            real_account_password = data.get('real_account_password')
            server_name_client = data.get('server_name_client')

            server_setting = ServerSetting.objects.create(
                server_ip=server_ip,
                real_account_login=real_account_login,
                real_account_password=real_account_password,
                server_name_client=server_name_client
            )

            return JsonResponse({
                "success": True,
                "message": "Server setting created successfully",
                "server_id": server_setting.id
            }, status=201)

        except Exception as e:
            return JsonResponse({"success": False, "error": str(e)}, status=400)
    else:
        return JsonResponse({"success": False, "error": "POST request required"}, status=405)


def get_server_settings(request):
    if request.method == 'GET':
        data = list(ServerSetting.objects.values())
        return JsonResponse({"success": True, "data": data}, safe=False)

    return JsonResponse({"success": False, "error": "GET required"}, status=405)

@method_decorator(csrf_exempt, name='dispatch')
class ServerSettingsAPIView(APIView):
    """
    API View to handle MT5 server settings configuration
    GET: Retrieve current server settings
    PUT: Update server settings
    POST: Update server settings (same as PUT for compatibility)
    """
    permission_classes = [AllowAny]  # <-- Replace with IsAdmin after testing
    http_method_names = ['get', 'put', 'post', 'head', 'options']

    def get(self, request):
        try:
            server_setting = ServerSetting.objects.latest('created_at')
            return Response({
                "server_ip": server_setting.server_ip,
                "login_id": server_setting.real_account_login,
                "server_password": server_setting.real_account_password,
                "server_name": server_setting.server_name_client
            }, status=status.HTTP_200_OK)
        except ServerSetting.DoesNotExist:
            return Response({
                "server_ip": "",
                "login_id": "",
                "server_password": "",
                "server_name": ""
            }, status=status.HTTP_200_OK)
        except Exception as e:
            return Response(
                {"error": f"Failed to retrieve server settings: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def put(self, request, *args, **kwargs):
        try:
            data = request.data
            required_fields = ['server_ip', 'login_id', 'server_password', 'server_name']
            missing_fields = [field for field in required_fields if not data.get(field)]

            if missing_fields:
                return Response(
                    {"error": f"Missing required fields: {', '.join(missing_fields)}"},
                    status=status.HTTP_400_BAD_REQUEST
                )

            server_setting, created = ServerSetting.objects.get_or_create(
                defaults={
                    'server_ip': data['server_ip'],
                    'real_account_login': data['login_id'],
                    'real_account_password': data['server_password'],
                    'server_name_client': data['server_name']
                }
            )

            if not created:
                server_setting.server_ip = data['server_ip']
                server_setting.real_account_login = data['login_id']
                server_setting.real_account_password = data['server_password']
                server_setting.server_name_client = data['server_name']
                server_setting.save()

            # Force refresh MT5 Manager connection with new credentials
            try:
                from adminPanel.mt5.services import reset_manager_instance
                reset_manager_instance()
                logger.info("MT5 Manager connection reset after server settings update")
            except Exception as e:
                logger.warning(f"Failed to reset MT5 Manager connection: {e}")

            return Response({
                "message": "Server settings updated successfully",
                "server_ip": server_setting.server_ip,
                "login_id": server_setting.real_account_login,
                "server_name": server_setting.server_name_client
            }, status=status.HTTP_200_OK)

        except Exception as e:
            return Response(
                {"error": f"Failed to update server settings: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def post(self, request, *args, **kwargs):
        """
        POST method for server settings - same functionality as PUT for compatibility
        """
        try:
            data = request.data
            required_fields = ['server_ip', 'login_id', 'server_password', 'server_name']
            missing_fields = [field for field in required_fields if not data.get(field)]

            if missing_fields:
                return Response(
                    {"error": f"Missing required fields: {', '.join(missing_fields)}"},
                    status=status.HTTP_400_BAD_REQUEST
                )

            server_setting, created = ServerSetting.objects.get_or_create(
                defaults={
                    'server_ip': data['server_ip'],
                    'real_account_login': data['login_id'],
                    'real_account_password': data['server_password'],
                    'server_name_client': data['server_name']
                }
            )

            if not created:
                server_setting.server_ip = data['server_ip']
                server_setting.real_account_login = data['login_id']
                server_setting.real_account_password = data['server_password']
                server_setting.server_name_client = data['server_name']
                server_setting.save()

            # Automated full MT5 database and cache reset after updating credentials
            try:
                from adminPanel.mt5.services import reset_manager_instance
                from adminPanel.mt5.models import MT5GroupConfig
                from django.core.cache import cache
                from django.db import transaction
                reset_manager_instance()
                # Delete all cached trading groups
                with transaction.atomic():
                    MT5GroupConfig.objects.all().delete()
                # Clear all Django cache
                cache.clear()
                # Clear MT5-specific cache keys
                for key in ['mt5_manager_error','mt5_groups_sync','mt5_connection_status','mt5_leverage_options','mt5_groups_last_sync']:
                    cache.delete(key)
                logger.info("Full MT5 database and cache reset after server settings update via POST")
            except Exception as e:
                logger.warning(f"Failed to fully reset MT5 database/cache: {e}")

            return Response({
                "message": "Server settings updated successfully",
                "server_ip": server_setting.server_ip,
                "login_id": server_setting.real_account_login,
                "server_name": server_setting.server_name_client
            }, status=status.HTTP_200_OK)

        except Exception as e:
            return Response(
                {"error": f"Failed to update server settings: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

def get_server_by_id(request, server_id):
    try:
        print(f"get_server_by_id called with server_id: {server_id}")
        print("Server change initiated - retrieving server settings...")
        server = ServerSetting.objects.get(id=server_id)
        data = {
            "id": server.id,
            "host": server.server_ip.split(":")[0] if ":" in server.server_ip else server.server_ip,
            "port": server.server_ip.split(":")[1] if ":" in server.server_ip else "443",
            "login": server.real_account_login,
            "password": server.real_account_password
        }
        print(f"Retrieved server data: {data}")

        # Reset MT5 instance with new server settings
        print("About to call reset_mt5_instance")
        from .MT5Service import reset_mt5_instance, force_refresh_trading_groups
        mt5_instance = reset_mt5_instance(server_id=server_id)
        print("reset_mt5_instance called")

        if mt5_instance is None:
            print("Failed to reset MT5 instance")
            return JsonResponse({"success": False, "error": "Failed to connect to MT5 server"}, status=500)

        print("About to call force_refresh_trading_groups")
        force_refresh_trading_groups()
        print("force_refresh_trading_groups called")

        print(f"Server change completed successfully for server_id: {server_id}")
        return JsonResponse({"success": True, "data": data})
    except ServerSetting.DoesNotExist:
        print(f"Server not found for id: {server_id}")
        return JsonResponse({"success": False, "error": "Server not found"}, status=404)
    except Exception as e:
        print(f"Exception in get_server_by_id: {str(e)}")
        return JsonResponse({"success": False, "error": str(e)}, status=500)
