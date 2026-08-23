from django.contrib import admin
from django import forms
from .models import Usuario
import secrets
from django.core.mail import send_mail
from django.conf import settings
from auditoria.models import AuditLog



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

    def clean(self):
        cleaned_data = super().clean()
        first_name = cleaned_data.get("first_name", "").strip()
        cedula = cleaned_data.get("cedula", "")
        groups = cleaned_data.get("groups")

        if not first_name:
            self.add_error("first_name", "El nombre es obligatorio para generar el usuario.")

        if not cedula or len(cedula) < 4:
            self.add_error("cedula", "La cédula debe tener al menos 4 dígitos.")

        if not groups:
            self.add_error("groups", "Debe asignar al menos un grupo al usuario.")
        elif groups.count() > 1:
            self.add_error("groups", "Solo se puede asignar un grupo por usuario.")

        return cleaned_data


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

    def clean(self):
        cleaned_data = super().clean()
        groups = cleaned_data.get("groups")

        if not groups:
            self.add_error("groups", "Debe asignar al menos un grupo al usuario.")
        elif groups.count() > 1:
            self.add_error("groups", "Solo se puede asignar un grupo por usuario.")

        return cleaned_data


# =========================
# ADMIN
# =========================
@admin.register(Usuario)
class CustomUsuarioAdmin(admin.ModelAdmin):

    form = CustomUsuarioChangeForm
    add_form = CustomUsuarioCreationForm

    list_display = ("username", "email", "get_grupo", "is_active")
    filter_horizontal = ("groups",)

    exclude = ("password",)

    def get_form(self, request, obj=None, **kwargs):
        if obj is None:
            kwargs["form"] = self.add_form
        return super().get_form(request, obj, **kwargs)

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

            nombre = (obj.first_name or "").strip().lower()
            cedula = obj.cedula[-4:] if obj.cedula else ""
            username = f"{nombre}{cedula}"

            if not username:
                raise ValueError("No se puede generar un username válido sin nombre y cédula.")

            obj.username = username

        obj.save()
        form.save_m2m()

        grupo = obj.groups.first()
        obj.is_staff = bool(grupo and grupo.name == "Administrador")
        obj.is_superuser = False
        obj.save()

        if is_new:
            self.log(request, "CREATE", obj, {
                "username": obj.username,
                "email": obj.email
            })

            try:
                send_mail(
                    subject="Bienvenido",
                    message=f"Usuario: {obj.username}\nPassword: {password}",
                    from_email=settings.DEFAULT_FROM_EMAIL,
                    recipient_list=[obj.email],
                    fail_silently=False,
                )
            except Exception as e:
                print(f"ERROR enviando correo: {e}")
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