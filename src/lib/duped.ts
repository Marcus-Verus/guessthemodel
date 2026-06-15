// ---------------------------------------------------------------
// DUPED — duped.gg
// Daily 5 (rotating category) + Endless survival mode (3 strikes).
// Real absurd Amazon products vs. AI fakes generated live by Claude.
// ---------------------------------------------------------------

// Drop your Amazon Associates tag here (e.g. "duped-20") and every
// buy link becomes an affiliate link automatically.
export const AFFILIATE_TAG = '';

export const amz = (q: string): string =>
	`https://www.amazon.com/s?k=${encodeURIComponent(q)}` +
	(AFFILIATE_TAG ? `&tag=${AFFILIATE_TAG}` : '');

export interface Category {
	id: string;
	label: string;
	emoji: string;
}

export interface Product {
	cat: string;
	name: string;
	tagline: string;
	price: string;
	rating: number;
	emoji: string;
	review: string;
	fact: string;
	buy?: string;
	img?: string;
	isReal?: boolean;
	crowd?: number;
}

export const CATEGORIES: Category[] = [
	{ id: 'kitchen', label: 'Kitchen Crimes', emoji: '🍳' },
	{ id: 'pets', label: 'Pet Nonsense', emoji: '🐾' },
	{ id: 'office', label: 'Office Gags', emoji: '📎' },
	{ id: 'home', label: 'Bed, Bath & Bizarre', emoji: '🛁' }
];

