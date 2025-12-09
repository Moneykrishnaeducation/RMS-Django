from django.db import models

class Groups(models.Model):
    Groups = models.CharField(max_length=255, unique=True)

    class Meta:
        db_table = 'Groups'
        app_label = 'core'
        

class Accounts(models.Model):
    login = models.IntegerField(unique=True)
    name = models.CharField(max_length=255, blank=True, null=True)
    email = models.EmailField(blank=True, null=True)
    group = models.CharField(max_length=255, blank=True, null=True)
    leverage = models.IntegerField(blank=True, null=True)
    balance = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    equity = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    profit = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    margin = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    margin_free = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    margin_level = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    last_access = models.DateTimeField(blank=True, null=True)
    registration = models.DateTimeField(blank=True, null=True)
 
    class Meta:
        db_table = 'Accounts'
        app_label = 'core'
 
class ServerSetting(models.Model):
    server_ip = models.CharField(max_length=100, verbose_name='Server IP Address with Port')
    real_account_login = models.CharField(max_length=100, verbose_name='Real Account Login ID')
    real_account_password = models.CharField(max_length=100, verbose_name='Real Account Password')
    server_name_client = models.CharField(max_length=100, verbose_name='Server Name for Live Accounts')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Server Setting'
        verbose_name_plural = 'Server Settings'

    def __str__(self):
        return f"{self.server_name_client} ({self.server_ip})"
