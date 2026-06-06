# Sasona — Prompt para Rediseño de todas las Pantallas

## Contexto

Sasona es una webapp de planificación de comidas familiares. Stack: React 19 + TypeScript + Vite + CSS Modules. Backend Fastify + SQLite. El frontend está construido con CSS Modules y tiene un diseño funcional pero visualmente básico (todo blanco/gris/indigo, tarjetas rectangulares, layout estándar).

**Objetivo:** Reescribir/rediseñar **todas las pantallas y componentes visuales** para que la app luzca **disruptiva, cercana y estéticamente atractiva**. El prompt asume que quien lo recibe tiene acceso al mismo stack (React + CSS Modules) y debe recrear cada pantalla con un nuevo sistema de diseño.

---

## Filosofía de Diseño

- **Disruptivo:** Romper con el molde de "app de recetas" tradicional. Nada de tarjetas blancas genéricas. Usar layouts inesperados, tipografía expresiva, micro-interacciones que sorprendan.
- **Cercano:** Sensación cálida, artesanal, humana. Colores tierra, texturas sutiles, bordes orgánicos (no rectángulos perfectos), ilustraciones custom, tono de voz amigable en los textos.
- **Atractivo:** Cada pantalla debe ser "instagrameable". Atención al detalle en sombras, gradientes, animaciones suaves, jerarquía visual clara. El placer visual debe ser inmediato.

---

## 1. PÁGINAS Y SUS FUNCIONALIDADES

### 1.1 LoginPage `/login`

**Qué debe mostrar:**
- Marca Sasona con identidad visual fuerte
- Formulario: email + contraseña + botón de inicio
- Link a registro: "¿No tienes cuenta? Regístrate"

**Comportamiento:**
- Al enviar, llama a `api.login({ email, password })` → recibe `{ user, token }`
- Guarda token en localStorage, redirige a `/dashboard`
- Si error, muestra mensaje de error

**Estados:** idle → loading → error | success (redirección)

---

### 1.2 RegisterPage `/register`

**Qué debe mostrar:**
- Formulario: email, username, contraseña, confirmar contraseña
- Link a login: "¿Ya tienes cuenta? Inicia sesión"

**Comportamiento:**
- Validación client-side: contraseñas deben coincidir antes de enviar
- Llama a `api.register({ email, username, password })` → recibe `{ user, token }`
- Guarda token, redirige a `/dashboard`

**Estados:** idle → loading (con validación previa) → error | success

---

### 1.3 DashboardPage `/dashboard`

**Data:** `useAuth()` para obtener `user.username`

**Qué debe mostrar:**
- Saludo personalizado: "Bienvenido, [username]"
- Mensaje acogedor: algo como "¿Qué cocinamos hoy?"
- Dos grandes tarjetas de acción:
  1. "+ Nueva receta" → navega a `/recipes/new`
  2. "📋 Mis recetas" → navega a `/recipes`
- Cada tarjeta debe tener: icono grande, título, descripción corta

**No tiene loading/error states** (es estática, solo usa el username del contexto).

---

### 1.4 MyRecipesPage `/recipes`

**Data fetch:** `api.getRecipes()` → `RecipeListItem[]` (id, name, imageUrl, servings, prepTime, ingredientCount, stepCount, createdAt)

**Qué debe mostrar:**
- Header: título "Mis recetas" + botón "+ Nueva receta"
- Grid de tarjetas de receta (cada una: imagen, nombre, comensales, tiempo, conteo ingredientes/pasos)
- Click en tarjeta → navega a `/recipes/:id`
- Estado vacío: mensaje + botón para crear primera receta

**Estados:** loading ("Cargando recetas...") → error (banner rojo) → empty (emoji + CTA) → grid

---

### 1.5 CreateRecipePage `/recipes/new`

**Data fetch:** `api.createRecipe(data)` en submit

**Qué debe mostrar:**
- Título "Nueva receta"
- Formulario completo:
  - Nombre de la receta (input texto, placeholder "Ej: Paella valenciana")
  - Imagen: dropzone drag & drop (preview, botón remover)
  - Comensales (number, min 1) + Tiempo preparación (number, min 1) — side by side
  - Ingredientes: lista dinámica (nombre, cantidad, unidad + botón remover + botón añadir)
  - Pasos: lista dinámica (textarea, step number + botón remover + botón añadir)
  - Botones: Cancelar (navega atrás) + Guardar receta (submit)

