# auditoria/models.py

from django.db import models
from django.conf import settings

class AuditLog(models.Model):

    ACCIONES = (
        ("CREATE", "Crear"),
        ("UPDATE", "Actualizar"),
        ("DELETE", "Eliminar"),
    )

    usuario = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True
    )

    accion = models.CharField(max_length=10, choices=ACCIONES)

    modelo = models.CharField(max_length=100)
    objeto_id = models.CharField(max_length=50)
    objeto_nombre = models.CharField(max_length=255, null=True, blank=True)

    cambios = models.JSONField(null=True, blank=True)

    fecha = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-fecha"]

    def __str__(self):
        return f"{self.usuario} - {self.accion} - {self.modelo}"
