from django.contrib.auth import authenticate, get_user_model
from django.contrib.auth.models import Group
import ssl
ssl._create_default_https_context = ssl._create_unverified_context
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.viewsets import ModelViewSet
from rest_framework.exceptions import PermissionDenied
from rest_framework_simplejwt.tokens import RefreshToken
from django.utils import timezone
from datetime import timedelta
from django.core.mail import send_mail, get_connection
from email.mime.text import MIMEText
import smtplib
import random
from auditoria.models import AuditLog
import json
from .models import Usuario
from .serializers import UsuarioSerializer, UsuarioMeSerializer
from .permissions import EsAdmin, EsAdminOVendedor
from auditoria.mixins import AuditMixin
from productos.models import Producto
from productos.serializers import ProductoSerializer
from clientes.models import Clientes
from clientes.serializers import ClienteSerializer
from api.models import Categoria
from api.serializers import CategoriaSerializer
from ventas.models import Venta
from ventas.serializers import VentaSerializer
from rest_framework.decorators import action
from .serializers import UsuarioSerializer


from rest_framework.decorators import action
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
    "debe_cambiar_password": user.debe_cambiar_password  
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

    def perform_create(self, serializer):
        if not self.request.user.groups.filter(name="Administrador").exists():
            raise PermissionDenied("Solo administradores pueden crear productos.")
        serializer.save()


class CategoriaViewSet(ModelViewSet):
    queryset = Categoria.objects.all()
    serializer_class = CategoriaSerializer

    def get_permissions(self):
        if self.action in ["create", "update", "partial_update", "destroy"]:
            return [EsAdmin()]
        return [EsAdminOVendedor()]


from django.contrib.auth.models import Group, User

class ClienteViewSet(ModelViewSet):
    queryset = Clientes.objects.all()
    serializer_class = ClienteSerializer

    def get_permissions(self):
        if self.action == "create":
            return [EsAdminOVendedor()]
        return [EsAdmin()]


class VentaViewSet(ModelViewSet):
    serializer_class = VentaSerializer

    def get_queryset(self):
        user = self.request.user
        if user.groups.filter(name="Administrador").exists():
            return Venta.objects.all()
        return Venta.objects.filter(usuario=user)

    def get_permissions(self):
        if self.action in ["create", "list", "retrieve"]:
            return [EsAdminOVendedor()]
        return [EsAdmin()]

    def perform_create(self, serializer):
        serializer.save(usuario=self.request.user)


class UsuarioViewSet(AuditMixin, ModelViewSet):
    serializer_class = UsuarioSerializer
    queryset = Usuario.objects.filter(activo=True)

    def get_permissions(self):
        if self.action == 'cambiar_password':
            return [IsAuthenticated()]

        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [EsAdmin()]

        return [IsAuthenticated()]

    @action(detail=False, methods=['post'])
    def cambiar_password(self, request):
        user = request.user
        password_actual = request.data.get("password_actual")
        password_nuevo = request.data.get("password_nuevo")

        if not password_actual or not password_nuevo:
            return Response({"error": "Datos incompletos"}, status=400)

        if not user.check_password(password_actual):
            return Response({"error": "Contraseña actual incorrecta"}, status=400)

        user.set_password(password_nuevo)
        user.debe_cambiar_password = False
        user.save()

        return Response({"message": "Contraseña actualizada"})

class UsuarioMeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        serializer = UsuarioMeSerializer(request.user)
        return Response(serializer.data)


@api_view(['POST'])
@permission_classes([AllowAny])
def request_password_reset(request):
    email = request.data.get('email')

    if not email:
        return Response({"error": "Email requerido"}, status=400)

    User = get_user_model()
    user = User.objects.only("id", "email").filter(email__iexact=email).first()

    if user:
        codigo = str(random.randint(100000, 999999))

        User.objects.filter(id=user.id).update(
            codigo_reset=codigo,
            codigo_reset_expira=timezone.now() + timedelta(minutes=10)
)
        context = ssl.create_default_context()
        context.check_hostname = False
        context.verify_mode = ssl.CERT_NONE

        try:
            server = smtplib.SMTP('smtp.gmail.com', 587)
            server.ehlo()
            server.starttls(context=context)
            server.login('soporteflorsync@gmail.com', 'lmrc pazi pmbk uoqk')

            msg = MIMEText(f"Tu código de recuperación es: {codigo}")
            msg['Subject'] = "Código de recuperación"
            msg['From'] = 'soporteflorsync@gmail.com'
            msg['To'] = email

            server.sendmail('soporteflorsync@gmail.com', [email], msg.as_string())
            server.quit()
        except Exception as e:
            print(f"Error enviando email: {e}", flush=True)

        print("CODIGO RESET:", codigo, flush=True)

    return Response({"message": "Si el correo existe, recibirás un código"})

@api_view(['POST'])
@permission_classes([AllowAny])
def verify_code(request):
    email = request.data.get('email')
    codigo = request.data.get('codigo')

    if not email or not codigo:
        return Response({"error": "Datos incompletos"}, status=400)

    User = get_user_model()
    user = User.objects.filter(email=email).first()
    if user.codigo_reset != codigo:
        return Response({"error": "Código incorrecto"}, status=400)

    if user.codigo_reset_expira < timezone.now():
        return Response({"error": "Código expirado"}, status=400)
    if not user:
        return Response({"error": "Usuario no encontrado"}, status=404)

    if user.codigo_reset != codigo:
        return Response({"error": "Código incorrecto"}, status=400)

    return Response({"message": "Código correcto"})


@api_view(['POST'])
@permission_classes([AllowAny])
def change_password(request):
    User = get_user_model()

    email = request.data.get("email")
    codigo = request.data.get("codigo")
    password = request.data.get("password")

    user = User.objects.filter(email=email, codigo_reset=codigo).first()

    if not user:
        return Response({"error": "Código inválido"}, status=400)

    user.set_password(password)
    user.codigo_reset = None
    user.codigo_reset_expira = None
    user.save()

    return Response({"message": "Contraseña cambiada correctamente"})