**Validación:** todos los ingredientes deben tener nombre, todos los pasos deben tener descripción

**Estados:** idle → validation error → submitting → success (redirige a `/recipes`)

---

### 1.6 RecipeDetailPage `/recipes/:id`

**Data fetch:**
- `api.getRecipeById(id)` → `RecipeResponse`
- `api.isRecipeSaved(id)` → `{ saved: boolean }`
- `api.saveRecipe(id)` / `api.unsaveRecipe(id)` → toggle
- `api.createShoppingList({ name, items })` → genera lista de compras

**Qué debe mostrar:**
- Botón "← Volver"
- Imagen hero (opcional)
- Nombre de receta + botón bookmark (guardar/desguardar)
- Info: comensales, tiempo
- Sección "Ingredientes" (lista)
- Sección "Pasos" (lista ordenada)
- Botón "Generar lista de compras" (después de generar → "Ver lista de compras" que navega a `/shopping-lists`)

**Estados:** loading → error → not found ("Receta no encontrada") → full detail → generating (button loading) → generated (botón cambia)

---

### 1.7 ProfilePage `/profile`

**Data fetch:**
- `api.uploadAvatar(base64)` → `{ avatarUrl }`
- `api.updateProfile({ email, username })` → `UserResponse`
- `api.changePassword({ currentPassword, newPassword })` → `{ message }`

**Qué debe mostrar (tres secciones verticales):**
1. **Avatar:** foto circular (100px), click para cambiar (file input oculto), muestra preview, overlay al hover
2. **Datos personales:** email + username, botón guardar
3. **Cambiar contraseña:** contraseña actual, nueva, confirmar, botón guardar. Validación client-side de matching.

**Estados:** cada formulario maneja su propio: idle → saving → success (banner verde) → error (banner rojo)

---

### 1.8 RandomDinnerPage `/random-dinner`

**Data fetch:**
- `api.getRecipes()` → nombres para máquina tragamonedas
- `api.getRecipeById(winner.id)` → detalle completo del ganador

**Qué debe mostrar:**
- **Estado vacío (sin recetas):** emoji + "No tienes recetas aún" + botón "Crear primera receta"
- **Estado normal:**
  - "Ventana" tipo slot machine con nombres girando (animación de shake/scroll)
  - Botón "¿Qué cenamos hoy?" grande y llamativo (deshabilitado mientras gira)
  - Al detenerse: animación de confeti + tarjeta del resultado (imagen, nombre, info, ingredientes, pasos)
  - Botones: "Otra vez" (repetir) + "Ver todas" (navega a `/recipes`)

**Animaciones:**
- Slot spinning: cambio rápido de texto con efecto shake
- Botón spin: glow pulsante mientras inactivo
- Resultado: scale + fade (0.5s, cubic-bezier(0.34, 1.56, 0.64, 1))
- Confeti: 60 partículas, colores aleatorios, caen desde arriba, 3s duración

**Estados:** loading recipes → empty → spinning → fetching winner details → result visible (con confeti)

---

### 1.9 FridgePage `/fridge` ("Mi heladera")

**Data fetch:** `api.findRecipesByIngredients({ ingredients, allowExtra })` → `RecipeMatch[]`

**Qué debe mostrar:**
- Título "¿Qué cocino hoy?" + subtítulo explicativo
- Input de ingredientes: tags (indigo pills con X), input + "Añadir"
- Checkbox: "Permitir recetas con ingredientes que no tengo"
- Botón "Buscar recetas" + "Limpiar" (aparece tras primera búsqueda)
- Resultados: tarjetas de match con:
  - Nombre + porcentaje de match (círculo verde/amarillo/rojo)
  - Info: comensales, tiempo
  - Contador: "{matchCount}/{totalCount} ingredientes"
  - Si faltan ingredientes: "⚠️ Falta: ..." (warning)
  - Si tiene todo: "✅ Tienes todos los ingredientes" (éxito)
  - Click → navega a `/recipes/:id`

**Estados:** idle → validation error ("Añade al menos un ingrediente") → loading ("Buscando recetas...") → empty results → results list

---

### 1.10 SavedRecipesPage `/saved`

**Data fetch:** `api.getSavedRecipes()` → `SavedRecipe[]` / `api.unsaveRecipe(recipeId)`

