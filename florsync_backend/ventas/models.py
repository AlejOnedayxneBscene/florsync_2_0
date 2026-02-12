from django.db import models
from decimal import Decimal

class Venta(models.Model):
    id_venta = models.AutoField(primary_key=True)

    cliente = models.ForeignKey(
        "clientes.Clientes",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="ventas"
    )

    fecha = models.DateTimeField(auto_now_add=True)

    usuario = models.ForeignKey(
        "usuarios.Usuario",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="ventas_usuario"
    )

    total = models.DecimalField(max_digits=12, decimal_places=2, default=0)

    def __str__(self):
        cliente_info = self.cliente.nombre_cliente if self.cliente else "Anónimo"
        return f"Venta #{self.id_venta} - {cliente_info} - {self.fecha.strftime('%d/%m/%Y')}"

class DetalleVenta(models.Model):
    id_detalle = models.AutoField(primary_key=True)

    venta = models.ForeignKey(
        Venta,
        on_delete=models.CASCADE,
        related_name='detalles'
    )

    producto = models.ForeignKey(
        "productos.Producto",
        on_delete=models.CASCADE
    )

    cantidad = models.PositiveIntegerField()

    precio = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True
    )

    def subtotal(self):
        return self.cantidad * self.precio

    def save(self, *args, **kwargs):
        if self.precio is None:
            self.precio = self.producto.precio

        super().save(*args, **kwargs)

        # Actualizar total de la venta
        total = sum(det.subtotal() for det in self.venta.detalles.all())
        self.venta.total = total
        self.venta.save()

    def __str__(self):
        return f"Venta {self.venta.id_venta} - {self.producto.nombre} x{self.cantidad}"
