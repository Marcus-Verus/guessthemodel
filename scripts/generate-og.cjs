#!/usr/bin/env node
// Generates static/og.png — run once with: node scripts/generate-og.js
const { createCanvas, registerFont } = require('canvas');
const fs = require('fs');
const path = require('path');

const W = 1200;
const H = 630;
const canvas = createCanvas(W, H);
const ctx = canvas.getContext('2d');

// Background
ctx.fillStyle = '#0D1117';
ctx.fillRect(0, 0, W, H);

// Subtle grid pattern
ctx.strokeStyle = '#161B22';
ctx.lineWidth = 1;
for (let x = 0; x <= W; x += 60) {
  ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
}
for (let y = 0; y <= H; y += 60) {
  ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
}

// Left accent bar
ctx.fillStyle = '#C3F73A';
ctx.fillRect(80, 160, 6, 310);

// Main title
ctx.fillStyle = '#FFFFFF';
ctx.font = 'bold 72px sans-serif';
ctx.fillText('GuessTheModel', 116, 260);

// Tagline
ctx.fillStyle = '#C3F73A';
ctx.font = 'bold 32px sans-serif';
ctx.fillText('Can you tell which AI wrote this?', 116, 320);

// Sub-tagline
ctx.fillStyle = '#8B949E';
ctx.font = '24px sans-serif';
ctx.fillText('Vote blind · Guess the model · See if the crowd agrees', 116, 370);

// Bottom tag
ctx.fillStyle = '#30363D';
ctx.fillRect(116, 415, 220, 50);
ctx.fillStyle = '#C3F73A';
ctx.font = 'bold 18px sans-serif';
ctx.fillText('guessthemodel.com', 130, 447);

// Decorative model boxes on right
const models = ['ChatGPT', 'Claude', 'Gemini', 'Grok', 'Perplexity'];
const colors = ['#10A37F', '#D4A87B', '#4285F4', '#FFFFFF', '#20B2AA'];
models.forEach((m, i) => {
  const x = 780;
  const y = 160 + i * 68;
  ctx.fillStyle = '#161B22';
  ctx.fillRect(x, y, 320, 52);
  ctx.strokeStyle = colors[i] + '80';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(x, y, 320, 52);
  ctx.fillStyle = colors[i];
  ctx.font = 'bold 18px sans-serif';
  ctx.fillText(m, x + 16, y + 33);
});

const out = path.resolve(__dirname, '../static/og.png');
fs.writeFileSync(out, canvas.toBuffer('image/png'));
console.log('Generated', out);
