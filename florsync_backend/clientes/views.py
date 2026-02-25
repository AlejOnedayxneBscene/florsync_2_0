from rest_framework.viewsets import ModelViewSet
from rest_framework.response import Response
from rest_framework import status
from django.shortcuts import get_object_or_404

from .models import Clientes
from .serializers import ClienteSerializer
from usuarios.permissions import EsAdmin, EsAdminOVendedor
from auditoria.mixins import AuditMixin


class ClienteViewSet(AuditMixin, ModelViewSet):
    serializer_class = ClienteSerializer
    queryset = Clientes.objects.filter(activo=True)

    def get_permissions(self):

        if self.action in ["create", "list", "retrieve"]:
            return [EsAdminOVendedor()]

        return [EsAdmin()]

    def create(self, request, *args, **kwargs):
        cedula = request.data.get("cedula")

        if not cedula:
            return Response(
                {"error": "La cédula es obligatoria"},
                status=status.HTTP_400_BAD_REQUEST
            )

        cliente_existente = Clientes.objects.filter(cedula=cedula).first()
        if cliente_existente and not cliente_existente.activo:

            datos_anteriores = {
                "activo": cliente_existente.activo
            }

            cliente_existente.nombre_cliente = request.data.get(
                "nombre_cliente",
                cliente_existente.nombre_cliente
            )
            cliente_existente.direccion = request.data.get(
                "direccion",
                cliente_existente.direccion
            )
            cliente_existente.telefono = request.data.get(
                "telefono",
                cliente_existente.telefono
            )
            cliente_existente.correo = request.data.get(
                "correo",
                cliente_existente.correo
            )

            cliente_existente.activo = True
            cliente_existente.save()

            # 🔥 REGISTRAR AUDITORÍA
            self._registrar_log(
                accion="UPDATE",
                instance=cliente_existente,
                cambios={
                    "activo": {
                        "antes": str(datos_anteriores["activo"]),
                        "despues": "True"
                    }
                }
            )

            serializer = self.get_serializer(cliente_existente)
            return Response(serializer.data)

        # 🔹 Si existe y está activo → error
        if cliente_existente and cliente_existente.activo:
            return Response(
                {"error": "Ya existe un cliente activo con esa cédula"},
                status=status.HTTP_400_BAD_REQUEST
            )

        # 🔹 Si no existe → crear normal
        return super().create(request, *args, **kwargs)

