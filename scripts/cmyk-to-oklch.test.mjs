import assert from "node:assert/strict"
import { describe, it } from "node:test"

import { PRINT_PROFILE, cmykToOklch, cmykToRgb } from "./cmyk-to-oklch.mjs"

describe("CMYK to OKLCH fallback converter", () => {
  it("keeps the fallback print profile explicit", () => {
    assert.equal(PRINT_PROFILE.name, "japanese-process-fallback")
    assert.equal(PRINT_PROFILE.inkGain, 0.18)
    assert.equal(PRINT_PROFILE.maxTotalInk, 350)
  })

  it("reproduces a known Sanzo Wada color", () => {
    assert.equal(cmykToOklch({ c: 0, m: 30, y: 6, k: 0 }), "oklch(0.839 0.132 334.502)")
  })

  it("formats edge-case colors without NaN or negative zero", () => {
    assert.equal(cmykToOklch({ c: 0, m: 0, y: 0, k: 100 }), "oklch(0 0 0)")
    assert.equal(cmykToOklch({ c: 0, m: 0, y: 0, k: 0 }), "oklch(1 0 0)")
  })

  it("keeps converted RGB channels inside sRGB bounds", () => {
    const rgb = cmykToRgb({ c: 92, m: 62, y: 10, k: 2 })
    assert.equal(rgb.mode, "rgb")

    for (const channel of ["r", "g", "b"]) {
      assert.ok(rgb[channel] >= 0 && rgb[channel] <= 1, `${channel} is in gamut`)
    }
  })

  it("rejects invalid CMYK channels", () => {
    assert.throws(() => cmykToOklch({ c: 0, m: 0, y: 0, k: 101 }), /k must be/)
    assert.throws(() => cmykToOklch({ c: 0, m: Number.NaN, y: 0, k: 0 }), /m must be/)
    assert.throws(() => cmykToOklch({ c: 0, y: 0, k: 0 }), /m must be/)
  })
})
