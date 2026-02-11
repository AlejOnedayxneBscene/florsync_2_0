
from django.contrib import admin
from django.urls import path, include
from .views import home
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

urlpatterns = [
    path('admin/', admin.site.urls),
    path('usuarios/', include('usuarios.urls')),  
    path("api/token/", TokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("", include("api.url")),  # o "api/"
    path("api/token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path('productos/', include('productos.urls')),
    path('clientes/', include('clientes.urls'))
]
