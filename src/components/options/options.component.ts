import type { EventWithTarget } from '@enke.dev/lit-utils/lib/types/event.types.js';
import { html, LitElement, unsafeCSS } from 'lit';
import {
  customElement,
  eventOptions,
  property,
  query,
  state,
} from 'lit/decorators.js';
import { ifDefined } from 'lit/directives/if-defined.js';
import { live } from 'lit/directives/live.js';
import { map } from 'lit/directives/map.js';

import MEDIA_SIZES from '../../assets/media-sizes.json' assert { type: 'json' };
import type {
  ApplicableFilters,
  FilterName,
} from '../../utils/filter.utils.js';
import { FILTERS } from '../../utils/filter.utils.js';

import styles from './options.component.css?inline';

export type MediaSize = [height: number, width: number];

/**
 * Options for the atmospheric posting.
 *
 * @emits {CustomEvent} size-change - Fired when the size is changed.
 * @emits {CustomEvent} filters-change - Fired when the filter is changed.
 */
@customElement('kvlm-posting-options')
export class Options extends LitElement {
  static override readonly styles = unsafeCSS(styles);

  @query('input[name="width"]')
  private widthInput!: HTMLInputElement;

  @query('input[name="height"]')
  private heightInput!: HTMLInputElement;

  @state()
  private isCustomSize = false;

  @property({ type: Object })
  readonly selectedSize!: MediaSize;

  @property({ type: Object })
  readonly selectedFilters!: ApplicableFilters;

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
    const name = target.dataset.name as FilterName;
    let isEnabled: boolean;
    let currentValue: number;

    if (target.name.endsWith('-value')) {
      isEnabled =
        target.parentElement?.querySelector<HTMLInputElement>(
          `input[name="${name}-toggle"]`,
        )?.checked ?? false;
      currentValue = target.valueAsNumber;
    } else {
      isEnabled = target.checked;
      currentValue =
        target.parentElement?.querySelector<HTMLInputElement>(
          `input[name="${name}-value"]`,
        )?.valueAsNumber ?? 0;
    }

    // determine the selected filters
    const selectedFilters = new Map(Object.entries(this.selectedFilters));
    if (isEnabled) {
      selectedFilters.set(name, currentValue);
    } else {
      selectedFilters.delete(name);
    }

    // notify about filter change
    const detail = Object.fromEntries(selectedFilters);
    const event = new CustomEvent('filters-change', { detail });
    this.dispatchEvent(event);
  }

  renderFilter(name: FilterName) {
    const isEnabled = name in this.selectedFilters;
    const schema = FILTERS[name];

    return html`
      <label class="options">
        <input
          type="checkbox"
          data-name="${name}"
          name="${name}-toggle"
          value="${name}"
          ?checked="${isEnabled}"
        />
        <input
          ?hidden="${!isEnabled}"
          data-name="${name}"
          name="${name}-value"
          type="${schema.step !== undefined ? 'range' : 'number'}"
          min="${ifDefined(schema.min)}"
          max="${ifDefined(schema.max)}"
          step="${ifDefined(schema.step)}"
          value="${ifDefined(schema.value)}"
        />
        <span>${name}</span>
      </label>
    `;
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
          ${map(Object.keys(FILTERS), name => this.renderFilter(name as FilterName))}
        </fieldset>

      </nav>
  </nav>
    `;
  }
}

declare global {
  interface HTMLElementEventMap {
    'size-change': CustomEvent<MediaSize>;
    'filters-change': CustomEvent<ApplicableFilters>;
  }

  interface HTMLElementTagNameMap {
    'kvlm-posting-options': Options;
  }
}
