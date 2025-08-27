/**
 * CSS filters are declared by its name and individual options.
 */
export type Filter = {
  value?: number; // allows setting a initial value
  unit?: string; // adds a unit, e.g. "deg", "%"
} &
  // usage as slider
  (| {
        step: number; // when given, a slider is used
        max: number; // required for sliders
        min: number; // required for sliders
      }
    // usage as input with optional min and max constraints
    | {
        step?: undefined; // explicitly undefined to differentiate from the slider case (discriminator)
        max?: number;
        min?: number;
      }
  );

/**
 * Parses a filter value into a CSS filter string.
 * @param name The name of the filter.
 * @param value The value of the filter.
 * @returns The CSS filter string.
 */
export function parseFilter(name: FilterName, value: number): string {
  return `${name}(${value}${FILTERS[name].unit})`;
}

/**
 * Applies a set of filters to a given canvas.
 * @param canvas The canvas to apply filters to.
 * @param filters The filters to apply. Right now native filters as well as
 *  custom raw filters are supported, but they should not be used together.
 */
export function applyFilters(
  canvas: HTMLCanvasElement | OffscreenCanvas,
  filters: ApplicableFilters,
): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  // set native filters on the canvas element
  const parsed = Object.entries(filters).map(([name, value]) =>
    parseFilter(name as FilterName, value),
  );
  ctx.filter = parsed.length > 0 ? parsed.join(' ') : 'none';
}

/**
 * Using native CSS filters in supporting browsers is
 * much simpler and more efficient than implementing
 * custom filters in JavaScript.
 */
export const FILTERS = {
  blur: { value: 20, min: 0, max: 200, step: 1, unit: 'px' },
  brightness: { value: 40, min: 0, max: 300, step: 1, unit: '%' },
  contrast: { value: 200, min: 0, max: 600, step: 1, unit: '%' },
  grayscale: { value: 50, min: 0, max: 100, step: 1, unit: '%' },
  'hue-rotate': { value: 90, min: 0, max: 360, step: 1, unit: 'deg' },
  invert: { value: 75, min: 0, max: 100, step: 1, unit: '%' },
  opacity: { value: 25, min: 0, max: 100, step: 1, unit: '%' },
  saturate: { value: 30, min: 0, max: 100, step: 1, unit: '%' },
  sepia: { value: 60, min: 0, max: 100, step: 1, unit: '%' },
} satisfies Record<string, Filter>;

/**
 * Aggregates all filter names into a union type.
 */
export type FilterName = keyof typeof FILTERS;

/**
 * When passing filters with values around, this type comes in handy
 */
export type ApplicableFilters = Partial<Record<FilterName, number>>;
