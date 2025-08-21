/**
 * CSS filters are simply declared as strings.
 */
export type Filter = string;

/**
 * Picks a set of filters by their names from a collection.
 * @param filters The collection of filters to pick from.
 * @param names The names of the filters to pick.
 * @returns The picked filters.
 */
export function pickFiltersByName<
  F extends Record<FilterName, Filter>,
  K extends keyof F,
  R extends (K extends keyof F ? F[K] : never)[],
>(filters: F, names: K[]): R {
  return names.map(name => filters[name]).filter(Boolean) as R;
}

/**
 * Applies a set of filters to a given canvas.
 * @param canvas The canvas to apply filters to.
 * @param filters The filters to apply. Right now native filters as well as
 *  custom raw filters are supported, but they should not be used together.
 */
export function applyFilters(
  canvas: HTMLCanvasElement,
  ...filters: FilterName[]
): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  // set native filters on the canvas element
  const nativeFilters = pickFiltersByName(
    NATIVE_FILTERS,
    filters as FilterName[],
  );
  ctx.filter = nativeFilters.length > 0 ? nativeFilters.join(' ') : 'none';
}

/**
 * A collection of custom image filters. As they're
 * applied frame by frame on videos, they tend to be
 * less performant than native CSS filters. So these
 * filters should be used sparingly and only when
 * necessary and primarily for images.
 */
/**
 * Using native CSS filters in supporting browsers is
 * much simpler and more efficient than implementing
 * custom filters in JavaScript.
 */
export const NATIVE_FILTERS = {
  blur: 'blur(20px)',
  brightness: 'brightness(0.4)',
  contrast: 'contrast(200%)',
  // shadow: 'drop-shadow(16px 16px 20px blue)',
  grayscale: 'grayscale(50%)',
  'hue rotate': 'hue-rotate(90deg)',
  invert: 'invert(75%)',
  opacity: 'opacity(25%)',
  saturate: 'saturate(30%)',
  sepia: 'sepia(60%)',
} satisfies Record<Filter, Filter>;

/**
 * Aggregates all filter names into a union type.
 */
export type FilterName = keyof typeof NATIVE_FILTERS;
