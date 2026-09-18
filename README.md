# Lamb Yipee

A fast-paced word typing and verse-racing game.

## Quick Start

### Play Locally
You can run the included Node.js server:

```bash
# Start the server (defaults to port 3000)
npm start
# or: node server.js
```

Then open [http://localhost:3000](http://localhost:3000) in your web browser.

Or simply open `lamb-yipee.html` or `index.html` directly in any modern web browser.

### Building
To re-bundle source changes into the standalone `lamb-yipee.html` and `index.html`:

```bash
node build.js
```

## Project Structure
- `index.src.html`: Source HTML template
- `css/style.css`: Game styles
- `js/`: Core game scripts (`engine.js`, `lamb.js`, `main.js`, `verses.js`)
- `assets/`: Game artwork and icons
- `lamb-yipee.html` / `index.html`: Standalone bundled game files
- `server.js`: Static file server
- `qa/`: QA gauntlet runner and test suite
