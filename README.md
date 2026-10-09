# Buscapromo

Aplicación web para centralizar y comparar ofertas de supermercados según la ubicación del usuario y el día de la semana. Proyecto final para la Tecnicatura en Programación.

## Integrantes
* Roqué, Gabriel Osvaldo
* Airalde, Milagros Abril

## Stack Tecnológico
* **Frontend:** HTML, CSS y JavaScript/TypeScript.
* **Backend:** Python con **FastAPI**.
* **Base de Datos:** MongoDB Atlas (NoSQL Documental).
* **Despliegue:** Google Cloud Platform (GCP) / Render / Vercel.

## Funcionalidades Principales (MVP)
* **Búsqueda y filtrado:** Los usuarios pueden filtrar promociones por día de la semana, supermercado (ej. Cordiez, Disco, ChangoMâs), banco o tarjeta.
* **Geolocalización básica:** Visualización de las ofertas disponibles según la zona o barrio (ej. Nueva Córdoba, Centro).
* **Visualización de detalles:** Tarjetas de información con los topes de reintegro, vigencia y condiciones de la promoción.
* **Carga de promociones (Admin):** Interfaz o endpoints básicos para dar de alta, modificar o dar de baja promociones de forma manual.

## 1. Arquitectura y Estructura del Repositorio

El proyecto se desarrolla dentro de un único repositorio de GitHub para mantenerlo centralizado. La estructura de carpetas es la siguiente:

* **`/frontend`**: Contiene el código fuente de la interfaz web con la que interactuará el usuario.
* **`/backend`**: Contiene el código fuente con la lógica de negocio y las conexiones al servidor (API RESTful con FastAPI).
* **`/database`**: Alojamiento de los esquemas, migraciones y scripts de inicialización de nuestra base de datos documental.
* **`/docs`**: Carpeta destinada a guardar toda la documentación técnica, diagramas, informes y esquemas de avances del proyecto.
* **`README.md`**: Documento principal con la documentación del proyecto, instrucciones de instalación, stack tecnológico e integrantes.

## 2. Listado de Módulos

El sistema se divide en los siguientes módulos funcionales para organizar su desarrollo:

* **Gestión de Supermercados**: Se ocupa de administrar la información de las distintas cadenas y sus sucursales (ej. nombres de fantasía, ubicaciones).
* **Gestión de Promociones (Ofertas)**: Se encarga de registrar, clasificar y administrar las ofertas vigentes, como promociones 2x1, descuentos exclusivos por banco o topes de reintegro.
* **Búsqueda y Comparación**: Es el motor principal que permite a los usuarios filtrar y consultar qué oferta está disponible hoy y cuál es el supermercado indicado para aprovecharla según sus medios de pago.
* **Gestión de Usuarios**: Se ocupa de la administración de perfiles, un módulo necesario para poder identificar a la persona y validarle beneficios personalizados.