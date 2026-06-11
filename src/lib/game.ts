/** Client-side game record keeping (localStorage). */

export interface GameRecord {
	date: string; // YYYY-MM-DD
	battle_id: string;
	score: number;
	out_of: number;
}

const HISTORY_KEY = 'gtm_v2_history';

export function loadHistory(): GameRecord[] {
	try {
		const raw = localStorage.getItem(HISTORY_KEY);
		const parsed = raw ? JSON.parse(raw) : [];
		return Array.isArray(parsed) ? parsed : [];
	} catch {
		return [];
	}
}

export function recordGame(rec: GameRecord): GameRecord[] {
	const history = loadHistory();
	if (history.some((h) => h.battle_id === rec.battle_id)) return history;
	const next = [...history, rec].slice(-365);
	try {
		localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
	} catch {
		/* storage full or unavailable */
	}
	return next;
}

export function computeStreaks(history: GameRecord[]): { current: number; max: number } {
	const dates = [...new Set(history.map((h) => h.date))].sort();
	if (dates.length === 0) return { current: 0, max: 0 };

	const dayMs = 86_400_000;
	let max = 1;
	let run = 1;
	for (let i = 1; i < dates.length; i++) {
		const gap = (Date.parse(dates[i]) - Date.parse(dates[i - 1])) / dayMs;
		run = gap === 1 ? run + 1 : 1;
		if (run > max) max = run;
	}

	// current streak must reach today or yesterday
	const today = new Date().toISOString().slice(0, 10);
	const last = dates[dates.length - 1];
	const sinceLast = (Date.parse(today) - Date.parse(last)) / dayMs;
	const current = sinceLast <= 1 ? run : 0;

	return { current, max };
}

export function scoreTitle(score: number, outOf: number): string {
	if (outOf <= 0) return '';
	const r = score / outOf;
	if (r === 1) return 'Model Whisperer';
	if (r >= 0.6) return 'Sharp Eye';
	if (r >= 0.4) return 'Decent Read';
	if (r > 0) return 'Mostly Fooled';
	return 'Perfectly Fooled';
}

export function emojiGrid(correct: boolean[]): string {
	return correct.map((c) => (c ? '🟩' : '⬛')).join('');
}

export function buildShareText(opts: {
	battleNumber?: number;
	score: number;
	outOf: number;
	correct: boolean[];
	streak: number;
	title?: string;
	tagline?: string;
}): string {
	const { battleNumber, score, outOf, correct, streak, title, tagline } = opts;
	const lines = [
		`GuessTheModel ${battleNumber ? `#${battleNumber} ` : ''}${score}/${outOf}`,
		emojiGrid(correct)
	];
	if (title) lines.push(title);
	if (streak >= 2) lines.push(`🔥 ${streak}-day streak`);
	lines.push(tagline ?? 'Can you tell ChatGPT from Claude?', 'https://guessthemodel.com');
	return lines.join('\n');
}

/** Titles for the Human-or-AI game. The insults are the share bait. */
export function deckTitle(score: number, outOf: number): string {
	if (outOf <= 0) return '';
	if (score === outOf) return 'Bot Detector';
	if (score === 0) return 'Perfectly Backwards';
	const r = score / outOf;
	if (r >= 0.8) return 'Sharp Eye';
	if (r >= 0.6) return 'Decent Radar';
	if (r >= 0.45) return 'Coin Flipper';
	return 'Certified NPC';
}
