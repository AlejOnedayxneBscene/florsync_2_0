from django.urls import path
from .views import   login_usuario, me

urlpatterns = [
    path('login/', login_usuario, name='login_usuario'), 
    path("me/", me),

]
