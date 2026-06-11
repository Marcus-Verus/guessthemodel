import type { Battle, SafeBattle, Slot, SlotTruth } from '$lib/types';
import { modelIdToName } from './stats';

type OutputKey = 'modelA' | 'modelB' | 'modelC' | 'modelD' | 'modelE';

const SLOTS: Slot[] = ['A', 'B', 'C', 'D', 'E'];
const OUTPUT_KEYS: OutputKey[] = ['modelA', 'modelB', 'modelC', 'modelD', 'modelE'];

function seedFromId(id: string): number {
	let h = 2166136261;
	for (const c of id) {
		h ^= c.charCodeAt(0);
		h = Math.imul(h, 16777619);
	}
	return h >>> 0;
}

/**
 * Deterministic per-battle ordering of output keys, seeded by battle id.
 * Every visitor sees the same shuffled order — the daily puzzle is shared —
 * but the DB keeps its canonical layout (modelA = Claude, modelB = ChatGPT, …)
 * so historical vote data stays consistent.
 */
export function displayOrder(battle: Pick<Battle, 'id' | 'outputs'>): OutputKey[] {
	const outputs = battle.outputs as Record<string, unknown>;
	const present = OUTPUT_KEYS.filter((k) => outputs[k]);
	let s = seedFromId(battle.id);
	const a = [...present];
	for (let i = a.length - 1; i > 0; i--) {
		s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
		const j = s % (i + 1);
		[a[i], a[j]] = [a[j], a[i]];
	}
	return a;
}

/** Display slots present for a battle (A.. up to E) */
export function displaySlots(battle: Pick<Battle, 'id' | 'outputs'>): Slot[] {
	return SLOTS.slice(0, displayOrder(battle).length);
}

/** Strip model ids and re-key outputs into display order. Safe to send to the browser. */
export function toSafe(battle: Battle): SafeBattle {
	const order = displayOrder(battle);
	const outputs: SafeBattle['outputs'] = { modelA: { text: '' }, modelB: { text: '' }, modelC: { text: '' } };
	order.forEach((key, i) => {
		outputs[OUTPUT_KEYS[i]] = { text: battle.outputs[key]!.text };
	});
	return { ...battle, outputs };
}

/** Display slot → canonical slot (the letter stored in the votes table) */
export function displayToCanonical(battle: Pick<Battle, 'id' | 'outputs'>, slot: Slot): Slot {
	const order = displayOrder(battle);
	const key = order[SLOTS.indexOf(slot)];
	return SLOTS[OUTPUT_KEYS.indexOf(key)];
}

/** Canonical slot → display slot */
export function canonicalToDisplay(battle: Pick<Battle, 'id' | 'outputs'>, canonical: Slot): Slot {
	const order = displayOrder(battle);
	const key = OUTPUT_KEYS[SLOTS.indexOf(canonical)];
	return SLOTS[order.indexOf(key)];
}

/** What model actually sits behind each display slot */
export function truthBySlot(battle: Pick<Battle, 'id' | 'outputs'>): Partial<Record<Slot, SlotTruth>> {
	const order = displayOrder(battle);
	const truth: Partial<Record<Slot, SlotTruth>> = {};
	order.forEach((key, i) => {
		const out = (battle.outputs as Record<string, { model_id: string } | undefined>)[key];
		if (out) truth[SLOTS[i]] = { name: modelIdToName(out.model_id), model_id: out.model_id };
	});
	return truth;
}
