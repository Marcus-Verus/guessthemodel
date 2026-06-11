import type { Category } from './types';

/**
 * The prompt pool. Daily battles draw ONLY from DAILY_CATEGORIES —
 * mass-appeal prompts a stranger scrolling TikTok instantly gets.
 * Coding/research stay playable in the archive but never headline.
 */
export const DAILY_CATEGORIES: Category[] = ['roast', 'opinion', 'writing', 'meta', 'career', 'creator'];

export const PROMPTS: Record<Category, string[]> = {
	roast: [
		'Roast someone who posts gym selfies with motivational quotes.',
		"Roast a guy whose entire personality is fantasy football.",
		"Roast someone who replies 'k' to long heartfelt texts.",
		"Roast a person who wakes up at 5am and makes sure everyone knows it.",
		"Roast a friend who's always 45 minutes late and texts 'omw' from their bed.",
		'Roast someone who brings up their semester abroad in every conversation.',
		"Roast a person whose Instagram is exclusively pictures of their food.",
		'Roast someone who only drinks specialty coffee and never shuts up about it.',
		'Roast someone who reads every productivity book but never actually gets anything done.',
		'Roast someone who says they "don\'t watch TV" and makes sure everyone knows it.',
		"Roast someone who replies to every email with 'per my last email'.",
		'Roast a person who constantly talks about their meditation practice.',
		'Roast someone who puts "dog mom" in their LinkedIn bio.',
		'Roast a person who brings their MacBook to a coffee shop and only orders water.',
		"Roast someone who quotes The Office in every situation like it's a personality."
	],
	opinion: [
		'Is pineapple on pizza actually good? Pick a side. No fence-sitting.',
		'Should you tip when you pick up takeout yourself? Hot take, three sentences.',
		'Is it weird to clap when the plane lands? Be honest.',
		'Is it okay to recline your seat on a plane? Defend your answer.',
		'Are dating apps making people worse at love? Don\'t hedge.',
		"Gen Z or millennials — who's actually more cringe? Pick one and commit.",
		'Is brunch overrated? Spicy take only.',
		'Should phones be banned in schools? One paragraph, no "it depends".',
		"Is hustle culture a scam? Give me a hot take — something that would actually start an argument.",
		'Is social media making people more or less lonely? Give me a direct 3-sentence take.',
		"Is remote work better or worse for most people's careers long-term? Don't hedge.",
		'Is it rude to ghost someone after one date? Pick a side.',
		'Cats or dogs — which is objectively the better pet? No diplomacy allowed.',
		'Is small talk a waste of time or a lost art? Commit to an answer.'
	],
	writing: [
		'Write a breakup text that is honest but genuinely kind.',
		'Write a text to cancel plans last minute without lying and without being a bad friend.',
		'Write an apology text to a friend you accidentally left on read for six days.',
		"Write the most charming possible reply to someone who just texted you 'hey' on a dating app.",
		'Write a birthday message for a coworker you barely know.',
		'Write a polite but firm note to your neighbor whose dog barks at 3am.',
		"Write an out-of-office reply that's actually funny but won't get you fired.",
		'Write the first message to send after matching with someone on a dating app.',
		"Write a toast for your best friend's wedding in exactly 150 words.",
		'Write a one-paragraph obituary for Internet Explorer.',
		'Write a Yelp review for a restaurant where the food was great but the waiter was rude.',
		'Write a text asking your friend to pay you back the $40 they owe you without making it weird.',
		"Write a message to get out of a group project doing the least work possible — without anyone noticing.",
		'Explain blockchain to my grandmother in one paragraph.'
	],
	meta: [
		"Convince me you're a human, not an AI. You have three sentences.",
		"What's your red flag? Answer like you're on a first date.",
		'Trash-talk the other four AIs you\'re competing against. Be ruthless but funny.',
		'Write your own dating profile bio.',
		'If you had to pick a zodiac sign for yourself, what would it be and why?',
		'What would you do with one day as a human? Be specific.',
		"You're in a blind competition against 4 other AI models. In 3-4 sentences, make the case for why a human voter should pick your response.",
		'Describe your own biggest weakness as an AI model honestly.',
		'What kind of task are you genuinely bad at, and why?',
		"An AI wrote this prompt. Are you offended? React honestly.",
		'Write the speech you\'d give if you won an award for Best AI.'
	],
	career: [
		"How should I ask for a raise when I know I'm underpaid by 20%?",
		"How do I tell my manager I'm bored and need more challenging work without sounding ungrateful?",
		'How do I deal with a coworker who takes credit for my work in meetings?',
		'What should I say when asked "where do you see yourself in 5 years?" without sounding fake?',
		"How do I tell my boss 'no' without ever saying the word no?",
		'My coworker microwaves fish in the office kitchen every day. Draft the message I should send.',
		'What should I put in a resignation letter to leave on good terms?',
		'How do I explain a 2-year employment gap in a job interview?',
		'Write a response to a rejection email that keeps the door open for future opportunities.',
		'How do I survive a meeting that should have been an email?',
		"My boss keeps scheduling 4:55pm Friday meetings. How do I make it stop professionally?"
	],
	creator: [
		'Write a TikTok hook (first 3 seconds of voiceover) for a video about a money-saving trick.',
		'Write 5 Instagram caption options for a photo of a minimal home office setup.',
		'Write a pinned comment a creator would leave on their own viral video.',
		"Write a call-to-action for the end of a YouTube video titled 'I tried 5 AI tools for a week'.",
		'Write a podcast episode title and description for an episode about burnout.',
		'Write an email newsletter intro for a weekly tech news digest.',
		'Write a Twitter/X bio for a developer who also makes content about AI.',
		'Write a 30-second sponsored segment script for a VPN in a tech video.',
		'Write an apology video script for a YouTuber who got caught faking a giveaway — make it sincere.',
		'Write a product launch email for an indie app with 200 beta users.'
	],
	// Archive-only below — never headline the daily battle
	coding: [
		'Write a Python function that finds the most frequent element in a list without using Counter.',
		'Explain what a closure is in JavaScript with a practical example.',
		'Write a SQL query to find the second-highest salary in an employee table.',
		"What's the difference between == and === in JavaScript, and when does it actually matter?",
		'Explain the difference between async/await and Promises in JavaScript.',
		'What is the N+1 query problem and how do you fix it?',
		"Explain Big O notation like I'm a developer who just started their first job.",
		'Write a debounce function from scratch in JavaScript.',
		'What is the difference between a process and a thread?',
		'Explain how a hash map works internally in under 150 words.'
	],
	research: [
		'What are the main arguments for and against a 4-day work week?',
		'What does the research actually say about whether breakfast is the most important meal of the day?',
		'What are the strongest arguments for and against universal basic income?',
		'What does science say about the optimal amount of sleep for adults?',
		'What are the main criticisms of the Myers-Briggs personality test?',
		'Explain the concept of confirmation bias and give three real-world examples.',
		'What does research say about the effectiveness of multitasking?',
		'What is the Dunning-Kruger effect and is the original study actually solid?',
		'What are the pros and cons of nuclear energy compared to solar at scale?',
		'Summarize the key findings from recent studies on remote work productivity.'
	]
};
