export type MediaSize = [height: number, width: number];

/**
 * Reads files from a drag event.
 * @param event The drag event to read files from.
 * @returns An array of files read from the event.
 */
export function readFilesFromEvent(event: DragEvent): File[] {
  const files: File[] = [];

  if (event.dataTransfer?.items) {
    // Use DataTransferItemList interface to access the file(s)
    [...event.dataTransfer.items].forEach(item => {
      // If dropped items aren't files, reject them
      if (item.kind === 'file') {
        const file = item.getAsFile();
        if (file) files.push(file);
      }
    });
  } else {
    // Use DataTransfer interface to access the file(s)
    [...(event.dataTransfer?.files ?? [])].forEach(file => files.push(file));
  }

  return files;
}

/**
 * Reads the contents of a file.
 * @param file The file to read.
 * @returns A promise that resolves with the file contents as an ArrayBuffer.
 */
export function readFileContents(file: File): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as ArrayBuffer);
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsArrayBuffer(file);
  });
}

/**
 * Saves the contents of a file.
 * @param url The data URL of the file to save.
 * @param filename The name of the file to save.
 */
export function saveFileContents(url: string, filename: string): void {
  // prepare link element
  const link = document.createElement('a');
  link.href = url;
  link.style.display = 'none';
  link.download = filename;

  // add link to the DOM and click it (start download)
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  // free up memory
  URL.revokeObjectURL(url);
}
