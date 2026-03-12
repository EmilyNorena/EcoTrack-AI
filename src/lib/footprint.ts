export type FootprintLineItem = {
  label: string
  activity: string
  emissionsKgCO2e: number
  assumptions?: string[]
}

export type FootprintEstimate = {
  totalKgCO2e: number
  items: FootprintLineItem[]
  notes: string[]
}

function toNumber(raw: string): number {
  const cleaned = raw.replaceAll(',', '.')
  const n = Number.parseFloat(cleaned)
  return Number.isFinite(n) ? n : 0
}

function round(n: number, digits = 2): number {
  const p = 10 ** digits
  return Math.round(n * p) / p
}

function sum(items: FootprintLineItem[]): number {
  return items.reduce((acc, it) => acc + (Number.isFinite(it.emissionsKgCO2e) ? it.emissionsKgCO2e : 0), 0)
}

export function estimateFootprint(text: string): FootprintEstimate {
  const t = text.toLowerCase()

  const items: FootprintLineItem[] = []
  const notes: string[] = []

  // Electricity (kWh) — rough world average grid factor
  {
    const kwhMatch = t.match(/(\d+(?:[.,]\d+)?)\s*(kwh|kw\s*h|kilowatt[-\s]?hours?)/i)
    if (kwhMatch) {
      const kwh = toNumber(kwhMatch[1])
      const factorKgPerKwh = 0.4
      items.push({
        label: 'Electricidad',
        activity: `${round(kwh)} kWh`,
        emissionsKgCO2e: kwh * factorKgPerKwh,
        assumptions: [`Factor promedio de red: ${factorKgPerKwh} kg CO₂e/kWh`],
      })
    }
  }

  // Fuel (liters) — if type unclear, assume diesel for small business fleets
  {
    const fuelMatch = t.match(
      /(\d+(?:[.,]\d+)?)\s*(l|liters?|litros?)\s*(?:de|of)?\s*(diesel|di[eé]sel|gasoline|petrol|gasolina)?/i,
    )
    if (fuelMatch) {
      const liters = toNumber(fuelMatch[1])
      const fuel = (fuelMatch[3] ?? '').toLowerCase()

      const isGasoline = /gasoline|petrol|gasolina/.test(fuel)

      const factor = isGasoline ? 2.31 : 2.68
      const label = isGasoline ? 'Gasolina' : 'Diésel'

      items.push({
        label: `Combustible (${label})`,
        activity: `${round(liters)} L`,
        emissionsKgCO2e: liters * factor,
        assumptions: [`Factor: ${factor} kg CO₂e/L`].concat(!fuelMatch[3] ? ['Tipo no especificado: se asume diésel'] : []),
      })
    }
  }

  // Natural gas (m3)
  {
    const gasMatch = t.match(/(\d+(?:[.,]\d+)?)\s*(m3|m³)\s*(?:de|of)?\s*(gas\s+natural|natural\s+gas|gas)/i)
    if (gasMatch) {
      const m3 = toNumber(gasMatch[1])
      const factor = 2.0
      items.push({
        label: 'Gas natural',
        activity: `${round(m3)} m³`,
        emissionsKgCO2e: m3 * factor,
        assumptions: [`Factor: ${factor} kg CO₂e/m³ (aprox.)`],
      })
    }
  }

  // Delivery vans — if only van count is provided, assume a default distance per van/day.
  {
    const vansMatch = t.match(/(\d+)\s*(?:delivery\s*)?vans?\b/i)
    if (vansMatch) {
      const vans = Number.parseInt(vansMatch[1], 10)

      const distanceMatch = t.match(/(\d+(?:[.,]\d+)?)\s*(km|kilometers?|kil[oó]metros?|mi|miles)\b/i)
      const distanceRaw = distanceMatch ? toNumber(distanceMatch[1]) : 0
      const unit = (distanceMatch?.[2] ?? 'km').toLowerCase()
      const distanceKm =
        distanceMatch && /mi|miles/.test(unit) ? distanceRaw * 1.60934 : distanceRaw

      const assumedKmPerVan = 30
      const totalKm = distanceMatch ? distanceKm : vans * assumedKmPerVan

      const factorKgPerKm = 0.25
      const assumptions: string[] = [`Factor furgoneta: ${factorKgPerKm} kg CO₂e/km (aprox.)`]
      if (!distanceMatch) assumptions.push(`No se indicó distancia: se asumen ${assumedKmPerVan} km por furgoneta/día`)

      items.push({
        label: 'Transporte (furgonetas)',
        activity: distanceMatch ? `${vans} furgonetas · ${round(totalKm)} km (total)` : `${vans} furgonetas`,
        emissionsKgCO2e: totalKm * factorKgPerKm,
        assumptions,
      })
    }
  }

  if (items.length === 0) {
    notes.push('No pude detectar unidades comunes (kWh, L de combustible, m³ de gas, vans/km). Prueba incluyendo números y unidades.')
  } else {
    notes.push('Esto es una estimación simple basada en factores promedio y reglas heurísticas.')
    notes.push('Para mayor precisión: indica país/ciudad (red eléctrica), tipo de vehículo y distancia recorrida.')
  }

  const total = sum(items)
  return {
    totalKgCO2e: round(total, 2),
    items: items.map((it) => ({ ...it, emissionsKgCO2e: round(it.emissionsKgCO2e, 2) })),
    notes,
  }
}

