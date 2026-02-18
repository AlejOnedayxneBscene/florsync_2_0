from rest_framework.viewsets import ModelViewSet
from rest_framework.response import Response
from rest_framework import status
from django.shortcuts import get_object_or_404

from .models import Clientes
from .serializers import ClienteSerializer
from usuarios.permissions import EsAdmin, EsAdminOVendedor


class ClienteViewSet(ModelViewSet):
    serializer_class = ClienteSerializer
    queryset = Clientes.objects.filter(activo=True)

    def get_permissions(self):

        # admin y vendedor pueden crear y ver
        if self.action in ["create", "list", "retrieve"]:
            return [EsAdminOVendedor()]

        # editar y eliminar solo admin
        return [EsAdmin()]

    # crear o reactivar cliente
    def create(self, request, *args, **kwargs):
        cedula = request.data.get("cedula")

        if not cedula:
            return Response(
                {"error": "La cédula es obligatoria"},
                status=status.HTTP_400_BAD_REQUEST
            )

        cliente_existente = Clientes.objects.filter(cedula=cedula).first()

        if cliente_existente:

            if not cliente_existente.activo:
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

                serializer = self.get_serializer(cliente_existente)
                return Response(serializer.data)

            return Response(
                {"error": "Ya existe un cliente activo con esa cédula"},
                status=status.HTTP_400_BAD_REQUEST
            )

        return super().create(request, *args, **kwargs)

    def perform_destroy(self, instance):
        instance.activo = False
        instance.save()
