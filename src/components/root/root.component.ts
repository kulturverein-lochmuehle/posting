import '../options/options.component.js';

import type { EventWithTarget } from '@enke.dev/lit-utils/lib/types/event.types.js';
import { html, LitElement, unsafeCSS } from 'lit';
import { customElement, eventOptions, query, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { styleMap } from 'lit/directives/style-map.js';

import MEDIA_SIZES from '../../assets/media-sizes.json' assert { type: 'json' };
import { readFilesFromEvent } from '../../utils/file.utils.js';
import type { FilterName } from '../../utils/filter.utils.js';
import { previewFile } from '../../utils/preview.utils.js';
import type { MediaSize } from '../options/options.component.js';

import styles from './root.component.css?inline';

@customElement('kvlm-atmospheric-posting')
export class Root extends LitElement {
  static override readonly styles = unsafeCSS(styles);

  #abortCtrl?: AbortController;

  @query('canvas')
  private canvas!: HTMLCanvasElement;

  @state()
  private dragging = false;

  @state()
  private file?: File;

  @state()
  private selectedSize: MediaSize = [
    MEDIA_SIZES['Instagram Feed'].height,
    MEDIA_SIZES['Instagram Feed'].width,
  ];

  @state()
  private selectedFilters: readonly FilterName[] = [];

  @eventOptions({ capture: true })
  private handleDragOver(event: DragEvent) {
    event.preventDefault();
  }

  @eventOptions({ capture: true })
  private handleDrop(event: DragEvent) {
    event.preventDefault();

    this.file = readFilesFromEvent(event)[0];
    this.#updateCanvas();
  }

  @eventOptions({ capture: true })
  private handleFileChange(event: EventWithTarget<HTMLInputElement>) {
    event.preventDefault();

    const input = event.target as HTMLInputElement;
    this.file = input.files?.[0];
    this.#updateCanvas();
  }

  @eventOptions({ passive: true })
  private handleSizeChange({ detail }: HTMLElementEventMap['size-change']) {
    this.selectedSize = detail;
    this.#updateCanvas();
  }

  @eventOptions({ passive: true })
  private handleFilterChange({
    detail,
  }: HTMLElementEventMap['filters-change']) {
    this.selectedFilters = detail;
    this.#updateCanvas();
  }

  #updateCanvas() {
    if (this.file === undefined) return;
    this.#abortCtrl?.abort();
    this.#abortCtrl = previewFile(
      this.file,
      this.canvas,
      ...this.selectedFilters,
    );
  }

  override render() {
    return html`
      <header>
        <kvlm-atmospheric-posting-options
          .selectedSize=${this.selectedSize}
          .selectedFilters=${Array.from(this.selectedFilters)}
          @size-change=${this.handleSizeChange}
          @filters-change=${this.handleFilterChange}
        ></kvlm-atmospheric-posting-options>
      </header>

      <main class="${classMap({ dragging: this.dragging })}">
        <section
          style="${styleMap({
            '---kvlm-atmospheric-posting-aspect-ratio': `${this.selectedSize[1]} / ${this.selectedSize[0]}`,
          })}"
        >
          <canvas
            height="${this.selectedSize[0]}"
            width="${this.selectedSize[1]}"
          ></canvas>
          <input
            type="file"
            accept="image/*,video/*"
            @dragover=${this.handleDragOver}
            @drop=${this.handleDrop}
            @change=${this.handleFileChange}
          />
        </section>
      </main>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'kvlm-atmospheric-posting': Root;
  }
}
