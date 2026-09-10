# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Comandos

```bash
npm install          # instalar dependencias (no hay node_modules ni lockfile en el repo)
npm run dev          # servidor de desarrollo (Next.js, http://localhost:3000)
npm run build        # build de producción
npm start            # servir el build
```

No hay linter, ni tests, ni CI configurados.

### Variables de entorno

El cliente Supabase (`lib/supabase.js`) las necesita para arrancar. Crear `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

Ambas son `NEXT_PUBLIC_*` (van al bundle del navegador). No hay service-role key ni secretos de servidor.

### Deploy

Vercel. `vercel.json` define un cron diario (13:00 UTC) que pega a `/api/keepalive` para que Supabase no pause la base por inactividad — ese endpoint solo hace un `count` sobre `productos`.

## Arquitectura

Next.js 15 (App Router) + React 19. **Toda la aplicación es una única SPA client-side en `app/page.js`** (~2000 líneas). No se usan Server Components, Server Actions ni route handlers salvo `app/api/keepalive/route.js`.

- `app/layout.js` — shell HTML, metadata, PWA manifest.
- `app/page.js` — `'use client'`. Contiene el router de vistas, todos los módulos, todos los modales y los tokens de estilo. Un solo archivo intencionalmente.
- `lib/supabase.js` — instancia única de `@supabase/supabase-js`.
- `public/manifest.json` — PWA (`display: standalone`).

### Acceso a datos

Todas las lecturas y escrituras son llamadas `supabase.from(...)` / `supabase.rpc(...)` **directas desde el navegador** con la anon key. No hay capa de API propia. La seguridad real depende de las políticas RLS y funciones RPC definidas en Supabase, que **no están versionadas en este repo** (no hay carpeta de migraciones). Si cambia el esquema, hay que reflejarlo a mano allá.

### Autenticación (propia, no Supabase Auth)

Flujo en el componente `Login`, vía RPCs: `login_usuario`, `set_password_usuario`, `resetear_password_usuario`.

- Solo correos `@chillersystem.com`.
- El auto-registro está bloqueado: los usuarios se crean desde el panel **Usuarios** (`GestionUsuarios`). La primera vez que entran, definen su propia contraseña.
- La sesión se guarda en `localStorage` (`cs_user`); el último mail en `cs_last_mail`.
- El objeto de sesión es `{ mail, nombre, rol, accesoTotal }`.

### Roles y permisos

Roles: `dueno` (Gerente), `supervisor`, `tecnico`, `deposito`. Etiquetas en `ROL_LABEL`.

- `accesoTotal(usuario)` — true si `rol === 'dueno'` **o** el flag `usuarios.acceso_total` está activo. Se togglea desde el panel Usuarios y vive en la base, no en el código.
- `BASES` (constante en `page.js`) — lista fija de bases/inventarios, cada una con un array de mails permitidos. `basesPermitidas(usuario)` filtra por eso; acceso total ve todas.
- Los permisos de cada vista se chequean inline en el render switch de `Home` y en el array `items` del `Sidebar` (campo `roles`). **Para agregar un módulo al menú:** editar el array `items` en `Sidebar`, agregar el caso en el switch de `Home`, y setear los roles.

### Tablas de Supabase en uso

`productos`, `garrafas`, `cobre`, `movimientos_cobre`, `pedidos`, `pedido_items`, `contador_pedidos` (fila `id=1`, numeración correlativa de pedidos), `vehiculos`, `usos_vehiculo`, `novedades_vehiculo`, `reparaciones`, `inventario_bases` (columna `base` = id de `BASES`), `usuarios`, `usuarios_public` (vista sin el hash de contraseña — usarla para lecturas).

### Módulos principales (todos en `page.js`)

- **Dashboard** — agregados de productos/garrafas/cobre/pedidos.
- **Stock** — catálogo `productos`, depósitos `Caseros` y `Mataderos`. Depósito da ingresos/edita/borra; supervisor y técnico agregan al carrito o piden productos que no existen.
- **Refrigerantes** — trazabilidad individual de garrafas. Ciclo de estado: `disponible` → `afuera` → `vacia` → `disponible`. Solo `deposito` registra movimientos.
- **Cobre** — metros de cañería + `movimientos_cobre`.
- **Vehiculos** — flota: tomar/devolver (`usos_vehiculo`), novedades, reparaciones, historial.
- **Carrito ("Mi Pedido")** — `carritoStore`, store global en memoria (no persiste). Ítems con `esNuevo` son productos a comprar que no están en catálogo.
- **Pedidos** — máquina de estados: `pendiente` → `aprobado` (supervisor/dueno) → depósito revisa disponibilidad ítem por ítem → se abre WhatsApp al solicitante → el solicitante confirma en la app → `entregado` (descuenta stock de `productos`). Estados alternativos: `rechazado`, `anulado` (con motivo). Los ítems `es_nuevo` se materializan como `productos` con `cantidad: 0`.
- **BaseInventario** — inventario por base (`inventario_bases`), con importación desde Excel (`xlsx`, import dinámico) y mapeo flexible de columnas.
- **GestionUsuarios** — alta/baja, cambio de rol, toggle de acceso total, teléfono para WhatsApp, reset de contraseña.

### WhatsApp

No hay integración de API. Se construye un texto y se abre `https://wa.me/<telefono>?text=...` con `window.open`. El teléfono sale de `usuarios.telefono` (formato: código de país + número, sin símbolos), cargado desde el panel Usuarios.

### Estilos

Estilos inline con objetos JS. Tokens compartidos como constantes al final de `page.js` (`btnPri`, `btnSec`, `btnMini`, `inp`, `th`, `td`, `qtyBtn`, ...) y colores como constantes arriba (`AZUL`, `AZUL_PROF`, `TINTA`, `CIELO`). `globals.css` carga las fuentes (Sora para títulos, Outfit para texto) y las directivas de Tailwind, aunque casi no se usan clases de Tailwind. Único paquete de UI: `lucide-react` (iconos).

## Convenciones

- Todo en español: identificadores, textos de UI y mensajes de commit.
- Detección de móvil: hook `useEsMovil()` (breakpoint 820px); el sidebar pasa a drawer deslizable.
- Después de cada mutación se vuelve a llamar `cargar()` para refrescar; no hay caché ni estado optimista.

## Cómo trabajamos con David

- David NO es programador. Explicaciones simples, sin jerga técnica.
- Los cambios de base de datos van en archivos SQL separados y numerados. David los corre él mismo en el SQL Editor de Supabase.
- Gotcha de Postgres ya aprendido: `CREATE OR REPLACE VIEW` no permite insertar columnas en el medio (solo al final), y `CREATE OR REPLACE FUNCTION` no permite cambiar el `RETURNS TABLE`. Si aparece error 42P16 o 42P13, hay que hacer `DROP` + `CREATE` de cero.
- Si hay SQL y código juntos, el orden siempre es: SQL primero, código después.
- David trabaja desde 2 PCs (casa y trabajo), ambas con el repo clonado por separado. Antes de empezar, conviene hacer `git pull`.
- Al terminar un cambio, indicar siempre cómo probarlo en la app real (chiller-stock.vercel.app).
- Compilar (`npm run build`) antes de dar un cambio por terminado.
