/* QA build: lamb-yipee.html + injected gauntlet runner -> qa/index.html
   Run: node qa/build.js   (after node build.js) */
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const game = fs.readFileSync(path.join(root, "lamb-yipee.html"), "utf8");
const runner = fs.readFileSync(path.join(__dirname, "runner.js"), "utf8");

const inject = "<script>\n" + runner + "\n</script>\n</body>";
if (!game.includes("</body>")) { console.error("no </body> in built game"); process.exit(1); }
const out = game.replace("</body>", () => inject);

fs.writeFileSync(path.join(__dirname, "index.html"), out);
console.log("QA build -> qa/index.html (" + (out.length / 1024).toFixed(1) + " KB)");
