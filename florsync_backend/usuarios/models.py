from django.contrib.auth.models import AbstractUser
from django.db import models

from django.contrib.auth.models import AbstractUser
from django.db import models
from django.conf import settings
import uuid


class Rol(models.Model):
    nombre = models.CharField(max_length=100, unique=True)

    def __str__(self):
        return self.nombre


class Usuario(AbstractUser):
    foto_url = models.CharField(max_length=400, blank=True, null=True)
    activo = models.BooleanField(default=True)
    cedula = models.CharField(max_length=20, null=True, blank=True, unique=True)
    codigo_reset = models.CharField(max_length=6, null=True, blank=True)
    codigo_reset_expira = models.DateTimeField(null=True, blank=True)
    debe_cambiar_password = models.BooleanField(default=False)

    rol = models.ForeignKey(
        'Rol',
        on_delete=models.PROTECT,
        null=True,
        blank=True
    )

    # Auditoría de quién creó/modificó/eliminó
    creado_por = models.ForeignKey(
        'self', null=True, blank=True,
        on_delete=models.SET_NULL,
        related_name='usuarios_creados'
    )
    modificado_por = models.ForeignKey(
        'self', null=True, blank=True,
        on_delete=models.SET_NULL,
        related_name='usuarios_modificados'
    )
    eliminado_por = models.ForeignKey(
        'self', null=True, blank=True,
        on_delete=models.SET_NULL,
        related_name='usuarios_eliminados'
    )

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=['email'],
                condition=models.Q(email__isnull=False),
                name='unique_email_no_null'
            )
        ]

    def save(self, *args, **kwargs):
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


class PasswordResetToken(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    token = models.UUIDField(default=uuid.uuid4, editable=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return str(self.token)