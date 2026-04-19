from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    login_usuario,
    me,
    request_password_reset,
    verify_code,
    change_password,
    UsuarioViewSet
)

router = DefaultRouter()
router.register(r'usuarios', UsuarioViewSet)  # 👈 aquí registras el ViewSet

urlpatterns = [
    path('', include(router.urls)),  # 👈 ESTO ES LO QUE TE FALTABA

    path('login/', login_usuario, name='login_usuario'),
    path("me/", me),

    path('password-reset/', request_password_reset),
    path('password-reset/verify/', verify_code),
    path('password-reset/change/', change_password),
]