const fs = require('fs');
const path = require('path');

const directories = [
  'c:/Users/TheGoat/Desktop/project/frontend/src/pages',
  'c:/Users/TheGoat/Desktop/project/frontend/src/components'
];
const ignoreRegex = /Landing|login|register/i;

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let original = content;

  // Backgrounds: turn white and cream into dark grey cards
  content = content.replace(/\bbg-white(?:(?![\/\w-]))/g, 'bg-[#1A1A1A]');
  content = content.replace(/\bbg-\[\#F7F5F2\]/gi, 'bg-[#141414]');
  content = content.replace(/\bbg-\[\#FFFFFF\]/gi, 'bg-[#1A1A1A]');
  content = content.replace(/\bbg-\[\#F4EFE9\]/gi, 'bg-[#262626]');

  // Colors that are semi-transparent white (e.g. bg-white/10) to dark overlays
  content = content.replace(/\bbg-white\/(\d+)/g, 'bg-[#333333]');
  
  // Text: turn dark text (for light cards) into light text (for dark cards)
  content = content.replace(/\btext-\[\#1A1612\]/gi, 'text-[#E5E5E5]');
  content = content.replace(/\btext-\[\#6B6158\]/gi, 'text-[#A3A3A3]');
  content = content.replace(/\btext-\[\#8F857B\]/gi, 'text-[#737373]');
  content = content.replace(/\btext-\[\#A89E94\]/gi, 'text-[#737373]');

  // Borders: turn light borders into dark borders
  content = content.replace(/\bborder-\[\#E5E0D8\]/gi, 'border-[#262626]');
  content = content.replace(/\bborder-\[\#F7F5F2\]/gi, 'border-[#333333]');
  content = content.replace(/\bborder-white(?:\/\d+)?\b/gi, 'border-[#262626]');

  // In styles and hex codes
  content = content.replace(/"#1A1612"/gi, '"#E5E5E5"');
  content = content.replace(/"#F7F5F2"/gi, '"#1A1A1A"');
  content = content.replace(/"#E5E0D8"/gi, '"#262626"');
  content = content.replace(/backgroundColor:\s*"white"/gi, 'backgroundColor: "#1A1A1A"');
  content = content.replace(/backgroundColor:\s*"#FFFFFF"/gi, 'backgroundColor: "#1A1A1A"');

  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated ${filePath}`);
  }
}

function traverse(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      traverse(fullPath);
    } else if (fullPath.endsWith('.jsx')) {
      if (!ignoreRegex.test(fullPath)) {
        processFile(fullPath);
      }
    }
  }
}

directories.forEach(traverse);
console.log('Done transforming to dark mode grey equivalents.');
