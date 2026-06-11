/**
 * Seed 7 daily battles into Supabase (today + 6 previous days).
 * Usage: node --env-file=.env scripts/seed.mjs
 *
 * Requires these env vars (put them in a .env file at the project root):
 *   PUBLIC_SUPABASE_URL
 *   PRIVATE_SUPABASE_SERVICE_ROLE_KEY
 *   OPENROUTER_API_KEY
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.PRIVATE_SUPABASE_SERVICE_ROLE_KEY;
const OPENROUTER_KEY = process.env.OPENROUTER_API_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY || !OPENROUTER_KEY) {
  console.error('Missing env vars. Create a .env file with PUBLIC_SUPABASE_URL, PRIVATE_SUPABASE_SERVICE_ROLE_KEY, OPENROUTER_API_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: false } });

const MODEL_IDS = {
  claude: 'anthropic/claude-sonnet-4-5',
  chatgpt: 'openai/gpt-4o',
  gemini: 'google/gemini-pro-1.5',
};

const SYSTEM_PROMPT = "You are a helpful assistant. Answer the user's prompt directly and concisely. Do not introduce yourself or mention your name.";

// One prompt per category for the 7-day seed — spread across all 6 categories + one repeat
const SEED_BATTLES = [
  { category: 'coding',   prompt: 'Write a debounce function from scratch in JavaScript.' },
  { category: 'career',   prompt: 'How should I ask for a raise when I know I\'m underpaid by 20%?' },
  { category: 'writing',  prompt: 'Write a breakup text that is honest but genuinely kind.' },
  { category: 'research', prompt: 'What are the main arguments for and against a 4-day work week?' },
  { category: 'roast',    prompt: 'Roast someone who only drinks specialty coffee and never shuts up about it.' },
  { category: 'creator',  prompt: 'Write a 30-second sponsored segment script for a VPN in a tech video.' },
  { category: 'coding',   prompt: 'Explain what a closure is in JavaScript with a practical example.' },
];

async function callModel(modelId, prompt) {
  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${OPENROUTER_KEY}`,
      'Content-Type': 'application/json',
      'Origin': 'https://guessthemodel.com',
      'X-Title': 'GuessTheModel',
    },
    body: JSON.stringify({
      model: modelId,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: prompt },
      ],
      temperature: 0.7,
      max_tokens: 300,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`OpenRouter ${modelId}: ${err}`);
  }

  const data = await res.json();
  return data.choices[0]?.message?.content ?? '';
}

function dateString(daysAgo) {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().slice(0, 10);
}

async function seedBattle({ category, prompt }, daysAgo) {
  const battle_date = dateString(daysAgo);
  console.log(`\n[${daysAgo === 0 ? 'TODAY' : `-${daysAgo}d`}] ${category} — "${prompt.slice(0, 55)}…"`);

  // Skip if a daily already exists for this date
  const { data: existing } = await supabase
    .from('battles')
    .select('id')
    .eq('is_daily', true)
    .eq('battle_date', battle_date)
    .maybeSingle();

  if (existing) {
    console.log(`  → Skipped (battle already exists for ${battle_date})`);
    return;
  }

  console.log('  → Calling Claude, ChatGPT, Gemini…');
  const [claudeText, chatgptText, geminiText] = await Promise.all([
    callModel(MODEL_IDS.claude, prompt),
    callModel(MODEL_IDS.chatgpt, prompt),
    callModel(MODEL_IDS.gemini, prompt),
  ]);

  const { data: battle, error } = await supabase
    .from('battles')
    .insert({
      prompt,
      category,
      outputs: {
        modelA: { text: claudeText, model_id: MODEL_IDS.claude },
        modelB: { text: chatgptText, model_id: MODEL_IDS.chatgpt },
        modelC: { text: geminiText, model_id: MODEL_IDS.gemini },
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

  console.log(`  → Created ${battle.id}`);
}

async function main() {
  console.log('GuessTheModel seed script');
  console.log(`Seeding ${SEED_BATTLES.length} daily battles…`);

  // Seed in order: today first, then yesterday, etc.
  for (let i = 0; i < SEED_BATTLES.length; i++) {
    await seedBattle(SEED_BATTLES[i], i);
    if (i < SEED_BATTLES.length - 1) {
      // Small pause between battles to avoid rate limits
      await new Promise(r => setTimeout(r, 1500));
    }
  }

  console.log('\nDone. Your site now has battles for the past 7 days.');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
