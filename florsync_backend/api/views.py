from rest_framework.viewsets import ModelViewSet
from rest_framework.response import Response
from rest_framework import status
from .models import Categoria
from .serializers import CategoriaSerializer
from usuarios.permissions import EsAdmin, EsAdminOVendedor

from rest_framework.viewsets import ModelViewSet
from rest_framework.response import Response
from rest_framework import status
from .models import Categoria
from .serializers import CategoriaSerializer
from usuarios.permissions import EsAdmin, EsAdminOVendedor

class CategoriaViewSet(ModelViewSet):
    serializer_class = CategoriaSerializer
    queryset = Categoria.objects.filter(activo=True)

    def get_permissions(self):
        if self.action in ["create", "update", "partial_update", "destroy"]:
            return [EsAdmin()]
        return [EsAdminOVendedor()]

    def perform_destroy(self, instance):
        instance.activo = False
        instance.save()

    def create(self, request, *args, **kwargs):
        nombre = request.data.get("nombre_categoria")
        if not nombre:
            return Response({"error": "nombre_categoria es obligatorio"}, status=status.HTTP_400_BAD_REQUEST)

        categoria, created = Categoria.objects.update_or_create(
            nombre_categoria=nombre,
            defaults={'activo': True}
        )

        serializer = self.get_serializer(categoria)
        return Response(serializer.data, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)

# views.py
