from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from django import forms
from .models import Usuario


# =============================
# FORM CREAR USUARIO
# =============================
class CustomUsuarioCreationForm(forms.ModelForm):
    password = forms.CharField(widget=forms.PasswordInput, required=True)

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

    def clean_groups(self):
        grupos = self.cleaned_data.get("groups")
        if not grupos or len(grupos) != 1:
            raise forms.ValidationError(
                "Debe seleccionar exactamente un grupo."
            )
        return grupos

    def save(self, commit=True):
        user = super().save(commit=False)

        user.set_password(self.cleaned_data["password"])

        nombre = (user.first_name or "").lower()
        cedula = user.cedula[-4:] if user.cedula else ""
        user.username = f"{nombre}{cedula}"

        if commit:
            user.save()

            grupo = user.groups.first()

            if grupo and grupo.name == "Administrador":
                user.is_staff = True
            else:
                user.is_staff = False
                user.is_superuser = False

            user.save()

        return user


# =============================
# FORM EDITAR
# =============================
class CustomUsuarioChangeForm(forms.ModelForm):
    class Meta:
        model = Usuario
        fields = "__all__"


# =============================
# ADMIN
# =============================
@admin.register(Usuario)
class CustomUsuarioAdmin(UserAdmin):
    add_form = CustomUsuarioCreationForm
    form = CustomUsuarioChangeForm
    model = Usuario

    list_display = ("username", "email", "get_grupo", "is_active")
    filter_horizontal = ("groups",)

    add_fieldsets = (
        (None, {
            "classes": ("wide",),
            "fields": (
                "first_name",
                "last_name",
                "cedula",
                "email",
                "password",
                "groups",
                "is_active",
            ),
        }),
    )

    fieldsets = (
        (None, {
            "fields": (
                "first_name",
                "last_name",
                "cedula",
                "email",
                "password",
                "groups",
                "is_active",
            ),
        }),
    )

    def get_grupo(self, obj):
        grupo = obj.groups.first()
        return grupo.name if grupo else "-"
    get_grupo.short_description = "Grupo"

    def save_model(self, request, obj, form, change):
        grupo = obj.groups.first()

        if grupo and grupo.name == "Administrador":
            obj.is_staff = True
        else:
            obj.is_staff = False
            obj.is_superuser = False

        super().save_model(request, obj, form, change)

    def get_form(self, request, obj=None, **kwargs):
        form = super().get_form(request, obj, **kwargs)
        groups_field = getattr(form.base_fields, "groups", None)

        if groups_field:
            form.base_fields["groups"].queryset = (
                form.base_fields["groups"]
                .queryset.filter(
                    name__in=["Administrador", "Vendedor"]
                )
            )
        return form
