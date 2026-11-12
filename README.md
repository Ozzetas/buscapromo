# Buscapromo

Plataforma web geolocalizada para centralizar, filtrar y comparar promociones bancarias y comerciales de supermercados en Córdoba Capital según la ubicación del usuario y el día de la semana. Proyecto Final Integrador para la **Tecnicatura Universitaria en Programación (UTN)**.

## Integrantes
- Roqué, Gabriel Osvaldo
- Airalde, Milagros Abril

---

## Stack Tecnológico
- **Backend:** Python 3.12 + **FastAPI 0.110.0** sobre servidor ASGI **Uvicorn 0.29.0**.
- **Persistencia NoSQL:** **MongoDB Atlas** consumido de forma asíncrona mediante `motor==3.3.2` y `pymongo==4.6.2`.
- **Validación y Serialización:** **Pydantic v2** (`pydantic==2.6.4`) con adaptador personalizado `PyObjectId` para transformar identificadores BSON (`_id`) en cadenas estándar (`id`).
- **Seguridad y Autenticación:** Hashing criptográfico con `bcrypt==4.1.2` y sesiones sin estado firmadas con `PyJWT==2.8.0` (HS256) bajo esquema `HTTPBearer`.
- **Frontend:** **React 18 + TypeScript + Vite**, estilizado con **Tailwind CSS** y consumo HTTP mediante **Axios** con interceptores JWT.
- **Despliegue:** Google Cloud Platform (GCP).

---

## Funcionalidades Principales (MVP Consolidado)
- **Búsqueda Geolocalizada (Fórmula de Haversine):** Filtra sucursales según las coordenadas del usuario (`latitude`, `longitude`) dentro de un radio seleccionable (`1 km`, `1.5 km`, `3 km` o `5 km`), calculando la distancia exacta en kilómetros.
- **Filtrado Combinado Optimizado:** Cruza sucursales cercanas y promociones vigentes por día de la semana (`0` Lunes a `6` Domingo) en una sola consulta vectorial (`$in`) en MongoDB, evitando el problema de N+1 peticiones.
- **Simulador de Zonas de Córdoba:** Permite usar el GPS real del navegador o alternar entre puntos clave de Córdoba Capital (Centro, Nueva Córdoba, Barrio General Paz, Alto Verde) para evaluar el motor geoespacial desde cualquier PC.
- **Control de Acceso Basado en Roles (RBAC):**
  - **Consumidor Público:** Explora ofertas cercanas y filtra por radio y día sin fricción de registro.
  - **Usuario Registrado (`user`):** Gestión de cuenta y sesión autenticada con JWT (`/api/v1/auth/me`).
  - **Administrador (`admin`):** Acceso exclusivo al **Panel Backoffice** para registrar sucursales, publicar promociones y ejecutar bajas lógicas (*Soft Delete*).

---

## 1. Arquitectura y Estructura del Repositorio

El proyecto implementa una arquitectura desacoplada Cliente-Servidor dentro de un repositorio centralizado:

- **`/backend`**: API RESTful construida con FastAPI bajo el **Patrón Factory** (`create_app`) y el **Patrón Repositorio**:
  - `api/`: Controladores modulares (`auth_router.py`, `supermarket_router.py`, `promotion_router.py`).
  - `core/`: Configuración de variables de entorno (`config.py`), seguridad JWT/bcrypt (`security.py`) y logging estructurado (`logger.py`).
  - `db/`: Cliente Singleton asíncrono de MongoDB Atlas con validación *Fail-Fast* (`database.py`).
  - `models/`: Adaptador `PyObjectId` para Pydantic v2 (`pyobjectid.py`).
  - `repositories/`: Capa de acceso a datos y cálculo trigonométrico de Haversine (`supermarket_repository.py`, `promotion_repository.py`, `user_repository.py`).
  - `schemas/`: DTOs de entrada y salida en Pydantic v2 (`supermarket.py`, `promotion.py`, `user.py`).
  - `seed.py`: Script idempotente de poblado inicial con sucursales reales de Córdoba, ofertas y usuarios de prueba.
- **`/frontend`**: Aplicación SPA en React + TypeScript con arquitectura modular (`api/`, `components/`, `context/`, `types/`, `utils/`).
- **`README.md`**: Documentación general, arquitectura y guía de instalación paso a paso para evaluación académica.

---

## 2. Listado de Módulos Funcionales

