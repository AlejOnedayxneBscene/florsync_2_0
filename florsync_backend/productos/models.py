from django.db import models
from django.conf import settings


class Producto(models.Model):
    id_producto = models.AutoField(primary_key=True)

    nombre = models.CharField(max_length=100)
    precio = models.DecimalField(max_digits=10, decimal_places=2)

    categoria = models.ForeignKey(
        "api.Categoria",
        on_delete=models.PROTECT,
        related_name="productos"
    )

    stock_total = models.IntegerField()
    stock_minimo = models.IntegerField(default=0)

    activo = models.BooleanField(default=True)

    #  AUDITORÍA
    creado_por = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="productos_creados"
    )

    editado_por = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="productos_editados"
    )

    def __str__(self):
        return self.nombre
