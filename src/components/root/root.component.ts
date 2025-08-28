import '../options/options.component.js';

import type { EventWithTarget } from '@enke.dev/lit-utils/lib/types/event.types.js';
import { html, LitElement, unsafeCSS } from 'lit';
import { customElement, eventOptions, query, state } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';

import MEDIA_SIZES from '../../assets/media-sizes.json' assert { type: 'json' };
import type { MediaSize } from '../../utils/file.utils.js';
import { readFilesFromEvent } from '../../utils/file.utils.js';
import type { ApplicableFilters } from '../../utils/filter.utils.js';
import { previewFile } from '../../utils/preview.utils.js';
import { renderFile } from '../../utils/render.utils.js';

import styles from './root.component.css?inline';

@customElement('kvlm-posting')
export class Root extends LitElement {
  static override readonly styles = unsafeCSS(styles);

  #abortCtrl?: AbortController;

  @query('canvas')
  private canvas!: HTMLCanvasElement;

  @state()
  private file?: File;

  @state()
  private saving?: number;

  @state()
  private selectedSize: MediaSize = [
    MEDIA_SIZES['Instagram Feed'].height,
    MEDIA_SIZES['Instagram Feed'].width,
  ];

  @state()
  private selectedFilters: ApplicableFilters = {};

  @eventOptions({ capture: true })
  private handleDragOver(event: DragEvent) {
    event.preventDefault();
    this.setAttribute('data-dragging', '');
  }

  @eventOptions({ capture: true })
  private handleDrop(event: DragEvent) {
    event.preventDefault();

    this.file = readFilesFromEvent(event)[0];
    this.removeAttribute('data-dragging');
    this.toggleAttribute('data-has-file', this.file !== undefined);
    this.#updateCanvas();
  }

  @eventOptions({ capture: true })
  private handleFileChange(event: EventWithTarget<HTMLInputElement>) {
    event.preventDefault();

    const input = event.target as HTMLInputElement;
    this.file = input.files?.[0];
    this.removeAttribute('data-dragging');
    this.toggleAttribute('data-has-file', this.file !== undefined);
    this.#updateCanvas();
  }

  @eventOptions({ passive: true })
  private handleSizeChange({ detail }: HTMLElementEventMap['size-change']) {
    this.selectedSize = detail;
    this.#updateCanvas();
  }

  @eventOptions({ passive: true })
  private handleFilterChange({ detail }: HTMLElementEventMap['filters-change']) {
    this.selectedFilters = detail;
    this.#updateCanvas();
  }

  @eventOptions({ passive: true })
  private async handleSave() {
    this.#renderCanvas();
  }

  #updateCanvas() {
    if (this.file === undefined) return;

    this.#abortCtrl?.abort();
    this.#abortCtrl = previewFile(this.file, this.canvas, this.selectedFilters);
  }

  async #renderCanvas() {
    if (this.file === undefined) return;

    this.#abortCtrl?.abort();
    this.#abortCtrl = await renderFile(
      this.file,
      this.selectedSize,
      this.selectedFilters,
      progress => {
        this.saving = Math.floor(progress * 100);
        if (progress >= 1) {
          setTimeout(() => {
            this.saving = undefined;
          }, 1000);
        }
      },
    );
  }

  override render() {
    return html`
      <header>
        <kvlm-posting-options
          .disabled="${this.file === undefined || this.saving !== undefined}"
          .saving=${this.saving}
          .selectedSize=${this.selectedSize}
          .selectedFilters=${this.selectedFilters}
          @save=${this.handleSave}
          @size-change=${this.handleSizeChange}
          @filters-change=${this.handleFilterChange}
        ></kvlm-posting-options>
      </header>

      <main>
        <section
          style="${styleMap({
            '---kvlm-posting-aspect-ratio': `${this.selectedSize[1]} / ${this.selectedSize[0]}`,
          })}"
        >
          <canvas height="${this.selectedSize[0]}" width="${this.selectedSize[1]}"></canvas>
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
    'kvlm-posting': Root;
  }
}
