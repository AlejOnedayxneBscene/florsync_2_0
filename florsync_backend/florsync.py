
import os
import sys
import time
import subprocess
import webbrowser

# Buscar manage.py en niveles superiores
def find_manage_py_up(start_dir, max_levels=5):
    current_dir = start_dir
    for _ in range(max_levels):
        if "manage.py" in os.listdir(current_dir):
            return current_dir  # Encontrado
        parent_dir = os.path.dirname(current_dir)  # Subir una dirección
        if parent_dir == current_dir:
            break
        current_dir = parent_dir
    return None

# Buscar 'manage.py' en subcarpetas
def find_manage_py_down(start_dir):
    for root, _, files in os.walk(start_dir):
        if "manage.py" in files:
            return root
    return None

# Detectar ubicación de ejecución
if getattr(sys, 'frozen', False):
    BASE_DIR = os.path.dirname(sys.executable)  
else:
    BASE_DIR = os.path.dirname(os.path.abspath(__file__)) 

# Determinar directorio del proyecto
if "dist" in BASE_DIR.lower():  # Si el ejecutable está en 'dist', busca hacia arriba
    PROJECT_DIR = find_manage_py_up(BASE_DIR)
else:  # Si está en otra ubicación (Ej: Escritorio), busca en subcarpetas
    PROJECT_DIR = find_manage_py_down(BASE_DIR)

# Cambiar al directorio donde está 'manage.py'
os.chdir(PROJECT_DIR)

# Levantar contenedores de Docker en segundo plano
subprocess.Popen(["docker-compose", "up", "-d"], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, shell=True)

# Esperar 5 segundos para asegurar que los contenedores se inicien
time.sleep(5)

# Abrir la aplicación en el navegador en el puerto 5147
webbrowser.open("http://localhost:5173")

