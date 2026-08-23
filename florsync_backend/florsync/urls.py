from django.contrib import admin
from django.urls import path, include
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

urlpatterns = [
    path('admin/', admin.site.urls),

    # Usuarios
    path('api/usuarios/', include('usuarios.urls')),

    # API
    path('api/', include('api.url')),

    # JWT
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),

    # Otros módulos
    path('productos/', include('productos.urls')),
    path('clientes/', include('clientes.urls')),
    path('ventas/', include('ventas.urls')),
    path('auditoria/', include('auditoria.urls')),
    
]