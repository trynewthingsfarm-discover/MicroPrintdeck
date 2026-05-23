import jsPDFModule from 'jspdf';
import type { Deck } from '../types';
import { imageUrlToBase64 } from './pollinations';

const { jsPDF } = jsPDFModule;

// ==================== MICRO CARD SPECS ====================
// Standard micro card: 1.4" × 2.0" (35.5mm × 50.8mm)
// These match the "mini" size used by Deep Red Stamps and standard micro card printers
// Aspect ratio 0.7:1 (same as poker size 2.5"×3.5")
const CARD_W_IN = 1.4;
const CARD_H_IN = 2.0;

// Letter paper dimensions
const PAGE_W_IN = 8.5;
const PAGE_H_IN = 11.0;
const MARGIN_IN = 0.4;  // Slightly larger margin for printer compatibility
const GAP_IN = 0.08;   // Small gap for cutting tolerance

// Convert to points (1 inch = 72 pt)
const PT = 72;
const CARD_W = CARD_W_IN * PT;   // ~100.8 pt
const CARD_H = CARD_H_IN * PT;   // ~144 pt
const PAGE_W = PAGE_W_IN * PT;   // 612 pt
const PAGE_H = PAGE_H_IN * PT;   // 792 pt
const MARGIN = MARGIN_IN * PT;   // ~28.8 pt
const GAP = GAP_IN * PT;         // ~5.76 pt

// Calculate cards per page: 5 cols × 5 rows = 25 cards per page
// Fronts: playing 54/25=3 pages, tarot 78/25=4 pages
const PRINT_W = PAGE_W - MARGIN * 2;
const PRINT_H = PAGE_H - MARGIN * 2;
const COLS = Math.floor((PRINT_W + GAP) / (CARD_W + GAP));
const ROWS = Math.floor((PRINT_H + GAP) / (CARD_H + GAP));
const PER_PAGE = COLS * ROWS;

// Helper: Draw corner crop marks
function drawCropMarks(doc: ReturnType<typeof jsPDF>, x: number, y: number, w: number, h: number) {
  const len = 8;    // Mark length
  const offset = 3; // Gap from card edge
  doc.setDrawColor(150, 130, 90);
  doc.setLineWidth(0.4);

  // Four corners
  [[x, y, -1, -1], [x + w, y, 1, -1], [x, y + h, -1, 1], [x + w, y + h, 1, 1]].forEach(([cx, cy, dx, dy]) => {
    // Horizontal mark
    doc.line(Number(cx) + Number(dx) * offset, Number(cy), Number(cx) + Number(dx) * (offset + len), Number(cy));
    // Vertical mark
    doc.line(Number(cx), Number(cy) + Number(dy) * offset, Number(cx), Number(cy) + Number(dy) * (offset + len));
  });
}

// Helper: Add page header with deck name
function addHeader(doc: ReturnType<typeof jsPDF>, title: string, subtitle: string, pageNum: number, totalPages: number) {
  doc.setFontSize(10);
  doc.setTextColor(90, 70, 40);
  doc.setFont('helvetica', 'bold');
  doc.text(title, PAGE_W / 2, 20, { align: 'center' });

  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(130, 110, 70);
  doc.text(`${subtitle} · Page ${pageNum}/${totalPages}`, PAGE_W / 2, 28, { align: 'center' });

  // Print info at bottom
  doc.setFontSize(6);
  doc.setTextColor(160, 140, 100);
  doc.text(`Cards: ${CARD_W_IN}" × ${CARD_H_IN}" (micro size) · Print at 100% (no scaling) · Cut on crop marks`, PAGE_W / 2, PAGE_H - 12, { align: 'center' });
}

// Load images in batch
async function loadImages(urls: string[], onProgress?: (n: number) => void): Promise<(string | null)[]> {
  const results: (string | null)[] = [];
  for (let i = 0; i < urls.length; i++) {
    try {
      results.push(await imageUrlToBase64(urls[i]));
    } catch {
      results.push(null);
    }
    if (onProgress) onProgress(i + 1);
  }
  return results;
}

