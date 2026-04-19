from rest_framework import serializers
from .models import AuditLog


class AuditLogSerializer(serializers.ModelSerializer):
    usuario = serializers.SerializerMethodField()
    usuario_id = serializers.SerializerMethodField()

    class Meta:
        model = AuditLog
        fields = [
            "id",
            "usuario",
            "usuario_id",
            "accion",
            "modelo",
            "objeto_id",
            "objeto_nombre",
            "cambios",
            "fecha",
        ]

    # =========================
    # NOMBRE USUARIO (SAFE)
    # =========================
    def get_usuario(self, obj):
        if obj.usuario:
            return obj.usuario.username
        return "Usuario no encontrado"

    # =========================
    # ID USUARIO (SAFE)
    # =========================
    def get_usuario_id(self, obj):
        if obj.usuario:
            return obj.usuario.id
        return None