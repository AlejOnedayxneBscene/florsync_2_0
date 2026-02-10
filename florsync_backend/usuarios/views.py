from django.contrib.auth.decorators import login_required
from django.http import JsonResponse
from rest_framework.decorators import api_view
from rest_framework.response import Response
from .models import Usuario
from .serializers import UsuariosSerializer


from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from django.contrib.auth import authenticate
from rest_framework_simplejwt.tokens import RefreshToken
from .models import Usuario

@api_view(["POST"])
@permission_classes([AllowAny])
def login_usuario(request):
    username = request.data.get("username", "").lower()
    password = request.data.get("password", "")

    if not username or not password:
        return Response({"error": "Faltan datos"}, status=400)

    user = authenticate(username=username, password=password)

    if user is None:
        return Response({"autenticado": False, "error": "Credenciales incorrectas"}, status=401)

    refresh = RefreshToken.for_user(user)

    # mensaje por rol
    mensaje = "Hola usuario"
    if user.groups.filter(name="administrador").exists():
        mensaje = "Hola administrador"
    elif user.groups.filter(name="vendedor").exists():
        mensaje = "Hola vendedor"

    return Response({
        "autenticado": True,
        "access": str(refresh.access_token),
        "refresh": str(refresh),
        "id": user.id,
        "username": user.username,
        "mensaje": mensaje
    })


from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def me(request):
    user = request.user
    return Response({
        "id": user.id,
        "username": user.username,
    })
