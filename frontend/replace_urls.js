const fs = require("fs");
const path = require("path");

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = dir + "/" + file;
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) { 
      results = results.concat(walk(file));
    } else { 
      if (file.endsWith(".tsx") || file.endsWith(".ts")) results.push(file);
    }
  });
  return results;
}

const files = walk("./src");
const targetUrl = "process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'";

files.forEach(file => {
  let content = fs.readFileSync(file, "utf8");
  let modified = false;

  if (content.includes("http://localhost:3001")) {
    modified = true;
    content = content.replace(/"http:\/\/localhost:3001([^"]*)"/g, "`\\${" + targetUrl + "}$1`");
    content = content.replace(/`http:\/\/localhost:3001([^`]*)`/g, "`\\${" + targetUrl + "}$1`");
    content = content.replace(/\x27http:\/\/localhost:3001([^\x27]*)\x27/g, "`\\${" + targetUrl + "}$1`");
    
    // Fix io("...") calls to not use template literals if they have no path
    content = content.replace(/io\(`\$\{process\.env\.NEXT_PUBLIC_API_URL \|\| 'http:\/\/localhost:3001'\}\`/g, "io(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'");
    
    fs.writeFileSync(file, content);
    console.log("Updated:", file);
  }
});
