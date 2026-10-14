import { defineConfig } from 'vite';

export default defineConfig({
  // The site lives at b-lilley.github.io/carry-the-one/, not at the domain root.
  // Without this, the built page looks for its JS/CSS in the wrong place and loads blank.
  base: '/carry-the-one/',
});
