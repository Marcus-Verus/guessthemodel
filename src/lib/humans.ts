/**
 * The human side of the Human-or-AI game.
 *
 * HONESTY RULE: every entry here must be genuinely written by a human.
 * Launch pool is verified historical writing (public domain / attested
 * short quotes). Each deck theme tells the AI to imitate the same style,
 * so era isn't a tell. User-submitted texts join the pool later.
 */

export interface HumanText {
	text: string;
	/** Shown on reveal: "Mark Twain, 1890s" */
	label: string;
}

export interface DeckTheme {
	id: string;
	/** Shown to players: the deck's flavor */
	label: string;
	/** The question framing shown above each text */
	tagline: string;
	humans: HumanText[];
	/** System prompt for generating the AI impostors in the same style */
	aiInstruction: string;
}

export const DECK_THEMES: DeckTheme[] = [
	{
		id: 'vintage-burns',
		label: 'Savage Burns',
		tagline: 'Some of these insults are 150 years old. Some were generated this week.',
		humans: [
			{ text: "I didn't attend the funeral, but I sent a nice letter saying I approved of it.", label: 'Mark Twain' },
			{ text: 'Some cause happiness wherever they go; others, whenever they go.', label: 'Oscar Wilde' },
			{ text: 'He has no enemies, but is intensely disliked by his friends.', label: 'Oscar Wilde' },
			{ text: 'I do not want people to be very agreeable, as it saves me the trouble of liking them a great deal.', label: 'Jane Austen, 1798' },
			{ text: 'He can compress the most words into the smallest idea of any man I ever met.', label: 'Abraham Lincoln' },
			{ text: 'This is not a novel to be tossed aside lightly. It should be thrown with great force.', label: 'Dorothy Parker' },
			{ text: "I've had a perfectly wonderful evening, but this wasn't it.", label: 'Groucho Marx' },
			{ text: "She looked as if she had been poured into her clothes and had forgotten to say 'when'.", label: 'P.G. Wodehouse' }
		],
		aiInstruction:
			'Write one savage, witty insult about a person, in the voice of a 19th-century wit like Twain or Wilde. One or two sentences, 10 to 30 words. No modern slang, no emojis, no quotation marks around it.'
	},
	{
		id: 'love-letters',
		label: 'Love Letters',
		tagline: 'Some of these were written by famous lovers. Some by a language model.',
		humans: [
			{ text: 'Ever thine. Ever mine. Ever ours.', label: 'Ludwig van Beethoven, 1812' },
			{ text: "You have absorb'd me. I have a sensation at the present moment as though I was dissolving.", label: 'John Keats, 1819' },
			{ text: "I awake full of you. Your image and the memory of last night's intoxicating pleasures has left no rest to my senses.", label: 'Napoleon Bonaparte, 1795' },
			{ text: 'I cannot exist without you. I am forgetful of every thing but seeing you again.', label: 'John Keats, 1819' },
			{ text: "You still fascinate and inspire me. You influence me for the better. You're the object of my desire, the #1 earthly reason for my existence.", label: 'Johnny Cash to June, 1994' },
			{ text: 'Whatever our souls are made of, his and mine are the same.', label: 'Emily Brontë, 1847' }
		],
		aiInstruction:
			'Write one or two swooning sentences from a love letter, in the voice of a 19th-century romantic. 10 to 35 words. Sincere, not parody. No modern slang, no emojis.'
	},
	{
		id: 'cynical-definitions',
		label: 'Cynical Dictionary',
		tagline: "Some of these definitions are from a real 1906 book. Some are fresh out of a datacenter.",
		humans: [
			{ text: 'Love, n. A temporary insanity curable by marriage.', label: 'Ambrose Bierce, 1906' },
			{ text: 'Bore, n. A person who talks when you wish him to listen.', label: 'Ambrose Bierce, 1906' },
			{ text: 'Acquaintance, n. A person whom we know well enough to borrow from, but not well enough to lend to.', label: 'Ambrose Bierce, 1906' },
			{ text: 'Egotist, n. A person of low taste, more interested in himself than in me.', label: 'Ambrose Bierce, 1906' },
			{ text: 'Year, n. A period of three hundred and sixty-five disappointments.', label: 'Ambrose Bierce, 1906' },
			{ text: 'Calamity, n. A more than commonly plain and unmistakable reminder that the affairs of this life are not of our own ordering.', label: 'Ambrose Bierce, 1906' }
		],
		aiInstruction:
			"Write one cynical dictionary definition of an everyday word, in the exact style of Ambrose Bierce's Devil's Dictionary. Format: Word, n. definition. 8 to 25 words. Dry, biting, no emojis."
	}
];
