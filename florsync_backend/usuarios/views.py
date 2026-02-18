from django.contrib.auth import authenticate

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from rest_framework_simplejwt.tokens import RefreshToken

from .serializers import UsuarioMeSerializer
from .permissions import EsAdmin, EsAdminOVendedor

from rest_framework.viewsets import ModelViewSet
from productos.models import Producto
from productos.serializers import ProductoSerializer
from clientes.models import Clientes
from clientes.serializers import ClienteSerializer
from api.models import Categoria
from api.serializers import CategoriaSerializer
from ventas.models import Venta
from ventas.serializers import VentaSerializer

@api_view(["POST"])
@permission_classes([AllowAny])
def login_usuario(request):
    username = request.data.get("username", "").lower()
    password = request.data.get("password", "")

    if not username or not password:
        return Response({"error": "Faltan datos"}, status=400)

    user = authenticate(username=username, password=password)

    if user is None:
        return Response(
            {"autenticado": False, "error": "Credenciales incorrectas"},
            status=401
        )

    refresh = RefreshToken.for_user(user)

    grupo = user.groups.first()
    nombre_grupo = grupo.name if grupo else None

    return Response({
        "autenticado": True,
        "access": str(refresh.access_token),
        "refresh": str(refresh),
        "id": user.id,
        "username": user.username,
        "grupo": nombre_grupo,
    })


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def me(request):
    user = request.user
    return Response({
        "id": user.id,
        "username": user.username,
    })

from rest_framework.exceptions import PermissionDenied

class ProductoViewSet(ModelViewSet):
    queryset = Producto.objects.all()
    serializer_class = ProductoSerializer

    def get_permissions(self):

        if self.action in ["create", "update", "partial_update", "destroy"]:
            return [EsAdmin()]

        return [EsAdminOVendedor()]

    # 🔥 BLOQUEO REAL
    def perform_create(self, serializer):
        if not self.request.user.groups.filter(
            name="Administrador"
        ).exists():
            raise PermissionDenied("Solo administradores pueden crear productos.")

        serializer.save()

    
class CategoriaViewSet(ModelViewSet):
    queryset = Categoria.objects.all()
    serializer_class = CategoriaSerializer

    def get_permissions(self):

        if self.action in ["create", "update", "partial_update", "destroy"]:
            return [EsAdmin()]

        return [EsAdminOVendedor()]
    




from django.contrib.auth.models import Group

class ClienteViewSet(ModelViewSet):
    queryset = Clientes.objects.all()
    serializer_class = ClienteSerializer

    def get_permissions(self):

        # vendedor puede crear clientes
        if self.action == "create":
            return [EsAdminOVendedor()]

        # todo lo demás solo admin
        return [EsAdmin()]


class VentaViewSet(ModelViewSet):
    serializer_class = VentaSerializer

    # historial según rol
    def get_queryset(self):
        user = self.request.user

        # admin ve todas
        if user.groups.filter(name="Administrador").exists():
            return Venta.objects.all()

        # vendedor solo las suyas
        return Venta.objects.filter(usuario=user)

    def get_permissions(self):

        # crear y ver historial
        if self.action in ["create", "list", "retrieve"]:
            return [EsAdminOVendedor()]

        # editar / borrar solo admin
        return [EsAdmin()]

    # seguridad
    def perform_create(self, serializer):
        serializer.save(usuario=self.request.user)



class UsuarioMeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        serializer = UsuarioMeSerializer(request.user)
        return Response(serializer.data)

