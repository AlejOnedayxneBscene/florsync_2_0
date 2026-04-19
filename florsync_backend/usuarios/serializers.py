from rest_framework import serializers
from django.core.mail import send_mail
from django.conf import settings
from .models import Usuario, Rol
from .utils import generar_username, generar_password_provisional


class UsuarioSerializer(serializers.ModelSerializer):
    rol_nombre = serializers.CharField(source='rol.nombre', read_only=True)

    class Meta:
        model = Usuario
        fields = [
            'id', 'username', 'first_name', 'last_name',
            'email', 'cedula', 'foto_url', 'activo',
            'debe_cambiar_password', 'rol', 'rol_nombre',
            'creado_por', 'modificado_por',
        ]
        read_only_fields = [
            'username', 'debe_cambiar_password',
            'creado_por', 'modificado_por',
        ]

    def validate_email(self, value):
        qs = Usuario.objects.filter(email=value.lower())
        if self.instance:
            qs = qs.exclude(pk=self.instance.pk)
        if qs.exists():
            raise serializers.ValidationError("Este correo ya está registrado.")
        return value.lower()

    def validate_cedula(self, value):
        qs = Usuario.objects.filter(cedula=value)
        if self.instance:
            qs = qs.exclude(pk=self.instance.pk)
        if qs.exists():
            raise serializers.ValidationError("Esta cédula ya está registrada.")
        return value

    def create(self, validated_data):
        first_name = validated_data.get('first_name', '')
        cedula = validated_data.get('cedula', '')

        username = generar_username(first_name, cedula)
        password = generar_password_provisional()

        usuario = Usuario(**validated_data)
        usuario.username = username
        usuario.debe_cambiar_password = True
        usuario.set_password(password)
        usuario.save()

        send_mail(
            subject='Bienvenido — Tus credenciales de acceso',
            message=(
                f"Hola {first_name},\n\n"
                f"Tu cuenta ha sido creada.\n\n"
                f"Usuario: {username}\n"
                f"Contraseña provisional: {password}\n\n"
                f"Al ingresar por primera vez se te pedirá cambiar tu contraseña.\n\n"
                f"Saludos."
            ),
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[usuario.email],
            fail_silently=False,
        )

        return usuario


class UsuarioMeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Usuario
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'rol', 'debe_cambiar_password']


class RolesSerializers(serializers.ModelSerializer):
    class Meta:
        model = Rol
        fields = '__all__'