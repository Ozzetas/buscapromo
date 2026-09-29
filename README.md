# Buscapromo

Aplicación web para centralizar y comparar ofertas de supermercados según la ubicación del usuario y el día de la semana. Proyecto final para la Tecnicatura en Programación.

## Integrantes
* Roqué, Gabriel Osvaldo
* Airalde, Milagros Abril


## Stack Tecnológico
* **Frontend:** HTML, CSS y JavaScript/TypeScript.
* **Backend:** Python (FastAPI o Flask).
* **Base de Datos:** MongoDB Atlas.
* **Despliegue:** Google Cloud Platform (GCP).

## Funcionalidades Principales (MVP)
* **Búsqueda y filtrado:** Los usuarios pueden filtrar promociones por día de la semana, supermercado (ej. Cordiez, Disco, ChangoMâs), banco o tarjeta.
* **Geolocalización básica:** Visualización de las ofertas disponibles según la zona o barrio (ej. Nueva Córdoba, Centro).
* **Visualización de detalles:** Tarjetas de información con los topes de reintegro, vigencia y condiciones de la promoción.
* **Carga de promociones (Admin):** Interfaz o endpoints básicos para dar de alta, modificar o dar de baja promociones de forma manual.

* ## 1. Arquitectura y Estructura del Repositorio

El proyecto se desarrolla dentro de un único repositorio de GitHub para mantenerlo centralizado. La estructura de carpetas es la siguiente:

* **`/frontend`**: Contiene el código fuente de la interfaz web con la que interactuará el usuario[cite: 1].
* **`/backend`**: Contiene el código fuente con la lógica de negocio y las conexiones al servidor[cite: 1].
* **`/database`**: Alojamiento de los esquemas, migraciones o scripts correspondientes a nuestra base de datos documental[cite: 1].
* **`/docs`**: Carpeta destinada a guardar toda la documentación, informes, esquemas de avances y entregas del proyecto[cite: 1].
* **`README.md`**: Documento principal con la documentación del proyecto, instrucciones de instalación, stack tecnológico e integrantes del equipo[cite: 1].

* ## 2. Listado de Módulos

El sistema se divide en los siguientes módulos para organizar sus funcionalidades:

* **Gestión de Supermercados**: Se ocupa de administrar la información de las distintas cadenas, utilizando nombres de fantasía como "Marfour" o "Mumbo" para evitar problemas de permisos[cite: 2].
* **Gestión de Promociones**: Se encarga de registrar y administrar las ofertas vigentes, como promociones 2x1, 3x2, y descuentos exclusivos[cite: 2].
* **Búsqueda y Comparación**: Permite a los usuarios consultar qué oferta está disponible hoy y cuál es el supermercado indicado para aprovecharla[cite: 2].
* **Gestión de Usuarios**: Se ocupa de la administración de perfiles, un módulo necesario para poder identificar a la persona y validarle beneficios personalizados, como las ofertas por su cumpleaños[cite: 2].

* ## 3. Diagrama de Entidades (Base de Datos Documental)

Dado que utilizamos una base de datos NoSQL, nuestro código trabaja con objetos (documentos). A continuación se detalla cómo están relacionadas las entidades principales a través de sus referencias:

* **Entidad `Supermercado`**: Almacena los datos de la cadena de compras.
  * `_id`: (ObjectId) Identificador único del supermercado.
  * `nombre`: (String) Nombre ficticio del supermercado (ej. "Marfour")[cite: 2].
  * `sucursales`: (Array) Lista de direcciones de las sucursales.

* **Entidad `Oferta`**: Almacena las promociones.
  * `_id`: (ObjectId) Identificador único de la oferta.
  * `supermercado_id`: (ObjectId) Referencia al `_id` de la entidad `Supermercado`. **(Esta es la relación principal entre ambas entidades)**.
  * `tipo`: (String) Detalle de la promo (ej. 2x1, 3x2, cumpleaños)[cite: 2].
  * `activa`: (Boolean) Indica si la oferta está vigente en el día actual.

* **Entidad `Usuario`**: Almacena los datos de las personas registradas en la web.
  * `_id`: (ObjectId) Identificador único del usuario.
  * `nombre`: (String) Nombre del usuario.
  * `fecha_nacimiento`: (Date) Atributo clave para calcular y mostrar de forma automática las ofertas de cumpleaños[cite: 2].
