import secrets
import string
from .models import Usuario


def generar_username(first_name: str, cedula: str) -> str:
    """
    Genera username = nombre + últimos 4 dígitos de cédula.
    Si ya existe, agrega un sufijo numérico incremental.
    """
    base = first_name.lower().strip().split()[0]  # solo primer nombre
    sufijo = cedula[-4:] if cedula and len(cedula) >= 4 else "0000"
    username = f"{base}{sufijo}"

    contador = 1
    candidato = username
    while Usuario.objects.filter(username=candidato).exists():
        candidato = f"{username}{contador}"
        contador += 1

    return candidato


def generar_password_provisional(longitud: int = 10) -> str:
    """Genera una contraseña aleatoria segura."""
    caracteres = string.ascii_letters + string.digits + "!@#$%"
    return ''.join(secrets.choice(caracteres) for _ in range(longitud))