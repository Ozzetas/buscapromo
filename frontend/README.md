# Buscapromo — Frontend Web

Interfaz de usuario SPA (*Single Page Application*) para la plataforma geolocalizada de promociones **Buscapromo**, desarrollada como parte del Trabajo Final de la Tecnicatura Universitaria en Programación (UTN).

## Stack Técnico del Cliente
- **Framework:** React 18 + TypeScript
- **Bundler y Entorno de Desarrollo:** Vite
- **Estilos:** Tailwind CSS (Diseño *Responsive Mobile-First*)
- **Cliente HTTP:** Axios con interceptores de solicitud/respuesta para gestión automática de tokens JWT (`Bearer`).

---

## Estructura de Directorios (`src/`)

```text
src/
├── api/
│   ├── client.ts             # Instancia Axios e interceptores JWT (Authorization y manejo 401)
│   ├── authService.ts        # Consumo de /auth/login, /auth/register y /auth/me
│   ├── supermarketService.ts # Consumo de /supermarkets/ y /supermarkets/nearby
│   ├── promotionService.ts   # Consumo de /promotions/search, alta y baja lógica
│   └── index.ts              # Exportación centralizada de servicios
├── components/
│   ├── Navbar.tsx            # Barra de navegación adaptativa según rol (RBAC)
│   ├── PromotionCard.tsx     # Tarjeta de oferta con distancia Haversine y días vigentes
│   ├── PromotionExplorer.tsx # Vista pública principal con GPS, selector de radio y día
│   ├── AdminBackoffice.tsx   # Panel exclusivo para rol 'admin' (ABMC de sucursales y ofertas)
│   └── AuthModal.tsx         # Modal de Login/Registro con cuentas semilla preconfiguradas
├── context/
│   └── AuthContext.tsx       # Estado global de sesión, hidratación JWT y validación de rol
├── types/
│   └── index.ts              # Contratos e interfaces TypeScript espejando DTOs de Pydantic v2
├── utils/
│   └── constants.ts          # Radios permitidos, mapeo de días (0=Lunes..6=Domingo) y zonas de Córdoba
├── App.tsx                   # Enrutador de vistas y composición principal
└── main.tsx                  # Punto de montaje de React
```

---

## Instalación y Uso

1. Instalar dependencias:

```bash
npm install
```

2. Configurar variable de entorno en `.env` (en la raíz de `frontend/`):

```env
VITE_API_URL=http://localhost:8000/api/v1
```

3. Levantar el servidor de desarrollo:

```bash
npm run dev
```

4. Verificar tipado estricto de TypeScript sin emitir archivos:

```bash
npx tsc --noEmit
```

5. Generar compilación optimizada para producción:

```bash
npm run build
```