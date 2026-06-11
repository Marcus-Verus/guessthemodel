import type { Category } from './types';

export const PROMPTS: Record<Category, string[]> = {
	coding: [
		'Write a Python function that finds the most frequent element in a list without using Counter.',
		'Explain what a closure is in JavaScript with a practical example.',
		'Write a SQL query to find the second-highest salary in an employee table.',
		"What's the difference between == and === in JavaScript, and when does it actually matter?",
		'Write a regex that validates a US phone number in any common format.',
		'Explain the difference between async/await and Promises in JavaScript.',
		'Write a function to check if a string is a palindrome without using reverse().',
		'What is the N+1 query problem and how do you fix it?',
		"Explain Big O notation like I'm a developer who just started their first job.",
		'Write a debounce function from scratch in JavaScript.',
		'What is the difference between a process and a thread?',
		'Explain how a hash map works internally in under 150 words.'
	],
	career: [
		"How should I ask for a raise when I know I'm underpaid by 20%?",
		'Write a LinkedIn summary for a software engineer with 5 years of experience switching to product management.',
		"How do I tell my manager I'm bored and need more challenging work without sounding ungrateful?",
		'What questions should I ask at the end of a job interview for a senior engineer role?',
		'How do I negotiate salary when the company asks for my current salary first?',
		'Write a cold outreach message to a senior engineer at a company I want to work at.',
		"How do I handle a performance review where I disagree with my manager's assessment?",
		'What should I put in a resignation letter to leave on good terms?',
		'How do I explain a 2-year employment gap in a job interview?',
		'Write a response to a rejection email that keeps the door open for future opportunities.',
		'How do I deal with a coworker who takes credit for my work in meetings?',
		'What should I say when asked "where do you see yourself in 5 years?" without sounding fake?'
	],
	writing: [
		'Write the opening paragraph of a thriller set in a near-future city where AI surveillance is everywhere.',
		"Rewrite this to be more concise: 'Due to the fact that it was raining heavily outside, we made the decision to cancel the event.'",
		'Write a product description for a $300 mechanical keyboard targeted at developers.',
		'Write a breakup text that is honest but genuinely kind.',
		'Explain blockchain to my grandmother in one paragraph.',
		'Write a tweet thread (5 tweets) announcing a new developer tool launch.',
		'Write the first message to send after matching with someone on a dating app.',
		"Write a toast for your best friend's wedding in exactly 150 words.",
		"Rewrite 'We are excited to announce our new product launch' so it doesn't sound like corporate speak.",
		'Write a README intro for an open-source project that makes developers actually want to try it.',
		'Write a one-paragraph obituary for Internet Explorer.',
		"Write a Yelp review for a restaurant where the food was great but the waiter was rude."
	],
	research: [
		'What are the main arguments for and against a 4-day work week?',
		'Summarize the key differences between supervised and unsupervised machine learning.',
		'What does the research actually say about whether breakfast is the most important meal of the day?',
		'Explain the trolley problem and its relevance to AI ethics today.',
		'What are the strongest arguments for and against universal basic income?',
		'What does science say about the optimal amount of sleep for adults?',
		'Summarize the key findings from recent studies on remote work productivity.',
		'What are the main criticisms of the Myers-Briggs personality test?',
		'Explain the concept of confirmation bias and give three real-world examples.',
		'What does research say about the effectiveness of multitasking?',
		'What is the Dunning-Kruger effect and is the original study actually solid?',
		'What are the pros and cons of nuclear energy compared to solar at scale?'
	],
	roast: [
		'Roast someone who only drinks specialty coffee and never shuts up about it.',
		"Roast a developer who uses 'it works on my machine' as a final answer.",
		'Roast someone who reads every productivity book but never actually gets anything done.',
		"Roast a startup founder who's been 'building in stealth' for three years.",
		'Roast someone who puts "dog mom" in their LinkedIn bio.',
		"Roast a developer who refuses to write comments because 'the code is self-documenting'.",
		"Roast someone who replies to every email with 'per my last email'.",
		'Roast a person who constantly talks about their meditation practice.',
		'Roast someone who takes meeting notes with a fountain pen in a leather Moleskine.',
		"Roast a developer who's been meaning to refactor that legacy code for two years.",
		'Roast someone who says they "don\'t watch TV" and makes sure everyone knows it.',
		'Roast a person who brings their MacBook to a coffee shop and only orders water.'
	],
	creator: [
		'Write a YouTube description for a 10-minute tutorial on using ChatGPT for productivity.',
		'Write 5 Instagram caption options for a photo of a minimal home office setup.',
		'Write a TikTok hook (first 3 seconds of voiceover) for a video about a money-saving tip.',
		'Write an email newsletter intro for a weekly tech news digest.',
		'Write a Patreon pitch for a developer who makes educational coding videos.',
		'Write a podcast episode title and description for an episode about burnout in tech.',
		"Write a call-to-action for the end of a YouTube video titled 'I tried 5 AI tools for a week'.",
		'Write a Twitter/X bio for a developer who also makes content about AI.',
		'Write a 30-second sponsored segment script for a VPN in a tech video.',
		'Write a pinned comment a creator would leave on their own viral video.',
		'Write an "About" page for a solo developer who builds and sells small software products.',
		'Write a product launch email for an indie app with 200 beta users.'
	]
};
