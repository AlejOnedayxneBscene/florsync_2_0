from auditoria.models import AuditLog
import copy
from decimal import Decimal
from django.db.models import Model


class AuditMixin:

    # -------------------------
    # CONVERTIR A JSON SAFE
    # -------------------------
    def _safe_value(self, value):
        if isinstance(value, Decimal):
            return float(value)

        if isinstance(value, Model):
            return str(value)

        return value

    def _to_json_safe_dict(self, data):
        return {
            k: self._safe_value(v)
            for k, v in data.items()
        }

    # -------------------------
    # LOG
    # -------------------------
    def _registrar_log(self, accion, instance, cambios=None):

        user = getattr(self.request, "user", None)

        AuditLog.objects.create(
            usuario=user if user and user.is_authenticated else None,
            accion=accion,
            modelo=instance.__class__.__name__,
            objeto_id=str(instance.pk) if instance.pk else None,
            objeto_nombre=str(instance),
            cambios=self._to_json_safe_dict(cambios) if cambios else {}
        )

    # =========================
    # CREATE
    # =========================
    def perform_create(self, serializer):

        instance = serializer.save()

        self._registrar_log(
            accion="CREATE",
            instance=instance,
            cambios=self._to_json_safe_dict(serializer.validated_data)
        )

    # =========================
    # UPDATE
    # =========================
    def perform_update(self, serializer):

        instance_before = copy.deepcopy(self.get_object())

        instance = serializer.save()

        cambios = {}

        for field, nuevo_valor in serializer.validated_data.items():
            viejo_valor = getattr(instance_before, field, None)

            if viejo_valor != nuevo_valor:
                cambios[field] = {
                    "antes": str(viejo_valor),
                    "despues": str(nuevo_valor)
                }

        if cambios:
            self._registrar_log(
                accion="UPDATE",
                instance=instance,
                cambios=cambios
            )

    # =========================
    # DELETE (SOFT DELETE)
    # =========================
    def perform_destroy(self, instance):

        snapshot = {
            field.name: str(getattr(instance, field.name))
            for field in instance._meta.fields
        }

        self._registrar_log(
            accion="DELETE",
            instance=instance,
            cambios={"eliminado": snapshot}
        )

        # 🔥 NUNCA BORRAR USUARIO
        if hasattr(instance, "activo"):
            instance.activo = False
            instance.save()
        else:
            instance.delete()