'use client'

import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'

export interface ElectricityInvoiceProps {
  // Recipient (tenant)
  nombre: string
  nit: string
  // Utility invoice data
  proveedor: string      // e.g. "NEU ENERGY SAS ESP"
  proveedorNit: string   // e.g. "901.302.727"
  contrato: string       // e.g. "NIU 902329"
  periodo: string        // e.g. "1 al 31 de marzo 2026"
  consumoKwh: number     // e.g. 537.3
  tarifaKwh: number      // COP per kWh
  direccion: string      // local address
  total: number          // COP to reimburse
}

const formatCOP = (v: number) =>
  `$ ${new Intl.NumberFormat('es-CO', { maximumFractionDigits: 0 }).format(v)}`

const formatKwh = (v: number) =>
  new Intl.NumberFormat('es-CO', { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(v)

const formatTarifa = (v: number) =>
  `$ ${new Intl.NumberFormat('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v)}`

const s = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 10,
    paddingTop: 55,
    paddingBottom: 65,
    paddingHorizontal: 65,
    color: '#000000',
    lineHeight: 1.4,
  },
  // ── Header ──────────────────────────────────────────
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 32,
  },
  headerTitle: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 11,
  },
  // ── Date ────────────────────────────────────────────
  date: {
    marginBottom: 28,
  },
  // ── Recipient ───────────────────────────────────────
  recipient: {
    marginBottom: 20,
  },
  bold: {
    fontFamily: 'Helvetica-Bold',
  },
  // ── Body ────────────────────────────────────────────
  body: {
    textAlign: 'justify',
    marginBottom: 20,
  },
  // ── Provider data ───────────────────────────────────
  dataBlock: {
    marginBottom: 18,
  },
  dataRow: {
    flexDirection: 'row',
    marginBottom: 3,
    flexWrap: 'wrap',
  },
  dataLabel: {
    fontFamily: 'Helvetica-Bold',
    marginRight: 3,
  },
  // ── NOTE box ────────────────────────────────────────
  noteBox: {
    borderWidth: 1.5,
    borderColor: '#16a34a',
    borderRadius: 4,
    padding: 10,
    marginBottom: 22,
  },
  noteText: {
    fontFamily: 'Helvetica-Bold',
  },
  noteUnderline: {
    fontFamily: 'Helvetica-Bold',
    textDecoration: 'underline',
  },
  // ── Closing / signature ─────────────────────────────
  closing: {
    marginBottom: 4,
  },
  signatureName: {
    marginTop: 22,
    marginBottom: 2,
  },
  signatureRole: {
    fontFamily: 'Helvetica-Bold',
    marginBottom: 1,
  },
  signatureCompany: {
    fontFamily: 'Helvetica-Bold',
  },
  // ── Footer ──────────────────────────────────────────
  divider: {
    borderTopWidth: 0.75,
    borderTopColor: '#000000',
    marginTop: 32,
    marginBottom: 10,
  },
  footer: {
    fontSize: 9,
    marginBottom: 8,
  },
  footerLabel: {
    fontFamily: 'Helvetica-Bold',
    marginBottom: 5,
  },
  bullet: {
    flexDirection: 'row',
    marginLeft: 12,
    marginBottom: 2,
  },
  bulletDot: {
    marginRight: 4,
  },
  legalText: {
    textAlign: 'justify',
    fontSize: 9,
    marginTop: 8,
  },
})

function DataRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={s.dataRow}>
      <Text style={s.dataLabel}>{label}</Text>
      <Text>{value}</Text>
    </View>
  )
}

export function ElectricityInvoicePDF({
  nombre, nit,
  proveedor, proveedorNit, contrato, periodo, consumoKwh, tarifaKwh, direccion,
  total,
}: ElectricityInvoiceProps) {
  return (
    <Document>
      <Page size="A4" style={s.page}>

        {/* CUENTA DE COBRO No. 001 */}
        <View style={s.headerRow}>
          <Text style={s.headerTitle}>CUENTA DE COBRO No. 001</Text>
        </View>

        {/* Date */}
        <Text style={s.date}>Bogotá D.C., 22 abril de 2026</Text>

        {/* Recipient */}
        <View style={s.recipient}>
          <Text style={s.bold}>Señores:</Text>
          <Text style={s.bold}>{nombre}</Text>
          <Text style={s.bold}>NIT {nit}</Text>
        </View>

        {/* Intro paragraph */}
        <Text style={s.body}>
          Manufacturas Reymon S.A., identificado con NIT 830.135.173-7, se permite presentar la
          siguiente cuenta de cobro por concepto de reintegro de costos y gastos correspondientes al
          pago del servicio de energía, detallado a continuación:
        </Text>

        {/* Provider data block */}
        <View style={s.dataBlock}>
          <DataRow label="Datos del Proveedor:" value={proveedor} />
          <DataRow label="NIT:"                  value={proveedorNit} />
          <DataRow label="Número de Contrato:"   value={contrato} />
          <DataRow label="Periodo facturado:"    value={periodo} />
          <DataRow label="Consumo:"              value={`${formatKwh(consumoKwh)} Kwh`} />
          <DataRow label="Valor del Kwh:"        value={formatTarifa(tarifaKwh)} />
          <DataRow label="Dirección del inmueble:" value={direccion} />
          <DataRow label="Valor por reintegrar:" value={formatCOP(total)} />
        </View>

        {/* NOTE box */}
        <View style={s.noteBox}>
          <Text style={s.noteText}>
            {'NOTA: Recuerde que, al ser un ingreso reembolso de gasto, en su contabilidad el '}
            <Text style={s.noteUnderline}>
              gasto debe quedar registrado al proveedor de energía
            </Text>
            {', puesto que Manufacturas Reymon S.A. solo actúa como intermediario.'}
          </Text>
        </View>

        {/* Closing */}
        <Text style={s.closing}>Cordialmente,</Text>

        {/* Signature block */}
        <Text style={s.signatureName}>BILMAR YOBAN BURGOS</Text>
        <Text style={s.signatureRole}>Representante Legal</Text>
        <Text style={s.signatureCompany}>MANUFACTURAS REYMON S.A.</Text>

        {/* Divider */}
        <View style={s.divider} />

        {/* Attachments */}
        <View style={s.footer}>
          <Text style={s.footerLabel}>Se adjunta a la presente:</Text>
          <View style={s.bullet}>
            <Text style={s.bulletDot}>•</Text>
            <Text>Copia de la factura de energía eléctrica</Text>
          </View>
          <View style={s.bullet}>
            <Text style={s.bulletDot}>•</Text>
            <Text>Soporte de pago realizado</Text>
          </View>
        </View>

        {/* Legal disclaimer */}
        <Text style={s.legalText}>
          El valor anteriormente relacionado fue asumido por la empresa y corresponde a un pago que
          debe ser reintegrado, en conformidad con el Oficio 087967 del 11 de septiembre de 2020
          emitido por la DIAN, así como con lo establecido en la cláusula octava del contrato de
          arrendamiento para inmueble de uso comercial, según la cual el servicio público de energía
          eléctrica es asumido por el arrendatario. Cada local cuenta con un contador cuya lectura
          es realizada mensualmente por la administración, la cual informa el consumo y el valor a
          pagar correspondiente.
        </Text>

      </Page>
    </Document>
  )
}
