/* Builds a fully self-contained lamb-yipee.html (inlines CSS + JS).
   Run:  node build.js */
const fs = require("fs");

let html = fs.readFileSync("index.src.html", "utf8");
const css = fs.readFileSync("css/style.css", "utf8");
const verses = fs.readFileSync("js/verses.js", "utf8");
const engine = fs.readFileSync("js/engine.js", "utf8");
const lamb = fs.readFileSync("js/lamb.js", "utf8");
const main = fs.readFileSync("js/main.js", "utf8");

html = html.replace("/*__CSS__*/", () => css);
html = html.replace("/*__VERSES__*/", () => verses);
html = html.replace("/*__ENGINE__*/", () => engine);
html = html.replace("/*__LAMB__*/", () => lamb);
html = html.replace("/*__MAIN__*/", () => main);

fs.writeFileSync("lamb-yipee.html", html);
fs.writeFileSync("index.html", html);

// Ensure public/ directory exists for Vercel and static hosting
if (!fs.existsSync("public")) {
  fs.mkdirSync("public", { recursive: true });
}
fs.writeFileSync("public/index.html", html);
fs.writeFileSync("public/lamb-yipee.html", html);

// Copy assets if directory exists
if (fs.existsSync("assets")) {
  const pubAssets = "public/assets";
  if (!fs.existsSync(pubAssets)) fs.mkdirSync(pubAssets, { recursive: true });
  for (const f of fs.readdirSync("assets")) {
    fs.copyFileSync("assets/" + f, pubAssets + "/" + f);
  }
}

console.log("Built lamb-yipee.html & index.html (root + public):", (html.length / 1024).toFixed(1) + " KB");
