import type { Deck, CardDefinition } from '../types';

// Pollinations base URL
const BASE_URL = 'https://image.pollinations.ai/prompt';

// Card dimensions for AI generation
const CARD_W = 512;
const CARD_H = 768;

// Generate deterministic URLs for AI art (for face cards only)
// Number cards get generated SVG with pips (instant, no AI needed)
export function buildFaceCardImageUrl(
  card: CardDefinition,
  stylePrompt: string,
  seed: number
): string {
  // Only face cards and jokers get AI art
  if (!['jack', 'queen', 'king', 'joker'].includes(card.value || '')) {
    return '';
  }

  const suitColors: Record<string, string> = {
    spades: 'midnight blue and silver accents',
    hearts: 'crimson and gold accents',
    diamonds: 'amber and copper accents',
    clubs: 'forest green and brass accents',
    joker: 'rainbow prismatic colors',
  };

  const suitColor = suitColors[card.suit || 'joker'];
  const faceRole = card.value === 'jack' ? 'youthful noble courtier page'
    : card.value === 'queen' ? 'regal elegant queen matriarch'
    : card.value === 'king' ? 'commanding majestic king monarch'
    : 'mischievous theatrical jester';

  const prompt = `${faceRole} portrait for ${card.name}, ${suitColor}, ${stylePrompt}, royal court card artwork, ornate costume with ${card.suit} motifs, dignified expression, elegant frame border, masterful illustration, print-ready quality, no text no letters no numbers`;

  const encoded = encodeURIComponent(prompt);
  return `${BASE_URL}/${encoded}?width=${CARD_W}&height=${CARD_H}&seed=${seed}&nologo=true&model=flux`;
}

export function buildCardBackImageUrl(stylePrompt: string, seed: number): string {
  const prompt = `elegant playing card back design, ${stylePrompt}, seamless repeating ornate pattern, sophisticated decorative motifs, rich dark tones with gold accents, intricate border frame, symmetrical design, no figures no faces, pure decorative pattern art, masterful illustration`;

  const encoded = encodeURIComponent(prompt);
  return `${BASE_URL}/${encoded}?width=${CARD_W}&height=${CARD_H}&seed=${seed + 50000}&nologo=true&model=flux`;
}

export function buildBoxImageUrl(stylePrompt: string, seed: number): string {
  const prompt = `luxury collector's box design for playing card deck, ${stylePrompt}, premium product packaging, elegant typography space at top, ornate decorative border, rich saturated colors, sophisticated illustration, professional design, masterpiece quality`;

  const encoded = encodeURIComponent(prompt);
  // Wider for box front face
  return `${BASE_URL}/${encoded}?width=768&height=512&seed=${seed + 30000}&nologo=true&model=flux`;
}

export function buildLeadMagnetImageUrl(stylePrompt: string, seed: number): string {
  const prompt = `premium marketing showcase for handcrafted playing card deck, ${stylePrompt}, elegant product photography mood, luxurious aesthetic, artistic quality, collector's item presentation, compelling visual, rich atmospheric lighting`;

  const encoded = encodeURIComponent(prompt);
  return `${BASE_URL}/${encoded}?width=1200&height=630&seed=${seed + 40000}&nologo=true&model=flux`;
}

// Export for compatibility
export { preloadImage } from './pollinations';
