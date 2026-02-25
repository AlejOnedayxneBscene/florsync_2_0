# auditoria/serializers.py

from rest_framework import serializers
from .models import AuditLog

class AuditLogSerializer(serializers.ModelSerializer):
    usuario = serializers.CharField(source="usuario.username")

    class Meta:
        model = AuditLog
        fields = [
            "id",
            "usuario",
            "accion",
            "modelo",
            "objeto_id",
            "objeto_nombre",
            "cambios",
            "fecha",
        ]
