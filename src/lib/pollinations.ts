import type { CardDefinition } from '../types';

const BASE_URL = 'https://image.pollinations.ai/prompt';
const TEXT_URL = 'https://text.pollinations.ai';

// Standard micro card: 2" height with ~1.4" width (2:3 aspect ratio like poker cards)
// At 72 DPI: 144 x 216 pts, we use 512x768 for high quality
const CARD_WIDTH = 512;
const CARD_HEIGHT = 768;

// Enhanced prompts for cohesive, sophisticated art
function buildQualityMarkers(): string {
  return 'masterful illustration, intricate fine art, professional quality, rich saturated colors, perfect for miniature print size, clear bold shapes readable at small scale, elegant ornate border frame';
}

function buildNegativeHints(): string {
  return 'NOT childish, NOT cartoon, NOT flat, NOT generic stock, NOT amateur, NOT blurry, NOT messy';
}

// Build a style anchor that gets embedded in every prompt for cohesion
function buildStyleAnchor(stylePrompt: string, deckType: 'playing' | 'tarot'): string {
  const baseStyle = stylePrompt.trim();
  // Ensure consistency by adding style anchors that tie all cards together
  const cohesionHints = 'unified aesthetic, consistent art style throughout deck, matching color palette, harmonious design language';
  return `${baseStyle}, ${cohesionHints}`;
}

function buildCardPrompt(
  card: CardDefinition,
  stylePrompt: string,
  deckType: 'playing' | 'tarot'
): string {
  const styleAnchor = buildStyleAnchor(stylePrompt, deckType);
  const quality = buildQualityMarkers();
  const negatives = buildNegativeHints();

  let cardSpecificPrompt: string;

  if (deckType === 'playing') {
    const suitGuidance = card.suit === 'spades' ? 'deep blue-black tones, elegant spade motifs'
      : card.suit === 'hearts' ? 'rich crimson and rose tones, romantic heart motifs'
      : card.suit === 'diamonds' ? 'brilliant gold and amber tones, geometric diamond facets'
      : card.suit === 'clubs' ? 'earth tones and forest greens, trefoil club motifs'
      : 'wild card energy, all colors';

    // Face cards get portrait treatment, number cards get design treatment
    if (['jack', 'queen', 'king'].includes(card.value || '')) {
      const faceRole = card.value === 'jack' ? 'youthful noble courtier'
        : card.value === 'queen' ? 'regal elegant matriarch sovereign'
        : 'commanding majestic monarch ruler';

      cardSpecificPrompt = `${faceRole} portrait for ${card.name}, ${suitGuidance}, noble court card art, royal attire with ${suitGuidance.split(',')[0]} accents, dignified expression, ornate frame border, ${card.artPromptHint}`;
    } else if (card.value === 'joker') {
      cardSpecificPrompt = `mischievous jester trickster figure, ${suitGuidance}, wild card art, elaborate costume, playful theatrical pose, carnival energy, ornate decorative border, ${card.artPromptHint}`;
    } else {
      // Number cards - focus on elegant pips arrangement
      cardSpecificPrompt = `${card.name}, elegant pip arrangement of ${card.suit} symbols, ${suitGuidance}, refined typography, classical playing card layout with ${card.value} symbols, clean sophisticated design, ornate border`;
    }
  } else {
    // Tarot cards
    const arcanaGuidance = card.arcana === 'major'
      ? 'major arcana, profound mystical symbolism, archetypal imagery, powerful transformative meaning'
      : `minor arcana ${card.suit} suit, subtle everyday magic, practical wisdom`;

    cardSpecificPrompt = `${card.name} tarot card, ${arcanaGuidance}, ${card.artPromptHint}, themes of ${card.symbolism}, ${styleAnchor}, mystical illustration, symbolic imagery, esoteric meaning visualized`;
  }

  const fullPrompt = `${cardSpecificPrompt}, ${styleAnchor}, ${quality}, ${negatives}`;

  return fullPrompt;
}

export function buildCardImageUrl(
  card: CardDefinition,
  stylePrompt: string,
  deckType: 'playing' | 'tarot',
  seed: number
): string {
  const prompt = buildCardPrompt(card, stylePrompt, deckType);
  const encoded = encodeURIComponent(prompt);

  // Use flux model for high quality, consistent results
  // Seed ensures reproducibility and ties cards together
  return `${BASE_URL}/${encoded}?width=${CARD_WIDTH}&height=${CARD_HEIGHT}&seed=${seed}&nologo=true&model=flux&enhance=true`;
}

