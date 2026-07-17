import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import { describe, it } from "node:test"

import { inGamut, oklch as toOklch } from "culori"

import { labToOklchVariants, PRINT_PROFILE } from "./cmyk-to-oklch.mjs"

const colors = JSON.parse(
  await readFile(new URL("../src/data/colors.json", import.meta.url), "utf8"),
)
const legacyOklch = JSON.parse(
  await readFile(
    new URL("../src/data/legacy-oklch.json", import.meta.url),
    "utf8",
  ),
)
const isInSrgb = inGamut("rgb")
const isInP3 = inGamut("p3")

describe("CMYK print characterization and OKLCH gamut variants", () => {
  it("keeps the inferred Japanese print condition explicit", () => {
    assert.equal(PRINT_PROFILE.name, "Japan Color 2001 Uncoated")
    assert.equal(PRINT_PROFILE.reference, "JC200104")
    assert.match(PRINT_PROFILE.sourceEdition, /978-4-86152-247-5/)
    assert.match(PRINT_PROFILE.assumption, /inferred/)
    assert.equal(PRINT_PROFILE.renderingIntent, "relative-colorimetric")
    assert.equal(PRINT_PROFILE.blackPointCompensation, false)
    assert.equal(PRINT_PROFILE.maxTotalInk, 350)
  })

  it("reproduces every checked-in gamut variant from its D50 Lab reference", () => {
    for (const color of colors) {
      assert.deepEqual(
        labToOklchVariants(color.labD50),
        { oklch: color.oklch, oklchP3: color.oklchP3 },
        `color #${color.id} ${color.name}`,
      )
    }
  })

  it("keeps each serialized value inside its promised output gamut", () => {
    for (const color of colors) {
      assert.ok(isInSrgb(color.oklch), `#${color.id} sRGB fallback`)
      assert.ok(isInP3(color.oklchP3), `#${color.id} Display P3 value`)
    }
  })

  it("preserves extra printable chroma when Display P3 can render it", () => {
    const paleLemon = colors.find((color) => color.id === 40)
    assert.ok(paleLemon)
    assert.ok(toOklch(paleLemon.oklchP3).c > toOklch(paleLemon.oklch).c)
    assert.equal(isInSrgb(paleLemon.oklchP3), false)
    assert.equal(isInP3(paleLemon.oklchP3), true)
  })

  it("preserves the complete previous conversion byte-for-byte", () => {
    assert.equal(Object.keys(legacyOklch).length, colors.length)
    assert.equal(legacyOklch["1"], "oklch(0.864 0.066 3.103)")
    assert.equal(legacyOklch["159"], "oklch(0.185 0.004 229.03)")

    for (const color of colors) {
      assert.ok(
        toOklch(legacyOklch[String(color.id)]),
        `#${color.id} legacy OKLCH value`,
      )
    }
  })

  it("formats an ideal D50 white without a phantom hue", () => {
    assert.deepEqual(labToOklchVariants({ l: 100, a: 0, b: 0 }), {
      oklch: "oklch(1 0 0)",
      oklchP3: "oklch(1 0 0)",
    })
  })

  it("rejects incomplete Lab references", () => {
    assert.throws(
      () => labToOklchVariants({ l: 50, a: Number.NaN, b: 0 }),
      /a must be a finite number/,
    )
    assert.throws(
      () => labToOklchVariants({ l: 50, a: 0 }),
      /b must be a finite number/,
    )
  })
})
