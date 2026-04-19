from django.contrib import admin
from django import forms
from .models import Usuario
import secrets
from django.core.mail import send_mail
from django.conf import settings
from auditoria.models import AuditLog


# =========================
# FORMS
# =========================
class CustomUsuarioCreationForm(forms.ModelForm):
    class Meta:
        model = Usuario
        fields = (
            "first_name",
            "last_name",
            "cedula",
            "email",
            "groups",
            "is_active",
        )


class CustomUsuarioChangeForm(forms.ModelForm):
    class Meta:
        model = Usuario
        fields = (
            "first_name",
            "last_name",
            "cedula",
            "email",
            "groups",
            "is_active",
        )


# =========================
# ADMIN
# =========================
@admin.register(Usuario)
class CustomUsuarioAdmin(admin.ModelAdmin):

    form = CustomUsuarioChangeForm
    add_form = CustomUsuarioCreationForm

    list_display = ("username", "email", "get_grupo", "is_active")
    filter_horizontal = ("groups",)

    # 🔥 FIX: evita password fields del UserAdmin
    exclude = ("password",)

    def get_queryset(self, request):
        return Usuario.objects.all()

    # =========================
    # AUDITORIA
    # =========================
    def log(self, request, accion, instance, cambios=None):
        AuditLog.objects.create(
            usuario=request.user,
            accion=accion,
            modelo="Usuario",
            objeto_id=str(instance.id),
            objeto_nombre=str(instance),
            cambios=cambios or {}
        )

    # =========================
    # CREATE / UPDATE
    # =========================
    def save_model(self, request, obj, form, change):
        is_new = not change

        if is_new:
            password = secrets.token_urlsafe(8)
            obj.set_password(password)
            obj.debe_cambiar_password = True

            nombre = (obj.first_name or "").lower()
            cedula = obj.cedula[-4:] if obj.cedula else ""
            obj.username = f"{nombre}{cedula}"

        obj.save()
        form.save_m2m()

        grupo = obj.groups.first()
        obj.is_staff = grupo and grupo.name == "Administrador"
        obj.is_superuser = False
        obj.save()

        if is_new:
            self.log(request, "CREATE", obj, {
                "username": obj.username,
                "email": obj.email
            })

            send_mail(
                subject="Bienvenido",
                message=f"Usuario: {obj.username}\nPassword: {password}",
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[obj.email],
            )
        else:
            self.log(request, "UPDATE", obj, {
                "username": obj.username,
                "email": obj.email
            })

    # =========================
    # DELETE = SOLO DESACTIVAR
    # =========================
    def delete_model(self, request, obj):
        self.log(request, "DELETE", obj, {
            "username": obj.username,
            "email": obj.email
        })

        obj.is_active = False
        obj.save()

    def get_grupo(self, obj):
        grupo = obj.groups.first()
        return grupo.name if grupo else "-"