- **Gestión de Supermercados (`/api/v1/supermarkets`)**: Administración de cadenas comerciales, direcciones físicas en Córdoba y coordenadas geográficas (`latitude`, `longitude`).
- **Gestión de Promociones (`/api/v1/promotions`)**: Registro de descuentos porcentuales, condiciones, topes de reintegro, días de aplicación y baja lógica (`PATCH /{id}/deactivate`).
- **Motor de Búsqueda y Comparación (`/api/v1/promotions/search`)**: Endpoint agregador que filtra sucursales en el radio indicado y ordena las promociones priorizando menor distancia y mayor porcentaje de descuento.
- **Gestión de Usuarios y Seguridad (`/api/v1/auth`)**: Registro, login, emisión de tokens JWT y guardias de autorización (`get_current_user` y `require_admin_role`).

---

## 3. Guía de Instalación y Ejecución Local (Para Evaluación)

Siga estos pasos para ejecutar y probar el proyecto completo (Backend + Base de Datos + Frontend) en su computadora.

### Prerrequisitos
- **Python 3.12** (o superior)
- **Node.js 18** (o superior) y **npm**
- **Git**

---

### Paso 1: Clonar el repositorio

```bash
git clone <URL_DEL_REPOSITORIO>
cd buscapromo
```

---

### Paso 2: Configurar y ejecutar el Backend (FastAPI)

1. Ingresar al directorio `backend` y crear el entorno virtual:

```bash
cd backend
python -m venv venv
```

2. Activar el entorno virtual:
- **En Windows (PowerShell):**
  ```powershell
  .\venv\Scripts\Activate.ps1
  ```
- **En Windows (CMD):**
  ```cmd
  venv\Scripts\activate.bat
  ```
- **En Linux / macOS:**
  ```bash
  source venv/bin/activate
  ```

3. Instalar las dependencias exactas del servidor:

```bash
pip install -r requirements.txt
```

4. Crear un archivo llamado **`.env`** en la raíz de la carpeta `backend/` con las siguientes variables de conexión a MongoDB Atlas:

```env
MONGODB_URL=mongodb+srv://gabrielroque093_db_user:oY8OeqCHm82Ry4wW@cluster0.mongodb.net/?retryWrites=true&w=majority
DATABASE_NAME=buscapromo_db
JWT_SECRET_KEY=buscapromo_clave_secreta_desarrollo_utn_2026
ENVIRONMENT=development
```
*(Nota: Asegúrese de que la URI de `MONGODB_URL` coincida con el host de su clúster de MongoDB Atlas).*

5. Ejecutar el script de poblado inicial (**Seeder idempotente**) para inyectar las 5 sucursales reales de Córdoba, las 6 promociones activas y los 2 usuarios de prueba:

```bash
python seed.py
```

6. Iniciar el servidor de desarrollo de FastAPI:

```bash
uvicorn main:app --reload
```
- El backend quedará activo en: **`http://localhost:8000`**
- Documentación interactiva Swagger UI disponible en: **`http://localhost:8000/docs`**

---

### Paso 3: Configurar y ejecutar el Frontend (React + Vite)

1. Abrir una **nueva terminal** (manteniendo el backend en ejecución) e ingresar a la carpeta `frontend`:

```bash
cd frontend
```

2. Instalar las dependencias de Node.js:

```bash
npm install
```

3. Crear un archivo **`.env`** en la raíz de `frontend/` (opcional, por defecto apunta a `localhost:8000`):

```env
VITE_API_URL=http://localhost:8000/api/v1
```

4. Iniciar la aplicación web:

```bash
npm run dev
```
- Abrir en el navegador: **`http://localhost:5173`**

---

### Paso 4: Credenciales de Prueba para Evaluar Roles (RBAC)

El script `seed.py` crea automáticamente dos cuentas listas para probar desde el botón **"Iniciar Sesión"** de la interfaz web (el modal incluye botones de autocompletado rápido para ambas cuentas):

| Rol en el Sistema | Correo Electrónico | Contraseña | Permisos Habilitados |
| :--- | :--- | :--- | :--- |
| **Administrador (`admin`)** | `admin@buscapromo.com` | `AdminPassword2026!` | Exploración pública + Acceso al **Panel Backoffice** (alta de sucursales, alta de promociones y baja lógica). |
| **Consumidor (`user`)** | `cliente@buscapromo.com` | `ClientePassword2026!` | Exploración pública geolocalizada + Sesión autenticada de consumidor (sin acceso al Backoffice). |