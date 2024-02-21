const fs = require('fs');

const readHTMLTemplate = (templateName, replacement, value) => {
  let template = fs.readFileSync(templateName, { encoding: "utf-8" });
  template = template.replace(
    new RegExp("{{ " + replacement + " }}", "g"),
    value
  );
  return template;
};

module.exports = readHTMLTemplate;