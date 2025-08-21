import { defineConfig } from 'vite';
import checker from 'vite-plugin-checker';
import mkcert from 'vite-plugin-mkcert';

// Vite configuration
// https://vite.dev/config/
export default defineConfig(async () => ({
  // ensure relative asset paths in index.html file
  base: './',
  // browser targets
  // https://vite.dev/config/build-options.html#build-target
  build: {
    target: ['es2022', 'edge120', 'firefox117', 'chrome120', 'safari17'],
  },
  plugins: [
    // add type check directly to vite
    checker({ typescript: true, overlay: false }),
    // ssl für lokalen dev server (cors int api)
    mkcert(),
  ],
}));
