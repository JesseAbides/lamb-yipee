/* Builds a fully self-contained lamb-yipee.html (inlines CSS + JS + base64 avatars).
   Run:  node build.js */
const fs = require("fs");
const path = require("path");

function copyDirRecursive(src, dest) {
  if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDirRecursive(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

function toBase64Uri(filePath, mime = "image/jpeg") {
  if (fs.existsSync(filePath)) {
    const b64 = fs.readFileSync(filePath).toString("base64");
    return `data:${mime};base64,${b64}`;
  }
  return "";
}

let html = fs.readFileSync("index.src.html", "utf8");
const css = fs.readFileSync("css/style.css", "utf8");
const verses = fs.readFileSync("js/verses.js", "utf8");
const engine = fs.readFileSync("js/engine.js", "utf8");
let lamb = fs.readFileSync("js/lamb.js", "utf8");
const main = fs.readFileSync("js/main.js", "utf8");

// Inline avatar base64 images into lamb.js
const avatars = {
  "/*__IMG_CAPYBARA__*/": toBase64Uri("assets/avatars/capybara.jpg"),
  "/*__IMG_NINJA_FOX__*/": toBase64Uri("assets/avatars/ninja_fox.jpg"),
  "/*__IMG_SCHOLAR_TURTLE__*/": toBase64Uri("assets/avatars/scholar_turtle.jpg"),
  "/*__IMG_GAMER_PANDA__*/": toBase64Uri("assets/avatars/gamer_panda.jpg"),
  "/*__IMG_BARISTA_OTTER__*/": toBase64Uri("assets/avatars/barista_otter.jpg"),
  "/*__IMG_DETECTIVE_CAT__*/": toBase64Uri("assets/avatars/detective_cat.jpg"),
  "/*__IMG_CHEF_BUNNY__*/": toBase64Uri("assets/avatars/chef_bunny.jpg"),
  "/*__IMG_LOFI_HAMSTER__*/": toBase64Uri("assets/avatars/lofi_hamster.jpg"),
  "/*__IMG_ROCKSTAR_PARROT__*/": toBase64Uri("assets/avatars/rockstar_parrot.jpg"),
  "/*__IMG_ASTRO_CORGI__*/": toBase64Uri("assets/avatars/astro_corgi.jpg")
};

for (const [placeholder, dataUri] of Object.entries(avatars)) {
  if (dataUri) {
    lamb = lamb.replace(placeholder, () => dataUri);
  }
}

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

// Copy assets recursively to public/assets
if (fs.existsSync("assets")) {
  copyDirRecursive("assets", "public/assets");
}

console.log("Built lamb-yipee.html & index.html (root + public):", (html.length / 1024).toFixed(1) + " KB");
