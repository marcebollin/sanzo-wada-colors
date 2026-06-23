import assert from "node:assert/strict"
import { describe, it } from "node:test"

import { formatHex } from "culori"

import { cmykToOklch, cmykToRgb, PRINT_PROFILE } from "./cmyk-to-oklch.mjs"

describe("CMYK to OKLCH converter", () => {
  it("keeps the calibrated print model explicit", () => {
    assert.equal(PRINT_PROFILE.name, "wscolors-calibrated-oklab-polynomial")
    assert.match(PRINT_PROFILE.source, /wscolors\.com\/colors/)
    assert.equal(PRINT_PROFILE.polynomialDegree, 6)
    assert.equal(PRINT_PROFILE.ridge, 1e-14)
    assert.equal(PRINT_PROFILE.targetCount, 159)
    assert.equal(PRINT_PROFILE.calibratedCmykCount, 159)
    assert.equal(PRINT_PROFILE.featureCount, 210)
    assert.equal(PRINT_PROFILE.maxTotalInk, 350)
  })

  it("reproduces the first palette clue colors from source CMYK", () => {
    assert.equal(
      cmykToOklch({ c: 0, m: 30, y: 6, k: 0 }),
      "oklch(0.864 0.066 3.103)",
    )
    assert.equal(formatHex(cmykToRgb({ c: 0, m: 30, y: 6, k: 0 })), "#f9c1ce")
    assert.equal(
      cmykToOklch({ c: 13, m: 73, y: 100, k: 0 }),
      "oklch(0.641 0.161 45.107)",
    )
    assert.equal(
      formatHex(cmykToRgb({ c: 13, m: 73, y: 100, k: 0 })),
      "#d96629",
    )
    assert.equal(
      cmykToOklch({ c: 84, m: 26, y: 32, k: 0 }),
      "oklch(0.608 0.105 209.91)",
    )
    assert.equal(formatHex(cmykToRgb({ c: 84, m: 26, y: 32, k: 0 })), "#0093a5")
  })

  it("formats edge-case colors without NaN or negative zero", () => {
    assert.equal(cmykToOklch({ c: 0, m: 0, y: 0, k: 100 }), "oklch(0 0 0)")
    assert.equal(cmykToOklch({ c: 0, m: 0, y: 0, k: 0 }), "oklch(1 0 0)")
    assert.equal(formatHex(cmykToRgb({ c: 0, m: 0, y: 0, k: 100 })), "#000000")
  })

  it("keeps converted RGB channels inside sRGB bounds", () => {
    const rgb = cmykToRgb({ c: 92, m: 62, y: 10, k: 2 })
    assert.equal(rgb.mode, "rgb")

    for (const channel of ["r", "g", "b"]) {
      assert.ok(
        rgb[channel] >= 0 && rgb[channel] <= 1,
        `${channel} is in gamut`,
      )
    }
  })

  it("rejects invalid CMYK channels", () => {
    assert.throws(() => cmykToOklch({ c: 0, m: 0, y: 0, k: 101 }), /k must be/)
    assert.throws(
      () => cmykToOklch({ c: 0, m: Number.NaN, y: 0, k: 0 }),
      /m must be/,
    )
    assert.throws(() => cmykToOklch({ c: 0, y: 0, k: 0 }), /m must be/)
  })
})
