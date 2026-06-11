export type Category = 'coding' | 'career' | 'writing' | 'research' | 'roast' | 'creator';

export type ModelName = 'chatgpt' | 'claude' | 'gemini' | 'grok' | 'perplexity';

export type VoteChoice = 'A' | 'B' | 'C' | 'all_bad';

/** The three models used in every battle */
export const BATTLE_MODELS: ModelName[] = ['claude', 'chatgpt', 'gemini'];

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

export const CATEGORIES: Category[] = ['coding', 'career', 'writing', 'research', 'roast', 'creator'];

export const CATEGORY_LABELS: Record<Category, string> = {
	coding: 'Coding',
	career: 'Career',
	writing: 'Writing',
	research: 'Research',
	roast: 'Roast',
	creator: 'Creator'
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
	};
	is_daily: boolean;
	battle_date: string | null;
	created_at: string;
}

export interface VoteStats {
	total: number;
	A: number;
	B: number;
	C: number;
	all_bad: number;
	model_A_name: ModelName;
	model_B_name: ModelName;
	model_C_name: ModelName;
}

export interface RevealPayload {
	model_A_name: ModelName;
	model_B_name: ModelName;
	model_C_name: ModelName;
	your_choice: VoteChoice;
	model_guess_correct: boolean | null;
	crowd_prediction_correct: boolean | null;
	stats: VoteStats;
	insight: string;
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
	GEMINI_LOYALIST: 'Gemini Loyalist'
} as const;
