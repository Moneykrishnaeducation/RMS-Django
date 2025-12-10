from django.db import models, connection

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

class OpenPositions(models.Model):
    login = models.ForeignKey(Accounts, on_delete=models.CASCADE, related_name='open_positions')
    position_id = models.BigIntegerField(unique=True)
    symbol = models.CharField(max_length=50)
    volume = models.DecimalField(max_digits=10, decimal_places=2)
    price = models.DecimalField(max_digits=15, decimal_places=5)
    profit = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    position_type = models.CharField(max_length=10, choices=[('Buy', 'Buy'), ('Sell', 'Sell')])
    date_created = models.DateTimeField()
    last_updated = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'OpenPositions'
        app_label = 'core'
        unique_together = ('login', 'position_id')

    def __str__(self):
        return f"Position {self.position_id} for {self.login.login}"

    @classmethod
    def create_table_if_not_exists(cls):
        with connection.cursor() as cursor:
            # Create the table if it doesn't exist
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS "OpenPositions" (
                    "id" serial NOT NULL PRIMARY KEY,
                    "position_id" bigint NOT NULL UNIQUE,
                    "symbol" varchar(50) NOT NULL,
                    "volume" numeric(10, 2) NOT NULL,
                    "price" numeric(15, 5) NOT NULL,
                    "profit" numeric(15, 2) NOT NULL DEFAULT 0,
                    "position_type" varchar(10) NOT NULL,
                    "date_created" timestamp with time zone NOT NULL,
                    "last_updated" timestamp with time zone NOT NULL,
                    "login_id" integer NOT NULL REFERENCES "Accounts" ("id") DEFERRABLE INITIALLY DEFERRED
                );
            ''')
            # Add unique constraint
            try:
                cursor.execute('''
                    ALTER TABLE "OpenPositions" ADD CONSTRAINT "OpenPositions_login_id_position_id_uniq" UNIQUE ("login_id", "position_id");
                ''')
            except:
                pass  # Constraint might already exist
            # Add index
            cursor.execute('''
                CREATE INDEX IF NOT EXISTS "OpenPositions_login_id_idx" ON "OpenPositions" ("login_id");
            ''')
            print("OpenPositions table created successfully.")
