import type { CardDefinition } from '../types';

const BASE_URL = 'https://image.pollinations.ai/prompt';
const TEXT_URL = 'https://text.pollinations.ai';

// Micro card dimensions: 512x720 gives good ~2:3 ratio for print
const CARD_WIDTH = 512;
const CARD_HEIGHT = 720;

function buildCardPrompt(
  card: CardDefinition,
  stylePrompt: string,
  deckType: 'playing' | 'tarot'
): string {
  const style = stylePrompt.trim();
  const cardContext = deckType === 'playing' ? 'playing card' : 'tarot card';

  const qualityMarkers = 'masterful illustration, intricate linework, rich color, high contrast, crisp details, print-ready, professional quality, painterly, fine art';
  const sizeMarkers = 'designed for small format, clear at miniature scale, bold shapes, readable at 1.5 inches, no tiny unreadable text';
  const borderNote = 'ornate decorative border frame, elegant card border design';

  let fullPrompt: string;
  if (deckType === 'playing') {
    fullPrompt = `${card.name} ${cardContext}, ${style}, ${card.artPromptHint}, symbolism of ${card.symbolism}, ${borderNote}, ${qualityMarkers}, ${sizeMarkers}`;
  } else {
    const arcanaTag = card.arcana === 'major' ? 'major arcana' : `minor arcana ${card.suit} suit`;
    fullPrompt = `${card.name} tarot card, ${arcanaTag}, ${style}, ${card.artPromptHint}, themes of ${card.symbolism}, mystical symbolic illustration, ${borderNote}, ${qualityMarkers}, ${sizeMarkers}`;
  }

  // Negatives embedded as style guidance (Pollinations doesn't support neg prompts but we can hint)
  fullPrompt += ', NOT childish, NOT cartoon, NOT flat, NOT generic stock art';

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
  return `${BASE_URL}/${encoded}?width=${CARD_WIDTH}&height=${CARD_HEIGHT}&seed=${seed}&nologo=true&model=flux`;
}

export function buildBackImageUrl(stylePrompt: string, deckType: 'playing' | 'tarot', seed: number): string {
  const deckLabel = deckType === 'playing' ? 'playing card' : 'tarot card';
  const prompt = `${deckLabel} back design, ${stylePrompt}, seamless repeating pattern, ornate decorative motifs, elegant symmetrical design, rich colors, masterful illustration, tile-able pattern, beautiful back of card, intricate, professional, print-ready, no faces, no figures, pure geometric and botanical pattern design`;
  const encoded = encodeURIComponent(prompt);
  return `${BASE_URL}/${encoded}?width=${CARD_WIDTH}&height=${CARD_HEIGHT}&seed=${seed + 9999}&nologo=true&model=flux`;
}

export function buildBoxImageUrl(stylePrompt: string, deckType: 'playing' | 'tarot', seed: number): string {
  const deckLabel = deckType === 'playing' ? 'playing card deck' : 'tarot card deck';
  const prompt = `box art for ${deckLabel}, ${stylePrompt}, product packaging illustration, ornate design, jewel-toned colors, rich textures, elegant typography space, masterful illustration, clean edges, print-ready, beautiful collector box design`;
  const encoded = encodeURIComponent(prompt);
  return `${BASE_URL}/${encoded}?width=768&height=512&seed=${seed + 8888}&nologo=true&model=flux`;
}

export function buildLeadMagnetImageUrl(stylePrompt: string, deckType: 'playing' | 'tarot', seed: number): string {
  const deckLabel = deckType === 'playing' ? 'playing card deck' : 'tarot card deck';
  const prompt = `marketing banner for handcrafted ${deckLabel}, ${stylePrompt}, premium product showcase, elegant composition, collector item, social media ad, luxurious aesthetic, artistic quality, compelling visual, rich atmosphere, painterly`;
  const encoded = encodeURIComponent(prompt);
  return `${BASE_URL}/${encoded}?width=1200&height=630&seed=${seed + 7777}&nologo=true&model=flux`;
}

export async function generateLeadMagnetCopy(deckName: string, stylePrompt: string, deckType: 'playing' | 'tarot'): Promise<string> {
  const deckLabel = deckType === 'playing' ? 'playing card deck' : 'tarot card deck';
  const prompt = `Write compelling social media lead magnet copy for a handcrafted micro ${deckLabel} called "${deckName}". Style: ${stylePrompt}. Write exactly: 1 punchy headline (under 10 words), 2 sentences of evocative description that makes people want it, 3 bullet points of key features (micro/pocket size, AI-generated unique art, printable PDF instant download), and 1 strong call to action. Make it feel premium, artistic, and irresistible. No emojis. Output just the copy, no labels.`;
  const encoded = encodeURIComponent(prompt);
  try {
    const res = await fetch(`${TEXT_URL}/${encoded}?model=openai`);
    if (!res.ok) throw new Error('Text gen failed');
    return await res.text();
  } catch {
    return `${deckName} — A Pocket-Sized Universe\n\nEvery card is a tiny portal. This micro ${deckLabel} distills art, mysticism, and craft into a deck that fits in your palm.\n\n• Miniature pocket size — take it everywhere\n• Unique AI-generated artwork, one-of-a-kind\n• Printable PDF — cut, fold, and hold it in your hands\n\nDownload your deck and hold art in the palm of your hand.`;
  }
}

// Preload image by creating an Image element (warms the Pollinations cache)
export function preloadImage(url: string): Promise<void> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve();
    img.onerror = () => resolve(); // resolve anyway
    img.src = url;
  });
}

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