**Qué debe mostrar:**
- Título "🔖 Guardados" + subtítulo "Recetas que guardaste para ver más tarde"
- Grid de tarjetas (imagen, nombre truncado, info, conteos)
- Hover: botón ✕ para quitar de guardados (esquina superior derecha)
- Click en tarjeta → navega a `/recipes/:id`
- Estado vacío: "Aún no tienes recetas guardadas" + hint

**Estados:** loading → empty → grid

---

### 1.11 GroupsPage `/groups`

**Data fetch:** `api.getGroups()`, `api.createGroup(name)`, `api.joinGroup(inviteCode)`

**Qué debe mostrar:**
- Header: título + botones "Unirse" + "Crear grupo"
- **Modal crear:** overlay + card con input "Nombre del grupo" + Cancelar/Crear
- **Modal unirse:** overlay + card con input "Código de invitación" + Cancelar/Unirse
- Lista de grupos: cada card muestra nombre, miembros, código (monospace)
- Click en grupo → navega a `/groups/:id`
- Estado vacío: emoji + "Crea un grupo familiar o únete a uno existente"

**Estados:** loading → empty → list → modal create/join open → submitting

---

### 1.12 GroupPage (Chat) `/groups/:id`

**Data fetch:**
- `api.getGroup(id)` → info del grupo
- `api.getMessages(groupId)` → `GroupMessage[]`
- `api.sendMessage(groupId, { message?, recipeId? })` → envía mensaje
- `api.castVote(messageId, vote)` → vota
- `api.closeVote(messageId)` → cierra votación

**Qué debe mostrar:**
- Header con info del grupo + botón ←
- Chat scrollable con burbujas:
  - Mensajes propios → alineados derecha (fondo indigo claro)
  - Mensajes de otros → alineados izquierda (fondo blanco)
  - Cada burbuja: username, timestamp, texto
  - Propuestas (con receta): borde indigo izquierdo
    - Si está en votación: botones 👍/👎/🤷 con conteos (cambian de color al votar) + "Cerrar votación"
    - Si fue aceptada: badge "✅ Aceptada"
- Input inferior: botón 🥘 (abre selector de recetas) + input texto + botón enviar

**Estados:** loading → not found → empty chat → chat con mensajes → recipe picker open → sending

---

### 1.13 ShoppingListsPage `/shopping-lists`

**Data fetch:** `api.getShoppingLists()`, `api.createShoppingList({ name, items })`, `api.deleteShoppingList(id)`

**Qué debe mostrar:**
- Header: título + "+ Nueva lista"
- **Modal crear:** nombre de lista + Cancelar/Crear
- Lista de listas: nombre, progreso "{checked}/{total} items", grupo (opcional), botón eliminar ✕
- Click → navega a `/shopping-lists/:id`
- Estado vacío: emoji + "Crea listas para tus compras o genera una desde una receta"

**Estados:** loading → empty → list → modal create → deleting (confirm dialog)

---

### 1.14 ShoppingListDetail `/shopping-lists/:id`

**Data fetch:** `api.getShoppingList(id)` → `ShoppingListDetail`, `api.toggleShoppingItem(itemId, checked)`

**Qué debe mostrar:**
- Header: ← + nombre + meta (grupo, progreso)
- Barra de progreso verde
- Lista de items con checkbox:
  - Checkbox (indigo)
  - Nombre (tachado si checked)
  - Cantidad/unidad (opcional)
  - Checkmark verde (aparece si checked)
  - Items checked: opacidad reducida, fondo gris claro
- Estado vacío: emoji + "No hay items en esta lista"

**Estados:** loading → error → not found → empty → item list

---

## 2. COMPONENTES REUTILIZABLES

### 2.1 Button
- **Props:** `variant?: 'primary' | 'secondary' | 'ghost'`, `isLoading?: boolean`
- **Estados:** normal, hover, active, disabled, loading
- **Loading:** muestra spinner o texto sustituto, botón deshabilitado

### 2.2 Input
- **Props:** `label: string`, `error?: string`, más props nativos de input
- **Estados:** normal, focus (borde indigo + glow), error (borde rojo + texto error abajo)

### 2.3 Layout Components

#### AuthLayout (wrapper auth, NO confundir con layout general)
- **Props:** `title: string`, `subtitle: string`, `children`
- **Renders:** Contenedor centrado vertical/horizontal, card blanca (max-width 420px), título + subtítulo + children

