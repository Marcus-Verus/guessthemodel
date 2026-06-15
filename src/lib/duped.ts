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
	{ cat: 'garden', name: 'Solar Dancing Flower', tagline: 'A plastic flower that wiggles in sunlight, forever.', price: '$8.99', rating: 4.3, emoji: '🌻', review: 'It dances on my windowsill. I envy its energy.', fact: 'Real - the dashboard-and-windowsill icon.', buy: amz('solar dancing flower') },
	// ---- Real, but they sound fake (difficulty spike) ----
	{ cat: 'kitchen', name: 'Nessie Ladle', tagline: 'A soup ladle shaped like the Loch Ness Monster peeking out of the pot.', price: '$15.00', rating: 4.7, emoji: '🦕', review: 'Nessie lives in my stockpot now. The kids eat more soup.', fact: 'Real - the Ototo Nessie ladle is a kitchen icon.', buy: amz('nessie ladle ototo') },
	{ cat: 'kitchen', name: 'Selfie Toaster', tagline: 'A toaster that burns your own face onto every slice of bread.', price: '$75.00', rating: 4.0, emoji: '🤳', review: 'I eat my own face for breakfast. A powerful way to start the day.', fact: 'Real - you mail them a photo and they build the insert.', buy: amz('selfie toaster custom face') },
	{ cat: 'pets', name: 'Inflatable Cat Unicorn Horn', tagline: 'A tiny inflatable unicorn horn that straps onto your cat.', price: '$9.99', rating: 4.1, emoji: '🦄', review: 'My cat is now a majestic beast. She has not forgiven me.', fact: 'Real - peak cat humiliation gear.', buy: amz('inflatable cat unicorn horn') },
	{ cat: 'office', name: 'Handerpants', tagline: 'Tiny underpants that you wear on your hands.', price: '$8.95', rating: 4.4, emoji: '🩲', review: 'Finally, briefs for my fingers. Coworkers remain concerned.', fact: 'Real - genuine Archie McPhee absurdity.', buy: amz('handerpants') },
	{ cat: 'home', name: 'Beard Bib', tagline: 'A bib that catches your beard trimmings and suctions to the mirror.', price: '$24.99', rating: 4.3, emoji: '🧔', review: 'No more hairy sink. My partner stopped threatening me.', fact: 'Real - the Beard King pitched it on Shark Tank.', buy: amz('beard bib beard king') }
];

