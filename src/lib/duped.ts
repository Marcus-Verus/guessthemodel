// ---------------------------------------------------------------
// DUPED - duped.gg
// Daily 5 (rotating category) + Endless survival mode (3 strikes).
// Real absurd Amazon products vs. AI fakes generated live by Claude.
// ---------------------------------------------------------------

// Drop your Amazon Associates tag here (e.g. "duped-20") and every
// buy link becomes an affiliate link automatically.
export const AFFILIATE_TAG = 'duped05-20';

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

// One category per weekday (index = JS getUTCDay(): 0 = Sunday).
export const CATEGORIES: Category[] = [
	{ id: 'home', label: 'Bed, Bath & Bizarre', emoji: '🛁' }, // Sun
	{ id: 'kitchen', label: 'Kitchen Crimes', emoji: '🍳' }, // Mon
	{ id: 'tools', label: 'Tool Shed', emoji: '🔧' }, // Tue
	{ id: 'office', label: 'Office Gags', emoji: '📎' }, // Wed
	{ id: 'tech', label: 'Tech & Gadgets', emoji: '🔌' }, // Thu
	{ id: 'pets', label: 'Pet Nonsense', emoji: '🐾' }, // Fri
	{ id: 'garden', label: 'Garden & Outdoor', emoji: '🌿' } // Sat
];

