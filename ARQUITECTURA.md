# Arquitectura y Módulos del Sistema

## 1. Desglose de Componentes (Arquitectura en Capas)
Siguiendo el principio de separación de responsabilidades, el sistema se divide en las siguientes capas:

*   **Capa de Presentación (Frontend UI):** Se encarga exclusivamente de renderizar la interfaz y capturar las interacciones del usuario. No procesa datos pesados.
*   **Capa de Lógica de Negocio (Backend API):** 
    *   *Módulo de Consultas:* Procesa los filtros (ubicación, día, tarjeta) enviados por el usuario y realiza las consultas optimizadas a la base de datos.
    *   *Módulo de Administración:* Protege y gestiona las rutas CRUD (Crear, Leer, Actualizar, Borrar) para mantener las ofertas actualizadas.
*   **Capa de Acceso a Datos:** Conexión directa y exclusiva con MongoDB Atlas.

## 2. Modelo de Datos (MongoDB)
Al ser una base de datos documental (NoSQL), estructuramos los datos buscando alta cohesión para agilizar las lecturas de las promociones. Utilizaremos principalmente dos colecciones:

**Colección: `supermercados`** (Datos de las sucursales)
```json
{
  "_id": "ObjectId",
  "nombre": "Cordiez",
  "sucursal": "Bv. Chacabuco",
  "coordenadas": {"lat": -31.425, "lng": -64.183}
}