export function buildBackImageUrl(stylePrompt: string, deckType: 'playing' | 'tarot', seed: number): string {
  const styleAnchor = buildStyleAnchor(stylePrompt, deckType);
  const deckLabel = deckType === 'playing' ? 'playing card' : 'tarot card';

  // Back design should complement but not compete with fronts
  // Use the same style but focus on pattern/ornament
  const prompt = `elegant ${deckLabel} back design, ${styleAnchor}, seamless repeating ornate pattern, sophisticated decorative motifs, rich jewel tones matching deck theme, intricate border frame, symmetrical design, no figures no text no faces, pure decorative pattern art, masterful illustration, print-ready quality`;

  const encoded = encodeURIComponent(prompt);
  // Different seed offset for uniqueness
  return `${BASE_URL}/${encoded}?width=${CARD_WIDTH}&height=${CARD_HEIGHT}&seed=${seed + 50000}&nologo=true&model=flux&enhance=true`;
}

export function buildBoxImageUrl(stylePrompt: string, deckType: 'playing' | 'tarot', seed: number): string {
  const styleAnchor = buildStyleAnchor(stylePrompt, deckType);
  const deckLabel = deckType === 'playing' ? 'playing card deck' : 'tarot card deck';

  // Box art should be eye-catching and showcase the style
  const prompt = `luxury collector's box design for ${deckLabel}, ${styleAnchor}, premium product packaging, elegant typography space at top, ornate decorative border, rich saturated colors, sophisticated illustration, professional design, clean layout for product label, masterpiece quality`;

  const encoded = encodeURIComponent(prompt);
  // Wider aspect for box front face
  return `${BASE_URL}/${encoded}?width=768&height=512&seed=${seed + 30000}&nologo=true&model=flux&enhance=true`;
}

export function buildLeadMagnetImageUrl(stylePrompt: string, deckType: 'playing' | 'tarot', seed: number): string {
  const styleAnchor = buildStyleAnchor(stylePrompt, deckType);
  const deckLabel = deckType === 'playing' ? 'playing card deck' : 'tarot card deck';

  const prompt = `premium marketing showcase for handcrafted ${deckLabel}, ${styleAnchor}, elegant product photography mood, luxurious aesthetic, artistic quality, collector's item presentation, compelling visual, rich atmospheric lighting, social media banner format`;

  const encoded = encodeURIComponent(prompt);
  // 1200x630 for social media (Instagram, Facebook, Twitter)
  return `${BASE_URL}/${encoded}?width=1200&height=630&seed=${seed + 40000}&nologo=true&model=flux&enhance=true`;
}

export async function generateLeadMagnetCopy(deckName: string, stylePrompt: string, deckType: 'playing' | 'tarot'): Promise<string> {
  const deckLabel = deckType === 'playing' ? 'playing card deck' : 'tarot card deck';
  const prompt = `Write compelling lead magnet copy for a handcrafted micro ${deckLabel} called "${deckName}". Style: ${stylePrompt}. Format: 1 punchy headline (under 10 words), 2 sentences of evocative description that makes people want it, 3 bullet points of key features (micro pocket size 1.4x2 inches, AI-generated unique art, printable PDF instant download), and 1 strong call to action. Make it feel premium and artistic. No emojis. Output only the copy.`;

  const encoded = encodeURIComponent(prompt);
  try {
    const res = await fetch(`${TEXT_URL}/${encoded}?model=openai`);
    if (!res.ok) throw new Error('Text gen failed');
    return await res.text();
  } catch {
    return `${deckName} — A Pocket-Sized Universe

Every card is a tiny portal. This micro ${deckLabel} distills art, mysticism, and craft into a deck that fits in your palm.

• Miniature 1.4"×2" pocket size — take it everywhere
• Unique AI-generated artwork — one-of-a-kind
• Printable PDF — cut, fold, and hold it

Download your deck and hold art in your hand.`;
  }
}

// Preload image to warm cache
export function preloadImage(url: string): Promise<void> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve();
    img.onerror = () => resolve();
    img.src = url;
  });
}

// Convert image URL to base64 for PDF embedding
export async function imageUrlToBase64(url: string): Promise<string> {
  const img = new Image();
  img.crossOrigin = 'anonymous';

  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = () => reject(new Error(`Failed to load image: ${url}`));
    img.src = url;
  });

  const canvas = document.createElement('canvas');
  canvas.width = img.naturalWidth || CARD_WIDTH;
  canvas.height = img.naturalHeight || CARD_HEIGHT;
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(img, 0, 0);
  return canvas.toDataURL('image/jpeg', 0.92);
}
