// Generates static/og.png (1200x630) — the duped.gg social share card.
// Run: node scripts/generate-og.cjs
const fs = require('fs');
const path = require('path');
const { createCanvas } = require('canvas');

const W = 1200;
const H = 630;
const COBALT = '#1230BF';
const COBALT_DEEP = '#0B1F86';
const TAG = '#FFD200';
const INK = '#14171F';

const canvas = createCanvas(W, H);
const ctx = canvas.getContext('2d');

// Background — radial wash matching the app.
const bg = ctx.createRadialGradient(W * 0.5, -80, 80, W * 0.5, H * 0.4, 900);
bg.addColorStop(0, '#2647E8');
bg.addColorStop(0.45, COBALT);
bg.addColorStop(1, COBALT_DEEP);
ctx.fillStyle = bg;
ctx.fillRect(0, 0, W, H);

// Starburst badge (same 24-point shape as the in-game burst).
const BURST_PTS = [
	[50, 0], [61, 12], [76, 6], [80, 22], [96, 24], [91, 39], [100, 50], [91, 61],
	[96, 76], [80, 78], [76, 94], [61, 88], [50, 100], [39, 88], [24, 94], [20, 78],
	[4, 76], [9, 61], [0, 50], [9, 39], [4, 24], [20, 22], [24, 6], [39, 12]
];

function starburst(cx, cy, size, rotation) {
	ctx.save();
	ctx.translate(cx, cy);
	ctx.rotate(rotation);
	ctx.beginPath();
	BURST_PTS.forEach(([px, py], i) => {
		const x = (px / 100 - 0.5) * size;
		const y = (py / 100 - 0.5) * size;
		if (i === 0) ctx.moveTo(x, y);
		else ctx.lineTo(x, y);
	});
	ctx.closePath();
	ctx.fillStyle = TAG;
	ctx.shadowColor = 'rgba(0,0,0,0.35)';
	ctx.shadowBlur = 30;
	ctx.shadowOffsetY = 14;
	ctx.fill();
	ctx.restore();
}

const badgeX = 960;
const badgeY = 300;
starburst(badgeX, badgeY, 360, -0.12);

// Badge label.
ctx.shadowColor = 'transparent';
ctx.textAlign = 'center';
ctx.fillStyle = INK;
ctx.font = 'bold 26px sans-serif';
ctx.fillText('REAL OR', badgeX, badgeY - 28);
ctx.font = 'bold 92px sans-serif';
ctx.fillText('AI?', badgeX, badgeY + 56);

// Left-hand text block.
ctx.textAlign = 'left';

ctx.fillStyle = TAG;
ctx.font = 'bold 24px sans-serif';
ctx.fillText('R E A L   O R   A I ?   ·   D A I L Y   5   +   E N D L E S S', 92, 150);

ctx.fillStyle = '#FFFFFF';
ctx.font = 'bold 150px sans-serif';
ctx.fillText('DUPED', 88, 300);
const dupedWidth = ctx.measureText('DUPED').width;
ctx.fillStyle = TAG;
ctx.fillText('.', 88 + dupedWidth + 4, 300);

ctx.fillStyle = '#C9D2FF';
ctx.font = '38px sans-serif';
ctx.fillText('Ridiculous products. Some are really on Amazon.', 92, 380);
ctx.fillText('Some an AI invented thirty seconds ago.', 92, 430);

ctx.fillStyle = TAG;
ctx.font = 'bold 40px sans-serif';
ctx.fillText('duped.gg', 92, 540);

const out = path.join(__dirname, '..', 'static', 'og.png');
fs.writeFileSync(out, canvas.toBuffer('image/png'));
console.log('Wrote', out, `(${W}x${H})`);
