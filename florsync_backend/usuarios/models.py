from django.contrib.auth.models import AbstractUser
from django.db import models

class Rol(models.Model):
    nombre = models.CharField(max_length=100, unique=True)

    def __str__(self):
        return self.nombre

class Usuario(AbstractUser):
    foto_url = models.CharField(max_length=400, blank=True, null=True)
    activo = models.BooleanField(default=True)

    def save(self, *args, **kwargs):
        # Normalizamos los campos de texto a minúsculas
        if self.username:
            self.username = self.username.lower()
        if self.first_name:
            self.first_name = self.first_name.lower()
        if self.last_name:
            self.last_name = self.last_name.lower()
        if self.email:
            self.email = self.email.lower()
        super().save(*args, **kwargs)

    def __str__(self):
        return self.username
