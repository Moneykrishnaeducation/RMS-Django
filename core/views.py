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
    """List all accounts."""
    try:
        svc = MT5Service()
        accounts = svc.list_accounts_by_groups()
        return JsonResponse({'accounts': accounts}, safe=False)
    except Exception as e:
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
