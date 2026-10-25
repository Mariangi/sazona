# 🍳 Sazona

Una aplicación web moderna para compartir recetas, planificar comidas semanales y colaborar en la cocina con amigos. Descubrí nuevas recetas, organiza tu menú semanal, y gestiona tus compras de forma inteligente.

## ✨ Características Principales

### 👨‍🍳 Recetas
- **Crear y editar recetas** con ingredientes, pasos de preparación y tiempos de cocción
- **Galería de fotos** para visualizar tus creaciones
- **Categorización** de recetas (Desayuno, Entrada, Plato principal, Postre, etc.)
- **Guardar favoritos** para acceso rápido
- **Búsqueda avanzada** por nombre y categoría

### 🛍️ Mi Heladera
- **Ingresa ingredientes** que tenés en casa
- **Descubre recetas** que puedas preparar con esos ingredientes
- **Flexibilidad** para permitir recetas con ingredientes adicionales
- **Filtrado inteligente** de resultados

### 📅 Semanario (Planificador Semanal)
- **Planifica 4 comidas por día**: Desayuno, Almuerzo, Merienda, Cena
- **Multiplicador de porciones**: Ajusta las cantidades según el número de comensales
- **Generación automática de lista de compras** con ingredientes consolidados
- **Interfaz intuitiva** con vista de 7 días

### 🤝 Grupos
- **Crea grupos** para cocinar con amigos y familia
- **Propuestas de recetas** con sistema de votación
- **Chat integrado** para comunicarse durante la planificación
- **Código de invitación** para agregar miembros
- **Generación colaborativa de listas de compras** con multiplicador de porciones

### 🔍 Descubrimiento
- **Explora recetas** de otros usuarios
- **Filtra por categoría** para encontrar lo que buscas
- **Busca por nombre** con sugerencias en tiempo real
- **Scroll infinito** para una experiencia fluida
- **Ver perfiles** de otros chefs

### 📝 Lista de Compras
- **Consolidación automática** de ingredientes (agrupadas por nombre y unidad)
- **Multiplicador de porciones** para ajustar cantidades
- **Marcar items** como comprados
- **Organización por secciones** del supermercado
- **Compartir listas** con el grupo

## 🚀 Inicio Rápido

### Requisitos Previos
- **Node.js** 16.x o superior
- **npm** 8.x o superior
- **SQLite3** (incluido en la mayoría de sistemas)

### Instalación

```bash
# Clonar el repositorio
git clone https://github.com/Mariangi/sazona.git
cd sazona

# Instalar dependencias
npm install

# Configurar base de datos
cd packages/server
npm run db:migrate

# Volver a la raíz
cd ../..
```

### Desarrollo

```bash
# Terminal 1: Iniciar servidor backend
cd packages/server
npm run dev

# Terminal 2: Iniciar cliente frontend
npm run dev
```

La aplicación estará disponible en `http://localhost:5173`

### Build Producción

```bash
# Compilar TypeScript y crear bundle de Vite
npm run build

# Build solo del cliente
cd packages/shared && npm run build
npm run build
```

## 📁 Estructura del Proyecto

```
sazona/
├── packages/
│   ├── server/                 # Backend Fastify + SQLite
│   │   ├── src/
│   │   │   ├── index.ts       # Servidor principal
│   │   │   ├── auth/          # Rutas de autenticación
│   │   │   ├── db/            # Configuración y schema
│   │   │   └── routes/        # Endpoints de la API
│   │   ├── drizzle/           # Migraciones SQL
│   │   └── data/              # Datos iniciales
│   ├── shared/                 # Tipos y validaciones compartidas
│   │   └── src/
│   │       ├── types.ts       # Interfaces TypeScript
│   │       ├── validation.ts  # Esquemas de validación
│   │       └── categories.ts  # Categorías de recetas
│   └── uploads/               # Almacenamiento de imágenes
├── src/                        # Frontend React
│   ├── components/
│   │   ├── Auth/              # Componentes de login/registro
│   │   ├── layout/            # Layout principal
│   │   ├── recipes/           # Componentes de recetas
│   │   ├── semanario/         # Planificador semanal
│   │   ├── groups/            # Componentes de grupos
│   │   ├── profile/           # Perfil de usuario
│   │   └── ui/                # Componentes reutilizables
│   ├── pages/                 # Páginas principales
│   ├── context/               # Context API (Autenticación)
│   ├── hooks/                 # Custom hooks
│   ├── api/                   # Cliente HTTP
│   └── index.css              # Estilos globales
├── public/                     # Archivos estáticos
└── package.json
```

## 🛠️ Stack Tecnológico

