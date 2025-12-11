from django.apps import AppConfig


class CoreConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'core'
    def ready(self):
        # Start the background fetching thread
        from .tasks import start_background_thread
        start_background_thread()