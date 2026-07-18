const fs = require('fs');
const path = require('path');

function processDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDir(fullPath);
    } else if (fullPath.endsWith('.js') || fullPath.endsWith('.css')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      
      // Remove block comments /* ... */
      content = content.replace(/\/\*[\s\S]*?\*\//g, '');
      
      // Remove inline JSX comments {/* ... */}
      content = content.replace(/\{\s*\/\*[\s\S]*?\*\/\s*\}/g, '');
      
      // Remove single line comments // ... but NOT inside URLs (http://)
      content = content.replace(/(?<!https?:)\/\/.*$/gm, '');
      
      // Clean up multiple blank lines
      content = content.replace(/\n\s*\n\s*\n/g, '\n\n');
      
      fs.writeFileSync(fullPath, content);
      console.log('Stripped comments from: ' + fullPath);
    }
  }
}

processDir('/home/yadavnikhil03/Downloads/Pulseroom/client/src');
