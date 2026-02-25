from auditoria.models import AuditLog


class AuditMixin:

    def _registrar_log(self, accion, instance, cambios=None):
        AuditLog.objects.create(
            usuario=self.request.user if self.request.user.is_authenticated else None,
            accion=accion,
            modelo=instance.__class__.__name__,
            objeto_nombre=str(instance),
            objeto_id=instance.pk,
            cambios=cambios or {}
        )

    # =========================
    # CREATE
    # =========================
    def perform_create(self, serializer):

        extra_data = {}

        if hasattr(serializer.Meta.model, "creado_por"):
            extra_data["creado_por"] = self.request.user

        instance = serializer.save(**extra_data)

        cambios = {k: str(v) for k, v in serializer.validated_data.items()}

        self._registrar_log(
            accion="CREATE",
            instance=instance,
            cambios=cambios
        )

    # =========================
    # UPDATE
    # =========================
    def perform_update(self, serializer):

        instance = self.get_object()

        datos_anteriores = {
            field: getattr(instance, field)
            for field in serializer.validated_data
        }

        extra_data = {}

        if hasattr(serializer.Meta.model, "editado_por"):
            extra_data["editado_por"] = self.request.user

        instance = serializer.save(**extra_data)

        cambios = {}

        for field, valor_nuevo in serializer.validated_data.items():
            valor_anterior = datos_anteriores[field]

            if valor_anterior != valor_nuevo:
                cambios[field] = {
                    "antes": str(valor_anterior),
                    "despues": str(valor_nuevo)
                }

        if cambios:
            self._registrar_log(
                accion="UPDATE",
                instance=instance,
                cambios=cambios
            )

    # =========================
    # DELETE
    # =========================
    def perform_destroy(self, instance):

        self._registrar_log(
            accion="DELETE",
            instance=instance
        )

        if hasattr(instance, "activo"):
            instance.activo = False
            instance.save()
        else:
            instance.delete()
