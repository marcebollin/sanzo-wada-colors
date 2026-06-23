/**
 * A stable `view-transition-name` for a palette swatch, shared by the Hero's
 * large feature tiles and the compact swatches in the About header. Matching
 * names across the two routes let the browser morph each color block from its
 * big hero size into the small navigation header (and back) on navigation.
 */
export function swatchViewTransitionName(colorId: number): string {
  return `swatch-${colorId}`
}
