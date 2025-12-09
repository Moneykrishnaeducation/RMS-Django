from django.http import JsonResponse
from django.shortcuts import render
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
import json
from .MT5Service import MT5Service

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
    """Get open positions for a specific login ID."""
    try:
        svc = MT5Service()
        positions = svc.get_open_positions(login_id)
        return JsonResponse({'positions': positions}, safe=False)
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
                print(f"Processing account: {acc}")
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
                print(f"Stored account {acc['login']}: created={created}")
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

