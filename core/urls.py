from django.urls import path
from . import views

urlpatterns = [
    path('groups/', views.get_groups, name='get_groups'),
    path('groups/db/', views.get_groups_from_db, name='get_groups_from_db'),
    path('accounts/', views.list_accounts, name='list_accounts'),
    path('accounts/<int:login_id>/', views.get_account_details, name='get_account_details'),
    path('positions/<int:login_id>/', views.get_open_positions, name='get_open_positions'),
    # Server settings endpoints
    path('server/settings/', views.ServerSettingsAPIView.as_view(), name='server_settings'),
    path('server/details/', views.ServerDetailsView.as_view(), name='server_details'),
]
