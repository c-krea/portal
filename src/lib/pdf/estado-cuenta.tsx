'use client'

import { Document, Image, Page, StyleSheet, Text, View } from '@react-pdf/renderer'

export type EstadoCuentaDocumento = {
  factura: string
  fechaFactura: string | null // 'YYYY-MM-DD'
  fechaVence: string | null // 'YYYY-MM-DD' (SIESA)
  diasMora: number // SIESA días de mora; ≤ 0 = al día
  saldo: number
  vencido: number // part of the saldo already overdue (SIESA vr_vencido)
}

export type EstadoCuentaData = {
  nombre: string
  nit: string
  zona: string | null
  documentos: EstadoCuentaDocumento[]
}

const RED = '#e11d48'
const INK = '#111827'
const MUTED = '#6b7280'
const LINE = '#e5e7eb'

const cop = (v: number) => `$${new Intl.NumberFormat('es-CO', { maximumFractionDigits: 0 }).format(Math.round(v))}`

function fecha(iso: string | null): string {
  if (!iso) return '—'
  const [y, m, d] = iso.slice(0, 10).split('-')
  return `${d}/${m}/${y}`
}

function generadoLabel(): string {
  const label = new Date().toLocaleDateString('es-CO', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'America/Bogota',
  })
  return `Generado el ${label}`
}

// Column widths (sum 100%) for the documents table.
const COL = { factura: '18%', emision: '18%', vence: '24%', dias: '18%', valor: '22%' } as const

const s = StyleSheet.create({
  // paddingBottom leaves room for the C-Krea logo + footer on the last page.
  page: { fontFamily: 'Helvetica', fontSize: 9.5, color: INK, paddingTop: 48, paddingBottom: 150, paddingHorizontal: 54 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: LINE },
  logo: { width: 150, objectFit: 'contain' },
  // C-Krea logo, centred at the bottom of the last page, above the footer.
  bottomLogo: { position: 'absolute', left: 0, right: 0, bottom: 58, alignItems: 'center' },
  bottomLogoImg: { height: 70, objectFit: 'contain' },
  title: { fontFamily: 'Helvetica-Bold', fontSize: 18, textAlign: 'right' },
  generado: { fontSize: 9, color: MUTED, textAlign: 'right', marginTop: 4 },
  nombre: { fontFamily: 'Helvetica-Bold', fontSize: 13, marginTop: 22, textTransform: 'uppercase' },
  sub: { fontSize: 9, color: MUTED, marginTop: 3 },
  totalTop: { fontFamily: 'Helvetica-Bold', fontSize: 11, marginTop: 16 },
  thead: { flexDirection: 'row', marginTop: 22, paddingBottom: 6, borderBottomWidth: 1, borderBottomColor: LINE },
  th: { fontFamily: 'Helvetica-Bold', fontSize: 8, color: MUTED, textTransform: 'uppercase' },
  row: { flexDirection: 'row', paddingVertical: 6 },
  cell: { fontSize: 9.5 },
  cellMuted: { fontSize: 9.5, color: MUTED },
  right: { textAlign: 'right' },
  bold: { fontFamily: 'Helvetica-Bold' },
  totalRow: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 6, paddingTop: 10, borderTopWidth: 1, borderTopColor: LINE },
  totalLabel: { fontFamily: 'Helvetica-Bold', fontSize: 11, width: '30%', textAlign: 'right', paddingRight: 12 },
  totalValue: { fontFamily: 'Helvetica-Bold', fontSize: 11, width: '22%', textAlign: 'right' },
  box: { alignSelf: 'flex-end', width: '43%', marginTop: 18, borderWidth: 1, borderColor: LINE },
  boxRow: { flexDirection: 'row' },
  boxRowBorder: { borderTopWidth: 1, borderTopColor: LINE },
  boxLabel: { width: '50%', paddingVertical: 4, paddingHorizontal: 6, fontSize: 8.5, borderRightWidth: 1, borderRightColor: LINE },
  boxValue: { width: '50%', paddingVertical: 4, paddingHorizontal: 6, fontSize: 9, textAlign: 'right', fontFamily: 'Helvetica-Bold' },
  empty: { marginTop: 14, fontSize: 9.5, color: MUTED },
  footer: { position: 'absolute', left: 54, right: 54, bottom: 32, flexDirection: 'row', justifyContent: 'space-between', fontSize: 8, color: MUTED },
})

