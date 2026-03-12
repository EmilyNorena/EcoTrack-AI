# EcoTrack AI (React + Tailwind)

App web simple para que pequeñas empresas describan sus actividades diarias en lenguaje natural y obtengan un **estimado básico** de huella de carbono (kg CO₂e).

## Requisitos

- Node.js + npm

## Ejecutar en local

```bash
npm install
npm run dev
```

Luego abre la URL que te muestre la terminal.

## ¿Qué entiende el estimador?

Por ahora detecta algunas unidades comunes dentro del texto:

- Electricidad: `kWh`
- Combustible: `L` (si no se especifica, asume diésel)
- Gas natural: `m³`
- Transporte: `vans` (y si aparece `km`/`miles`, lo usa como distancia total)

Los factores de emisión y supuestos están en `src/lib/footprint.ts` y se muestran en la UI como “Supuestos usados”.

## Nota

Esto es un prototipo educativo: para reportes formales, usa factores locales y una metodología como GHG Protocol.
