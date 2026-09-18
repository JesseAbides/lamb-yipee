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
console.log("Built lamb-yipee.html & index.html:", (html.length / 1024).toFixed(1) + " KB");
