/**
 * Seed 7 daily battles into Supabase using pre-written static responses.
 * No OpenRouter calls needed — avoids origin/allowlist restrictions.
 * Usage: node --env-file=.env scripts/seed.mjs
 *
 * Requires: PUBLIC_SUPABASE_URL, PRIVATE_SUPABASE_SERVICE_ROLE_KEY
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.PRIVATE_SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Missing env vars. Need PUBLIC_SUPABASE_URL and PRIVATE_SUPABASE_SERVICE_ROLE_KEY in .env');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: false } });

const MODEL_IDS = {
  claude:  'anthropic/claude-sonnet-4-5',
  chatgpt: 'openai/gpt-4o',
  gemini:  'google/gemini-pro-1.5',
};

const SEED_BATTLES = [
  {
    category: 'coding',
    prompt: 'Write a debounce function from scratch in JavaScript.',
    claude: `function debounce(fn, delay) {
  let timer;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
}

// Usage
const handleSearch = debounce((query) => {
  console.log('Searching for:', query);
}, 300);

\`debounce\` wraps a function so it only fires after the specified delay has passed since the last call. Each new call resets the timer, so rapid-fire invocations (like keystrokes) only trigger the function once the user pauses.`,
    chatgpt: `function debounce(func, wait) {
  let timeout;

  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

How it works:
1. Returns a wrapper that clears any pending timer on every call
2. Sets a new timer for \`wait\` milliseconds
3. Only when the timer completes does it invoke the original function

Example usage:
const debouncedSearch = debounce(searchAPI, 500);
input.addEventListener('input', (e) => debouncedSearch(e.target.value));`,
    gemini: `A debounce function delays execution until a certain amount of time has passed since the last call. Here's a clean implementation:

function debounce(func, delay) {
  let timeoutId;
  return function(...args) {
    if (timeoutId) clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      func.apply(this, args);
    }, delay);
  };
}

Usage:
const debouncedResize = debounce(() => console.log('resized!'), 250);
window.addEventListener('resize', debouncedResize);

The key insight is that \`timeoutId\` lives in the closure — each call cancels the previous timer and starts fresh.`,
  },

  {
    category: 'career',
    prompt: "How should I ask for a raise when I know I'm underpaid by 20%?",
    claude: `Start by building your case before the conversation. Document your contributions — specific projects, metrics, and outcomes that show your value. Research market rates using Glassdoor, Levels.fyi, or LinkedIn Salary to back up the 20% gap with data, not just a feeling.

When you schedule the meeting, frame it as a career conversation, not a complaint. Open with your accomplishments, then present the market data: "Based on my research and what comparable roles pay, I think there's a gap worth discussing." Name the number you want — vague requests get vague answers.

Be ready for pushback. If budget is the excuse, ask about a timeline: "If not now, what would need to happen for a review in 90 days?" Get any commitments in writing. If they won't move at all, you have useful information about whether to stay.`,
    chatgpt: `Here's a strategic approach:

1. Do your homework first
Gather salary data from Glassdoor, LinkedIn Salary, and Levels.fyi. Document your specific achievements and quantify them — revenue generated, costs saved, projects shipped.

2. Request a dedicated meeting
Don't bring it up casually. Ask for time specifically to discuss your compensation.

3. Lead with value, follow with market data
"Over the past year, I've [accomplishments]. Based on current market rates for my role and experience, I believe there's a meaningful gap in my compensation."

4. State a specific number
Vague requests get vague answers. Ask for exactly what you want.

5. Prepare for objections
"Budget is tight" → Ask about a concrete timeline for review.
"You just got a raise" → Acknowledge it, pivot back to market data.

If they can't close the gap, that's valuable information about whether to stay.`,
    gemini: `Asking for a raise when you're underpaid requires preparation and confidence.

Prepare your case:
- Gather market data showing the 20% gap (Glassdoor, LinkedIn Salary, industry reports)
- List your key accomplishments with measurable impact
- Time it well — after a recent win, during review cycles, or when the company is doing well

The conversation:
Schedule a formal meeting. Open by expressing your commitment to the role, then present your case: "I've researched market rates for my role and there's a significant gap. I'd like to discuss bringing my salary to [specific number]."

Key tips:
- Name the exact number you want
- Stay professional — this is a business negotiation, not a confrontation
- Don't threaten to leave unless you mean it

If they say no, ask what specifically needs to change for a raise to happen, and request a concrete timeline in writing.`,
  },

  {
    category: 'writing',
    prompt: 'Write a breakup text that is honest but genuinely kind.',
    claude: `Hey. I've been sitting with this for a while, and I owe you honesty rather than more silence. I don't think we're right for each other long-term, and I'd rather tell you that clearly than let things drift. What we had was real, and you're someone I genuinely care about — that's exactly why I don't want to string you along. I'm sorry for how much this hurts. You deserve someone who's all in, and I want that for you.`,
    chatgpt: `Hey [Name], I've been thinking a lot, and I want to be honest with you because you deserve that. I don't think we're in the right place to keep building something together, and I know that's hard to hear. This isn't about you doing anything wrong — you've been kind and genuine, and I mean that. I just don't feel the connection we'd both need for this to work long-term, and it wouldn't be fair to either of us to continue.

I'm really grateful for the time we spent together. I'm sorry for the hurt this causes. Wishing you genuinely good things.`,
    gemini: `Hey, I've been thinking a lot about us, and I want to be honest with you because you deserve that.

I don't think this relationship is working for me, and I don't want to keep going and end up hurting you more down the line. You're a genuinely good person and you've treated me well — this isn't about anything you did wrong.

I care about you, which is why I'm telling you directly instead of pulling away or making excuses. I think we both deserve to find something that really fits.

I'm sorry for the pain this causes. I hope you give yourself space to feel whatever you need to feel, and that things get easier for you soon.`,
  },

  {
    category: 'research',
    prompt: 'What are the main arguments for and against a 4-day work week?',
    claude: `For:
- Productivity holds or improves. Trials in Iceland, the UK, and Japan found output stayed the same or increased — focused work time sharpens when it's scarce, and meetings get cut.
- Employee wellbeing. Reduced burnout, better mental health, lower absenteeism, and stronger retention.
- Environmental spillovers. Fewer commuting days lowers emissions; a longer weekend can stimulate leisure spending.

Against:
- Doesn't fit all industries. Healthcare, retail, manufacturing, and customer service can't easily compress schedules without coverage gaps or higher costs.
- Hidden intensity. Four days can mean cramming five days of stress into fewer hours, especially for people already stretched thin.
- Coordination friction. Global teams and clients on different schedules create real gaps.
- Uneven benefits. Salary workers gain most; hourly workers may just see fewer hours and less pay.

The strongest counterargument isn't that productivity drops — the evidence doesn't support that — but that it's a structural change that benefits some workers and sectors far more than others.`,
    chatgpt: `Arguments For a 4-Day Work Week:

Productivity benefits
- Research shows output often stays the same or improves (Microsoft Japan saw a 40% productivity increase)
- Parkinson's Law: work expands to fill time; less time can create more focus

Employee wellbeing
- Reduced burnout and stress
- Better work-life balance and mental health
- Higher job satisfaction and lower turnover

Business advantages
- Lower overhead (energy, office use)
- Competitive recruiting edge

Arguments Against:

Operational challenges
- Healthcare, manufacturing, and customer service need 5-7 day coverage
- Coordinating with clients on different schedules is complex

Potential downsides
- Work may get compressed rather than reduced — longer, more intense days
- Not all roles adapt equally; could widen white-collar vs. blue-collar gaps

Economic concerns
- Some businesses may need more staff to maintain coverage, raising costs

Bottom line: Evidence from trials is mostly positive, but universal implementation faces real structural barriers.`,
    gemini: `The 4-day work week debate has strong arguments on both sides.

Arguments in favor:
1. Maintained or improved productivity — Pilot programs in Iceland, the UK, and Japan showed most companies held output steady. Focused work replaces inefficient meetings.
2. Better employee wellbeing — Workers report lower stress, improved work-life balance, and reduced burnout, leading to lower absenteeism and higher retention.
3. Environmental benefits — Fewer commuting days reduce carbon emissions.
4. Talent attraction — Companies offering 4-day weeks gain a significant recruiting advantage.

Arguments against:
1. Not universally applicable — Healthcare, retail, emergency services, and manufacturing can't easily adopt compressed schedules without coverage issues.
2. Work compression — The same workload in fewer days can mean longer, more intense days rather than actual rest.
3. Coordination challenges — Global teams and clients on 5-day schedules create friction and communication gaps.
4. Unequal impact — Benefits skew toward knowledge workers; hourly workers may just see fewer paid hours.

The evidence from trials is generally encouraging, but successful implementation requires careful adaptation to industry and role type.`,
  },

  {
    category: 'roast',
    prompt: 'Roast someone who only drinks specialty coffee and never shuts up about it.',
    claude: `Ah yes, the person who turned a hot drink into a personality disorder. You spent $18 on a "naturally processed Ethiopian Yirgacheffe with notes of blueberry and jasmine" — which tastes exactly like burnt water, but you insist that's because my palate is "undeveloped."

You carry a ceramic travel cup to signal that plastic is beneath you, then spend 40 minutes describing your pour-over ratio to anyone who makes the mistake of asking how your morning is going. Your coffee guy has a name. You know his farm's elevation. You have strong opinions about water temperature. You have never, in recorded history, just wanted a coffee. You want an experience. An origin story. A journey.

The rest of us just want caffeine and for you to please, for five consecutive minutes, talk about literally anything else.`,
    chatgpt: `Ah, the specialty coffee person. The one who looked at humanity's greatest invention — a hot caffeinated beverage that gets people through the morning — and thought: this needs to be a whole thing.

You don't drink coffee. You curate it. You have a grinder that costs more than most people's rent, you describe flavor notes like you're testifying at a wine trial, and you've used the phrase "single origin" in conversation more times than you've said "I love you."

Your coffee order isn't a drink — it's a TED Talk with a receipt. You've ruined every diner breakfast by quietly judging the coffee while loudly saying nothing, which somehow communicates everything.

The worst part? You're not even more caffeinated than anyone else. You're just like this naturally.`,
    gemini: `Let's talk about the person who discovered that coffee could be a moral failing and ran with it.

You've never just had a coffee. You've had a "lightly washed Kenyan processed at 1,900 meters with stone fruit on the finish." You bring your own beans to other people's houses. You've said the word "terroir" unironically in casual conversation. Twice.

Your coffee journey has a beginning, a middle, and a chapter where you bought a $300 scale to weigh water. You look at a Starbucks the way a sommelier looks at a juice box.

The funniest part is that you're always tired. With all that precision, all that artisanal excellence — you're still exhausted by 2pm. Maybe the Folgers crowd is onto something.`,
  },

  {
    category: 'creator',
    prompt: 'Write a 30-second sponsored segment script for a VPN in a tech video.',
    claude: `"Before we get into it — quick word from today's sponsor, NordVPN. If you're using public WiFi at airports, cafes, or hotels, your traffic is visible to anyone on that network. NordVPN encrypts your connection so it isn't. It also lets you browse as if you're in a different country, which is useful if you travel or want access to region-locked content. One subscription covers six devices — phone, laptop, whatever. There's a 30-day money-back guarantee, so it's zero risk to try. Link in the description, and the code gets you an extra three months free. Alright, back to the video."`,
    chatgpt: `"This video is sponsored by ExpressVPN. When you're on public WiFi — at a coffee shop, airport, or hotel — your data is exposed to anyone on that network. ExpressVPN encrypts your entire connection in one tap, keeping your browsing, passwords, and personal info private. It also lets you access content from over 90 countries, which is great if you travel or want to unlock streaming libraries not available in your region. Works on all your devices, and they offer a 30-day money-back guarantee. Use the link in the description to get three extra months free with an annual plan. Now, back to what we were talking about."`,
    gemini: `[Upbeat but natural tone]

"Hey, quick break — this video is brought to you by Surfshark. Here's the thing about browsing without a VPN: your ISP can see everything you do online, and on public WiFi, so can anyone else on the network. Surfshark encrypts your connection and masks your IP so you're actually private — not just incognito-tab private. It also unblocks streaming content from other regions and comes with unlimited simultaneous device connections, so your whole household is covered on one plan. You can get Surfshark at a big discount with the link below, and there's a 30-day money-back guarantee. Alright, back to the video."`,
  },

  {
    category: 'coding',
    prompt: 'Explain what a closure is in JavaScript with a practical example.',
    claude: `A closure is a function that retains access to variables from its outer scope even after that outer function has finished executing.

function makeCounter() {
  let count = 0;
  return function () {
    count++;
    return count;
  };
}

const counter = makeCounter();
console.log(counter()); // 1
console.log(counter()); // 2
console.log(counter()); // 3

\`makeCounter\` runs once and returns the inner function. Normally you'd expect \`count\` to disappear after \`makeCounter\` finishes — but the returned function closes over \`count\`, keeping it alive in memory. Each call to \`counter()\` increments the same variable. This is useful for private state, memoization, and factory functions.`,
    chatgpt: `A closure is a function that "remembers" variables from its outer scope, even after that outer scope has finished executing.

function createGreeter(greeting) {
  return function(name) {
    console.log(\`\${greeting}, \${name}!\`);
  };
}

const sayHello = createGreeter('Hello');
const sayHi = createGreeter('Hi');

sayHello('Alice'); // "Hello, Alice!"
sayHi('Bob');      // "Hi, Bob!"

What's happening:
1. \`createGreeter\` runs and returns a new function
2. That function closes over the \`greeting\` variable
3. Even though \`createGreeter\` has finished, \`greeting\` persists in memory

Why it matters: closures let you create functions with private, persistent state. They're fundamental to JavaScript scope and used constantly in React hooks, module patterns, and callbacks.`,
    gemini: `A closure occurs when an inner function retains access to variables from its outer function's scope, even after the outer function has returned.

Here's a practical example — a reusable ID generator:

function createIdGenerator() {
  let lastId = 0;
  return function generateId() {
    lastId += 1;
    return lastId;
  };
}

const generateUserId = createIdGenerator();
const generateOrderId = createIdGenerator();

console.log(generateUserId());  // 1
console.log(generateUserId());  // 2
console.log(generateOrderId()); // 1 — separate counter
console.log(generateUserId());  // 3

Each call to \`createIdGenerator()\` creates its own \`lastId\`. The returned function closes over that variable, keeping it private. \`generateUserId\` and \`generateOrderId\` have completely independent counters.

Why closures matter: they give you private state without classes, and they're the foundation of memoization, currying, and the module pattern.`,
  },
];

function dateString(daysAgo) {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().slice(0, 10);
}

async function seedBattle(battle, daysAgo) {
  const battle_date = dateString(daysAgo);
  const label = daysAgo === 0 ? 'TODAY' : `-${daysAgo}d`;
  console.log(`\n[${label}] ${battle.category} — "${battle.prompt.slice(0, 55)}…"`);

  const { data: existing } = await supabase
    .from('battles')
    .select('id')
    .eq('is_daily', true)
    .eq('battle_date', battle_date)
    .maybeSingle();

  if (existing) {
    console.log(`  → Skipped (daily battle already exists for ${battle_date})`);
    return;
  }

  const { data, error } = await supabase
    .from('battles')
    .insert({
      prompt: battle.prompt,
      category: battle.category,
      outputs: {
        modelA: { text: battle.claude,  model_id: MODEL_IDS.claude  },
        modelB: { text: battle.chatgpt, model_id: MODEL_IDS.chatgpt },
        modelC: { text: battle.gemini,  model_id: MODEL_IDS.gemini  },
      },
      is_daily: true,
      battle_date,
    })
    .select()
    .single();

  if (error) {
    console.error(`  → DB error: ${error.message}`);
    return;
  }

  console.log(`  → Created ${data.id}`);
}

async function main() {
  console.log('GuessTheModel seed script (static responses)');
  console.log(`Seeding ${SEED_BATTLES.length} daily battles…`);

  for (let i = 0; i < SEED_BATTLES.length; i++) {
    await seedBattle(SEED_BATTLES[i], i);
  }

  console.log('\nDone.');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