#### AuthLayout (layout general, con sidebar)
- Sidebar izquierdo (desktop) → bottom navbar (mobile <768px)
- Header superior con marca + avatar de usuario
- `<main>` con `<Outlet />`

#### Sidebar
- Logo "Sasona"
- Nav links: Dashboard, Guardados, Mi heladera, Listas de compra, Mis grupos
- Footer: avatar + username → navega a `/profile`, botón logout (rojo)
- **Mobile (<768px):** fixed bottom, iconos + texto mini, oculta logo y footer

### 2.4 Profile Components

#### AvatarUpload
- Props: `currentUrl: string | null`, `onUpload: (base64) => Promise<void>`
- 100px circular, click → file picker, hover overlay, preview inmediato

#### ProfileForm
- Email + username inputs, botón guardar
- Estados: idle → saving → success (banner verde) → error (banner rojo)

#### ChangePasswordForm
- Current password + new password + confirm + botón
- Validación client-side de matching

### 2.5 Recipe Components

#### RecipeCard
- Props: `recipe: RecipeListItem`
- Imagen (160px, o placeholder 🍽️), nombre truncado, comensales, tiempo, conteos
- Click → navega a `/recipes/:id`
- Hover: levanta 2px + shadow

#### RecipeForm
- Formulario completo de creación con todos los sub-componentes

#### ImageUpload
- Dropzone drag & drop, preview, botón remover

#### IngredientInput
- Lista dinámica: filas de (nombre, cantidad, unidad, ✕) + botón "+ Añadir"

#### StepInput
- Lista dinámica: filas de (número, textarea, ✕) + botón "+ Añadir paso"

### 2.6 Fridge Components

#### FridgeInput
- Props: `ingredients: string[]`, `onChange: (ingredients) => void`
- Tags indigo con ✕ + input + "Añadir"
- Enter o click para añadir

#### RecipeMatchCard
- Props: `match: RecipeMatch`
- Imagen, nombre, % match (círculo color), info, conteo, missing/all set
- Click → `/recipes/:id`

---

## 3. DATA TYPES (TypeScript)

```typescript
UserResponse { id, email, username, avatarUrl, createdAt }
AuthResponse { user: UserResponse, token }
Ingredient { name, quantity, unit }
Step { description }
RecipeResponse { id, userId, name, imageUrl, servings, prepTime, ingredients[], steps[], createdAt, updatedAt }
RecipeListItem { id, name, imageUrl, servings, prepTime, ingredientCount, stepCount, createdAt }
RecipeMatch { id, name, imageUrl, servings, prepTime, matchCount, totalCount, matchPercentage, missingIngredients[] }
FamilyGroup { id, name, inviteCode, createdBy, memberCount, createdAt }
FamilyMember { id, userId, username, avatarUrl, role }
GroupMessage { id, groupId, userId, username, avatarUrl, recipeId, recipeName, message, status, votes: {si, no, tal_vez}, userVote, createdAt }
ShoppingList { id, groupId, userId, name, groupName, itemCount, checkedCount, createdAt, updatedAt }
ShoppingListItem { id, listId, name, quantity, unit, checked, orderIndex }
ShoppingListDetail { id, groupId, userId, name, groupName, items[], createdAt, updatedAt }
SavedRecipe { id, recipeId, name, imageUrl, servings, prepTime, ingredientCount, stepCount, savedAt }
```

---

## 4. API SURFACE (todos los endpoints que la UI debe consumir)

```
POST /auth/register       → AuthResponse
POST /auth/login          → AuthResponse
GET  /auth/me             → UserResponse
PUT  /auth/profile        → UserResponse
PUT  /auth/password       → { message }
POST /auth/avatar         → { avatarUrl }

GET  /recipes             → RecipeListItem[]
GET  /recipes/random      → RecipeResponse
GET  /recipes/:id         → RecipeResponse
POST /recipes             → RecipeResponse
POST /recipes/find-by-ingredients → RecipeMatch[]
GET  /recipes/saved       → SavedRecipe[]
POST /recipes/saved       → { id, recipeId, savedAt }
DELETE /recipes/saved/:recipeId → { message }
GET  /recipes/:id/saved   → { saved: boolean }

POST /groups              → FamilyGroup
POST /groups/join         → FamilyGroup
GET  /groups              → FamilyGroup[]
GET  /groups/:id          → any (group detail)
GET  /groups/:id/messages → GroupMessage[]
POST /groups/:id/messages → GroupMessage
POST /messages/:id/vote   → { si, no, tal_vez, userVote }
POST /messages/:id/close-vote → { accepted, shoppingListId?, si, no, tal_vez }

GET  /shopping-lists      → ShoppingList[]
POST /shopping-lists      → { id, name }
GET  /shopping-lists/:id  → ShoppingListDetail
PATCH /shopping-list-items/:id → { id, checked }
DELETE /shopping-lists/:id → { message }
```