export const REAL_PRODUCTS: Product[] = [
	// ---- Kitchen Crimes ----
	{ cat: 'kitchen', name: 'Hutzler 571 Banana Slicer', tagline: 'Slice an entire banana in one press.', price: '$5.98', rating: 4.6, emoji: '🍌', review: 'Saved my marriage. We were spending hours slicing bananas the old way.', fact: '100% real, and its joke review section is Amazon folklore.', buy: amz('hutzler 571 banana slicer') },
	{ cat: 'kitchen', name: 'Bob Ross Toaster', tagline: 'Toasts a happy little Bob Ross face onto every slice.', price: '$39.99', rating: 4.6, emoji: '🍞', review: 'There are no burnt toasts, only happy accidents.', fact: 'Real - officially licensed and genuinely beloved.', buy: amz('bob ross toaster') },
	{ cat: 'kitchen', name: 'Hot Dog Toaster', tagline: 'A pop-up toaster with slots for two dogs and two buns.', price: '$24.99', rating: 4.3, emoji: '🌭', review: 'Breakfast, lunch, and dinner are the same meal now.', fact: 'Real - a retro-diner classic that genuinely works.', buy: amz('hot dog toaster') },
	{ cat: 'kitchen', name: 'Pizza Scissors', tagline: 'Scissors with a built-in spatula. Cut, lift, serve.', price: '$17.99', rating: 4.5, emoji: '🍕', review: 'I will never respect a pizza wheel again.', fact: 'Real, and honestly kind of brilliant.', buy: amz('pizza scissors spatula') },
	{ cat: 'kitchen', name: 'Yodeling Pickle', tagline: 'A battery-operated pickle that yodels on command.', price: '$12.95', rating: 4.7, emoji: '🥒', review: "It yodels. It's a pickle. What more do you need to know?", fact: 'Real - made by novelty legends Archie McPhee.', buy: amz('yodeling pickle') },
	// ---- Pet Nonsense ----
	{ cat: 'pets', name: 'LICKI Brush', tagline: 'Hold it in your mouth and lick your cat like its mother would.', price: '$29.99', rating: 4.0, emoji: '🐱', review: 'My cat and I have never been closer. My family has never been further.', fact: 'Real - it even pitched on Shark Tank.', buy: amz('licki brush cat') },
	{ cat: 'pets', name: 'Cat Scratch DJ Deck', tagline: 'A cardboard turntable so your cat can drop sick scratches.', price: '$22.00', rating: 4.4, emoji: '🎧', review: 'DJ Whiskers plays the same set every night. Crowd goes wild.', fact: 'Real - a design-store favorite by Suck UK.', buy: amz('cat scratch dj deck') },
	{ cat: 'pets', name: 'Dog Umbrella Leash', tagline: 'An inverted umbrella that keeps your dog dry on walks.', price: '$18.99', rating: 4.1, emoji: '☂️', review: 'My corgi stays dry. I am soaked. The hierarchy is clear.', fact: 'Real - and dogs look incredible under them.', buy: amz('dog umbrella leash') },
	{ cat: 'pets', name: 'Chicken Harness & Leash', tagline: 'Take your hen for a dignified neighborhood stroll.', price: '$15.99', rating: 4.2, emoji: '🐔', review: 'Henrietta commands respect at the park now.', fact: 'Real - backyard-chicken people are very serious about this.', buy: amz('chicken harness leash') },
	// ---- Office Gags ----
	{ cat: 'office', name: 'Screaming Goat Figurine', tagline: "Press the goat. The goat screams. That's the product.", price: '$9.95', rating: 4.7, emoji: '🐐', review: 'I press it after every email. My coworkers understand.', fact: 'Real - it comes with a tiny illustrated book.', buy: amz('screaming goat figurine') },
	{ cat: 'office', name: 'Finger Hands', tagline: 'Tiny rubber hands you wear on each fingertip.', price: '$11.50', rating: 4.8, emoji: '🖐️', review: 'Ten tiny high fives at all times. Life-changing.', fact: 'Real. There are also finger hands for your finger hands.', buy: amz('finger hands archie mcphee') },
	{ cat: 'office', name: 'Desktop Punching Bag', tagline: 'A suction-cup speed bag for workplace emotions.', price: '$19.99', rating: 4.3, emoji: '🥊', review: 'HR-approved violence. Mostly.', fact: 'Real - a cubicle stress classic.', buy: amz('desktop punching bag') },
	{ cat: 'office', name: 'Passive-Aggressive Sticky Notes', tagline: 'Pre-printed notes that say what you actually mean.', price: '$8.99', rating: 4.6, emoji: '📝', review: 'The break-room fridge has never been cleaner. Or tenser.', fact: 'Real - several competing brands, in fact.', buy: amz('passive aggressive sticky notes') },
	// ---- Bed, Bath & Bizarre ----
	{ cat: 'home', name: 'Burrito Blanket', tagline: 'A 71-inch flour tortilla. You are the filling.', price: '$19.99', rating: 4.8, emoji: '🌯', review: 'Wrapped myself at 8pm. Became food. No regrets.', fact: "Real - one of Amazon's best-selling gag gifts ever.", buy: amz('burrito tortilla blanket') },
	{ cat: 'home', name: 'Ostrich Pillow', tagline: 'A wearable cocoon for napping face-down anywhere.', price: '$99.00', rating: 4.1, emoji: '😴', review: 'Slept at my desk. Woke up to HR. Worth it.', fact: 'Real - it raised over $190k on Kickstarter.', buy: amz('ostrich pillow nap') },
	{ cat: 'home', name: 'Nicolas Cage Sequin Pillow', tagline: 'Swipe the sequins to reveal his face. Swipe again to hide it.', price: '$14.99', rating: 4.5, emoji: '✨', review: 'Guests are afraid of my couch now. Five stars.', fact: 'Real, and a perennial white-elephant champion.', buy: amz('nicolas cage sequin pillow') },
	{ cat: 'home', name: 'Toilet Timer', tagline: 'A sand timer that ends bathroom hiding sessions in 5 minutes.', price: '$14.95', rating: 4.5, emoji: '⏳', review: 'Bought by my wife. Reviewed under duress.', fact: 'Real - a Shark Tank deal and a Father\'s Day bestseller.', buy: amz('toilet timer sand') },
	{ cat: 'home', name: 'Emergency Underpants in a Can', tagline: 'One pair of unisex underpants, canned for your darkest hour.', price: '$9.95', rating: 4.4, emoji: '🥫', review: 'Hope for the best, can the rest.', fact: 'Real, also from Archie McPhee.', buy: amz('emergency underpants in a can') },
	// ---- More Kitchen Crimes ----
	{ cat: 'kitchen', name: 'Egg Cuber', tagline: 'Press a hard-boiled egg into a perfect cube.', price: '$11.99', rating: 4.1, emoji: '🥚', review: 'Round eggs roll off the plate. Cubes know their place.', fact: 'Real - a retro gadget that genuinely makes square eggs.', buy: amz('egg cuber square egg mold') },
	{ cat: 'kitchen', name: 'Corn Kernel Stripper', tagline: 'Zip a whole cob clean in one downward stroke.', price: '$8.49', rating: 4.4, emoji: '🌽', review: 'I have stripped every cob in the house. Send more corn.', fact: 'Real - the "corn zipper" is a county-fair legend.', buy: amz('corn kernel stripper zipper') },
	{ cat: 'kitchen', name: 'Five-Blade Herb Scissors', tagline: 'Five parallel blades mince herbs in a single snip.', price: '$10.99', rating: 4.3, emoji: '🌿', review: 'My basil never saw it coming. Five times the menace.', fact: 'Real, and weirdly satisfying.', buy: amz('5 blade herb scissors') },
	// ---- More Pet Nonsense ----
	{ cat: 'pets', name: 'Bird Diaper FlightSuit', tagline: 'A wearable diaper so your parrot can roam the house.', price: '$24.95', rating: 4.0, emoji: '🦜', review: 'Polly is now house-trained and frankly stylish.', fact: 'Real - bird people swear by them.', buy: amz('bird diaper flight suit') },
	{ cat: 'pets', name: 'Cat Exercise Wheel', tagline: 'A five-foot hamster wheel, scaled up for your cat.', price: '$199.99', rating: 4.2, emoji: '🐈', review: 'My cat ran a 5K at 3am. I have not slept since.', fact: 'Real - yes, cats actually use them.', buy: amz('cat exercise wheel') },
	{ cat: 'pets', name: 'Dog Snuffle Mat', tagline: 'A shaggy mat that hides kibble for your dog to forage.', price: '$16.99', rating: 4.6, emoji: '🐶', review: 'Dinner now takes 20 minutes instead of 4 seconds.', fact: 'Real - vets actually recommend these.', buy: amz('dog snuffle mat') },
	// ---- More Office Gags ----
	{ cat: 'office', name: 'The Useless Box', tagline: 'Flip the switch and a tiny arm flips it right back off.', price: '$23.99', rating: 4.6, emoji: '🔘', review: 'It does nothing, beautifully. My new role model.', fact: 'Real - a classic "leave me alone" machine.', buy: amz('useless box leave me alone') },
	{ cat: 'office', name: 'USB Humping Dog', tagline: 'A plastic terrier that enthusiastically rides your USB port.', price: '$9.99', rating: 4.3, emoji: '🐕', review: 'Plugged it in during a Zoom call. I no longer have that job.', fact: 'Real - a cubicle prank hall-of-famer.', buy: amz('usb humping dog') },
	{ cat: 'office', name: 'Desktop Zen Garden', tagline: 'A tiny sand tray with a tiny rake for tiny peace.', price: '$13.99', rating: 4.2, emoji: '🏯', review: 'I rake the sand between meetings. The sand understands.', fact: 'Real - the desk-calm classic.', buy: amz('desktop zen garden mini rake') },
	// ---- More Bed, Bath & Bizarre ----
	{ cat: 'home', name: 'Squatty Potty', tagline: 'A footstool that puts your colon at the perfect angle.', price: '$24.99', rating: 4.7, emoji: '🚽', review: 'Life-changing. I tell strangers about it. They leave.', fact: 'Real - a Shark Tank smash with a unicorn ad.', buy: amz('squatty potty') },
	{ cat: 'home', name: 'Motion Toilet Night Light', tagline: 'A bowl light that glows in 16 colors when you approach.', price: '$12.99', rating: 4.5, emoji: '🌈', review: '3am bathroom trips are now a tiny rave.', fact: 'Real - motion-activated and oddly delightful.', buy: amz('toilet night light motion') },
	{ cat: 'home', name: 'Wearable Blanket Hoodie', tagline: 'A giant fleece sweatshirt-blanket you live inside.', price: '$39.99', rating: 4.6, emoji: '🧥', review: 'Put it on in October. See you in spring.', fact: 'Real - another Shark Tank cozy juggernaut.', buy: amz('wearable blanket hoodie oversized') },
	// ---- Tool Shed ----
	{ cat: 'tools', name: 'Mini Chainsaw', tagline: 'A 6-inch one-handed chainsaw for light pruning.', price: '$39.99', rating: 4.4, emoji: '🪚', review: 'Trimmed a branch and my entire ego grew back.', fact: 'Real - the handheld mini chainsaw went viral.', buy: amz('mini chainsaw cordless 6 inch') },
	{ cat: 'tools', name: 'Magnetic Wristband', tagline: 'A wristband that holds your screws while you work.', price: '$13.99', rating: 4.6, emoji: '🧲', review: 'My screws stopped running away. Marriage saved.', fact: 'Real - and genuinely useful.', buy: amz('magnetic wristband screws') },
	{ cat: 'tools', name: 'Drill Brush Scrubbers', tagline: 'Scrub-brush heads that attach to your power drill.', price: '$12.99', rating: 4.5, emoji: '🧽', review: 'I drilled my bathtub clean. Felt unstoppable.', fact: 'Real - cleaning influencers love them.', buy: amz('drill brush power scrubber set') },
	{ cat: 'tools', name: 'Tactical Pen', tagline: 'A pen that also breaks glass and means business.', price: '$16.99', rating: 4.3, emoji: '🖊️', review: 'Writes grocery lists, survives the apocalypse.', fact: 'Real - a very serious pen.', buy: amz('tactical pen glass breaker') },
	{ cat: 'tools', name: 'Pocket Hand Chainsaw', tagline: 'A pocket-sized chain you saw logs with by hand.', price: '$10.99', rating: 4.2, emoji: '🪵', review: 'Cut a log at the campsite. Slept like a lumberjack.', fact: 'Real - a camping/survival staple.', buy: amz('pocket chainsaw hand') },
	// ---- Tech & Gadgets ----
	{ cat: 'tech', name: 'USB Mini Fridge', tagline: 'A desktop fridge that chills exactly one can.', price: '$28.99', rating: 4.0, emoji: '🧊', review: 'It holds one soda. That soda is my best friend.', fact: 'Real - peak desk flex.', buy: amz('usb mini fridge one can') },
	{ cat: 'tech', name: 'Phone Screen Magnifier', tagline: 'A foldable screen that makes your phone movie-sized. Sort of.', price: '$15.99', rating: 3.9, emoji: '📱', review: 'Watched a film in glorious slightly-bigger.', fact: 'Real - the cardboard-era classic.', buy: amz('phone screen magnifier') },
	{ cat: 'tech', name: 'Bluetooth Beanie', tagline: 'A knit hat with headphones built into it.', price: '$19.99', rating: 4.2, emoji: '🎧', review: 'Warm head, full playlist, zero earbuds lost.', fact: 'Real - surprisingly popular.', buy: amz('bluetooth beanie headphones') },
	{ cat: 'tech', name: 'Glowing Smart Water Bottle', tagline: 'A bottle that glows to remind you to drink water.', price: '$34.99', rating: 4.1, emoji: '💧', review: 'It glows. I drink. I am a houseplant now.', fact: 'Real - hydration via peer pressure.', buy: amz('smart water bottle glow reminder') },
	{ cat: 'tech', name: 'Mini Phone Fan', tagline: 'A tiny fan that plugs into your phone.', price: '$9.99', rating: 4.0, emoji: '🌀', review: 'Cooled my face and drained my battery. Fair trade.', fact: 'Real - a summer-commute lifesaver.', buy: amz('mini phone fan plug in') },
	// ---- Garden & Outdoor ----
	{ cat: 'garden', name: 'Bigfoot Garden Statue', tagline: 'A crouching Sasquatch lurking in your flower bed.', price: '$24.99', rating: 4.6, emoji: '🦶', review: 'Scared the mailman. Worth every penny.', fact: 'Real - cryptid lawn decor is a whole genre.', buy: amz('bigfoot garden statue') },
	{ cat: 'garden', name: 'Garden Gnome', tagline: 'A classic bearded gnome to judge your weeds.', price: '$17.99', rating: 4.5, emoji: '🧙', review: 'He watches. He waits. The lawn behaves.', fact: 'Real - the original yard guardian.', buy: amz('garden gnome statue') },
	{ cat: 'garden', name: 'Motion-Activated Animal Sprinkler', tagline: 'Blasts water at any critter that wanders into the yard.', price: '$49.99', rating: 4.4, emoji: '💦', review: 'Deer fled. Neighbor fled. Mostly the deer.', fact: 'Real - the Orbit Yard Enforcer is legendary.', buy: amz('motion activated sprinkler animal deterrent') },
	{ cat: 'garden', name: 'Electric Fly Swatter', tagline: 'A tennis racket that zaps bugs on contact.', price: '$11.99', rating: 4.5, emoji: '🪰', review: 'Backyard tennis with consequences. 10/10.', fact: 'Real - oddly addictive.', buy: amz('electric fly swatter racket') },
	{ cat: 'garden', name: 'Solar Dancing Flower', tagline: 'A plastic flower that wiggles in sunlight, forever.', price: '$8.99', rating: 4.3, emoji: '🌻', review: 'It dances on my windowsill. I envy its energy.', fact: 'Real - the dashboard-and-windowsill icon.', buy: amz('solar dancing flower') }
];

