const fs = require("fs");
const path = require("path");

describe("Frontend XSS protections", () => {
  const renderingScripts = [
    "favorites.js",
    "film-detail.js",
    "dashboard.js",
    "admin-users.js",
    "admin-movies.js",
  ];

  it.each(renderingScripts)(
    "%s does not use HTML injection sinks",
    (fileName) => {
      const source = fs.readFileSync(
        path.resolve(process.cwd(), "public/js", fileName),
        "utf8",
      );

      expect(source).not.toMatch(/\.innerHTML\b/);
      expect(source).not.toMatch(/\.outerHTML\b/);
      expect(source).not.toMatch(/\.insertAdjacentHTML\b/);
      expect(source).not.toMatch(/document\.write\b/);
    },
  );
});