export function EstadoCuentaPDF({
  data,
  logoSrc,
  bottomLogoSrc,
}: {
  data: EstadoCuentaData
  /** Header logo (REYMON). */
  logoSrc: string
  /** C-Krea logo at the bottom of the last page. */
  bottomLogoSrc: string
}) {
  const total = data.documentos.reduce((acc, d) => acc + d.saldo, 0)
  const enMora = data.documentos.reduce((acc, d) => acc + d.vencido, 0)
  const corriente = total - enMora
  const sub = [`NIT ${data.nit}`, data.zona ? `Zona ${data.zona}` : null].filter(Boolean).join('  ·  ')

  return (
    <Document title={`Estado de cuenta ${data.nombre}`} author="C-Krea">
      <Page size="A4" style={s.page}>
        <View style={s.header}>
          {/* eslint-disable-next-line jsx-a11y/alt-text -- react-pdf Image has no alt */}
          <Image src={logoSrc} style={s.logo} />
          <View>
            <Text style={s.title}>Estado de Cuenta</Text>
            <Text style={s.generado}>{generadoLabel()}</Text>
          </View>
        </View>

        <Text style={s.nombre}>{data.nombre}</Text>
        <Text style={s.sub}>{sub}</Text>
        <Text style={s.totalTop}>Total cartera: {cop(total)}</Text>

        {data.documentos.length === 0 ? (
          <Text style={s.empty}>Sin documentos pendientes en cartera.</Text>
        ) : (
          <>
            <View style={s.thead}>
              <Text style={[s.th, { width: COL.factura }]}>Factura</Text>
              <Text style={[s.th, { width: COL.emision }]}>Fecha emisión</Text>
              <Text style={[s.th, { width: COL.vence }]}>Fecha vencimiento</Text>
              <Text style={[s.th, s.right, { width: COL.dias }]}>Días de mora</Text>
              <Text style={[s.th, s.right, { width: COL.valor }]}>Valor</Text>
            </View>
            {data.documentos.map((d) => (
              <View key={d.factura} style={s.row} wrap={false}>
                <Text style={[s.cell, { width: COL.factura }]}>{d.factura}</Text>
                <Text style={[s.cellMuted, { width: COL.emision }]}>{fecha(d.fechaFactura)}</Text>
                <Text style={[s.cellMuted, { width: COL.vence }]}>{fecha(d.fechaVence)}</Text>
                {d.diasMora > 0 ? (
                  <Text style={[s.cell, s.right, s.bold, { width: COL.dias, color: RED }]}>
                    {d.diasMora} {d.diasMora === 1 ? 'día' : 'días'}
                  </Text>
                ) : (
                  <Text style={[s.cellMuted, s.right, { width: COL.dias }]}>al día</Text>
                )}
                <Text style={[s.cell, s.right, s.bold, { width: COL.valor }]}>{cop(d.saldo)}</Text>
              </View>
            ))}

            <View style={s.totalRow} wrap={false}>
              <Text style={s.totalLabel}>Total cartera</Text>
              <Text style={s.totalValue}>{cop(total)}</Text>
            </View>

            <View style={s.box} wrap={false}>
              <View style={s.boxRow}>
                <Text style={[s.boxLabel, s.bold, { color: RED }]}>EN MORA:</Text>
                <Text style={[s.boxValue, { color: RED }]}>{cop(enMora)}</Text>
              </View>
              <View style={[s.boxRow, s.boxRowBorder]}>
                <Text style={s.boxLabel}>CORRIENTE:</Text>
                <Text style={s.boxValue}>{cop(corriente)}</Text>
              </View>
              <View style={[s.boxRow, s.boxRowBorder]}>
                <Text style={[s.boxLabel, s.bold]}>TOTAL CARTERA</Text>
                <Text style={[s.boxValue, { fontSize: 10 }]}>{cop(total)}</Text>
              </View>
            </View>
          </>
        )}

        {/* Absolute and NOT fixed, placed after the content: it lands on the
            last page only, pinned to its bottom above the footer. */}
        <View style={s.bottomLogo} wrap={false}>
          {/* eslint-disable-next-line jsx-a11y/alt-text -- react-pdf Image has no alt */}
          <Image src={bottomLogoSrc} style={s.bottomLogoImg} />
        </View>

        <View style={s.footer} fixed>
          <Text>La información financiera proviene de SIESA como sistema maestro.</Text>
          <Text render={({ pageNumber, totalPages }) => `Página ${pageNumber} de ${totalPages}`} />
        </View>
      </Page>
    </Document>
  )
}
