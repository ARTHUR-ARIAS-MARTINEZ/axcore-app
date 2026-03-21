# MANUAL MAESTRO DE OPERACIONES AX-CORE 2026
*Versión Definitiva — Actualizado 20 de Marzo 2026*

---

## 1. VISIONADO GENERAL DEL ECOSISTEMA

El modelo de negocio de AX-CORE opera en 3 esferas separadas para mantener control absoluto, pagos seguros y evitar fugas. La infraestructura se alimenta de una **Base de Datos en la Nube (npoint.io)** gratuita y persistente, sincronizada con el servidor en Render, garantizando que los códigos y gimnasios se guarden para siempre sin pérdida de datos.

**Capacidad actual:** Hasta 20 gimnasios × 200 clientes cada uno = 4,000 códigos activos simultáneos.

---

## 2. LA CADENA DE MANDO (EL FLUJO REAL DE TRABAJO)

### PASO A: EL JEFE (TÚ — ARTHUR)
- **URL:** `https://arthur-arias-martinez.github.io/axcore-app/admin.html`
- **Contraseña:** `ARTHUR2026`
- **Lo que haces:**
  1. Entras con tu contraseña secreta
  2. Primero creas un "Bloque" (le pones el nombre que quieras y pegas una clave API)
  3. Luego creas un "Gimnasio" dentro de ese bloque
  4. Eliges el plan: Básico (50 usuarios, $1,500/mes), Estándar (100, $2,000/mes) o Premium (200, $3,000/mes)
  5. El sistema te genera un código de franquicia, por ejemplo: `AXB-X9K1`
  6. **ESE CÓDIGO ES LO QUE TÚ VENDES.** Se lo entregas al dueño del gimnasio junto con la contraseña `1234`

### PASO B: EL COACH / DUEÑO DEL GIMNASIO
- **URL:** `https://arthur-arias-martinez.github.io/axcore-app/coach.html`
- **Lo que hace:**
  1. Entra con el código que tú le vendiste (`AXB-X9K1`) y contraseña `1234`
  2. Ve en pantalla su límite de cuentas (ej: 0 / 50)
  3. Cuando un cliente le paga, presiona "+ GENERAR PASE NUEVO" y le pone el nombre del cliente
  4. El sistema genera un pase único: `AX-L34D`
  5. El Coach le da ese código al cliente
  6. **Si el cliente no paga**, el Coach le da click a "CORTAR ACCESO" y la app del cliente se bloquea al instante

### PASO C: EL ATLETA (USUARIO FINAL)
- **URL:** `https://arthur-arias-martinez.github.io/axcore-app/`
- **Lo que hace:**
  1. Abre la app, presiona "Regístrate aquí"
  2. Crea un usuario y contraseña
  3. Pega el código que le dio el Coach (`AX-L34D`)
  4. El sistema valida el código con la nube → si es válido, le da acceso a toda la app
  5. Si el Coach le cortó el acceso, la app le muestra "ACCESO DENEGADO"

### CONTROL DE TU PARTE (JEFE)
- Si un gimnasio no te paga, desde tu Panel Maestro le das "PAUSAR" → instantáneamente se bloquea TODO su gimnasio (el Coach ya no puede generar códigos y todos sus atletas pierden acceso)
- Cuando pague, le das "ACTIVAR" y todo vuelve a funcionar

---

## 3. ARQUITECTURA TÉCNICA (POR QUÉ FUNCIONA)

| Componente | Servicio | Costo | Para qué sirve |
|---|---|---|---|
| **Las 3 pantallas** (admin, coach, app) | GitHub Pages | GRATIS | Muestra las interfaces visuales |
| **El servidor** (procesa códigos) | Render | GRATIS | Ejecuta la lógica de crear/validar códigos |
| **La base de datos** (guarda todo) | npoint.io | GRATIS | Almacena gimnasios y códigos en la nube |

**¿Cómo se conectan?**
1. Tú abres `admin.html` → creas un gimnasio → el frontend le habla al servidor en Render → Render guarda el gimnasio en npoint.io
2. El Coach abre `coach.html` → genera un código → Render lo guarda en npoint.io
3. El Atleta abre la app → pega su código → la app le pregunta a Render → Render busca en npoint.io → si existe y está activo, le da acceso

**Los datos NUNCA se pierden.** Aunque Render se reinicie (cosa que pasa cada ~15 min en plan gratis), al arrancar de nuevo, carga toda la información desde npoint.io automáticamente.

---

## 4. CÓDIGOS ESPECIALES (PARA PRUEBAS)

Estos códigos funcionan sin necesidad de que alguien los genere:

| Código | Para qué sirve |
|---|---|
| `GYM-MASTER` | Acceso total como superusuario en Coach (contraseña: 1234) |
| `AXV-DEMO` | Acceso directo a la app del atleta sin validación |
| `AXV-ADMIN` | Acceso directo a la app del atleta sin validación |

---

## 5. PLANES DE PRECIOS (TU GANANCIA)

| Plan | Límite de Clientes | Cobro Mensual al Gimnasio | Código Generado |
|---|---|---|---|
| Básico | 50 | $1,500 MXN | Empieza con `AXB-` |
| Estándar | 100 | $2,000 MXN | Empieza con `AXE-` |
| Premium | 200 | $3,000 MXN | Empieza con `AXP-` |

Con 20 gimnasios en plan básico = $30,000 MXN/mes de ingreso recurrente.

---

## 6. PARA ACTUALIZAR EL CÓDIGO

Si se hacen cambios al código, solo se necesita desde la computadora:
```
git add .
git commit -m "descripcion del cambio"
git push
```
GitHub Pages se actualiza en ~1 minuto. Render detecta el cambio y se actualiza en ~3-5 minutos.

---

## 7. CONTACTO TÉCNICO

- **Repositorio:** `https://github.com/ARTHUR-ARIAS-MARTINEZ/axcore-app`
- **Backend Render:** `https://axcore-appax-core-backend.onrender.com/health`
- **Base de Datos Nube:** `https://api.npoint.io/3540867fff5ccdedc4d6` (solo lectura debug)

### ¡Opera y domina el mercado! 💪
