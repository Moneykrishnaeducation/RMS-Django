from django.urls import path
from . import views

urlpatterns = [
    path('groups/', views.get_groups, name='get_groups'),#Fetches group list from MT5 server and stores in database
    path('groups/db/', views.get_groups_from_db, name='get_groups_from_db'),#Retrieves group list from local database
    path('accounts/', views.list_accounts, name='list_accounts'),#fetch the account details from MT5 and store in the DB
    path('accounts/db/', views.get_accounts_from_db, name='get_accounts_from_db'),#Retrieves account list from local database
    path('accounts/al/', views.get_all_account_details, name='get_all_account_details'), #Gets detailed account information for ALL accounts from MT5
    path('accounts/<int:login_id>/', views.get_account_details, name='get_account_details'),# get the account details from the Mt5
    path('positions/<int:login_id>/', views.get_open_positions, name='get_open_positions'),# get the open position details from the Mt5
    path('positions/sync_all/', views.sync_all_open_positions, name='sync_all_open_positions'),
    path('api/positions/open/', views.get_open_positions_from_db, name='get_open_positions'),
    path('lots/all/', views.get_all_lots, name='get_all_lots'),# getall the login user's lot
    path('lots/<int:login_id>/', views.get_all_lots_by_login, name='get_all_lots_by_login'),
    # Server settings endpoints
    path('sync/mt5/', views.sync_mt5_data, name='sync_mt5_data'),# Automate sync of all MT5 data to DB

    path('server/settings/', views.ServerSettingsAPIView.as_view(), name='server_settings'),
    path('server/details/', views.ServerDetailsView.as_view(), name='server_details'),
]
