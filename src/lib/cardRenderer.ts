// Standard playing card SVG renderer
// Generates proper playing cards with pips, ranks, and suit symbols

// Card dimensions (aspect ratio 2.5:3.5 poker size, scaled to 512x768 for AI generation)
const CARD_W = 512;
const CARD_H = 768;

// Margins as percentages (matching standard playing card layout)
const XM = 0.12;  // ~12% horizontal margin
const YM = 0.10;  // ~10% vertical margin
const XM_INV = 1 - XM;
const YM_INV = 1 - YM;

// Pip layout positions for each card number (y positions for pips)
// Each number has specific pip arrangements based on standard playing card patterns
const PIP_POSITIONS: Record<string, Array<[number, number]>> = {
  'A': [[0.5, 0.5]],  // One centered pip
  '2': [[XM, YM], [XM_INV, YM_INV]],
  '3': [[XM, YM], [0.5, 0.5], [XM_INV, YM_INV]],
  '4': [[XM, YM], [XM_INV, YM], [XM, YM_INV], [XM_INV, YM_INV]],
  '5': [[XM, YM], [XM_INV, YM], [0.5, 0.5], [XM, YM_INV], [XM_INV, YM_INV]],
  '6': [[XM, YM], [XM_INV, YM], [XM, 0.5], [XM_INV, 0.5], [XM, YM_INV], [XM_INV, YM_INV]],
  '7': [[XM, YM], [XM_INV, YM], [XM, 0.5], [0.32, 0.32], [XM_INV, 0.5], [XM, YM_INV], [XM_INV, YM_INV]],
  '8': [[XM, YM], [XM_INV, YM], [XM, 0.33], [0.32, 0.5], [XM_INV, 0.33], [XM, 0.67], [XM_INV, 0.67], [XM, YM_INV], [XM_INV, YM_INV]].slice(0, 8),
  '9': [[XM, YM], [XM_INV, YM], [XM, 0.32], [XM_INV, 0.32], [0.5, 0.5], [XM, 0.68], [XM_INV, 0.68], [XM, YM_INV], [XM_INV, YM_INV]],
  '10': [[XM, YM], [XM_INV, YM], [XM, 0.25], [XM_INV, 0.25], [XM, 0.42], [XM_INV, 0.42], [0.5, 0.5], [XM, 0.58], [XM_INV, 0.58], [XM, 0.75], [XM_INV, 0.75], [XM, YM_INV], [XM_INV, YM_INV]].slice(0, 10),
};

// SVG paths for suit pip symbols
const SUIT_PATHS = {
  spades: `<path d="M0,-12 C-8,0 -12,4 -12,8 C-12,14 -6,18 0,12 C6,18 12,14 12,8 C12,4 8,0 0,-12 M0,18 L-4,28 L4,28 Z" />`,
  hearts: `<path d="M0,10 C-12,-4 -18,-14 -12,-20 C-6,-26 0,-18 0,-18 C0,-18 6,-26 12,-20 C18,-14 12,-4 0,10 Z" />`,
  diamonds: `<path d="M0,-20 L12,0 L0,20 L-12,0 Z" />`,
  clubs: `<path d="M0,-20 C-10,-20 -16,-12 -12,0 C-16,8 -8,14 0,10 C8,14 16,8 12,0 C16,-12 10,-20 0,-20 M0,10 L-4,26 L4,26 Z" />`,
};

