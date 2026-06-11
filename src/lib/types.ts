export type Category = 'coding' | 'career' | 'writing' | 'research' | 'roast' | 'creator' | 'meta' | 'opinion';

export type ModelName = 'chatgpt' | 'claude' | 'gemini' | 'grok' | 'perplexity';

export type VoteChoice = 'A' | 'B' | 'C' | 'D' | 'E' | 'all_bad';

/** A display slot — what players see. Order is shuffled server-side per battle. */
export type Slot = 'A' | 'B' | 'C' | 'D' | 'E';

export const ALL_SLOTS: Slot[] = ['A', 'B', 'C', 'D', 'E'];

/** Player's tag for each display slot */
export type GuessMap = Partial<Record<Slot, ModelName>>;

export const BATTLE_MODELS: ModelName[] = ['claude', 'chatgpt', 'gemini', 'grok', 'perplexity'];

export const MODEL_LABELS: Record<ModelName, string> = {
	chatgpt: 'ChatGPT',
	claude: 'Claude',
	gemini: 'Gemini',
	grok: 'Grok',
	perplexity: 'Perplexity'
};

export const MODEL_COLORS: Record<ModelName, string> = {
	chatgpt: '#10A37F',
	claude: '#D4A87B',
	gemini: '#4285F4',
	grok: '#FFFFFF',
	perplexity: '#20B2AA'
};

/** Maps OpenRouter model_id → human-readable version label shown on reveal */
export const MODEL_VERSION_LABELS: Record<string, string> = {
	// current lineup
	'anthropic/claude-opus-4.8': 'Claude Opus 4.8',
	'openai/gpt-5.5': 'GPT-5.5',
	'google/gemini-3.1-pro-preview': 'Gemini 3.1 Pro',
	'x-ai/grok-4.3': 'Grok 4.3',
	'perplexity/sonar-pro': 'Perplexity Sonar Pro',
	// legacy ids kept for archive battles
	'anthropic/claude-sonnet-4-5': 'Claude Sonnet 4.5',
	'anthropic/claude-sonnet-4-6': 'Claude Sonnet 4.6',
	'anthropic/claude-opus-4-8': 'Claude Opus 4.8',
	'anthropic/claude-haiku-4-5': 'Claude Haiku 4.5',
	'openai/gpt-4o': 'GPT-4o',
	'openai/gpt-4o-mini': 'GPT-4o mini',
	'openai/gpt-4.1': 'GPT-4.1',
	'google/gemini-pro-1.5': 'Gemini 1.5 Pro',
	'google/gemini-2.0-flash-001': 'Gemini 2.0 Flash',
	'google/gemini-2.5-pro': 'Gemini 2.5 Pro',
	'x-ai/grok-2-1212': 'Grok 2',
	'x-ai/grok-3': 'Grok 3',
	'perplexity/llama-3.1-sonar-large-128k-online': 'Perplexity Sonar Large'
};

export const CATEGORIES: Category[] = ['coding', 'career', 'writing', 'research', 'roast', 'creator', 'meta', 'opinion'];

export const CATEGORY_LABELS: Record<Category, string> = {
	coding: 'Coding',
	career: 'Career',
	writing: 'Writing',
	research: 'Research',
	roast: 'Roast',
	creator: 'Creator',
	meta: 'Meta',
	opinion: 'Opinion'
};

export interface BattleOutput {
	text: string;
	model_id: string;
}

export interface Battle {
	id: string;
	prompt: string;
	category: Category;
	outputs: {
		modelA: BattleOutput;
		modelB: BattleOutput;
		modelC: BattleOutput;
		modelD?: BattleOutput;
		modelE?: BattleOutput;
	};
	is_daily: boolean;
	battle_date: string | null;
	created_at: string;
}

/** Stripped version sent to the browser — no model names until after vote */
export interface SafeBattle {
	id: string;
	prompt: string;
	category: Category;
	outputs: {
		modelA: { text: string };
		modelB: { text: string };
		modelC: { text: string };
		modelD?: { text: string };
		modelE?: { text: string };
	};
	is_daily: boolean;
	battle_date: string | null;
	created_at: string;
}

/** What each display slot actually was — revealed only after lock-in */
export interface SlotTruth {
	name: ModelName;
	model_id: string;
}

export interface CrowdStats {
	/** players who picked a favorite (excludes legacy all_bad votes) */
	players: number;
	/** favorite counts per display slot */
	fav: Partial<Record<Slot, number>>;
	/** players with a score (played the matching game) */
	scored_players: number;
	/** score_dist[n] = players who scored n */
	score_dist: number[];
}

export interface RevealPayload {
	truth: Partial<Record<Slot, SlotTruth>>;
	your_favorite: Slot;
	your_guesses: GuessMap;
	score: number;
	out_of: number;
	crowd: CrowdStats;
}

export interface GlobalStats {
	votes_cast: number;
	battles_run: number;
	models_tested: number;
}

export const PLAYER_TITLES = {
	MODEL_SNIPER: 'Model Sniper',
	CROWD_READER: 'Crowd Reader',
	BIAS_BREAKER: 'Bias Breaker',
	CLAUDE_LOYALIST: 'Claude Loyalist',
	CHATGPT_LOYALIST: 'ChatGPT Loyalist',
	GEMINI_LOYALIST: 'Gemini Loyalist',
	GROK_LOYALIST: 'Grok Loyalist',
	PERPLEXITY_LOYALIST: 'Perplexity Loyalist',
	ALL_BAD_CHAMPION: 'All Bad Champion'
} as const;
