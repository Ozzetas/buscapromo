// Script de inicialización de Base de Datos para Buscapromo
// Para ejecutar este script localmente, usar: mongosh <nombre_base_datos> seed.js

print("Iniciando la carga de datos (Seed) para Buscapromo...");

// 1. Limpiamos las colecciones por si ya tenían datos (para empezar de cero)
db.supermercados.drop();
db.promociones.drop();
db.usuarios.drop();

print("Colecciones limpiadas.");

// 2. Insertamos Supermercados de prueba
const marfourId = ObjectId();
const mumboId = ObjectId();

db.supermercados.insertMany([
  {
    _id: marfourId,
    nombre_fantasia: "Marfour",
    razon_social: "Marfour S.A.",
    sucursales: [
      {
        nombre: "Sucursal Centro",
        direccion: "Av. General Paz 123",
        barrio: "Centro",
        coordenadas: { lat: -31.416, lng: -64.183 }
      }
    ]
  },
  {
    _id: mumboId,
    nombre_fantasia: "Mumbo",
    razon_social: "Mumbo Retail",
    sucursales: [
      {
        nombre: "Sucursal Cerro",
        direccion: "Av. Rafael Núñez 4567",
        barrio: "Cerro de las Rosas",
        coordenadas: { lat: -31.365, lng: -64.240 }
      }
    ]
  }
]);

print("Supermercados insertados.");

// 3. Insertamos Promociones de prueba vinculadas a los supermercados
db.promociones.insertMany([
  {
    supermercado_id: marfourId, // Relacionado con Marfour
    titulo: "20% descuento en Almacén",
    tipo_descuento: "Porcentaje",
    porcentaje_descuento: 20,
    medios_pago: {
      banco: "Banco Galicia",
      tarjeta: "Visa",
      tipo_tarjeta: "Crédito"
    },
    condiciones: { tope_reintegro: 5000, compra_minima: 15000 },
    vigencia: {
      fecha_inicio: new Date("2026-10-01"),
      fecha_fin: new Date("2026-10-31"),
      dias_semana: ["Jueves", "Viernes"]
    },
    activa: true
  },
  {
    supermercado_id: mumboId, // Relacionado con Mumbo
    titulo: "3 cuotas sin interés en Electro",
    tipo_descuento: "Financiacion",
    porcentaje_descuento: 0,
    medios_pago: {
      banco: "Todos",
      tarjeta: "Mastercard",
      tipo_tarjeta: "Crédito"
    },
    condiciones: { tope_reintegro: 0, compra_minima: 50000 },
    vigencia: {
      fecha_inicio: new Date("2026-10-01"),
      fecha_fin: new Date("2026-12-31"),
      dias_semana: ["Todos"]
    },
    activa: true
  }
]);

print("Promociones insertadas.");

// 4. Insertamos un Usuario de prueba
db.usuarios.insertOne({
  nombre: "Gabriel",
  apellido: "Roqué",
  email: "gabriel@email.com",
  fecha_nacimiento: new Date("1995-05-15"),
  barrio_preferido: "Nueva Córdoba",
  tarjetas_guardadas: [
    {
      banco: "Banco Galicia",
      tarjeta: "Visa",
      tipo_tarjeta: "Crédito"
    }
  ]
});

print("Usuario de prueba insertado.");
print("¡Seed finalizado con éxito! La base de datos ya tiene estructura y datos iniciales.");