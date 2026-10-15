import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://rudolfjs.id.au',
  output: 'static',
  // The holding page must stay self-contained: no external stylesheets.
  build: { inlineStylesheets: 'always' },
  devToolbar: { enabled: false },
});