// Generate SVG for a playing card
export function generatePlayingCardSVG(
  rank: string,
  suit: 'spades' | 'hearts' | 'diamonds' | 'clubs',
  options: {
    accentColor?: string;
    borderColor?: string;
    textColor?: string;
    pipSize?: number;
    showCenterArt?: boolean;
  } = {}
): string {
  const {
    accentColor = '#1a1a2e',
    borderColor = '#d4af37',
    textColor = suit === 'hearts' || suit === 'diamonds' ? '#c41e3a' : '#1a1a2e',
    pipSize = 24,
    showCenterArt = true
  } = options;

  const suitPath = SUIT_PATHS[suit];
  const isFaceCard = ['J', 'Q', 'K'].includes(rank);
  const isAce = rank === 'A';
  const isJoker = rank === 'JOKER';

  // Build rank display (A, 2-10, J, Q, K)
  const rankDisplay = isJoker ? '*' : rank;

  // Scale pip positions to card dimensions
  const scalePipPos = ([px, py]: [number, number]): [number, number] => [
    px * CARD_W,
    py * CARD_H
  ];

  // Generate pips for the main card body
  let pipsSVG = '';
  if (!isFaceCard && !isJoker && PIP_POSITIONS[rank]) {
    const positions = PIP_POSITIONS[rank];
    positions.forEach(([px, py]) => {
      const [x, y] = scalePipPos([px, py]);
      // For mirrored positions, we need to check if pip should be inverted
      const shouldInvert = py > 0.55;
      pipsSVG += `
        <g transform="translate(${x}, ${y}) ${shouldInvert ? 'rotate(180)' : ''}">
          <g transform="scale(${pipSize / 20})">${suitPath}</g>
        </g>`;
    });
  }

  // Generate corner rank/pip indicators
  const cornerPip = `<g transform="scale(${pipSize * 0.7 / 20})">${suitPath}</g>`;
  const cornerContent = `
    <text x="0" y="0" font-family="serif" font-size="32" font-weight="bold" fill="${textColor}">${rankDisplay}</text>
    <g transform="translate(0, 36)">${cornerPip}</g>
  `;

  // Card border and background
  const borderPath = `
    M 12,0
    L ${CARD_W - 12},0
    C ${CARD_W},0 ${CARD_W},0 ${CARD_W},12
    L ${CARD_W},${CARD_H - 12}
    C ${CARD_W},${CARD_H} ${CARD_W},${CARD_H} ${CARD_W - 12},${CARD_H}
    L 12,${CARD_H}
    C 0,${CARD_H} 0,${CARD_H} 0,${CARD_H - 12}
    L 0,12
    C 0,0 0,0 12,0
    Z
  `;

  // Center art placeholder for AI overlay
  const centerArtRect = showCenterArt && (isFaceCard || isAce) ?
    `<rect x="${CARD_W * 0.15}" y="${CARD_H * 0.18}" width="${CARD_W * 0.7}" height="${CARD_H * 0.64}" fill="white" opacity="0.9" rx="8" />` :
    '';

  // Face card frame
  const faceCardFrame = isFaceCard ? `
    <rect x="${CARD_W * 0.12}" y="${CARD_H * 0.15}" width="${CARD_W * 0.76}" height="${CARD_H * 0.70}" fill="none" stroke="${borderColor}" stroke-width="3" rx="6" />
    <rect x="${CARD_W * 0.14}" y="${CARD_H * 0.17}" width="${CARD_W * 0.72}" height="${CARD_H * 0.66}" fill="white" rx="5" />
  ` : '';

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${CARD_W} ${CARD_H}" width="${CARD_W}" height="${CARD_H}">
  <defs>
    <linearGradient id="cardBg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#fefefe"/>
      <stop offset="100%" style="stop-color:#f8f6f0"/>
    </linearGradient>
  </defs>

  <!-- Card border -->
  <path d="${borderPath}" fill="url(#cardBg)" stroke="${borderColor}" stroke-width="2" />

  <!-- Top-left corner -->
  <g transform="translate(${CARD_W * 0.07}, ${CARD_H * 0.07})">
    ${cornerContent}
  </g>

  <!-- Bottom-right corner (inverted) -->
  <g transform="translate(${CARD_W * 0.93}, ${CARD_H * 0.93}) rotate(180)">
    ${cornerContent}
  </g>

  ${faceCardFrame}
  ${centerArtRect}

  <!-- Main pips -->
  <g fill="${textColor}">
    ${pipsSVG}
  </g>
</svg>`;

  return svg;
}

// Convert SVG to data URL for image embedding
export function svgToDataURL(svg: string): string {
  const encoded = encodeURIComponent(svg);
  return `data:image/svg+xml,${encoded}`;
}

// Create a canvas from SVG for PDF embedding
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

// Generate card back SVG with pattern
export function generateCardBackSVG(pattern: 'classic' | 'ornate' | 'minimal' = 'ornate'): string {
  const borderPath = `
    M 12,0
    L ${CARD_W - 12},0
    C ${CARD_W},0 ${CARD_W},0 ${CARD_W},12
    L ${CARD_W},${CARD_H - 12}
    C ${CARD_W},${CARD_H} ${CARD_W},${CARD_H} ${CARD_W - 12},${CARD_H}
    L 12,${CARD_H}
    C 0,${CARD_H} 0,${CARD_H} 0,${CARD_H - 12}
    L 0,12
    C 0,0 0,0 12,0
    Z
  `;

  // Border pattern
  let patternSVG = '';
  if (pattern === 'ornate') {
    // Decorative border with corner flourishes
    patternSVG = `
      <rect x="8" y="8" width="${CARD_W - 16}" height="${CARD_H - 16}" fill="none" stroke="#d4af37" stroke-width="2" rx="8" />
      <rect x="16" y="16" width="${CARD_W - 32}" height="${CARD_H - 32}" fill="none" stroke="#d4af37" stroke-width="1" rx="6" />
      <!-- Corner flourishes -->
      <circle cx="24" cy="24" r="8" fill="none" stroke="#d4af37" stroke-width="1.5" />
      <circle cx="${CARD_W - 24}" cy="24" r="8" fill="none" stroke="#d4af37" stroke-width="1.5" />
      <circle cx="24" cy="${CARD_H - 24}" r="8" fill="none" stroke="#d4af37" stroke-width="1.5" />
      <circle cx="${CARD_W - 24}" cy="${CARD_H - 24}" r="8" fill="none" stroke="#d4af37" stroke-width="1.5" />
    `;
  } else if (pattern === 'classic') {
    patternSVG = `
      <rect x="10" y="10" width="${CARD_W - 20}" height="${CARD_H - 20}" fill="none" stroke="#d4af37" stroke-width="3" rx="6" />
    `;
  }

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${CARD_W} ${CARD_H}" width="${CARD_W}" height="${CARD_H}">
  <defs>
    <linearGradient id="backBg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#1a1a2e"/>
      <stop offset="100%" style="stop-color:#16213e"/>
    </linearGradient>
  </defs>

  <!-- Card border -->
  <path d="${borderPath}" fill="url(#backBg)" stroke="#d4af37" stroke-width="2" />

  ${patternSVG}
</svg>`;

  return svg;
}