export const FALLBACK_FAKES: Product[] = [
	// kitchen
	{ cat: 'kitchen', name: 'ToastMate Pro', tagline: 'The toaster with a built-in treadmill. Your bread earns its butter.', price: '$54.99', rating: 4.3, emoji: '🏃', review: 'My toast has never been more disciplined.', fact: 'AI-invented. No bread has ever jogged.' },
	{ cat: 'kitchen', name: 'WhisperLadle', tagline: 'A soup ladle with built-in white noise for silent serving.', price: '$27.50', rating: 4.0, emoji: '🍲', review: 'Soup night is finally peaceful. The ladle hums softly.', fact: 'AI-invented. Ladles remain loud and proud.' },
	{ cat: 'kitchen', name: 'GravyAlarm', tagline: 'An alarm clock that wakes you with the scent of fresh gravy.', price: '$44.99', rating: 4.2, emoji: '⏰', review: 'I wake up hungry and confused, but on time.', fact: "AI-invented. Scent alarms exist - gravy doesn't. Yet." },
	// pets
	{ cat: 'pets', name: 'PetPetter 3000', tagline: 'A robotic hand that pats your dog once an hour while you work.', price: '$89.99', rating: 3.9, emoji: '🐕', review: 'My dog now prefers the machine. Mixed feelings.', fact: 'AI-invented. Your dog still wants the real you.' },
	{ cat: 'pets', name: 'Hamster Rush Hour Wheel', tagline: 'An exercise wheel that plays traffic sounds for a realistic commute.', price: '$34.99', rating: 4.1, emoji: '🐹', review: 'He honks at nothing now. Very lifelike.', fact: 'AI-invented. Hamsters remain blissfully unemployed.' },
	{ cat: 'pets', name: 'FetchCast', tagline: 'A smart ball that refuses to be thrown in bad weather.', price: '$49.99', rating: 3.8, emoji: '🎾', review: 'It declined fetch on Tuesday. The dog respects it more than me.', fact: 'AI-invented. Balls cannot check forecasts.' },
	// office
	{ cat: 'office', name: 'The Blame Spinner', tagline: 'A desktop wheel that fairly assigns fault after every meeting.', price: '$21.99', rating: 4.4, emoji: '🎡', review: "It landed on 'Q3 conditions.' We all moved on.", fact: 'AI-invented - though every office runs an invisible one.' },
	{ cat: 'office', name: 'Meeting Escape Cord', tagline: 'Pull the cord and your laptop fakes a convincing crash.', price: '$39.99', rating: 4.5, emoji: '🪂', review: 'Used it twice in one standup. No survivors. No suspicions.', fact: 'AI-invented. Your laptop crashes for free already.' },
	{ cat: 'office', name: 'CrumbHarvester Mini', tagline: 'A tiny combine harvester that farms your keyboard crumbs.', price: '$28.99', rating: 4.0, emoji: '🚜', review: 'Yielded half a granola bar in week one.', fact: 'AI-invented. Keyboard vacuums exist - combines do not.' },
	// home
	{ cat: 'home', name: 'The Apology Doorbell', tagline: 'Rings, then immediately says sorry for disturbing you.', price: '$32.99', rating: 4.1, emoji: '🔔', review: 'Finally, a doorbell that understands social anxiety.', fact: 'AI-invented - though honestly, someone should make it.' },
	{ cat: 'home', name: 'SnoreScore Pillow', tagline: 'Grades your snoring nightly and posts the report to your fridge.', price: '$79.99', rating: 3.7, emoji: '🛏️', review: "Got a B-. My wife disputes the grade. Says it's generous.", fact: 'AI-invented. Snore trackers exist - none of them grade.' },
	{ cat: 'home', name: 'SockSync Clips', tagline: 'Bluetooth clips that beep when sock pairs drift apart.', price: '$24.99', rating: 3.8, emoji: '🧦', review: 'Found a sock from 2019. Emotional reunion.', fact: 'AI-invented - the lost-sock industrial complex survives.' },
	// kitchen
	{ cat: 'kitchen', name: 'SteamWhistle Colander', tagline: 'A pasta strainer that whistles like a kettle when fully drained.', price: '$26.99', rating: 4.1, emoji: '♨️', review: 'It toots when the pasta is ready. My family comes running.', fact: 'AI-invented. Colanders are silent by trade.' },
	{ cat: 'kitchen', name: 'FridgeGossip Magnet', tagline: 'A magnet that narrates your snacking in a disappointed accent.', price: '$18.99', rating: 3.9, emoji: '🧲', review: '"Third cheese stick, is it." I have never felt so seen.', fact: 'AI-invented. Your fridge keeps your secrets, for now.' },
	// pets
	{ cat: 'pets', name: 'ParrotPrompter', tagline: 'A tiny teleprompter that feeds your parrot trending phrases.', price: '$42.00', rating: 4.0, emoji: '🦜', review: 'My parrot now does a morning news segment. Ratings are up.', fact: 'AI-invented. Parrots write their own material.' },
	{ cat: 'pets', name: 'GoldfishGym Ramp', tagline: 'A miniature treadmill ramp for a more athletic goldfish.', price: '$31.50', rating: 3.8, emoji: '🐠', review: 'Gill is in the best shape of his nine-second life.', fact: 'AI-invented. Goldfish remain proudly un-gym.' },
	// office
	{ cat: 'office', name: 'DeadlineFog Machine', tagline: 'A desktop fogger that simulates the mist of looming urgency.', price: '$37.99', rating: 4.2, emoji: '🌫️', review: 'The fog rolled in at 4:58pm. The report wrote itself.', fact: 'AI-invented. Your dread is generated locally.' },
	{ cat: 'office', name: 'ReplyAllRoulette', tagline: 'A button that recalls one random sent email per day.', price: '$22.49', rating: 3.9, emoji: '🎰', review: 'It un-sent my resignation. The wheel is kind sometimes.', fact: 'AI-invented. Sent is still forever.' },
	// home
	{ cat: 'home', name: 'DreamSubtitles Sleep Mask', tagline: 'Displays live subtitles of your dreams on the inside.', price: '$59.99', rating: 4.1, emoji: '😴', review: 'Last night was [INAUDIBLE] then a horse. Riveting.', fact: 'AI-invented. Dreams remain un-captioned.' },
	{ cat: 'home', name: 'ThermostatTherapist', tagline: 'A thermostat that asks how the temperature makes you feel.', price: '$84.99', rating: 4.0, emoji: '🌡️', review: '"And how does 68 degrees sit with you?" We talked for an hour.', fact: 'AI-invented. Your thermostat is not licensed.' },
	// tools
	{ cat: 'tools', name: 'WD-41', tagline: 'Like WD-40, but it apologizes after every spray.', price: '$9.49', rating: 4.2, emoji: '🛢️', review: '"Sorry about the squeak," it whispered. Hinge fixed.', fact: 'AI-invented. There is no sorry in lubricant.' },
	{ cat: 'tools', name: 'Self-Tightening Bolt', tagline: 'A bolt that tightens itself when it senses you getting frustrated.', price: '$14.99', rating: 4.0, emoji: '🔩', review: 'It read the room and snugged right up.', fact: 'AI-invented. Bolts cannot sense your rage.' },
	{ cat: 'tools', name: 'Whisper Drill', tagline: 'A power drill that hums quietly so it never wakes the baby.', price: '$59.99', rating: 4.1, emoji: '🤫', review: 'Built a whole bookshelf during nap time.', fact: 'AI-invented. Drills are constitutionally loud.' },
	{ cat: 'tools', name: 'Stud Finder: Ego Mode', tagline: 'Beeps when it locates the most confident person in the room.', price: '$21.99', rating: 3.9, emoji: '📡', review: 'It pointed straight at my brother-in-law. Accurate.', fact: 'AI-invented. It only finds wall studs, sadly.' },
	// tech
	{ cat: 'tech', name: 'Wi-Fi Extender for Feelings', tagline: 'Boosts emotional range so you sense people in the next room.', price: '$49.99', rating: 3.8, emoji: '📶', review: 'I felt my roommate sulking from the kitchen. Eerie.', fact: 'AI-invented. Feelings remain offline.' },
	{ cat: 'tech', name: 'Smart Fork 2.0', tagline: 'Counts your bites and quietly judges each one.', price: '$39.99', rating: 4.0, emoji: '🍴', review: 'Bite 14 got a disappointed buzz. Rude but fair.', fact: 'AI-invented. Forks have no opinions. Yet.' },
	{ cat: 'tech', name: 'Plant Earbuds', tagline: 'Noise-cancelling earbuds sized for your houseplants.', price: '$27.99', rating: 4.1, emoji: '🪴', review: 'My fern finally gets some peace and quiet.', fact: 'AI-invented. Plants do not commute.' },
	{ cat: 'tech', name: 'Motivation AirTag', tagline: 'A tracker that tells you where you last left your motivation.', price: '$32.00', rating: 3.9, emoji: '🏷️', review: 'It said "the couch, 2019." Devastatingly correct.', fact: 'AI-invented. Some things cannot be found.' },
	// garden
	{ cat: 'garden', name: 'Anxious Garden Gnome', tagline: 'A gnome that only comes out of his little house at night.', price: '$22.99', rating: 4.2, emoji: '🏚️', review: 'We have never met. I respect his boundaries.', fact: 'AI-invented. Gnomes are famously unbothered.' },
	{ cat: 'garden', name: 'Squirrel Speed Bump', tagline: 'A tiny speed bump to slow down reckless backyard squirrels.', price: '$15.99', rating: 4.0, emoji: '🐿️', review: 'They ignore it completely, but it feels official.', fact: 'AI-invented. Squirrels obey no laws.' },
	{ cat: 'garden', name: 'Silent Wind Chimes', tagline: 'Weatherproof chimes engineered to make absolutely no sound.', price: '$18.99', rating: 4.4, emoji: '🎐', review: 'Finally, the peace of chimes without the chimes.', fact: 'AI-invented. That is just a decoration.' },
	{ cat: 'garden', name: 'Self-Mowing Lawn Stone', tagline: 'A decorative rock that legally claims to mow your lawn.', price: '$29.99', rating: 3.7, emoji: '🪨', review: 'Grass is knee-high but the rock looks confident.', fact: 'AI-invented. Rocks do not mow.' },
	// ---- More fakes (endless-deck balance) ----
	// kitchen
	{ cat: 'kitchen', name: 'MoodRing Spatula', tagline: 'The handle changes color based on how stressed your stirring is.', price: '$19.99', rating: 4.0, emoji: '🥄', review: 'It went red during gravy. The spatula knew.', fact: 'AI-invented. Your spatula has no feelings, probably.' },
	{ cat: 'kitchen', name: 'Self-Salting Shaker', tagline: 'A shaker that decides how much salt you actually need.', price: '$29.99', rating: 3.9, emoji: '🧂', review: 'It denied me salt on Tuesday. We are not speaking.', fact: 'AI-invented. Seasoning remains a personal choice.' },
	{ cat: 'kitchen', name: 'Toast Karaoke', tagline: 'A toaster that hums backing tracks while your bread browns.', price: '$48.99', rating: 4.2, emoji: '🎤', review: 'Breakfast is now a duet. The neighbors have notes.', fact: 'AI-invented. Toasters cannot carry a tune.' },
	// pets
	{ cat: 'pets', name: 'TreatGPS Collar', tagline: 'A collar that claims to navigate your dog to dropped snacks.', price: '$54.99', rating: 4.1, emoji: '📡', review: 'Rerouted to the kitchen floor. Arrived in 4 seconds.', fact: 'AI-invented. Dogs already have this. It is called a nose.' },
	{ cat: 'pets', name: 'Aquarium Doorbell', tagline: 'A tank-mounted button your fish can ring for attention.', price: '$27.99', rating: 3.8, emoji: '🐟', review: 'It has rung 400 times. I think it is just bubbles.', fact: 'AI-invented. Fish have no appointments.' },
	// office
	{ cat: 'office', name: 'Self-Banging Gavel', tagline: 'A desk gavel that bangs itself when a meeting runs long.', price: '$33.99', rating: 4.3, emoji: '🔨', review: 'It silenced Greg at minute nine. We held a small parade.', fact: 'AI-invented. Meetings remain immortal.' },
	{ cat: 'office', name: 'Inbox Snow Globe', tagline: 'Shake it for the calming illusion of a cleared inbox.', price: '$16.99', rating: 4.0, emoji: '❄️', review: 'I shook it instead of replying. Productivity unchanged, mood up.', fact: 'AI-invented. Your unread count is real.' },
	// home
	{ cat: 'home', name: 'WhisperBlinds', tagline: 'Window blinds that softly narrate the weather as they open.', price: '$74.99', rating: 4.1, emoji: '🪟', review: '"Partly cloudy, like your plans." Rude, but accurate.', fact: 'AI-invented. Blinds remain non-verbal.' },
	{ cat: 'home', name: 'PillowPolygraph', tagline: 'A pillow that detects whether you really slept well or are lying.', price: '$62.99', rating: 3.9, emoji: '🛌', review: 'It called my "8 hours" a fabrication. We both know it is right.', fact: 'AI-invented. Your sleep debt stays off the record.' },
	{ cat: 'home', name: 'Couch Curfew Cushion', tagline: 'A cushion that gently nags you toward bed after midnight.', price: '$39.99', rating: 4.2, emoji: '🛋️', review: 'It buzzed at 1am. I ignored it. It buzzed harder.', fact: 'AI-invented. The couch is not your parent.' }
];

