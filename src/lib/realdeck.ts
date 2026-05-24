import type { CardDefinition } from '../types';
import { preloadImage } from './pollinations';

// Pollinations base URL
const BASE_URL = 'https://image.pollinations.ai/prompt';

// Standard card dimensions for AI
const CARD_W = 512;
const CARD_H = 768;

// Generate AI art URL for a card
export function buildCardImageUrl(
  card: CardDefinition,
  stylePrompt: string,
  deckType: 'playing' | 'tarot',
  seed: number
): string {
  // For playing cards - generate themed art
  const suitVisuals: Record<string, string> = {
    spades: 'deep blue and silver, celestial night sky, starlit',
    hearts: 'crimson and gold, romantic warm glow, passionate',
    diamonds: 'amber copper metallic, wealth luxury jewels',
    clubs: 'emerald forest green, natural earthy botanical',
  };

  const suitColor = suitVisuals[card.suit || 'spades'];

  let prompt: string;
  if (deckType === 'playing') {
    // For number cards - decorative themed background
    const rankNum = card.value === 'ace' ? 'A' : card.value?.toUpperCase();
    prompt = `${card.name} playing card artwork, ${suitColor}, ${stylePrompt}, elegant decorative art nouveau style, ornate borders and flourishes, no text no letters no numbers, pure decorative illustration, masterpiece quality`;

    // For face cards - character art
    if (['jack', 'queen', 'king'].includes(card.value || '')) {
      const faceType = card.value === 'jack' ? 'young noble courtier'
        : card.value === 'queen' ? 'elegant regal queen'
        : 'majestic powerful king';
      prompt = `${faceType} portrait, ${card.name}, ${suitColor}, ${stylePrompt}, royal court card, ornate costume with ${card.suit} motifs, dignified expression, playing card art, masterpiece illustration, no text`;
    }
  } else {
    // Tarot
    prompt = `${card.name} tarot card, ${stylePrompt}, ${card.artPromptHint || ''}, mystical artwork, detailed scene, tarot illustration style, masterpiece, no text`;
  }

  const encoded = encodeURIComponent(prompt);
  return `${BASE_URL}/${encoded}?width=${CARD_W}&height=${CARD_H}&seed=${seed}&nologo=true&model=flux`;
}

export function buildBackImageUrl(stylePrompt: string, deckType: 'playing' | 'tarot', seed: number): string {
  const prompt = `elegant ${deckType} card back design, ${stylePrompt}, ornate decorative pattern, seamless repeating motif, rich dark colors with gold accents, sophisticated symmetrical design, no figures no faces, premium collector quality`;

  const encoded = encodeURIComponent(prompt);
  return `${BASE_URL}/${encoded}?width=${CARD_W}&height=${CARD_H}&seed=${seed + 50000}&nologo=true&model=flux`;
}

export function buildBoxImageUrl(stylePrompt: string, deckType: 'playing' | 'tarot', seed: number): string {
  const prompt = `premium collector's box design for ${deckType} card deck, ${stylePrompt}, luxury product packaging, elegant typography space, ornate decorative border, rich saturated colors, masterpiece design`;

  const encoded = encodeURIComponent(prompt);
  return `${BASE_URL}/${encoded}?width=768&height=512&seed=${seed + 30000}&nologo=true&model=flux`;
}

export function buildLeadMagnetImageUrl(stylePrompt: string, deckType: 'playing' | 'tarot', seed: number): string {
  const prompt = `showcase of premium handcrafted ${deckType} card deck, ${stylePrompt}, elegant product photography, luxury collector's item, atmospheric lighting, compelling visual, masterpiece`;

  const encoded = encodeURIComponent(prompt);
  return `${BASE_URL}/${encoded}?width=1200&height=630&seed=${seed + 40000}&nologo=true&model=flux`;
}

export { preloadImage };
