export type ConsumoLectura = {
  lecturaAnterior: number
  kwh: number
  esPrimeraLectura: boolean
}

// No previous row → handover baseline (anterior = actual, kwh = 0).
// A stored previous of 0 is a real reading, not a first reading.
export function consumoDesdeLecturas(
  lecturaActual: number,
  lecturaAnterior: number | null,
): ConsumoLectura {
  if (lecturaAnterior == null) {
    return { lecturaAnterior: lecturaActual, kwh: 0, esPrimeraLectura: true }
  }
  const kwh = Math.round((lecturaActual - lecturaAnterior) * 100) / 100
  return { lecturaAnterior, kwh, esPrimeraLectura: false }
}

// MROUND(kwh × tarifa, 50). Zero consumo or missing tarifa → $0.
export function totalEnergia(kwh: number, tarifaKwh: number): number {
  if (kwh <= 0 || tarifaKwh <= 0) return 0
  return Math.round((kwh * tarifaKwh) / 50) * 50
}
