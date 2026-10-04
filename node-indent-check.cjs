const fs = require('fs');
function show(path, lines) {
  const arr = fs.readFileSync(path, 'utf8').split('\n');
  console.log(`== ${path} ==`);
  for (const n of lines) {
    if (n < 0 || n >= arr.length) continue;
    const s = arr[n];
    let i = 0;
    while (i < s.length && (s[i] === ' ' || s[i] === '\t')) i++;
    console.log(`${String(n + 1).padStart(3)}: indent=${i} | ${JSON.stringify(s.slice(i, i + 75))}`);
  }
}
show('src/app/display/context/DebugContext.tsx', [260, 261, 262, 435, 436, 437, 438, 439, 440, 441, 442, 443]);
