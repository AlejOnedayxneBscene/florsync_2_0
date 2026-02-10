from .models import Usuario
from .models import Rol
from rest_framework import serializers

class UsuariosSerializer(serializers.ModelSerializer):
    class Meta:
        model = Usuario
        fields = '__all__' 

class RolesSerializers(serializers.ModelSerializer):
    class Meta:
        model = Rol
        fields = '__all__' 