export const REAL_PRODUCTS: Product[] = [
	// ---- Kitchen Crimes ----
	{ cat: 'kitchen', name: 'Hutzler 571 Banana Slicer', tagline: 'Slice an entire banana in one press.', price: '$5.98', rating: 4.6, emoji: '🍌', review: 'Saved my marriage. We were spending hours slicing bananas the old way.', fact: '100% real, and its joke review section is Amazon folklore.', buy: amz('hutzler 571 banana slicer') },
	{ cat: 'kitchen', name: 'Bob Ross Toaster', tagline: 'Toasts a happy little Bob Ross face onto every slice.', price: '$39.99', rating: 4.6, emoji: '🍞', review: 'There are no burnt toasts, only happy accidents.', fact: 'Real — officially licensed and genuinely beloved.', buy: amz('bob ross toaster') },
	{ cat: 'kitchen', name: 'Hot Dog Toaster', tagline: 'A pop-up toaster with slots for two dogs and two buns.', price: '$24.99', rating: 4.3, emoji: '🌭', review: 'Breakfast, lunch, and dinner are the same meal now.', fact: 'Real — a retro-diner classic that genuinely works.', buy: amz('hot dog toaster') },
	{ cat: 'kitchen', name: 'Pizza Scissors', tagline: 'Scissors with a built-in spatula. Cut, lift, serve.', price: '$17.99', rating: 4.5, emoji: '🍕', review: 'I will never respect a pizza wheel again.', fact: 'Real, and honestly kind of brilliant.', buy: amz('pizza scissors spatula') },
	{ cat: 'kitchen', name: 'Yodeling Pickle', tagline: 'A battery-operated pickle that yodels on command.', price: '$12.95', rating: 4.7, emoji: '🥒', review: "It yodels. It's a pickle. What more do you need to know?", fact: 'Real — made by novelty legends Archie McPhee.', buy: amz('yodeling pickle') },
	// ---- Pet Nonsense ----
	{ cat: 'pets', name: 'LICKI Brush', tagline: 'Hold it in your mouth and lick your cat like its mother would.', price: '$29.99', rating: 4.0, emoji: '🐱', review: 'My cat and I have never been closer. My family has never been further.', fact: 'Real — it even pitched on Shark Tank.', buy: amz('licki brush cat') },
	{ cat: 'pets', name: 'Cat Scratch DJ Deck', tagline: 'A cardboard turntable so your cat can drop sick scratches.', price: '$22.00', rating: 4.4, emoji: '🎧', review: 'DJ Whiskers plays the same set every night. Crowd goes wild.', fact: 'Real — a design-store favorite by Suck UK.', buy: amz('cat scratch dj deck') },
	{ cat: 'pets', name: 'Dog Umbrella Leash', tagline: 'An inverted umbrella that keeps your dog dry on walks.', price: '$18.99', rating: 4.1, emoji: '☂️', review: 'My corgi stays dry. I am soaked. The hierarchy is clear.', fact: 'Real — and dogs look incredible under them.', buy: amz('dog umbrella leash') },
	{ cat: 'pets', name: 'Chicken Harness & Leash', tagline: 'Take your hen for a dignified neighborhood stroll.', price: '$15.99', rating: 4.2, emoji: '🐔', review: 'Henrietta commands respect at the park now.', fact: 'Real — backyard-chicken people are very serious about this.', buy: amz('chicken harness leash') },
	// ---- Office Gags ----
	{ cat: 'office', name: 'Screaming Goat Figurine', tagline: "Press the goat. The goat screams. That's the product.", price: '$9.95', rating: 4.7, emoji: '🐐', review: 'I press it after every email. My coworkers understand.', fact: 'Real — it comes with a tiny illustrated book.', buy: amz('screaming goat figurine') },
	{ cat: 'office', name: 'Finger Hands', tagline: 'Tiny rubber hands you wear on each fingertip.', price: '$11.50', rating: 4.8, emoji: '🖐️', review: 'Ten tiny high fives at all times. Life-changing.', fact: 'Real. There are also finger hands for your finger hands.', buy: amz('finger hands archie mcphee') },
	{ cat: 'office', name: 'Desktop Punching Bag', tagline: 'A suction-cup speed bag for workplace emotions.', price: '$19.99', rating: 4.3, emoji: '🥊', review: 'HR-approved violence. Mostly.', fact: 'Real — a cubicle stress classic.', buy: amz('desktop punching bag') },
	{ cat: 'office', name: 'Passive-Aggressive Sticky Notes', tagline: 'Pre-printed notes that say what you actually mean.', price: '$8.99', rating: 4.6, emoji: '📝', review: 'The break-room fridge has never been cleaner. Or tenser.', fact: 'Real — several competing brands, in fact.', buy: amz('passive aggressive sticky notes') },
	// ---- Bed, Bath & Bizarre ----
	{ cat: 'home', name: 'Burrito Blanket', tagline: 'A 71-inch flour tortilla. You are the filling.', price: '$19.99', rating: 4.8, emoji: '🌯', review: 'Wrapped myself at 8pm. Became food. No regrets.', fact: "Real — one of Amazon's best-selling gag gifts ever.", buy: amz('burrito tortilla blanket') },
	{ cat: 'home', name: 'Ostrich Pillow', tagline: 'A wearable cocoon for napping face-down anywhere.', price: '$99.00', rating: 4.1, emoji: '😴', review: 'Slept at my desk. Woke up to HR. Worth it.', fact: 'Real — it raised over $190k on Kickstarter.', buy: amz('ostrich pillow nap') },
	{ cat: 'home', name: 'Nicolas Cage Sequin Pillow', tagline: 'Swipe the sequins to reveal his face. Swipe again to hide it.', price: '$14.99', rating: 4.5, emoji: '✨', review: 'Guests are afraid of my couch now. Five stars.', fact: 'Real, and a perennial white-elephant champion.', buy: amz('nicolas cage sequin pillow') },
	{ cat: 'home', name: 'Toilet Timer', tagline: 'A sand timer that ends bathroom hiding sessions in 5 minutes.', price: '$14.95', rating: 4.5, emoji: '⏳', review: 'Bought by my wife. Reviewed under duress.', fact: 'Real — a Shark Tank deal and a Father\'s Day bestseller.', buy: amz('toilet timer sand') },
	{ cat: 'home', name: 'Emergency Underpants in a Can', tagline: 'One pair of unisex underpants, canned for your darkest hour.', price: '$9.95', rating: 4.4, emoji: '🥫', review: 'Hope for the best, can the rest.', fact: 'Real, also from Archie McPhee.', buy: amz('emergency underpants in a can') }
];

