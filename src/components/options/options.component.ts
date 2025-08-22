import { ListConverter } from '@enke.dev/lit-utils/lib/converters/list.converter.js';
import type { EventWithTarget } from '@enke.dev/lit-utils/lib/types/event.types.js';
import { html, LitElement, unsafeCSS } from 'lit';
import {
  customElement,
  eventOptions,
  property,
  query,
  state,
} from 'lit/decorators.js';
import { live } from 'lit/directives/live.js';
import { map } from 'lit/directives/map.js';

import MEDIA_SIZES from '../../assets/media-sizes.json' assert { type: 'json' };
import type { FilterName } from '../../utils/filter.utils.js';
import { NATIVE_FILTERS } from '../../utils/filter.utils.js';

import styles from './options.component.css?inline';

export type MediaSize = [height: number, width: number];

/**
 * Options for the atmospheric posting.
 *
 * @emits {CustomEvent} size-change - Fired when the size is changed.
 * @emits {CustomEvent} filters-change - Fired when the filter is changed.
 */
@customElement('kvlm-atmospheric-posting-options')
export class Options extends LitElement {
  static override readonly styles = unsafeCSS(styles);

  @query('input[name="width"]')
  private widthInput!: HTMLInputElement;

  @query('input[name="height"]')
  private heightInput!: HTMLInputElement;

  @state()
  private isCustomSize = false;

  @property({ type: Object, reflect: false })
  readonly selectedSize!: MediaSize;

  @property({ type: Array, reflect: true, converter: ListConverter(' ') })
  readonly selectedFilters!: FilterName[];

  @eventOptions({ passive: true })
  private handleSizeChange({
    target,
  }: EventWithTarget<HTMLSelectElement | HTMLInputElement>) {
    // check what issued the event
    this.isCustomSize = target.name !== 'size' || target.value === 'custom';

    // determine the new size
    let detail: MediaSize;
    if (this.isCustomSize) {
      const width = this.widthInput.valueAsNumber;
      const height = this.heightInput.valueAsNumber;
      detail = [!isNaN(width) ? width : 500, !isNaN(height) ? height : 500];
      console.log({ width, height }, detail);
    } else {
      const size = MEDIA_SIZES[target.value as keyof typeof MEDIA_SIZES];
      detail = [size.height, size.width];
    }

    // notify about size change
    const event = new CustomEvent('size-change', { detail });
    this.dispatchEvent(event);
  }

  @eventOptions({ passive: true })
  private handleFilterChange({ target }: EventWithTarget<HTMLInputElement>) {
    // determine the selected filters
    const selectedFilters = new Set(this.selectedFilters);
    if (target.checked) {
      selectedFilters.add(target.value as FilterName);
    } else {
      selectedFilters.delete(target.value as FilterName);
    }

    // notify about filter change
    const detail = [...selectedFilters];
    const event = new CustomEvent('filters-change', { detail });
    this.dispatchEvent(event);
  }

  override render() {
    return html`
      <nav>
        <label class="dropdown" @change=${this.handleSizeChange}>
          <span>Size</span>
          <select name="size">
            <option
              value="custom"
              ?selected="${this.isCustomSize}"
            >
              Custom
            </option>
            ${map(
              Object.entries(MEDIA_SIZES),
              ([size, { height, width }]) => html`
                <option
                  value="${size}"
                  ?selected="${!this.isCustomSize &&
                  this.selectedSize[0] === height &&
                  this.selectedSize[1] === width}"
                >
                  ${size}
                </option>
              `,
            )}
          </select>

          <input name="width" type="number" min="0" step="1" placeholder="width" required ?readonly="${!this.isCustomSize}" .valueAsNumber="${live(this.selectedSize[0])}" />
          <input name="height" type="number" min="0" step="1" placeholder="height" required ?readonly="${!this.isCustomSize}" .valueAsNumber="${live(this.selectedSize[1])}" />
        </label>

        <fieldset @change=${this.handleFilterChange}>
          <legend>Filters</legend>
          ${map(
            Object.keys(NATIVE_FILTERS),
            name => html`
              <label class="options">
                <input
                  type="checkbox"
                  name="native-filters"
                  value="${name}"
                  ?checked="${this.selectedFilters.includes(
                    name as FilterName,
                  )}"
                />
                <span>${name}</span>
              </label>
            `,
          )}
        </fieldset>

      </nav>
  </nav>
    `;
  }
}

declare global {
  interface HTMLElementEventMap {
    'size-change': CustomEvent<MediaSize>;
    'filters-change': CustomEvent<FilterName[]>;
  }

  interface HTMLElementTagNameMap {
    'kvlm-atmospheric-posting-options': Options;
  }
}
