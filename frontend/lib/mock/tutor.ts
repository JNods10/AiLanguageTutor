import type { ChatTurn, Correction, Message } from "@/lib/types/chat";
import type { Language } from "@/lib/languages";
import { createId } from "@/lib/utils/id";

type ScriptedResponse = {
  reply: string;
  correction: Correction;
  trigger: string;
};

const OPENING_MESSAGES: Record<string, string> = {
  es: "¡Hola! Soy tu tutor de español. Hoy vamos a practicar hablando de compras y mercados. ¿Qué te gustaría comprar en un mercado local?",
  fr: "Bonjour ! Je suis votre tuteur de français. Aujourd'hui, nous allons pratiquer en parlant des courses et des marchés. Qu'aimeriez-vous acheter au marché local ?",
  ja: "こんにちは！日本語のチューターです。今日は買い物や市場について練習しましょう。地元の市場で何を買いたいですか？",
  de: "Hallo! Ich bin dein Deutsch-Tutor. Heute üben wir Einkaufen und Märkte. Was würdest du auf einem lokalen Markt kaufen?",
  pt: "Olá! Sou seu tutor de português. Hoje vamos praticar falando sobre compras e mercados. O que você gostaria de comprar em um mercado local?",
  zh: "你好！我是你的中文导师。今天我们来练习购物和市场的话题。你想在当地市场买什么？",
  nl: "Hallo! Ik ben je Nederlandse tutor. Vandaag oefenen we met praten over winkelen en markten. Wat zou je willen kopen op een lokale markt?",
};

const SCRIPTED_RESPONSES: Record<string, ScriptedResponse> = {
  es: {
    reply:
      "¡Buena pregunta! En los mercados locales puedes encontrar frutas frescas, verduras y productos artesanales. ¿Has visitado algún mercado en España o en otro país hispanohablante?",
    correction: {
      original: "al tienda",
      corrected: "a la tienda",
      explanation:
        '"Tienda" is feminine — it takes the article "la", not "el". So "al" (a + el) becomes "a la".',
      tags: ["comprar", "mercados"],
    },
    trigger: "al tienda",
  },
  fr: {
    reply:
      "Excellente question ! Dans les marchés locaux, vous pouvez trouver des fruits frais, des légumes et des produits artisanaux. Avez-vous déjà visité un marché en France ?",
    correction: {
      original: "le marché du légumes",
      corrected: "le marché des légumes",
      explanation:
        '"Légumes" is plural, so you need "des" (de + les), not "du" (de + le).',
      tags: ["marché", "légumes"],
    },
    trigger: "du légumes",
  },
  ja: {
    reply:
      "いい質問ですね！地元の市場では新鮮な果物、野菜、手工芸品が見つかります。日本や他の国の市場に行ったことがありますか？",
    correction: {
      original: "市場に行きました",
      corrected: "市場へ行きました",
      explanation:
        'When indicating direction toward a place, "へ" is often more natural than "に" for movement verbs like 行く.',
      tags: ["市場", "買い物"],
    },
    trigger: "市場に行",
  },
  de: {
    reply:
      "Gute Frage! Auf lokalen Märkten findest du frisches Obst, Gemüse und handgemachte Produkte. Warst du schon mal auf einem Markt in Deutschland?",
    correction: {
      original: "in der Markt",
      corrected: "auf dem Markt",
      explanation:
        '"Markt" is masculine and uses "der". For open-air markets, Germans typically say "auf dem Markt", not "in der Markt".',
      tags: ["Markt", "einkaufen"],
    },
    trigger: "in der markt",
  },
  pt: {
    reply:
      "Boa pergunta! Nos mercados locais você encontra frutas frescas, verduras e produtos artesanais. Você já visitou algum mercado no Brasil ou em Portugal?",
    correction: {
      original: "no mercado local",
      corrected: "no mercado local",
      explanation:
        'Your phrase is correct! "No" combines "em" + "o" for masculine nouns like "mercado".',
      tags: ["mercado", "comprar"],
    },
    trigger: "mercado local",
  },
  zh: {
    reply:
      "好问题！在当地市场你可以找到新鲜水果、蔬菜和手工艺品。你去过中国或其他国家的市场吗？",
    correction: {
      original: "我去市场",
      corrected: "我去市场了",
      explanation:
        'Adding "了" at the end indicates a completed action, which sounds more natural when talking about a past visit.',
      tags: ["市场", "购物"],
    },
    trigger: "我去市场",
  },
  nl: {
    reply:
      "Goede vraag! Op lokale markten vind je vers fruit, groenten en ambachtelijke producten. Ben je al eens naar een markt in Nederland geweest?",
    correction: {
      original: "naar de winkel ga",
      corrected: "naar de winkel gaan",
      explanation:
        'Infinitive verbs in Dutch typically end in "-en". "Gaan" is the correct infinitive form of "to go".',
      tags: ["markt", "winkelen"],
    },
    trigger: "winkel ga",
  },
};

const SEED_USER_MESSAGES: Record<string, string> = {
  es: "Quiero comprar frutas frescas al tienda del mercado.",
  fr: "Je veux acheter des fruits frais le marché du légumes.",
  ja: "地元の市場に行きました。新鮮な果物を買いたいです。",
  de: "Ich möchte frisches Obst in der Markt kaufen.",
  pt: "Quero comprar frutas frescas no mercado local.",
  zh: "我想去市场买新鲜水果。",
  nl: "Ik wil vers fruit kopen en naar de winkel ga.",
};

const FALLBACK_REPLY =
  "That's a great point! Keep practicing — the more you write, the more natural it will feel. Can you tell me more about what you'd like to learn?";

const SIMULATED_DELAY_MS = { min: 800, max: 1500 };

function getScripted(language: Language): ScriptedResponse {
  return SCRIPTED_RESPONSES[language.code] ?? SCRIPTED_RESPONSES.es;
}

function createTutorMessage(text: string, offsetMs = 0): Message {
  return {
    id: createId(),
    role: "tutor",
    text,
    timestamp: new Date(Date.now() - offsetMs),
  };
}

function createUserMessage(text: string, offsetMs = 0): Message {
  return {
    id: createId(),
    role: "user",
    text,
    timestamp: new Date(Date.now() - offsetMs),
  };
}

function matchesTrigger(userText: string, trigger: string): boolean {
  return userText.toLowerCase().includes(trigger.toLowerCase());
}

export function getOpeningTurn(language: Language): ChatTurn {
  const text = OPENING_MESSAGES[language.code] ?? OPENING_MESSAGES.es;
  return { message: createTutorMessage(text) };
}

export function getSeedConversation(language: Language): ChatTurn[] {
  const scripted = getScripted(language);
  const userText = SEED_USER_MESSAGES[language.code] ?? SEED_USER_MESSAGES.es;

  return [
    getOpeningTurn(language),
    { message: createUserMessage(userText, 120_000) },
    {
      message: createTutorMessage(scripted.reply, 60_000),
      correction: scripted.correction,
    },
  ];
}

export async function simulateTutorReply(
  userText: string,
  language: Language,
): Promise<ChatTurn> {
  const delay =
    SIMULATED_DELAY_MS.min +
    Math.random() * (SIMULATED_DELAY_MS.max - SIMULATED_DELAY_MS.min);
  await new Promise((resolve) => setTimeout(resolve, delay));

  const scripted = getScripted(language);
  const shouldCorrect = matchesTrigger(userText, scripted.trigger);

  return {
    message: createTutorMessage(shouldCorrect ? scripted.reply : FALLBACK_REPLY),
    correction: shouldCorrect ? scripted.correction : undefined,
  };
}
