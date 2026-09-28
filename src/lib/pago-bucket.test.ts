import { describe, it } from "node:test"
import assert from "node:assert/strict"
import { classifyPagoBucket } from "./pago-bucket"

describe("classifyPagoBucket", () => {
  it("paid before due is Al día", () => {
    assert.equal(
      classifyPagoBucket({ fechaFactura: "2025-03-05", fechaRecaudo: "2025-03-10" }),
      "al_dia",
    )
  })

  it("paid exactly on factura+30 is Al día", () => {
    assert.equal(
      classifyPagoBucket({ fechaFactura: "2025-03-01", fechaRecaudo: "2025-03-31" }),
      "al_dia",
    )
  })

  it("paid on factura+31 is Mora", () => {
    assert.equal(
      classifyPagoBucket({ fechaFactura: "2025-03-01", fechaRecaudo: "2025-04-01" }),
      "mora",
    )
  })

  it("invoice from a previous month but paid within 30 days is Al día", () => {
    assert.equal(
      classifyPagoBucket({ fechaFactura: "2025-03-28", fechaRecaudo: "2025-04-05" }),
      "al_dia",
    )
  })

  it("month boundary: Jan 31 +30 = Mar 2 Al día, Mar 3 Mora", () => {
    assert.equal(
      classifyPagoBucket({ fechaFactura: "2025-01-31", fechaRecaudo: "2025-03-02" }),
      "al_dia",
    )
    assert.equal(
      classifyPagoBucket({ fechaFactura: "2025-01-31", fechaRecaudo: "2025-03-03" }),
      "mora",
    )
  })

  it("year boundary: Dec 15 +30 = Jan 14 Al día, Jan 15 Mora", () => {
    assert.equal(
      classifyPagoBucket({ fechaFactura: "2024-12-15", fechaRecaudo: "2025-01-14" }),
      "al_dia",
    )
    assert.equal(
      classifyPagoBucket({ fechaFactura: "2024-12-15", fechaRecaudo: "2025-01-15" }),
      "mora",
    )
  })

  it("missing invoice date is Al día", () => {
    assert.equal(
      classifyPagoBucket({ fechaFactura: null, fechaRecaudo: "2025-04-05" }),
      "al_dia",
    )
  })
})
