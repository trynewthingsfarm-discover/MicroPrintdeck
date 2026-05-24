// Standard playing card renderer with proper Unicode suit symbols

const CARD_W = 512;
const CARD_H = 768;

// Unicode suit symbols - actual playing card symbols
const SUIT_SYMBOLS: Record<string, string> = {
  spades: '♠',
  hearts: '♥',
  diamonds: '♦',
  clubs: '♣',
};

// Proper pip positions for each card rank (as percentages)
// These follow standard playing card layouts
const PIP_POSITIONS: Record<string, Array<[number, number, boolean]>> = {
  'A': [[0.5, 0.5, false]],  // Ace - one large centered
  '2': [[0.22, 0.18, false], [0.78, 0.82, true]],
  '3': [[0.22, 0.18, false], [0.5, 0.5, false], [0.78, 0.82, true]],
  '4': [[0.22, 0.18, false], [0.78, 0.18, false], [0.22, 0.82, true], [0.78, 0.82, true]],
  '5': [[0.22, 0.18, false], [0.78, 0.18, false], [0.5, 0.5, false], [0.22, 0.82, true], [0.78, 0.82, true]],
  '6': [[0.22, 0.18, false], [0.78, 0.18, false], [0.22, 0.5, false], [0.78, 0.5, false], [0.22, 0.82, true], [0.78, 0.82, true]],
  '7': [[0.22, 0.18, false], [0.78, 0.18, false], [0.22, 0.5, false], [0.5, 0.35, false], [0.78, 0.5, false], [0.22, 0.82, true], [0.78, 0.82, true]],
  '8': [[0.22, 0.12, false], [0.78, 0.12, false], [0.22, 0.36, false], [0.78, 0.36, false], [0.22, 0.64, true], [0.78, 0.64, true], [0.22, 0.88, true], [0.78, 0.88, true]],
  '9': [[0.22, 0.12, false], [0.78, 0.12, false], [0.22, 0.30, false], [0.78, 0.30, false], [0.5, 0.5, false], [0.22, 0.70, true], [0.78, 0.70, true], [0.22, 0.88, true], [0.78, 0.88, true]],
  '10': [[0.22, 0.10, false], [0.78, 0.10, false], [0.22, 0.28, false], [0.78, 0.28, false], [0.5, 0.40, false], [0.5, 0.60, true], [0.22, 0.72, true], [0.78, 0.72, true], [0.22, 0.90, true], [0.78, 0.90, true]],
};

export function generatePlayingCardSVG(
  rank: string,
  suit: 'spades' | 'hearts' | 'diamonds' | 'clubs',
  options: {
    accentColor?: string;
    pipSize?: number;
  } = {}
): string {
  const {
    accentColor = '#1a1a2e',
    pipSize = 36,
  } = options;

  const suitSymbol = SUIT_SYMBOLS[suit];
  const isRed = suit === 'hearts' || suit === 'diamonds';
  const suitColor = isRed ? '#c41e3a' : '#1a1a1a';

  // Rank display
  const rankDisplay = rank;

  // Generate pip positions
  let pipsContent = '';
  const positions = PIP_POSITIONS[rank] || [];
  const pipScale = rank === 'A' ? 2.5 : 1;

  positions.forEach(([px, py, inverted]) => {
    const x = px * CARD_W;
    const y = py * CARD_H;
    const fontSize = pipSize * pipScale;
    const transform = inverted ? `translate(${x}, ${y}) rotate(180)` : `translate(${x}, ${y})`;
    pipsContent += `
      <text
        x="0"
        y="0"
        font-family="serif"
        font-size="${fontSize}"
        font-weight="500"
        fill="${suitColor}"
        text-anchor="middle"
        dominant-baseline="central"
        transform="${transform}"
      >${suitSymbol}</text>`;
  });

  // Corner indices (top-left)
  const cornerContent = `
    <text x="0" y="0" font-family="serif" font-size="28" font-weight="bold" fill="${suitColor}" text-anchor="middle">${rankDisplay}</text>
    <text x="0" y="28" font-family="serif" font-size="24" fill="${suitColor}" text-anchor="middle">${suitSymbol}</text>
  `;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${CARD_W} ${CARD_H}" width="${CARD_W}" height="${CARD_H}">
  <defs>
    <linearGradient id="cardBg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#fefefe"/>
      <stop offset="100%" style="stop-color:#f5f3ed"/>
    </linearGradient>
  </defs>

  <!-- Card border -->
  <rect x="0" y="0" width="${CARD_W}" height="${CARD_H}" fill="url(#cardBg)" stroke="${accentColor}" stroke-width="3" rx="12" />

  <!-- Top-left corner -->
  <g transform="translate(${CARD_W * 0.1}, ${CARD_H * 0.08})">
    ${cornerContent}
  </g>

  <!-- Bottom-right corner (rotated 180) -->
  <g transform="translate(${CARD_W * 0.90}, ${CARD_H * 0.92}) rotate(180)">
    ${cornerContent}
  </g>

  <!-- Main pips -->
  ${pipsContent}
</svg>`;

  return svg;
}

// Card back SVG
export function generateCardBackSVG(style: 'classic' | 'ornate' | 'minimal' = 'ornate'): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${CARD_W} ${CARD_H}" width="${CARD_W}" height="${CARD_H}">
  <defs>
    <linearGradient id="backBg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#1a1a2e"/>
      <stop offset="100%" style="stop-color:#16213e"/>
    </linearGradient>
    <pattern id="backPattern" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
      <rect width="40" height="40" fill="none" stroke="#d4af37" stroke-width="0.5" opacity="0.3"/>
      <circle cx="20" cy="20" r="6" fill="none" stroke="#d4af37" stroke-width="0.5" opacity="0.4"/>
    </pattern>
  </defs>

  <rect x="0" y="0" width="${CARD_W}" height="${CARD_H}" fill="url(#backBg)" stroke="#d4af37" stroke-width="3" rx="12" />
  <rect x="12" y="12" width="${CARD_W - 24}" height="${CARD_H - 24}" fill="url(#backPattern)" rx="8" />
  <rect x="12" y="12" width="${CARD_W - 24}" height="${CARD_H - 24}" fill="none" stroke="#d4af37" stroke-width="2" rx="8" />
</svg>`;

  return svg;
}

// Convert SVG to data URL
export function svgToDataURL(svg: string): string {
  const encoded = encodeURIComponent(svg);
  return `data:image/svg+xml,${encoded}`;
}

// Convert SVG to canvas for PDF
export async function svgToCanvas(svg: string): Promise<HTMLCanvasElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = CARD_W;
      canvas.height = CARD_H;
      const ctx = canvas.getContext('2d')!;
      ctx.fillStyle = '#fefefe';
      ctx.fillRect(0, 0, CARD_W, CARD_H);
      ctx.drawImage(img, 0, 0);
      resolve(canvas);
    };
    img.onerror = reject;
    img.src = svgToDataURL(svg);
  });
}
