import { describe, it } from "node:test"
import assert from "node:assert/strict"
import { consumoDesdeLecturas, totalEnergia } from "./lectura-consumo"

describe("consumoDesdeLecturas", () => {
  it("first reading with no previous is a $0 baseline", () => {
    const r = consumoDesdeLecturas(2734.7, null)
    assert.equal(r.esPrimeraLectura, true)
    assert.equal(r.lecturaAnterior, 2734.7)
    assert.equal(r.kwh, 0)
  })

  it("later reading bills the difference", () => {
    const r = consumoDesdeLecturas(2800, 2734.7)
    assert.equal(r.esPrimeraLectura, false)
    assert.equal(r.lecturaAnterior, 2734.7)
    assert.equal(r.kwh, 65.3)
  })

  it("previous reading of 0 is not a first reading", () => {
    const r = consumoDesdeLecturas(120, 0)
    assert.equal(r.esPrimeraLectura, false)
    assert.equal(r.kwh, 120)
  })
})

describe("totalEnergia", () => {
  it("first reading total is 0 even with a tarifa", () => {
    assert.equal(totalEnergia(0, 824), 0)
  })

  it("rounds kWh × tarifa to nearest 50", () => {
    assert.equal(totalEnergia(65.3, 824), 53800)
  })
})
