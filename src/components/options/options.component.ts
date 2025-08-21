import { ListConverter } from '@enke.dev/lit-utils/lib/converters/list.converter.js';
import type { EventWithTarget } from '@enke.dev/lit-utils/lib/types/event.types.js';
import { html, LitElement, unsafeCSS } from 'lit';
import { customElement, eventOptions, property } from 'lit/decorators.js';
import { map } from 'lit/directives/map.js';

import MEDIA_SIZES from '../../assets/media-sizes.json' assert { type: 'json' };
import type { FilterName } from '../../utils/filter.utils.js';
import { NATIVE_FILTERS } from '../../utils/filter.utils.js';

import styles from './options.component.css?inline';

type MediaSize = keyof typeof MEDIA_SIZES;

/**
 * Options for the atmospheric posting.
 *
 * @emits {CustomEvent} size-change - Fired when the size is changed.
 * @emits {CustomEvent} filters-change - Fired when the filter is changed.
 */
@customElement('kvlm-atmospheric-posting-options')
export class Options extends LitElement {
  static override readonly styles = unsafeCSS(styles);

  @property({ type: String, reflect: true })
  readonly selectedSize!: MediaSize;

  @property({ type: Array, reflect: true, converter: ListConverter(' ') })
  readonly selectedFilters!: FilterName[];

  @eventOptions({ passive: true })
  private handleSizeChange({ target }: EventWithTarget<HTMLSelectElement>) {
    // notify about size change
    const event = new CustomEvent('size-change', { detail: target.value });
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
        <label class="dropdown">
          <span>Size</span>
          <select name="size" @change=${this.handleSizeChange}>
            ${map(
              Object.keys(MEDIA_SIZES),
              size => html`
                <option value=${size} ?selected=${this.selectedSize === size}>
                  ${size}
                </option>
              `,
            )}
          </select>
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
                  value=${name}
                  ?checked=${this.selectedFilters.includes(name as FilterName)}
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