// ==================== FRONT CARDS PDF ====================
export async function generateFrontsPDF(deck: Deck, onProgress?: (n: number) => void): Promise<void> {
  const doc = new jsPDF({ unit: 'pt', format: 'letter', orientation: 'portrait' });

  const cards = deck.cards.filter(c => c.front_image_url && c.status === 'done');
  const total = cards.length;
  const totalPages = Math.ceil(total / PER_PAGE);

  let loaded = 0;
  const cardCount = cards.length;

  for (let page = 0; page < totalPages; page++) {
    if (page > 0) doc.addPage();

    const pageNum = page + 1;
    addHeader(
      doc,
      `${deck.name} — Card Fronts`,
      'Cut on crop marks',
      pageNum,
      totalPages
    );

    const pageCards = cards.slice(page * PER_PAGE, (page + 1) * PER_PAGE);

    for (let i = 0; i < pageCards.length; i++) {
      const card = pageCards[i];
      const col = i % COLS;
      const row = Math.floor(i / COLS);
      const x = MARGIN + col * (CARD_W + GAP);
      const y = MARGIN + 15 + row * (CARD_H + GAP);

      // Card background (subtle ivory)
      doc.setFillColor(252, 250, 245);
      doc.roundedRect(x, y, CARD_W, CARD_H, 2, 2, 'F');

      // Load and embed image
      try {
        const imgData = await imageUrlToBase64(card.front_image_url!);
        doc.addImage(imgData, 'JPEG', x, y, CARD_W, CARD_H, undefined, 'FAST');
      } catch {
        // Fallback: card name text
        doc.setFontSize(6);
        doc.setTextColor(100, 80, 60);
        doc.text(card.card_name, x + CARD_W / 2, y + CARD_H / 2, { align: 'center', maxWidth: CARD_W - 4 });
      }

      // Crop marks
      drawCropMarks(doc, x, y, CARD_W, CARD_H);

      loaded++;
      if (onProgress && loaded % 5 === 0) {
        onProgress(Math.floor((loaded / cardCount) * 100));
      }
    }
  }

  doc.save(`${deck.name.replace(/\s+/g, '_')}_fronts.pdf`);
}

// ==================== BACK CARDS PDF ====================
export async function generateBacksPDF(deck: Deck, onProgress?: (n: number) => void): Promise<void> {
  if (!deck.back_image_url) return;

  const doc = new jsPDF({ unit: 'pt', format: 'letter', orientation: 'portrait' });

  const cards = deck.cards.filter(c => c.status === 'done');
  const total = cards.length;
  const totalPages = Math.ceil(total / PER_PAGE);

  // Load back image once
  const backImg = await imageUrlToBase64(deck.back_image_url).catch(() => null);

  for (let page = 0; page < totalPages; page++) {
    if (page > 0) doc.addPage();

    const pageNum = page + 1;
    addHeader(
      doc,
      `${deck.name} — Card Backs`,
      'Print on REVERSE SIDE of fronts sheet',
      pageNum,
      totalPages
    );

    const countOnPage = Math.min(PER_PAGE, total - page * PER_PAGE);

    // IMPORTANT: Mirror horizontally for double-sided printing
    // When you flip the paper, the backs align with fronts
    for (let i = 0; i < countOnPage; i++) {
      const mirroredCol = COLS - 1 - (i % COLS);  // Mirror columns
      const row = Math.floor(i / COLS);
      const x = MARGIN + mirroredCol * (CARD_W + GAP);
      const y = MARGIN + 15 + row * (CARD_H + GAP);

      doc.setFillColor(252, 250, 245);
      doc.roundedRect(x, y, CARD_W, CARD_H, 2, 2, 'F');

      if (backImg) {
        try {
          doc.addImage(backImg, 'JPEG', x, y, CARD_W, CARD_H, undefined, 'FAST');
        } catch { /* skip */ }
      }

      drawCropMarks(doc, x, y, CARD_W, CARD_H);

      if (onProgress) onProgress(Math.floor(((page * PER_PAGE + i + 1) / total) * 100));
    }
  }

  doc.save(`${deck.name.replace(/\s+/g, '_')}_backs.pdf`);
}

