const fs = require("fs");

const readHTMLTemplate = (templateName, replacements) => {
  let template = fs.readFileSync(templateName, { encoding: "utf-8" });

  for (const [placeholder, value] of Object.entries(replacements)) {
    template = template.replace(
      new RegExp("{{ " + placeholder + " }}", "g"),
      value
    );
  }
  return template;
};

module.exports = readHTMLTemplate;
