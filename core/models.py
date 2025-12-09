from django.db import models

class Groups(models.Model):
    Groups = models.CharField(max_length=255, unique=True)

    class Meta:
        db_table = 'Groups'
        app_label = 'core'
