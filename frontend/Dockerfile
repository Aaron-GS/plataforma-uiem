# Etapa 1: Construir la app de Vue
FROM node:20-alpine AS build

WORKDIR /app

# Copiar los archivos de dependencias
COPY package*.json ./

# Instalar TODAS las dependencias (incluyendo devDependencies para Vite)
RUN npm ci --include=dev

# Copiar el resto del código
COPY . .

# Ejecutar el build de producción
RUN npm run build

# Etapa 2: Servir los archivos con Nginx
FROM nginx:alpine

# Copiar la configuración de Nginx para Vue Router
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copiar los archivos estáticos generados
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]