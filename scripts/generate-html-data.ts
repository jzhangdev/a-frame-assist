import marked, { Tokens } from "marked";
import fs from "node:fs/promises";
import path from "node:path";
import jsonfile from "jsonfile";

const docsPath = path.resolve(__dirname, "../node_modules/aframe/docs/");

(async () => {
  const primitivesDocs = await fs.readdir(path.resolve(docsPath, "primitives"));
  const primitivesDocsPaths = primitivesDocs.map((filename) => ({
    filename,
    path: path.resolve(docsPath, `primitives/${filename}`),
  }));

  const generateTagsPromises = primitivesDocsPaths.map(
    async ({ filename, path }) => {
      const file = await fs.readFile(path);
      const tokens = marked.lexer(file.toString());
      console.log(tokens);

      const table = tokens.find(
        (token) => token.type === "table"
      ) as Tokens.Table;

      const attributes = table?.rows.map(
        ([attribute, componentMapping, defaultValue]) => {
          return {
            name: attribute.text,
            values: defaultValue
              ? [
                  {
                    name: defaultValue.text,
                  },
                ]
              : [],
            description: `Component Mapping: ${componentMapping.text}`,
          };
        }
      );

      return {
        name: filename.replace(".md", ""),
        description: file.toString(),
        attributes,
      };
    }
  );

  const tags = await Promise.all(generateTagsPromises);

  const htmlDataJson = {
    version: 1.1,
    tags,
  };

  await jsonfile.writeFile("a-frame.html-data.json", htmlDataJson, {
    spaces: 2,
  });
})();
