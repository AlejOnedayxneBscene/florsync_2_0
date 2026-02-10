from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from django import forms
from .models import Usuario

class CustomUsuarioForm(forms.ModelForm):
    class Meta:
        model = Usuario
        fields = '__all__'

    def clean_groups(self):
        grupos = self.cleaned_data.get('groups')
        if not grupos or len(grupos) != 1:
            raise forms.ValidationError("Debe seleccionar exactamente un grupo (Administrador o Vendedor).")
        return grupos

@admin.register(Usuario)
class CustomUsuarioAdmin(UserAdmin):
    form = CustomUsuarioForm
    model = Usuario
    list_display = ('username', 'email', 'get_grupo', 'is_staff', 'is_active')

    def get_grupo(self, obj):
        grupos = obj.groups.all()
        return grupos[0].name if grupos else "-"
    get_grupo.short_description = 'Grupo'

    # Ocultamos permisos individuales
    def get_fieldsets(self, request, obj=None):
        fieldsets = super().get_fieldsets(request, obj)
        new_fieldsets = []
        for name, data in fieldsets:
            fields = list(data.get('fields', ()))
            if 'user_permissions' in fields:
                fields.remove('user_permissions')
            new_fieldsets.append((name, {'fields': fields}))
        return new_fieldsets

    def get_form(self, request, obj=None, **kwargs):
        form = super().get_form(request, obj, **kwargs)
        # Solo filtramos grupos si el campo existe
        groups_field = getattr(form.base_fields, 'groups', None)
        if groups_field:
            form.base_fields['groups'].queryset = form.base_fields['groups'].queryset.filter(
                name__in=['Administrador', 'Vendedor']
            )
        return form
