# Essence — Perfumería

Sistema de tienda online + panel de administración para el negocio de perfumes.
React + Vite + Supabase, mismo patrón que `sabor-de-lo-nuestro-pos` y `VARIEDADES-CALERO`.

## Diseño
- Paleta: crema amarillento (`#f7e6ab`) + plomo mate (`#413d35`)
- Tipografía: Cormorant Garamond (display) + Inter (texto)

## Estructura
- Tienda pública: catálogo con filtros, carrito, checkout
- Panel admin (PIN `1234` por defecto, cámbialo en `src/App.jsx`): resumen, pedidos online, catálogo

## Cómo correrlo localmente

```
npm install
npm run dev
```

## Conectar a Supabase

1. Crea un proyecto en https://supabase.com
2. Copia la URL y la anon key (Configuración → API)
3. Crea un archivo `.env.local` en la raíz con:

```
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu-anon-key
```

4. Crea las tablas `productos` y `pedidos` en Supabase (columnas básicas: `id`, `name`, `cat`, `tipo`, `size`, `price`, `icon` para productos; `name`, `phone`, `address`, `payment`, `total`, `status`, `items` para pedidos)

## Subir a GitHub

```
git init
git add .
git commit -m "Primera version de Essence Perfumeria"
git branch -M main
git remote add origin https://github.com/TU-USUARIO/essence-perfumeria.git
git push -u origin main
```

## Desplegar

Conecta el repo en Vercel (Import Project) y listo — igual que con tus otros dos sistemas.
