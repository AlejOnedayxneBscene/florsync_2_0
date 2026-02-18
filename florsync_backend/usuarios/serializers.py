from .models import Usuario
from .models import Rol
from rest_framework import serializers
from rest_framework import serializers
from .models import Usuario



class UsuarioMeSerializer(serializers.ModelSerializer):
    grupo = serializers.SerializerMethodField()

    class Meta:
        model = Usuario
        fields = ["id", "username", "email", "grupo"]

    def get_grupo(self, obj):
        grupo = obj.groups.first()
        return grupo.name if grupo else None


class RolesSerializers(serializers.ModelSerializer):
    class Meta:
        model = Rol
        fields = '__all__' 