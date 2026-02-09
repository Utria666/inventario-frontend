# Inventario Frontend

Sistema de gestion de inventario construido con React, TypeScript y Ant Design. Interfaz moderna con tema oscuro, gestion completa de productos, movimientos de stock, reportes y control de roles.

## Tabla de Contenidos

- [Requisitos Previos](#requisitos-previos)
- [Instalacion](#instalacion)
- [Configuracion](#configuracion)
- [Ejecucion](#ejecucion)
- [Despliegue](#despliegue)
- [Estructura del Proyecto](#estructura-del-proyecto)
- [Modulos](#modulos)
- [Stack Tecnologico](#stack-tecnologico)
- [Roles y Permisos](#roles-y-permisos)
- [Guia de Contribucion](#guia-de-contribucion)

---

## Requisitos Previos

Antes de comenzar, asegurate de tener instalado:

| Herramienta | Version Minima | Verificar con |
|-------------|---------------|---------------|
| **Node.js** | 18.0.0 | `node --version` |
| **npm** | 9.0.0 | `npm --version` |
| **Git** | 2.0.0 | `git --version` |

Ademas, necesitas el **backend** corriendo. El backend esta en el repositorio [stock-management-api](https://github.com/Utria666/stock-management-api).

---

## Instalacion

### 1. Clonar el repositorio

```bash
git clone https://github.com/Utria666/inventario-frontend.git
cd inventario-frontend
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Verificar que todo esta correcto

```bash
npm run build
```

Si el build pasa sin errores, la instalacion fue exitosa.

---

## Configuracion

### Backend (obligatorio)

Este frontend necesita el backend corriendo en `http://localhost:3045`. El proxy ya esta configurado en `vite.config.ts`:

```ts
server: {
  proxy: {
    '/api': {
      target: 'http://localhost:3045',
      changeOrigin: true,
    },
  },
}
```

> Si tu backend corre en otro puerto, cambia el valor de `target` en `vite.config.ts`.

### Variables de entorno (opcional)

No se requieren variables de entorno para desarrollo. El proxy de Vite se encarga de redirigir las peticiones al backend.

Para **produccion**, necesitaras configurar la URL del backend. Crea un archivo `.env.production`:

```env
VITE_API_URL=https://tu-backend-en-produccion.com/api
```

---

## Ejecucion

### Desarrollo

```bash
# 1. Asegurate de que el backend este corriendo en el puerto 3045
# (en otra terminal, dentro del proyecto backend)
cd ../investario-backend
npm run dev

# 2. Inicia el frontend
cd ../inventario-frontend
npm run dev
```

La aplicacion estara disponible en **http://localhost:5173**

### Credenciales de prueba

| Rol | Email | Contrasena |
|-----|-------|------------|
| ADMIN | `admin@inventory.com` | `Admin123!` |

> Las credenciales pueden variar segun los datos semilla (seed) de tu backend.

### Comandos disponibles

| Comando | Descripcion |
|---------|-------------|
| `npm run dev` | Inicia el servidor de desarrollo con HMR |
| `npm run build` | Compila TypeScript y genera el build de produccion |
| `npm run preview` | Previsualiza el build de produccion localmente |
| `npm run lint` | Ejecuta ESLint para verificar el codigo |

---

## Despliegue

### Opcion 1: Servidor estatico (Nginx, Apache, etc.)

```bash
# 1. Generar el build
npm run build

# 2. Los archivos se generan en la carpeta dist/
ls dist/
```

Sube el contenido de `dist/` a tu servidor. Configuracion de Nginx de ejemplo:

```nginx
server {
    listen 80;
    server_name tu-dominio.com;
    root /var/www/inventario-frontend/dist;
    index index.html;

    # SPA: redirigir todas las rutas a index.html
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Proxy al backend
    location /api/ {
        proxy_pass http://localhost:3045;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### Opcion 2: Vercel

```bash
# Instalar Vercel CLI
npm i -g vercel

# Desplegar
vercel
```

Agrega un archivo `vercel.json` en la raiz:

```json
{
  "rewrites": [
    { "source": "/api/(.*)", "destination": "https://tu-backend.com/api/$1" },
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

### Opcion 3: Netlify

```bash
# Build command: npm run build
# Publish directory: dist
```

Agrega un archivo `netlify.toml`:

```toml
[build]
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/api/*"
  to = "https://tu-backend.com/api/:splat"
  status = 200

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

### Opcion 4: Docker

Crea un `Dockerfile`:

```dockerfile
# Build
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Servir
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

```bash
docker build -t inventario-frontend .
docker run -p 80:80 inventario-frontend
```

---

## Estructura del Proyecto

```
src/
├── api/                    # Capa de comunicacion con el backend
│   ├── client.ts           # Instancia de Axios (interceptores JWT, manejo de 401)
│   └── endpoints/          # Funciones por modulo
│       ├── auth.ts         # Login, Register
│       ├── categories.ts   # CRUD Categorias
│       ├── locations.ts    # CRUD Ubicaciones
│       ├── movements.ts    # Crear y listar movimientos
│       ├── productLocations.ts  # CRUD Stock por ubicacion
│       ├── products.ts     # CRUD Productos
│       ├── reports.ts      # Reportes (stock bajo, historial, valor)
│       ├── suppliers.ts    # CRUD Proveedores
│       └── users.ts        # CRUD Usuarios (ADMIN)
│
├── layouts/
│   └── MainLayout.tsx      # ProLayout con sidebar y menus por rol
│
├── pages/                  # Paginas de la aplicacion
│   ├── auth/               # Login y Register
│   ├── categorias/         # CRUD Categorias
│   ├── dashboard/          # Dashboard con graficos y estadisticas
│   ├── movimientos/        # Movimientos de inventario (4 tipos)
│   ├── productLocations/   # Stock por ubicacion
│   ├── productos/          # CRUD Productos con filtros
│   ├── proveedores/        # CRUD Proveedores
│   ├── reportes/           # Reportes con 3 tabs
│   ├── ubicaciones/        # CRUD Ubicaciones
│   └── usuarios/           # CRUD Usuarios (ADMIN only)
│
├── routes/
│   ├── index.tsx           # Configuracion de rutas (React Router v6)
│   └── ProtectedRoute.tsx  # Guard: redirige a /login si no hay token
│
├── store/
│   └── authStore.ts        # Estado de autenticacion (Zustand + persist)
│
├── types/
│   └── models.ts           # Interfaces TypeScript (User, Product, Movement, etc.)
│
├── App.tsx                 # Providers: Ant Design (dark theme), React Query, Router
└── main.tsx                # Punto de entrada
```

---

## Modulos

### Dashboard
Pantalla principal con:
- **4 tarjetas** de estadisticas: Total Productos, Valor del Inventario, Alertas de Stock Bajo, Movimientos del dia
- **2 graficos**: Valor de inventario por ubicacion (barras), Movimientos ultimos 7 dias (lineas)
- **Tabla** de productos con stock bajo

### Productos
CRUD completo con:
- Busqueda por nombre y SKU
- Filtros por categoria y proveedor
- Vista detalle con stock por ubicacion

### Categorias / Ubicaciones / Proveedores
CRUDs estandar con ProTable, busqueda y formularios modales.

### Usuarios (solo ADMIN)
- Crear usuarios con contrasena temporal autogenerada
- Modal con boton de copiar contrasena al portapapeles
- Roles diferenciados con etiquetas de color (ADMIN = azul, USER = default)

### Stock por Ubicacion
- Indicadores visuales: etiqueta roja "Bajo" cuando `stockActual < stockMinimo`
- Filtro "Solo stock bajo"
- Stock actual es de solo lectura (se modifica unicamente via movimientos)

### Movimientos
Formulario dinamico con 4 tipos:
| Tipo | Campos |
|------|--------|
| **Entrada** | Producto-Ubicacion, Cantidad, Notas |
| **Salida** | Producto-Ubicacion, Cantidad (muestra stock actual), Notas |
| **Ajuste** | Producto-Ubicacion, Cantidad (puede ser negativa), Notas |
| **Transferencia** | Origen, Destino, Cantidad, Notas |

### Reportes
Tres tabs:
1. **Stock Bajo**: Ordenado por deficit, etiquetas de urgencia
2. **Historial de Movimientos**: Paginacion server-side con filtros (tipo, fechas, producto, ubicacion)
3. **Valor del Inventario**: Desglose por ubicacion con total general

---

## Stack Tecnologico

| Tecnologia | Uso |
|------------|-----|
| [React 19](https://react.dev/) | Libreria de UI |
| [TypeScript 5.9](https://www.typescriptlang.org/) | Tipado estatico |
| [Vite 7](https://vite.dev/) | Bundler y dev server |
| [Ant Design 5](https://ant.design/) | Componentes de UI (tema oscuro) |
| [Ant Design ProComponents](https://procomponents.ant.design/) | ProTable, ProLayout, ProForm |
| [Ant Design Charts](https://ant-design-charts.antgroup.com/) | Graficos (barras, lineas) |
| [React Router 7](https://reactrouter.com/) | Navegacion SPA |
| [TanStack Query 5](https://tanstack.com/query) | Fetching, cache y sincronizacion de datos |
| [Zustand 5](https://zustand.docs.pmnd.rs/) | Estado global (autenticacion) |
| [Axios](https://axios-http.com/) | Cliente HTTP |
| [Day.js](https://day.js.org/) | Manejo de fechas |

---

## Roles y Permisos

| Funcionalidad | ADMIN | USER |
|---------------|:-----:|:----:|
| Dashboard | Si | Si |
| Ver Productos | Si | Si |
| Crear/Editar/Eliminar Productos | Si | No |
| Categorias | Si | No (menu oculto) |
| Ubicaciones | Si | No (menu oculto) |
| Proveedores | Si | No (menu oculto) |
| Usuarios | Si | No (menu oculto) |
| Stock por Ubicacion | Si | Si |
| Crear Movimientos | Si | Si |
| Reportes | Si | Si |

---

## Guia de Contribucion

### 1. Fork y clonar

```bash
# Fork desde GitHub, luego:
git clone https://github.com/TU-USUARIO/inventario-frontend.git
cd inventario-frontend
npm install
```

### 2. Crear una rama

```bash
# Usar nombres descriptivos
git checkout -b feat/nombre-del-feature    # Para nuevas funcionalidades
git checkout -b fix/descripcion-del-bug    # Para correcciones
git checkout -b refactor/que-se-refactoriza # Para refactoring
```

### 3. Convenciones de codigo

- **Idioma del codigo**: Ingles (variables, funciones, componentes)
- **Idioma de la UI**: Espanol (textos, labels, mensajes)
- **Componentes**: Functional components con hooks
- **Estado del servidor**: TanStack Query (`useQuery`, `useMutation`)
- **Estado local**: `useState` / `useReducer`
- **Estado global**: Solo Zustand (para auth)
- **Formularios**: Ant Design ProForm / ModalForm
- **Tablas**: Ant Design ProTable
- **Estilos**: Ant Design tokens (no CSS custom salvo excepciones)

### 4. Patron para nuevos modulos CRUD

Si necesitas agregar un nuevo modulo, segui este patron:

```
1. Crear api/endpoints/miModulo.ts     (funciones CRUD)
2. Crear pages/miModulo/MiModuloPage.tsx (ProTable + ModalForm)
3. Registrar la ruta en routes/index.tsx
4. Agregar menu item en layouts/MainLayout.tsx
```

Usa cualquier CRUD existente como referencia (ej: `categorias/`).

### 5. Commits

Seguir [Conventional Commits](https://www.conventionalcommits.org/):

```bash
feat: agregar modulo de ordenes de compra
fix: corregir filtro de fecha en reportes
refactor: extraer hook useProducts del componente
docs: actualizar README con nuevas instrucciones
```

### 6. Pull Request

```bash
# Asegurate de que el build pase
npm run build

# Push y crear PR
git push origin feat/mi-feature
```

Al crear el PR:
- Describir **que** se hizo y **por que**
- Incluir capturas de pantalla si hay cambios visuales
- Referenciar issues si aplica (`Closes #12`)

### 7. Checklist antes del PR

- [ ] `npm run build` pasa sin errores
- [ ] `npm run lint` pasa sin warnings criticos
- [ ] Toda la UI nueva esta en espanol
- [ ] Los textos de los componentes no estan hardcodeados en ingles
- [ ] Se respetan los permisos por rol (ADMIN/USER)

---

## Licencia

Proyecto academico - IUDC (Instituto Universitario de Colombia).
