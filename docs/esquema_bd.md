# Esquema de Base de Datos Documental (MongoDB)

A continuación se detalla la estructura de las colecciones principales para el sistema "Buscapromo". Al utilizar MongoDB, los datos se estructuran en documentos JSON.

### Colección: `supermercados`
Almacena la información principal de las cadenas. Las sucursales se encuentran anidadas como un *array* para optimizar las consultas geolocalizadas.

```json
{
  "_id": "64b9a1f2e4b0d3c1a2b3c4d5",
  "nombre_fantasia": "Marfour",
  "razon_social": "Marfour S.A.",
  "logo_url": "[https://midominio.com/logos/marfour.png](https://midominio.com/logos/marfour.png)",
  "sucursales": [
    {
      "nombre": "Sucursal Centro",
      "direccion": "Av. General Paz 123",
      "barrio": "Centro",
      "coordenadas": {
        "lat": -31.416,
        "lng": -64.183
      }
    },
    {
      "nombre": "Sucursal Nueva Córdoba",
      "direccion": "Estrada 456",
      "barrio": "Nueva Córdoba",
      "coordenadas": {
        "lat": -31.428,
        "lng": -64.188
      }
    }
  ]
}
```

### Colección: `promociones`
Almacena las ofertas activas. Incluye la lógica de medios de pago, topes de reintegro y vigencia solicitada en el MVP.

```json
{
  "_id": "64b9a2a1e4b0d3c1a2b3c4d6",
  "supermercado_id": "64b9a1f2e4b0d3c1a2b3c4d5", 
  "titulo": "20% de descuento en almacén",
  "descripcion_corta": "Llevando 3 productos iguales",
  "tipo_descuento": "Porcentaje", 
  "porcentaje_descuento": 20,
  "medios_pago": {
    "banco": "Banco Galicia",
    "tarjeta": "Visa",
    "tipo_tarjeta": "Crédito"
  },
  "condiciones": {
    "tope_reintegro": 5000,
    "compra_minima": 15000
  },
  "vigencia": {
    "fecha_inicio": "2026-10-01T00:00:00Z",
    "fecha_fin": "2026-10-31T23:59:59Z",
    "dias_semana": ["Jueves", "Viernes"] 
  },
  "activa": true
}
```

### Colección: `usuarios`
Registra a las personas para validar beneficios.

```json
{
  "_id": "64b9a3b5e4b0d3c1a2b3c4d7",
  "nombre": "Gabriel",
  "apellido": "Roqué",
  "email": "gabriel@email.com",
  "fecha_nacimiento": "1995-05-15T00:00:00Z",
  "barrio_preferido": "Nueva Córdoba",
  "tarjetas_guardadas": [
    {
      "banco": "Banco Galicia",
      "tarjeta": "Visa",
      "tipo_tarjeta": "Crédito"
    }
  ]
}
```