// ==================== BOX TEMPLATE PDF ====================
// Box designed for micro card stack: ~2.2" × 1.6" × 0.65"
// Tumbled end box style (like cigarette/tarot boxes)
export async function generateBoxPDF(deck: Deck): Promise<void> {
  const doc = new jsPDF({ unit: 'pt', format: 'letter', orientation: 'landscape' });

  // Landscape letter: 792 × 612 pt (11" × 8.5")
  const LW = 792;
  const LH = 612;

  // Box dimensions (points)
  // Micro card stack: ~100 cards × 0.012" thick = ~1.2" stack
  // Box interior: Slightly larger than cards for easy slide
  const BW = 112;   // Box width: ~1.55" (card width 1.4" + clearance)
  const BH = 158;   // Box height: ~2.2" (card height 2.0" + clearance)
  const BD = 55;    // Box depth: ~0.76" (card stack + clearance)

  // Tuck flap dimensions
  const TUCK_H = 35;  // Tuck flap height
  const GLUE_TAB = 18; // Side glue tab width

  // Start position (centered)
  const startX = (LW - (BW + BD * 2)) / 2;
  const startY = (LH - (BH + TUCK_H + BD + 20)) / 2;

  // Title
  doc.setFontSize(11);
  doc.setTextColor(80, 60, 40);
  doc.setFont('helvetica', 'bold');
  doc.text(`${deck.name} — Printable Box Template`, LW / 2, 25, { align: 'center' });
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(120, 100, 70);
  doc.text('Cut solid lines · Score & fold dashed lines · Glue tabs where marked', LW / 2, 35, { align: 'center' });

  // Load box art
  const boxImg = deck.box_image_url ? await imageUrlToBase64(deck.box_image_url).catch(() => null) : null;

  // Panel layout (unfolded box net)
  // [Tuck Flap] [Front] [Bottom] [Back] [Top Closure]
  //            [Side]            [Side]

  const panels = [
    // Main face panels (horizontal strip)
    { x: startX + BD, y: startY + 40, w: BW, h: BH, label: 'FRONT', hasArt: true },
    { x: startX + BD, y: startY + 40 + BH, w: BW, h: BD, label: 'BOTTOM' },
    { x: startX + BD, y: startY + 40 + BH + BD, w: BW, h: BH, label: 'BACK' },
    { x: startX + BD, y: startY + 40 + BH * 2 + BD, w: BW, h: TUCK_H, label: 'TUCK FLAP' },

    // Side panels (vertical)
    { x: startX, y: startY + 40, w: BD, h: BH, label: 'SIDE' },
    { x: startX + BD + BW, y: startY + 40, w: BD, h: BH, label: 'SIDE' },

    // Top flap
    { x: startX + BD, y: startY + 40 - BD, w: BW, h: BD, label: 'TOP' },
  ];

  // Draw all panels
  panels.forEach((panel, idx) => {
    // Fill
    doc.setFillColor(252, 250, 245);
    doc.rect(panel.x, panel.y, panel.w, panel.h, 'F');

    // Add box art to front panel
    if (panel.hasArt && boxImg) {
      try {
        doc.addImage(boxImg, 'JPEG', panel.x + 4, panel.y + 4, panel.w - 8, panel.h - 8);
      } catch { /* skip */ }
    }

    // Solid border (cut line)
    doc.setDrawColor(60, 50, 40);
    doc.setLineWidth(0.8);
    doc.rect(panel.x, panel.y, panel.w, panel.h);

    // Panel label
    doc.setFontSize(5);
    doc.setTextColor(100, 80, 60);
    if (!panel.hasArt || !boxImg) {
      doc.text(panel.label, panel.x + panel.w / 2, panel.y + panel.h / 2 + 2, { align: 'center' });
    }
  });

  // Glue tabs (dashed border)
  doc.setLineDashPattern([3, 3], 0);
  doc.setDrawColor(140, 120, 80);
  doc.setLineWidth(0.5);
  doc.setFillColor(245, 240, 230);

  // Left side glue tab
  const leftSide = panels[4];
  doc.rect(leftSide.x - GLUE_TAB, leftSide.y, GLUE_TAB, leftSide.h, 'FD');
  doc.setFontSize(5);
  doc.setTextColor(140, 100, 60);
  doc.text('GLUE', leftSide.x - GLUE_TAB / 2, leftSide.y + leftSide.h / 2, { align: 'center', angle: 90 });

  // Right side glue tab
  const rightSide = panels[5];
  doc.rect(rightSide.x + rightSide.w, rightSide.y, GLUE_TAB, rightSide.h, 'FD');
  doc.text('GLUE', rightSide.x + rightSide.w + GLUE_TAB / 2, rightSide.y + rightSide.h / 2, { align: 'center', angle: 90 });

  doc.setLineDashPattern([], 0);

  // ==================== ASSEMBLY INSTRUCTIONS ====================
  const instrX = startX + BD + BW + BD + GLUE_TAB + 30;
  const instrY = startY + 40;

  doc.setFontSize(8);
  doc.setTextColor(70, 55, 35);
  doc.setFont('helvetica', 'bold');
  doc.text('Assembly Instructions:', instrX, instrY);

  doc.setFontSize(6);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 85, 65);

  const instructions = [
    '1. Print this page at 100% (no scaling)',
    '2. Cut around OUTER edge (solid lines)',
    '3. Score all DASHED lines with a ruler',
    '   and bone folder/empty ballpoint pen',
    '4. Fold all scored lines inward',
    '5. Apply glue to tabs marked "GLUE"',
    '6. Press side panels onto glued tabs',
    '7. Let dry for 10 minutes',
    '8. Tuck flap closes the top',
    '',
    'TIP: Use 80-110 lb cardstock for',
    'best results. Laminate for durability.',
  ];

  instructions.forEach((line, i) => {
    doc.text(line, instrX, instrY + 14 + i * 9);
  });

  // Dimensions reference
  doc.setFontSize(5);
  doc.setTextColor(140, 120, 90);
  doc.text(`Finished box: ~1.55" × 2.2" × 0.75"`, instrX, instrY + 130);
  doc.text(`Fits ${deck.deck_type === 'playing' ? '54' : '78'} micro cards`, instrX, instrY + 140);

  doc.save(`${deck.name.replace(/\s+/g, '_')}_box.pdf`);
}
