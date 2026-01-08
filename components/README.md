Components library (plain JavaScript web components)

Project layout
- src/: source ESM modules
- src/loader.js: imports and registers all components
- demo/: simple playground and examples
- dist/: built output (copied from src)

Scripts
- build: copy src/ to dist/
- dev: start a small static server at http://localhost:5173
- preview: same server on :4173

Local development
1) Run: node scripts/serve.mjs . 5173
2) Open: http://localhost:5173/components/demo/
   - Add ?build=dist to load from dist instead of src

Usage (from GitHub Pages)
Once pushed to the repo, you can load from Pages:

<script type="module" src="https://derekbarnhart.github.io/components/dist/loader.js"></script>

Or import individual components by path:

<script type="module">
  import "https://derekbarnhart.github.io/components/dist/components/db-badge/db-badge.js";
  // then use <db-badge> in the page
</script>

Creating new components
1) Create folder: src/components/<name>/
2) Define element in <name>.js and register with customElements.define
3) Export it, and add an import in src/loader.js
4) Run build to sync dist/

