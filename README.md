# Plataforma de Actividades y Talleres — Bogotá D.C. y SENA

Aplicación web que centraliza la oferta de actividades, talleres y programas de formación disponibles en las 20 localidades de Bogotá. Permite a los ciudadanos consultar eventos por localidad mediante un mapa interactivo, y a los funcionarios cargar cronogramas desde archivos Excel de la Secretaría de Bogotá o del Portafolio de Formación SENA.

---

## Tecnologías

| Capa | Tecnología |
|---|---|
| Frontend | React 19 + Vite + Tailwind CSS v4 |
| Backend | FastAPI + SQLAlchemy |
| Base de datos | SQLite |
| Mapa | Leaflet + React-Leaflet |
| Autenticación | JWT (python-jose) |

---

## Estructura del proyecto

```
├── backend/
│   ├── app/
│   │   ├── models/        # Modelos SQLAlchemy (Actividad, Localidad, Usuario)
│   │   ├── routers/       # Endpoints REST (auth, publico, admin)
│   │   ├── services/      # ETL para Secretaría y SENA
│   │   └── schemas/       # Esquemas Pydantic
│   ├── seed.py            # Crea tablas, carga localidades y usuario admin
│   ├── migrate_sena_cols.py  # Migración: agrega columnas SENA a BD existente
│   └── requirements.txt
└── frontend/
    ├── src/
    │   ├── components/    # HeaderInstitucional, MapaBogota, TarjetaActividad, etc.
    │   ├── pages/         # Inicio (ciudadano) y Admin (funcionario)
    │   └── services/      # api.js — cliente HTTP
    └── package.json
```

---

## Requisitos previos

- **Python** 3.10 o superior
- **Node.js** 18 o superior
- **npm** 9 o superior

---

## Instalación y ejecución

### 1. Clonar el repositorio

```bash
git clone https://github.com/JeikDeveloper/ProyectoSDIS.git
cd ProyectoSDIS
```

### 2. Configurar el Backend

```bash
cd backend
python -m venv venv
```

**Windows:**
```bash
venv\Scripts\activate
```

**Linux / macOS:**
```bash
source venv/bin/activate
```

```bash
pip install -r requirements.txt
```

Crear el archivo de variables de entorno:

```bash
# backend/.env
DATABASE_URL=sqlite:///./plataforma_bogota.db
SECRET_KEY=clave-secreta-cambiar-en-produccion
```

Inicializar la base de datos (crea tablas, localidades y usuario admin):

```bash
python seed.py
```

Iniciar el servidor:

```bash
uvicorn app.main:app --reload
```

La API queda disponible en `http://localhost:8000`. Documentación interactiva en `http://localhost:8000/docs`.

---

### 3. Configurar el Frontend

En otra terminal:

```bash
cd frontend
npm install
npm run dev
```

La aplicación queda disponible en `http://localhost:5173`.

---

## Uso

### Vista pública (`/`)

1. Selecciona una localidad en el mapa o en el desplegable.
2. Filtra por tipo de actividad o usa el buscador por palabra clave.
3. Haz clic en una tarjeta para ver el detalle completo.

### Panel administrativo (`/admin`)

Credenciales por defecto:
- **Usuario:** `admin`
- **Contraseña:** `admin123`

#### Carga Secretaría de Bogotá

Sube un archivo `.xlsx` o `.csv` con las siguientes columnas:

| Columna | Obligatoria | Descripción |
|---|---|---|
| `titulo` | Sí | Nombre de la actividad |
| `localidad` | Sí | Una de las 20 localidades de Bogotá |
| `lugar` | Sí | Dirección o nombre del lugar |
| `fecha_inicio` | Sí | Formato `DD/MM/YYYY` |
| `tipo` | Sí | `Taller`, `Evento` o `Actividad` |
| `organizador` | Sí | `Secretaría`, `SENA` u `Otro` |
| `descripcion` | No | Texto libre (máx. 1000 caracteres) |
| `fecha_fin` | No | Formato `DD/MM/YYYY` |
| `hora_inicio` | No | Formato `HH:MM` (24 h) |
| `hora_fin` | No | Formato `HH:MM` (24 h) |

#### Carga SENA

Sube el archivo **Portafolio de Formación SENA — Regional Distrito Capital** (`.xlsx`). El sistema procesa automáticamente las 4 hojas:
- Titulada Presencial
- Titulada Virtual
- Complementaria Virtual
- Complementaria Presencial

Se requiere seleccionar la **localidad** y la **fecha de inicio** antes de cargar.

En ambos casos, el sistema muestra una **vista previa de validación** con los registros a cargar y los errores encontrados antes de confirmar la inserción.

---

## Migración (BD existente)

Si ya tienes una base de datos creada y necesitas agregar las columnas SENA:

```bash
cd backend
python migrate_sena_cols.py
```

---

## Accesibilidad

La aplicación cumple con **WCAG 2.1 Nivel AA**, **NTC 5854** y la **Resolución MinTIC 1519/2020**:

- Navegación completa por teclado (incluyendo el mapa interactivo)
- Lector de pantalla compatible (ARIA roles, live regions, etiquetas descriptivas)
- Contraste de color ≥ 4.5:1 en texto y ≥ 3:1 en componentes UI
- Foco visible en todos los elementos interactivos
- Trampa de foco en modales con restauración al cerrar
- Títulos de página dinámicos por vista
- Skip link "Saltar al contenido principal"

---

## Variables de entorno

| Variable | Descripción | Ejemplo |
|---|---|---|
| `DATABASE_URL` | URL de conexión SQLAlchemy | `sqlite:///./plataforma_bogota.db` |
| `SECRET_KEY` | Clave para firmar tokens JWT | Cadena aleatoria segura |
| `ALGORITHM` | Algoritmo JWT (opcional) | `HS256` (por defecto) |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Duración del token (opcional) | `60` (por defecto) |
