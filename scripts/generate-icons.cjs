// Generates app icons into static/: icon-192.png, icon-512.png, apple-touch-icon.png
// Run: node scripts/generate-icons.cjs
const fs = require('fs');
const path = require('path');
const { createCanvas, registerFont } = require('canvas');

registerFont(path.join(__dirname, '..', 'static', 'fonts', 'ArchivoBlack-Regular.ttf'), {
	family: 'Archivo Black'
});

const COBALT = '#1230BF';
const TAG = '#FFD200';

function icon(size, file) {
	const c = createCanvas(size, size);
	const ctx = c.getContext('2d');

	// Full-bleed cobalt (works as a maskable icon — glyph stays in the safe zone).
	ctx.fillStyle = COBALT;
	ctx.fillRect(0, 0, size, size);

	// Yellow "?" wordmark, matching the favicon.
	ctx.fillStyle = TAG;
	ctx.textAlign = 'center';
	ctx.textBaseline = 'middle';
	ctx.font = `${Math.round(size * 0.6)}px "Archivo Black"`;
	ctx.fillText('?', size / 2, size * 0.54);

	const out = path.join(__dirname, '..', 'static', file);
	fs.writeFileSync(out, c.toBuffer('image/png'));
	console.log('Wrote', file, `(${size}x${size})`);
}

icon(192, 'icon-192.png');
icon(512, 'icon-512.png');
icon(180, 'apple-touch-icon.png');
