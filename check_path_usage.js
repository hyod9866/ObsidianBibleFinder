const fs = require('fs');
const content = fs.readFileSync('C:\\Users\\D-kanghyodgeun\\.gemini\\antigravity\\scratch\\obsidian-bible-bethlehem\\main.ts', 'utf8');
const lines = content.split('\n');
lines.forEach((line, idx) => {
    if (line.includes('path.')) {
        console.log(`${idx + 1}: ${line}`);
    }
});
