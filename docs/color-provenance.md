# Color provenance and gamut policy

## What the source data represents

Sanzo Wada's original *Haishoku Soukan* was published in six volumes in
1933–34. The Huntington Library catalogue describes the plates as having
mounted illustrations. ICC profiles did not exist at that time, so there is no
historically correct ICC profile that can be assigned to the original physical
swatches.

This project uses the CMYK values published with Seigensha's 2010 revised
reproduction, *A Dictionary of Color Combinations* (ISBN
978-4-86152-247-5). Seigensha states that all of its color tables include CMYK
values. CMYK values are device-dependent: they need a printing condition before
they can be converted to measured Lab or a screen color.

Sources:

- [Seigensha's Japanese edition page](https://www.seigensha.com/books/978-4-86152-247-5/)
- [Seigensha's English edition page](https://en.seigensha.com/books/978-4-86152-247-5/)
- [Huntington Library record for the 1933–34 original](https://hdl.huntington.org/digital/collection/p16003coll14/id/21849)

## Print condition used

The conversion uses **Japan Color 2001 Uncoated** (`JC200104`) as its working
print condition. The ICC registry defines it as an ISO 12647-2:1996 sheet-fed
offset condition using positive plates and uncoated paper type 4 (105 gsm), with
a 69/cm screen.

This is a reasoned approximation for the modern reproduction, based on its
Japanese production, 2010 publication date, and visibly uncoated stock. It is
not printer metadata supplied by Seigensha and is not asserted to describe the
1933–34 original. A measured target from the exact edition and press run would
be required to improve on this assumption.

- [ICC registry: Japan Color 2001 Uncoated](https://registry.color.org/cmyk-registry/jc200104)
- [ICC Japan Color 2001 white paper](https://archive.color.org/files/JapanColor2005English.pdf)

The profile is read with relative-colorimetric intent and without black-point
compensation. The result is stored as media-relative CIELAB D50 in each color's
`labD50` field. Black-point compensation is deliberately off during source
characterization; it belongs in a later device-to-device transform, not between
the source print condition and its profile connection space.

The Adobe-distributed ICC file is not checked into this repository. The
converted D50 Lab references are checked in, so the public conversion remains
reproducible without redistributing that profile.

## Screen gamut policy

Each color has two OKLCH serializations derived from the same D50 Lab reference:

- `oklch` is chroma-mapped to sRGB. It is the fallback and the stable value used
  by matching, copy actions, and portable bitmap exports.
- `oklchP3` is independently chroma-mapped to Display P3. Browsers use it when
  `matchMedia("(color-gamut: p3)")` reports a P3-capable display.

The P3 value is not made artificially more vivid. If the characterized printed
color already fits inside sRGB, both strings are intentionally identical. This
is why an accurate uncoated-print reconstruction uses only a small part of the
additional P3 gamut: wider output capability does not imply that the historical
source contained wider-gamut color.

The Feeling matcher remains in sRGB so a palette's ranking is deterministic on
every device. Its visual target and all dictionary swatches use the wider P3
variant where available.

The bottom control bar exposes both approaches without requiring historical
context. `Profiled` uses the Japan Color characterization and Display P3
enhancement described above. `Reference` uses fixed sRGB screen values aimed at
visual resemblance to printed swatches. Selecting either mode changes the
visible theme, palette matching, copied values, and bitmap exports together.
The Reference values are preserved in `src/data/legacy-oklch.json`, including
their original three-decimal boundary rounding. Profiled remains the default on
every new page load.

## CMYK print handoff

The Copy Combination popover always opens in OKLCH. Its CMYK format is plain
text rather than CSS because CMYK channels only have a defined appearance when
paired with a source profile. The handoff keeps the book's original channel
percentages and supplies the interpretation that corresponds to the selected
rendering mode:

- `Profiled`: Japan Color 2001 Uncoated (`JC200104`), relative colorimetric,
  black-point compensation off.
- `Reference`: U.S. Web Coated (SWOP) v2, relative colorimetric, black-point
  compensation on—the characterization behind the fixed Reference screen
  values.

For production, assign the listed source profile to the CMYK values and let the
printer convert from it to the profile for the actual press and paper. Assigning
a profile interprets the book channels; it does not rewrite them.

## Regenerating the data

With LittleCMS `transicc` and a locally licensed copy of
`JapanColor2001Uncoated.icc`:

```bash
TRANSICC_BIN=/path/to/transicc node scripts/cmyk-to-oklch.mjs \
  --icc-profile /path/to/JapanColor2001Uncoated.icc --force --audit
```

To regenerate the gamut variants from the checked-in Lab references:

```bash
node scripts/cmyk-to-oklch.mjs --force --audit
```
