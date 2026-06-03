# ⚽ Quiniela Mundial 2026

Aplicación web para quiniela del Mundial FIFA 2026 con actualizaciones en tiempo real, tabla de puntos automática y panel de administrador.

---

## 🗺️ Guía de instalación completa (paso a paso)

### Herramientas que necesitas (todas gratis)

| Herramienta | Para qué | Link |
|---|---|---|
| **Supabase** | Base de datos + login | supabase.com |
| **GitHub** | Guardar el código | github.com |
| **Vercel** | Publicar la página web | vercel.com |
| **Node.js** | Correr el proyecto localmente | nodejs.org |

---

## PASO 1 — Configurar Supabase (base de datos)

1. Ve a **[supabase.com](https://supabase.com)** y crea una cuenta gratuita
2. Crea un nuevo proyecto (pon un nombre como `quiniela-mundial-2026`)
3. Guarda la contraseña que te pide — la necesitarás después
4. Espera ~2 minutos a que el proyecto se inicialice

### Crear las tablas

5. En el menú lateral, ve a **SQL Editor**
6. Haz clic en **New Query**
7. Copia y pega TODO el contenido del archivo `SUPABASE_SCHEMA.sql`
8. Haz clic en **Run** (botón verde)
9. Deberías ver: `Success. No rows returned`

### Crear el usuario admin

10. En el menú lateral ve a **Authentication → Users**
11. Haz clic en **Add user → Create new user**
12. Email: `admin@quiniela.local`
13. Password: pon la contraseña que quieras (la usarás para entrar como admin)
14. Haz clic en **Create User**
15. Copia el **UUID** del usuario que acaba de aparecer (es algo como `a1b2c3d4-...`)
16. Regresa al **SQL Editor** y ejecuta este query (reemplaza el UUID):

```sql
INSERT INTO users_meta (user_id, username, is_admin, confirmed)
VALUES ('PEGA-AQUI-EL-UUID-DEL-ADMIN', 'Admin', TRUE, TRUE);
```

### Activar Realtime

17. En el menú lateral ve a **Database → Replication**
18. En la sección **Source**, activa el toggle para estas tablas:
    - `results`
    - `knockout_results`  
    - `picks`
    - `knockout_picks`
    - `bonus_challenges`

### Obtener las credenciales de la API

19. Ve a **Settings → API**
20. Copia:
    - **Project URL** (algo como `https://abcdef.supabase.co`)
    - **anon / public key** (una cadena larga)

---

## PASO 2 — Subir el código a GitHub

1. Ve a **[github.com](https://github.com)** y crea una cuenta si no tienes
2. Crea un nuevo repositorio llamado `quiniela-mundial-2026`
3. Marca como **Private** (para que sea solo tuyo)
4. **No** inicialices con README
5. En tu computadora, abre la terminal en la carpeta del proyecto y ejecuta:

```bash
git init
git add .
git commit -m "Quiniela Mundial 2026 - inicial"
git branch -M main
git remote add origin https://github.com/TU_USUARIO/quiniela-mundial-2026.git
git push -u origin main
```

> Si no tienes git instalado: descárgalo en [git-scm.com](https://git-scm.com)

---

## PASO 3 — Publicar en Vercel (URL pública)

1. Ve a **[vercel.com](https://vercel.com)** y crea una cuenta (puedes entrar con GitHub)
2. Haz clic en **Add New → Project**
3. Selecciona el repositorio `quiniela-mundial-2026`
4. En la sección **Environment Variables**, agrega:

| Name | Value |
|---|---|
| `VITE_SUPABASE_URL` | tu Project URL de Supabase |
| `VITE_SUPABASE_ANON_KEY` | tu anon key de Supabase |

5. Haz clic en **Deploy**
6. En ~1 minuto tendrás una URL pública como `https://quiniela-mundial-2026.vercel.app`

¡Esa URL es la que compartes con los 13 participantes! 🎉

---

## PASO 4 — Probar localmente (opcional)

Para correr el proyecto en tu computadora antes de publicarlo:

```bash
# 1. Instala Node.js desde nodejs.org si no lo tienes

# 2. En la carpeta del proyecto:
npm install

# 3. Crea el archivo de variables de entorno:
cp .env.example .env.local
# Edita .env.local con tus credenciales de Supabase

# 4. Corre el servidor de desarrollo:
npm run dev
# Abre http://localhost:3000
```

---

## 🔐 Cómo funciona el login

- Cualquier participante entra con **su nombre** (sin contraseña)
- La primera vez que entra, se crea su cuenta automáticamente
- Si ya tiene cuenta, entra directo a su quiniela
- El admin entra con el botón "Acceso administrador" y la contraseña que configuraste

---

## ⚙️ Cómo hacer cambios en tiempo real (como admin)

Una vez que estés adentro como admin, puedes:

| Acción | Dónde |
|---|---|
| Ingresar resultados de partidos | Admin → Resultados |
| Activar/desactivar ×2 en partidos | Admin → Partidos Dobles |
| Añadir nuevos retos bonus | Admin → Bonus Challenges |
| Resolver retos bonus (poner respuesta correcta) | Admin → Bonus Challenges → Resolver |
| Ver qué usuarios confirmaron | Admin → Usuarios |

La tabla de puntos se actualiza automáticamente en tiempo real para todos los usuarios cada vez que ingresas un resultado.

---

## 📋 Reglas de puntuación configuradas

| Situación | Puntos |
|---|---|
| Resultado exacto (ej: 2-1 vs 2-1) | **3 puntos** |
| Ganador correcto sin importar marcador | **1 punto** |
| Partidos de México, EUA o Canadá | **×2 todos los puntos** |
| Partido marcado como doble por admin | **×2 todos los puntos** |
| Reto bonus acertado (goleador / selección) | **10 puntos c/u** |

**Criterios de desempate:**
1. Mayor cantidad de resultados exactos (3 pts)
2. Mayor cantidad de goles individuales acertados correctamente

---

## 🛠️ Hacer cambios al código

Para hacer mejoras al código sin perder los datos:

1. Edita el código localmente
2. Haz `git push` a GitHub
3. Vercel detecta el cambio y re-despliega automáticamente en ~1 minuto
4. Los datos en Supabase nunca se tocan — son independientes del código

---

## 🆘 Problemas comunes

**"Error al iniciar sesión" al primer login**
→ Ve a Supabase → Authentication → Settings → activa "Enable email confirmations: OFF"

**La tabla no se actualiza en tiempo real**
→ Verifica que activaste Replication para las tablas en Supabase (Paso 1, punto 17-18)

**No puedo entrar como admin**
→ Verifica que ejecutaste el INSERT de users_meta con el UUID correcto

**Supabase dice "invalid API key"**
→ Verifica que copiaste bien el `anon key` en las variables de entorno de Vercel (no el `service_role key`)
