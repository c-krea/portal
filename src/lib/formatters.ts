const copFormatter = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
})

export function formatCOP(value: number): string {
  return copFormatter.format(value)
}

export function formatPercent(value: number, decimals = 1): string {
  return `${value.toFixed(decimals)}%`
}

export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date
  return d.toLocaleDateString("es-CO", { day: "2-digit", month: "2-digit", year: "numeric" })
}

export function formatDateShort(date: Date | string): string {
  const d = typeof date === "string" ? new Date(`${date}T00:00:00`) : date
  return d.toLocaleDateString("es-CO", { day: "2-digit", month: "short" }).replace(".", "")
}