export const FALLBACK_FAKES: Product[] = [
	// Believable "could be real but isn't" fakes - plain names, subtle impossibility.
	// kitchen
	{ cat: 'kitchen', name: 'Avocado Ripening Box', tagline: 'A countertop box that claims to ripen a rock-hard avocado in 60 seconds.', price: '$34.99', rating: 4.0, emoji: '🥑', review: 'Used it twice. Avocado still hard, box still warm. Staying hopeful.', fact: 'AI-invented. There is no shortcut to a ripe avocado.' },
	{ cat: 'kitchen', name: 'Self-Stirring Sauce Pot', tagline: 'A pot that stirs your sauce and adjusts the heat by tasting it as it cooks.', price: '$49.99', rating: 4.2, emoji: '🥘', review: 'Risotto without the babysitting. It "tasted" my soup and oversalted it.', fact: 'AI-invented. Pots have no taste buds.' },
	{ cat: 'kitchen', name: 'Egg Freshness Scanner', tagline: 'A handheld scanner you wave over an egg to check if it is still good.', price: '$29.99', rating: 3.8, emoji: '🥚', review: 'Beeped green at an egg I was sure was bad. Trust issues now.', fact: 'AI-invented. The float-in-water test is free.' },
	{ cat: 'kitchen', name: 'Instant Cooling Mug', tagline: 'A mug that drops fresh coffee to the perfect sip temperature in 30 seconds.', price: '$45.00', rating: 4.1, emoji: '☕', review: 'Still scalds my tongue, just a bit faster. Looks sleek though.', fact: 'AI-invented. Physics charges a fee.' },
	{ cat: 'kitchen', name: 'Pizza Revival Box', tagline: 'A countertop box that makes day-old pizza taste freshly delivered.', price: '$39.99', rating: 4.0, emoji: '🍕', review: 'Crust got crispier, cheese got hopeful. Not terrible.', fact: 'AI-invented. The oven already does this.' },
	// pets
	{ cat: 'pets', name: 'Cat Translator Collar', tagline: 'A collar that turns your cat’s meows into short phrases on an app.', price: '$59.99', rating: 3.8, emoji: '🐱', review: 'It translated everything as "feed me." Possibly accurate.', fact: 'AI-invented. Cats refuse to be parsed.' },
	{ cat: 'pets', name: 'Pet Mood Camera', tagline: 'A home camera that texts you your dog’s mood throughout the day.', price: '$74.99', rating: 3.9, emoji: '📷', review: 'Reported "bored" forty times. We are working on it.', fact: 'AI-invented. It is just a camera with confidence.' },
	{ cat: 'pets', name: 'Aquarium Screensaver Lid', tagline: 'A tank lid that plays calming scenery for your fish to watch.', price: '$42.00', rating: 3.7, emoji: '🐠', review: 'The fish ignore it. The cat watches for hours.', fact: 'AI-invented. Fish are not subscribers.' },
	{ cat: 'pets', name: 'Hamster Step Counter', tagline: 'A wheel clip that tracks your hamster’s daily mileage in an app.', price: '$22.99', rating: 4.0, emoji: '🐹', review: 'He ran a marathon Tuesday, sat in the food bowl Wednesday.', fact: 'AI-invented. Hamsters do not log workouts.' },
	{ cat: 'pets', name: 'Dog Mood Bandana', tagline: 'A bandana that changes color to show your dog’s current mood.', price: '$16.99', rating: 3.8, emoji: '🐕', review: 'It is always blue. Either he is calm or it is just blue.', fact: 'AI-invented. Fabric cannot read feelings.' },
	// office
	{ cat: 'office', name: 'Coffee Ring Eraser', tagline: 'A pen that lifts coffee-ring stains right off paper documents.', price: '$12.99', rating: 3.9, emoji: '☕', review: 'Smudged the ring into a bigger ring. Still trying.', fact: 'AI-invented. Paper does not un-stain.' },
	{ cat: 'office', name: 'Self-Sorting Paper Tray', tagline: 'A desk tray that quietly reorders your papers by priority.', price: '$34.99', rating: 3.8, emoji: '🗂️', review: 'It moved one memo to the top. Bold choice. Wrong memo.', fact: 'AI-invented. Paper has no ambitions.' },
	{ cat: 'office', name: 'Whiteboard Eraser Robot', tagline: 'A palm-sized robot that drives across your whiteboard and erases it.', price: '$44.99', rating: 4.1, emoji: '🤖', review: 'Erased the board and one important phone number. Mostly great.', fact: 'AI-invented. Your sleeve still works.' },
	{ cat: 'office', name: 'Cubicle Quiet Hood', tagline: 'A fabric canopy that wraps your chair to block out office noise.', price: '$89.00', rating: 3.7, emoji: '🔇', review: 'Coworkers stopped talking to me entirely. Working as intended.', fact: 'AI-invented. That is a tent for one.' },
	{ cat: 'office', name: 'Pen Cap Locator', tagline: 'A tiny tracker that beeps to help you find a lost pen cap.', price: '$15.99', rating: 3.8, emoji: '🖊️', review: 'Found three caps, none of them mine. The hunt continues.', fact: 'AI-invented. Just buy more pens.' },
	// home
	{ cat: 'home', name: 'Sock Pairing Bin', tagline: 'A laundry bin that sorts and pairs your socks as you drop them in.', price: '$54.99', rating: 3.8, emoji: '🧦', review: 'Paired two unrelated socks with total confidence. Bold.', fact: 'AI-invented. The dryer still wins.' },
	{ cat: 'home', name: 'Wrinkle-Release Closet Rod', tagline: 'A closet rod that gently de-wrinkles your clothes overnight.', price: '$79.99', rating: 3.9, emoji: '👔', review: 'Shirts came out slightly less creased. Possibly placebo.', fact: 'AI-invented. The iron is unbothered.' },
	{ cat: 'home', name: 'Dream Recorder Headband', tagline: 'A sleep headband that records your dreams to replay in the morning.', price: '$129.00', rating: 3.7, emoji: '😴', review: 'Played back static and a vague horse. Five stars for mystery.', fact: 'AI-invented. Dreams are not on tape.' },
	{ cat: 'home', name: 'Pillow Fluffing Dock', tagline: 'A bedside dock that re-fluffs your pillow to full loft every morning.', price: '$59.99', rating: 3.8, emoji: '🛏️', review: 'Pillow is marginally fluffier. The whirring wakes me though.', fact: 'AI-invented. Just punch the pillow.' },
	{ cat: 'home', name: 'Stair-Climbing Vacuum', tagline: 'A robot vacuum that climbs stairs to clean every floor on its own.', price: '$199.00', rating: 3.9, emoji: '🪜', review: 'Tumbled down the stairs with great enthusiasm. Floors are clean-ish.', fact: 'AI-invented. Robot vacuums fear stairs.' },
	// tools
	{ cat: 'tools', name: 'Self-Leveling Picture Hook', tagline: 'A wall hook that keeps your frames perfectly level on its own.', price: '$13.99', rating: 3.9, emoji: '🖼️', review: 'Frame still tilts, but the hook seems proud of itself.', fact: 'AI-invented. Gravity remains in charge.' },
	{ cat: 'tools', name: 'No-Strip Screw Bit', tagline: 'A drill bit that removes any screw without ever stripping it.', price: '$19.99', rating: 4.0, emoji: '🪛', review: 'Stripped the screw and the bit. Two for one.', fact: 'AI-invented. Screws always find a way.' },
	{ cat: 'tools', name: 'Silent Hammer', tagline: 'A hammer with a dampened head so you can hang shelves at 2am.', price: '$24.99', rating: 3.8, emoji: '🔨', review: 'Neighbors still knocked. Nails went in fine though.', fact: 'AI-invented. Hammers are loud by nature.' },
	{ cat: 'tools', name: 'Smart Bubble Level', tagline: 'A stick-on level that sends the bubble reading to your phone.', price: '$16.99', rating: 3.7, emoji: '📐', review: 'Phone says level, shelf says otherwise. Trust the shelf.', fact: 'AI-invented. The bubble does not have wifi.' },
	{ cat: 'tools', name: 'Stud Finder Glasses', tagline: 'Glasses that let you see the studs and pipes behind your walls.', price: '$39.99', rating: 3.7, emoji: '🥽', review: 'Saw nothing but my own reflection. Walls remain mysterious.', fact: 'AI-invented. X-ray glasses still do not work.' },
	// tech
	{ cat: 'tech', name: 'Holographic Phone Projector', tagline: 'A clip-on lens that projects your phone screen as a floating hologram.', price: '$39.99', rating: 3.7, emoji: '📱', review: 'Projected a blurry blob that was technically my screen. Futuristic.', fact: 'AI-invented. That is not how light works.' },
	{ cat: 'tech', name: 'Kinetic Charging Case', tagline: 'A phone case that recharges your battery from your everyday movement.', price: '$49.99', rating: 3.8, emoji: '🔋', review: 'Walked 12,000 steps for three percent. Cardio at least.', fact: 'AI-invented. Your pocket is not a power plant.' },
	{ cat: 'tech', name: 'Universal Remote Wristband', tagline: 'A wristband that controls any TV in the room with a tap.', price: '$34.99', rating: 3.7, emoji: '⌚', review: 'Changed a stranger’s TV at the gym. Powerful, slightly evil.', fact: 'AI-invented. Your wrist is not a remote.' },
	{ cat: 'tech', name: 'Selective Silence Earbuds', tagline: 'Earbuds that filter out one specific person’s voice while you work.', price: '$129.00', rating: 3.9, emoji: '🎧', review: 'Muted my brother-in-law flawlessly. Worth every penny.', fact: 'AI-invented. They cannot pick a target. Sadly.' },
	{ cat: 'tech', name: 'Screen Crack Repair Film', tagline: 'A film you press on to fill and erase the cracks in your phone screen.', price: '$17.99', rating: 3.7, emoji: '📲', review: 'Cracks slightly less visible, fingers slightly more cut. Even trade.', fact: 'AI-invented. Glass does not heal.' },
	// garden
	{ cat: 'garden', name: 'Weed-Detecting Trowel', tagline: 'A trowel that scans a plant and tells you if it is a weed.', price: '$29.99', rating: 3.8, emoji: '🌱', review: 'Called my tomato seedling a weed. Bold and wrong.', fact: 'AI-invented. The trowel cannot tell either.' },
	{ cat: 'garden', name: 'Birdsong Garden Stone', tagline: 'A decorative stone that plays birdsong to attract real birds.', price: '$26.99', rating: 3.7, emoji: '🐦', review: 'Attracted one very confused pigeon. Progress.', fact: 'AI-invented. Birds prefer actual snacks.' },
	{ cat: 'garden', name: 'Tomato Ripening Lamp', tagline: 'A garden lamp that ripens green tomatoes on the vine overnight.', price: '$44.99', rating: 3.7, emoji: '🍅', review: 'Tomatoes still green, electric bill still up. Patience, I guess.', fact: 'AI-invented. Tomatoes ripen on their own time.' },
	{ cat: 'garden', name: 'Frost Warning Stake', tagline: 'A garden stake that glows blue a few hours before frost arrives.', price: '$22.99', rating: 3.9, emoji: '❄️', review: 'Glowed on a warm night. The tomatoes panicked for nothing.', fact: 'AI-invented. It cannot see the future.' },
	{ cat: 'garden', name: 'Talking Scarecrow', tagline: 'A scarecrow that detects birds and politely asks them to leave.', price: '$64.99', rating: 3.7, emoji: '🌾', review: 'It says "shoo" in a calm voice. The crows respect it.', fact: 'AI-invented. Scarecrows are the strong, silent type.' }
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
	const used = new Set<string>();
	// Take up to n items with distinct names (no duplicate cards in a day).
	const take = (arr: Product[], n: number, isReal: boolean): Product[] => {
		const out: Product[] = [];
		for (const p of shuffle(arr)) {
			if (out.length >= n) break;
			if (used.has(p.name)) continue;
			used.add(p.name);
			out.push({ ...p, isReal });
		}
		return out;
	};

	const realCount = Math.random() < 0.5 ? 2 : 3;
	const reals = take(
		REAL_PRODUCTS.filter((p) => p.cat === cat.id),
		realCount,
		true
	);

	const fakePool =
		liveFakes && liveFakes.length >= 3 ? liveFakes : FALLBACK_FAKES.filter((p) => p.cat === cat.id);
	let fks = take(fakePool, 5 - reals.length, false);
	// Backfill from the house deck if the live fakes had dupes or name collisions.
	if (reals.length + fks.length < 5) {
		fks = fks.concat(
			take(
				FALLBACK_FAKES.filter((p) => p.cat === cat.id),
				5 - reals.length - fks.length,
				false
			)
		);
	}

	return shuffle([...reals, ...fks]).map(withCrowd);
}

export function buildEndlessDeck(extraFakes?: Product[]): Product[] {
	const reals = REAL_PRODUCTS.map((p) => ({ ...p, isReal: true }));
	const fakes = [...FALLBACK_FAKES, ...(extraFakes || [])].map((p) => ({ ...p, isReal: false }));
	return shuffle([...reals, ...fakes]).map(withCrowd);
}