export function shuffle<T>(arr: T[]): T[] {
	const a = [...arr];
	for (let i = a.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[a[i], a[j]] = [a[j], a[i]];
	}
	return a;
}

// Category is fixed by weekday, so every Monday is the same category, etc.
export function categoryForDay(day: number): Category {
	const weekday = new Date(day * 86400000).getUTCDay();
	return CATEGORIES[weekday];
}

// Launch day (2026-06-15) is #1.
const LAUNCH_DAY = Math.floor(Date.UTC(2026, 5, 15) / 86400000);
export function numberForDay(day: number): number {
	return day - LAUNCH_DAY + 1;
}
export function dayForNumber(n: number): number {
	return LAUNCH_DAY + n - 1;
}

export function todaysCategory(): Category {
	return categoryForDay(Math.floor(Date.now() / 86400000));
}

export function tomorrowsCategory(): Category {
	return categoryForDay(Math.floor(Date.now() / 86400000) + 1);
}

// Reveal banners - rotated so it's not the same line every round.
const WIN_LABELS = ['NAILED IT', 'CLOCKED IT', 'SHARP EYE', 'CALLED IT', 'NICE'];
const LOSE_LABELS = ['DUPED!', 'GOTCHA', 'FOOLED YA', 'SO CLOSE', 'OUTFOXED'];
export function revealLabel(correct: boolean, i: number): string {
	const list = correct ? WIN_LABELS : LOSE_LABELS;
	return list[((i % list.length) + list.length) % list.length];
}

// Wordle-style daily puzzle number. 2026-06-15 (launch) = #1.
export function dailyNumber(): number {
	return numberForDay(Math.floor(Date.now() / 86400000));
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
