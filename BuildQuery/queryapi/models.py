from django.db import models

# Create your models here.
from django.db import models

class SavedQuery(models.Model):
    name = models.CharField(max_length=255, unique=True)
    query = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