---

## 5. DIRECTRICES DE DISEÑO

### Paleta de Color (propuesta inicial, se puede cambiar)

Debe sentirse cálida, artesanal, vibrante. Inspiración: mercados locales, cocinas familiares, vegetales frescos, especias.

- **Fondo principal:** tono crema/beige cálido (no gris)
- **Acentos:** terracota, mostaza, verde oliva, naranja quemado
- **Texto:** marrón oscuro (no gris frío)
- **Tarjetas:** fondos con textura sutil, sombras orgánicas
- **Gradientes:** que evoquen especias (cúrcuma, pimentón, canela)

### Tipografía

- **Títulos:** una variable display expresiva (puede ser serif o manuscrita para contraste)
- **Cuerpo:** sans-serif legible pero con personalidad
- **Jerarquía:** tamaños generosos, espaciado amplio

### Formas y Layouts

- Nada de bordes rectos perfectos. Usar border-radius generosos (20px+), formas orgánicas
- Elementos asimétricos, superposiciones, capas
- Las tarjetas no tienen que ser rectángulos alineados a grid — pueden solaparse, tener ángulos, formas irregulares
- El layout del dashboard podría ser una composición más libre, no solo columnas

### Micro-interacciones

- Transiciones suaves y con personalidad (cubic-bezier juguetones)
- Hover states con transformaciones sutiles (scale, rotate, lift)
- Botones con micro-ondas o ripple
- Checkboxes animados
- Skeleton loaders con shimmer
- Toast notifications para success/error con entrada animada

### Imágenes e Ilustraciones

- Las imágenes de recetas deben mostrarse con bordes redondeados generosos, quizás con sombras superpuestas
- Ilustraciones custom para estados vacíos (nada de emojis genéricos)
- Iconografía coherente con el estilo general

### Estados y Feedback

Cada pantalla debe manejar visualmente:
- **Loading:** skeleton screens o spinners con personalidad (nada de spinners genéricos)
- **Empty:** ilustraciones + copy creativo
- **Error:** banners con diseño consistente, con posibilidad de reintentar
- **Success:** feedback visual positivo (checkmark animado, toast, transición)

---

## 6. TONO Y COPY

El texto en la app debe ser:
- Cálido y conversacional (tutear al usuario)
- Con chispa de humor y personalidad
- Nada de textos genéricos tipo "Error del servidor" — mejor "¡Ups! Algo salió mal en la cocina... intenta de nuevo"
- Estados vacíos: "Tu heladera está vacía... ¡agrega ingredientes!", "Aún no guardaste recetas, ¡cuando encuentres una que te encante, guardala!"
- Los nombres de las páginas pueden ser más creativos: "Mi despensa" en vez de "FridgePage"

---

## 7. RESTRICCIONES TÉCNICAS

- **Stack:** React + TypeScript + CSS Modules
- **Routing:** React Router DOM (BrowserRouter)
- **No** usar librerías de componentes externas (ni shadcn, ni MUI, ni Chakra)
- **No** usar librerías de animación externas (solo CSS keyframes + transiciones)
- **No** cambiar el backend ni los tipos compartidos — solo la capa visual
- Los componentes deben seguir recibiendo las mismas props y devolver los mismos datos
- Los nombres de archivo y exportaciones deben mantenerse iguales
- Las rutas y navegación deben mantenerse idénticas

---

## 8. ENTREGABLES ESPERADOS

Para cada pantalla y componente listado arriba, se debe producir:
1. El archivo `.tsx` con la lógica y markup
2. El archivo `.module.css` con todos los estilos
3. Los estilos deben manejar **todos los estados** (loading, empty, error, success, hover, active, focus, disabled)
4. Diseño responsive: mobile-first, breakpoint en 768px

El resultado final debe ser que la app se vea y sienta completamente transformada — como un producto nuevo — pero con la misma funcionalidad y datos.