### Backend
- **Fastify** - Framework web rápido y eficiente
- **SQLite** - Base de datos ligera
- **Drizzle ORM** - Type-safe SQL query builder
- **JWT** - Autenticación segura
- **TypeScript** - Type safety en todo el proyecto

### Frontend
- **React 18** - UI library
- **React Router** - Navegación SPA
- **TypeScript** - Type safety
- **Vite** - Build tool ultra-rápido
- **CSS Modules** - Estilos encapsulados

### DevOps
- **npm workspaces** - Monorepo management
- **Playwright** - Testing (en desarrollo)

## 🔐 Autenticación

La aplicación utiliza JWT (JSON Web Tokens) para autenticación:

1. **Registro**: Crea una cuenta con email y contraseña
2. **Login**: Obtén un token JWT válido
3. **Sesiones**: El token se almacena en localStorage
4. **Rutas protegidas**: El frontend verifica autenticación antes de navegar

## 📚 API Endpoints Principales

### Autenticación
- `POST /api/auth/register` - Registrar usuario
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Obtener usuario actual

### Recetas
- `GET /api/recipes` - Mis recetas
- `POST /api/recipes` - Crear receta
- `PUT /api/recipes/:id` - Actualizar receta
- `DELETE /api/recipes/:id` - Eliminar receta
- `GET /api/recipes/discover` - Descubrir recetas (con búsqueda)
- `POST /api/recipes/find-by-ingredients` - Buscar por ingredientes

### Semanario
- `GET /api/meal-plans` - Obtener planes semanales
- `POST /api/meal-plans` - Crear plan
- `GET /api/meal-plans/:id` - Obtener plan específico
- `PUT /api/meal-plans/:id/entries` - Actualizar comidas
- `PUT /api/meal-plans/:id/servings` - Actualizar multiplicador
- `POST /api/meal-plans/:id/generate-list` - Generar lista de compras

### Grupos
- `GET /api/groups` - Mis grupos
- `POST /api/groups` - Crear grupo
- `GET /api/groups/:id` - Obtener grupo
- `POST /api/messages/:id/close-vote` - Cerrar votación y generar lista

## 🎨 Paleta de Colores

```css
--c-primary: #ff8240       /* Naranja principal */
--c-surface: #faf8f5       /* Superficie clara */
--c-border: #e8dfd5        /* Bordes suaves */
--c-text: #1a1a1a          /* Texto principal */
--c-error: #e74c3c         /* Errores */
```

## 📱 Responsive Design

La aplicación es completamente responsive:
- **Mobile-first**: Optimizada para dispositivos móviles
- **Breakpoints**: 768px (tablet), 1024px (desktop)
- **Touch-friendly**: Botones y elementos grandes

## 🔄 Flujo de Datos

```
Usuario
  ↓
Frontend (React)
  ↓
API Client (Fetch)
  ↓
Backend (Fastify)
  ↓
Base de Datos (SQLite)
```

## 🧪 Testing

```bash
# Ejecutar tests (próximamente)
npm run test

# Tests de integración
npm run test:integration
```

## 📋 Roadmap

- [ ] Sincronización en tiempo real con WebSockets
- [ ] Recomendaciones personalizadas basadas en historial
- [ ] Importar recetas de URLs
- [ ] Cálculo de información nutricional
- [ ] Exportar listas de compras a PDF
- [ ] Integración con supermercados locales
- [ ] Aplicación móvil nativa

## 🤝 Contribuir

¡Las contribuciones son bienvenidas! Por favor:

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📝 Notas de Desarrollo

### Variables de Entorno

Crea un archivo `.env` en `packages/server`:

```
DATABASE_URL=sqlite:./data/sazona.db
JWT_SECRET=tu_secreto_super_seguro
PORT=3000
NODE_ENV=development
```

### Migraciones de Base de Datos

```bash
# Crear una nueva migración
cd packages/server
npm run db:generate

# Aplicar migraciones
npm run db:migrate

# Resetear base de datos (dev solo)
npm run db:reset
```

### Scripts Útiles

```bash
# Linter
npm run lint

# Type checking
npm run type-check

# Preview de build
npm run preview
```

## 📞 Soporte

Para reportar bugs o solicitar features:
- Abre un issue en GitHub
- Envía un email a [contact@sazona.local]

## 📄 Licencia

Este proyecto está bajo la licencia MIT. Ver [LICENSE](LICENSE) para más detalles.

## 👨‍💻 Autor

**Mariangi** - [GitHub Profile](https://github.com/Mariangi)

---

**Hecho con ❤️ para los amantes de la cocina** 🍽️
