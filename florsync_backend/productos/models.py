from django.db import models


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

    def __str__(self):
        return self.nombre