export const FALLBACK_FAKES: Product[] = [
	// kitchen
	{ cat: 'kitchen', name: 'ToastMate Pro', tagline: 'The toaster with a built-in treadmill. Your bread earns its butter.', price: '$54.99', rating: 4.3, emoji: '🏃', review: 'My toast has never been more disciplined.', fact: 'AI-invented. No bread has ever jogged.' },
	{ cat: 'kitchen', name: 'WhisperLadle', tagline: 'A soup ladle with built-in white noise for silent serving.', price: '$27.50', rating: 4.0, emoji: '🍲', review: 'Soup night is finally peaceful. The ladle hums softly.', fact: 'AI-invented. Ladles remain loud and proud.' },
	{ cat: 'kitchen', name: 'GravyAlarm', tagline: 'An alarm clock that wakes you with the scent of fresh gravy.', price: '$44.99', rating: 4.2, emoji: '⏰', review: 'I wake up hungry and confused, but on time.', fact: "AI-invented. Scent alarms exist — gravy doesn't. Yet." },
	// pets
	{ cat: 'pets', name: 'PetPetter 3000', tagline: 'A robotic hand that pats your dog once an hour while you work.', price: '$89.99', rating: 3.9, emoji: '🐕', review: 'My dog now prefers the machine. Mixed feelings.', fact: 'AI-invented. Your dog still wants the real you.' },
	{ cat: 'pets', name: 'Hamster Rush Hour Wheel', tagline: 'An exercise wheel that plays traffic sounds for a realistic commute.', price: '$34.99', rating: 4.1, emoji: '🐹', review: 'He honks at nothing now. Very lifelike.', fact: 'AI-invented. Hamsters remain blissfully unemployed.' },
	{ cat: 'pets', name: 'FetchCast', tagline: 'A smart ball that refuses to be thrown in bad weather.', price: '$49.99', rating: 3.8, emoji: '🎾', review: 'It declined fetch on Tuesday. The dog respects it more than me.', fact: 'AI-invented. Balls cannot check forecasts.' },
	// office
	{ cat: 'office', name: 'The Blame Spinner', tagline: 'A desktop wheel that fairly assigns fault after every meeting.', price: '$21.99', rating: 4.4, emoji: '🎡', review: "It landed on 'Q3 conditions.' We all moved on.", fact: 'AI-invented — though every office runs an invisible one.' },
	{ cat: 'office', name: 'Meeting Escape Cord', tagline: 'Pull the cord and your laptop fakes a convincing crash.', price: '$39.99', rating: 4.5, emoji: '🪂', review: 'Used it twice in one standup. No survivors. No suspicions.', fact: 'AI-invented. Your laptop crashes for free already.' },
	{ cat: 'office', name: 'CrumbHarvester Mini', tagline: 'A tiny combine harvester that farms your keyboard crumbs.', price: '$28.99', rating: 4.0, emoji: '🚜', review: 'Yielded half a granola bar in week one.', fact: 'AI-invented. Keyboard vacuums exist — combines do not.' },
	// home
	{ cat: 'home', name: 'The Apology Doorbell', tagline: 'Rings, then immediately says sorry for disturbing you.', price: '$32.99', rating: 4.1, emoji: '🔔', review: 'Finally, a doorbell that understands social anxiety.', fact: 'AI-invented — though honestly, someone should make it.' },
	{ cat: 'home', name: 'SnoreScore Pillow', tagline: 'Grades your snoring nightly and posts the report to your fridge.', price: '$79.99', rating: 3.7, emoji: '🛏️', review: "Got a B-. My wife disputes the grade. Says it's generous.", fact: 'AI-invented. Snore trackers exist — none of them grade.' },
	{ cat: 'home', name: 'SockSync Clips', tagline: 'Bluetooth clips that beep when sock pairs drift apart.', price: '$24.99', rating: 3.8, emoji: '🧦', review: 'Found a sock from 2019. Emotional reunion.', fact: 'AI-invented — the lost-sock industrial complex survives.' }
];

export function shuffle<T>(arr: T[]): T[] {
	const a = [...arr];
	for (let i = a.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[a[i], a[j]] = [a[j], a[i]];
	}
	return a;
}

export function todaysCategory(): Category {
	const day = Math.floor(Date.now() / 86400000);
	return CATEGORIES[day % CATEGORIES.length];
}

export function tomorrowsCategory(): Category {
	const day = Math.floor(Date.now() / 86400000);
	return CATEGORIES[(day + 1) % CATEGORIES.length];
}

function withCrowd(p: Product): Product {
	return { ...p, crowd: 18 + Math.floor(Math.random() * 64) };
}

export function buildDailyRounds(cat: Category, liveFakes: Product[] | null): Product[] {
	const realCount = Math.random() < 0.5 ? 2 : 3;
	const reals = shuffle(REAL_PRODUCTS.filter((p) => p.cat === cat.id))
		.slice(0, realCount)
		.map((p) => ({ ...p, isReal: true }));
	const fakePool =
		liveFakes && liveFakes.length >= 3 ? liveFakes : FALLBACK_FAKES.filter((p) => p.cat === cat.id);
	const fks = shuffle(fakePool)
		.slice(0, 5 - reals.length)
		.map((p) => ({ ...p, isReal: false }));
	return shuffle([...reals, ...fks]).map(withCrowd);
}

export function buildEndlessDeck(extraFakes?: Product[]): Product[] {
	const reals = REAL_PRODUCTS.map((p) => ({ ...p, isReal: true }));
	const fakes = [...FALLBACK_FAKES, ...(extraFakes || [])].map((p) => ({ ...p, isReal: false }));
	return shuffle([...reals, ...fakes]).map(withCrowd);
}
