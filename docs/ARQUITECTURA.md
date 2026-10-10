# Arquitectura y Módulos del Sistema

## 1. Arquitectura del Proyecto (Diseño en Capas)
Siguiendo el principio de separación de responsabilidades, el sistema "Buscapromo" se divide en las siguientes capas lógicas:

* **Capa de Presentación (Frontend UI):** Se encarga exclusivamente de renderizar la interfaz web y capturar las interacciones del usuario (filtros de búsqueda, clics en promociones). No procesa datos pesados ni lógica de negocio.
* **Capa de Lógica de Negocio (Backend API):** Es el núcleo del sistema. Se encarga de recibir las peticiones del frontend, validar los datos (ej. verificar si una promoción sigue vigente hoy o si el tope de reintegro aplica), interactuar con la base de datos y devolver la información procesada.
* **Capa de Acceso a Datos (Database):** Conexión directa y exclusiva con nuestro clúster de MongoDB Atlas para la persistencia de los documentos.

## 2. Stack Tecnológico y Justificación
Se han definido las siguientes tecnologías para el desarrollo del MVP:

* **Frontend:** HTML, CSS y JavaScript/TypeScript.
* **Backend:** **FastAPI** (Python). 
  * *Justificación:* Se eligió FastAPI sobre Flask porque es un framework moderno, extremadamente rápido, y cuenta con soporte nativo para operaciones asincrónicas, lo cual es ideal para realizar múltiples consultas simultáneas a la base de datos NoSQL. Además, autogenera la documentación de la API (Swagger), agilizando el trabajo del equipo.
* **Base de Datos:** **MongoDB Atlas** (NoSQL).
  * *Justificación:* Al ser una base de datos documental, nos permite estructurar entidades complejas de forma flexible, como anidar sucursales dentro de supermercados o guardar objetos dinámicos de medios de pago, sin necesidad de esquemas rígidos (JOINs) que ralentizan las consultas geolocalizadas.
* **Despliegue:** Google Cloud Platform (GCP) / Render / Vercel.

## 3. Listado de Módulos Funcionales
El sistema se divide en los siguientes módulos, ordenados por prioridad de desarrollo para el MVP:

1. **Módulo de Búsqueda y Comparación (Prioridad Alta):**
   * *Descripción:* Motor principal del sistema. Procesa los filtros del usuario (ubicación, día de la semana, banco, tarjeta) y realiza las consultas a la base de datos para devolver las promociones que coinciden con su criterio de búsqueda y vigencia.
2. **Módulo de Gestión de Promociones (Prioridad Alta):**
   * *Descripción:* Administra el ciclo de vida de las ofertas. Permite registrar qué descuentos están activos, topes de reintegro, medios de pago asociados y vigencia (ej. "Válido solo los jueves").
3. **Módulo de Gestión de Supermercados (Prioridad Media):**
   * *Descripción:* Se ocupa de administrar la información estática de las cadenas comerciales (nombres de fantasía como "Marfour") y las coordenadas de sus sucursales físicas.
4. **Módulo de Gestión de Usuarios (Prioridad Baja/Media):**
   * *Descripción:* Administración de perfiles. Permite al usuario guardar sus tarjetas o bancos frecuentes para no tener que filtrarlos manualmente cada vez que ingresa, y registrar su fecha de nacimiento para mostrar alertas de promociones de cumpleaños.