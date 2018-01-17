# webcv-skeleton

This is the skeleton project which I built on [my personal site](http://v2.balazs.rozsenich.hu). It's built on Angular2 ES2015. It includes a custom build script that generates compressed output for deployment.

## Required folder structure:
- `./lib`: thirdparty and utility scripts
- `./src`: source root
    - `/app`: Angular modules (any structure is tolerated)
    - `/resources`: CSS, images, fonts, etc. (any structure is tolerated)
    - `favicon.ico`
    - `index.html`

## Build script usage
Install dependencies via npm: `npm i`

Clean and Build project: `npm run-script build`

Clean output: `npm run-script clean`

Launch site: `npm run-script launch`

### Build output
- `./out`: output root
    - `/components`: all HTML sources are minified and collected into this folder - also links to files are resolved
    - `/lib`: copy of `./lib` folder
    - `/resources`: copy of `./src/resources`; JSON files are minified
    - `app.js`: all JS sources are ordered in a dependency tree and collected into this single minified file; this should be linked in `index.html`
    - `favicon.ico`
    - `index.html`: minified copy of `./src/index.html`

## Credits and dependencies
- Site template: https://html5up.net/strata
- JS minifier: https://www.npmjs.com/package/minifier
- HTML minifier: https://www.npmjs.com/package/html-minifier
- JSON minifier: https://www.npmjs.com/package/jsonminify
- HTTP server: https://www.npmjs.com/package/http-server




> This work is licensed under the Creative Commons Attribution 3.0 Unported License. To view a copy of this license, visit http://creativecommons.org/licenses/by/3.0/ or send a letter to Creative Commons, PO Box 1866, Mountain View, CA 94042, USA.