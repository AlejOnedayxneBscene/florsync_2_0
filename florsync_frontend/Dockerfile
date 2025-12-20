# Frontend Dockerfile

# Usar imagen base de Node.js
FROM node:18-slim

# Definir el directorio de trabajo
WORKDIR /app

# Copiar package.json y package-lock.json (si existe)
COPY package*.json ./ 

# Instalar dependencias
RUN npm install

# Copiar el resto del código del frontend
COPY . /app/

# Exponer el puerto donde Vite servirá la app
EXPOSE 5173

# Iniciar el servidor de desarrollo (se mueve a CMD)
CMD ["npm", "run", "dev"]
