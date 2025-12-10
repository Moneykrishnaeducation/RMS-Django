from django.http import JsonResponse
from django.shortcuts import render
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
import json
from .MT5Service import MT5Service

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

def normalize_date(date_value):
    """Ensure date_value is a valid datetime object."""
    if date_value is None:
        return timezone.now()
    elif isinstance(date_value, str):
        try:
            # If the date ends with 'Z', replace it with '+00:00' (for UTC time)
            if date_value.endswith('Z'):
                date_value = date_value[:-1] + '+00:00'  # Convert 'Z' to UTC offset
            # Attempt to parse the string as a datetime
            return datetime.fromisoformat(date_value)
        except Exception as e:
            print(f"Error parsing date {date_value}: {e}. Returning current time.")
            return timezone.now()
    elif isinstance(date_value, datetime):
        # If it's already a datetime object, return it
        return date_value
    else:
        # If it's any other type, return the current time
        print(f"Unexpected date type: {type(date_value)}. Returning current time.")
        return timezone.now()

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

@csrf_exempt  # Only use if necessary, consider removing for production
@require_http_methods(["GET"])
def get_all_lots(request):
    """Fetch and calculate the total 'lot' (volume) for each symbol for all accounts."""
    try:
        # Fetch and aggregate all positions for all accounts in one query
        lot_data = (
            OpenPositions.objects
            .values('login__login', 'symbol')  # Group by account login and symbol
            .annotate(total_volume=Sum('volume'))  # Sum the volume for each group
            .order_by('login__login', 'symbol')  # Order results by login and symbol
        )

        # Prepare the response data
        all_lots = [
            {
                "login_id": item['login__login'],  # Use the login_id
                "symbol": item['symbol'],
                "lot": item['total_volume']
            }
            for item in lot_data
        ]

        # Return the data as a JSON response
        return JsonResponse({"data": all_lots}, safe=False)

    except Exception as e:
        # You can log the exception here for debugging purposes
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
        return JsonResponse({"data": all_lots}, safe=False)

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


def sync_mt5_data(request):
    try:
        call_command("sync_mt5")   # or the exact name of your command file
        return JsonResponse({"message": "Sync started successfully"})
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)

def index(request):
    """Render the main index page."""
    return render(request, 'index.html')

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
        svc = MT5Service()
        positions = svc.get_open_positions(login_id)
        print(f"Fetched {len(positions)} positions from MT5 for login {login_id}")
        print(f"Positions data: {positions}")
        # Store positions in database
        from .models import Accounts, OpenPositions
        from django.utils import timezone
        account = Accounts.objects.get(login=login_id)
        # Get current positions in DB for this login
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
                        'date_created': pos.get('date') or timezone.now(),
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
                # print(f"Processing account: {acc}")
                # Convert string dates to datetime if present
                last_access = None
                registration = None
                if acc.get('last_access'):
                    try:
                        last_access = datetime.fromisoformat(acc['last_access'].replace('Z', '+00:00'))
                    except Exception as e:
                        print(f"Error parsing last_access: {e}")
                        last_access = None
                if acc.get('registration'):
                    try:
                        registration = datetime.fromisoformat(acc['registration'].replace('Z', '+00:00'))
                    except Exception as e:
                        print(f"Error parsing registration: {e}")
                        registration = None

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

