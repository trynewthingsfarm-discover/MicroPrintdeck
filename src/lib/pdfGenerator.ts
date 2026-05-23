import jsPDFModule from 'jspdf';
import type { Deck } from '../types';
import { imageUrlToBase64 } from './pollinations';

const { jsPDF } = jsPDFModule;

// Micro card dimensions in inches: 1.4" × 2.0"
const CARD_W_IN = 1.4;
const CARD_H_IN = 2.0;
const PAGE_W_IN = 8.5;
const PAGE_H_IN = 11.0;
const MARGIN_IN = 0.35;
const GAP_IN = 0.1;

// Points (1 inch = 72 pts in jsPDF default)
const PT = 72;
const CARD_W = CARD_W_IN * PT;
const CARD_H = CARD_H_IN * PT;
const PAGE_W = PAGE_W_IN * PT;
const PAGE_H = PAGE_H_IN * PT;
const MARGIN = MARGIN_IN * PT;
const GAP = GAP_IN * PT;
const PRINT_W = PAGE_W - MARGIN * 2;
const PRINT_H = PAGE_H - MARGIN * 2;

const COLS = Math.floor((PRINT_W + GAP) / (CARD_W + GAP));
const ROWS = Math.floor((PRINT_H + GAP) / (CARD_H + GAP));
const PER_PAGE = COLS * ROWS;

function drawCutMarks(doc: jsPDF, x: number, y: number, w: number, h: number) {
  const len = 4;
  const gap = 2;
  doc.setDrawColor(180, 180, 180);
  doc.setLineWidth(0.3);
  // corners
  const corners = [
    [x, y], [x + w, y], [x, y + h], [x + w, y + h]
  ] as [number, number][];
  corners.forEach(([cx, cy]) => {
    const dx = cx === x ? 1 : -1;
    const dy = cy === y ? 1 : -1;
    doc.line(cx - dx * gap, cy, cx - dx * (gap + len), cy);
    doc.line(cx, cy - dy * gap, cx, cy - dy * (gap + len));
  });
}

function addPageHeader(doc: jsPDF, title: string, subtitle: string) {
  doc.setFontSize(9);
  doc.setTextColor(120, 100, 60);
  doc.setFont('helvetica', 'bold');
  doc.text(title, PAGE_W / 2, 18, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(160, 140, 100);
  doc.text(subtitle, PAGE_W / 2, 25, { align: 'center' });
}

async function loadImages(urls: string[]): Promise<(string | null)[]> {
  return Promise.all(urls.map(url => imageUrlToBase64(url).catch(() => null)));
}

export async function generateFrontsPDF(deck: Deck, onProgress?: (n: number) => void): Promise<void> {
  const doc = new jsPDF({ unit: 'pt', format: 'letter', orientation: 'portrait' });

  const cards = deck.cards.filter(c => c.front_image_url && c.status === 'done');
  const total = cards.length;

  for (let page = 0; page < Math.ceil(total / PER_PAGE); page++) {
    if (page > 0) doc.addPage();

    addPageHeader(
      doc,
      `${deck.name} — Card Fronts`,
      `Page ${page + 1} · Cut along marks · ${deck.deck_type === 'playing' ? 'Micro Playing Cards' : 'Micro Tarot Cards'}`
    );

    const pageCards = cards.slice(page * PER_PAGE, (page + 1) * PER_PAGE);
    const urls = pageCards.map(c => c.front_image_url);
    const images = await loadImages(urls);

    pageCards.forEach((card, i) => {
      const col = i % COLS;
      const row = Math.floor(i / COLS);
      const x = MARGIN + col * (CARD_W + GAP);
      const y = MARGIN + 18 + row * (CARD_H + GAP);

      // Card background
      doc.setFillColor(245, 240, 230);
      doc.roundedRect(x, y, CARD_W, CARD_H, 3, 3, 'F');

      const img = images[i];
      if (img) {
        try {
          doc.addImage(img, 'JPEG', x, y, CARD_W, CARD_H, undefined, 'FAST');
        } catch {
          doc.setFontSize(5);
          doc.setTextColor(100);
          doc.text(card.card_name, x + CARD_W / 2, y + CARD_H / 2, { align: 'center' });
        }
      }

      drawCutMarks(doc, x, y, CARD_W, CARD_H);

      if (onProgress) onProgress(page * PER_PAGE + i + 1);
    });
  }

  doc.save(`${deck.name.replace(/\s+/g, '_')}_fronts.pdf`);
}

export async function generateBacksPDF(deck: Deck, onProgress?: (n: number) => void): Promise<void> {
  if (!deck.back_image_url) return;
  const doc = new jsPDF({ unit: 'pt', format: 'letter', orientation: 'portrait' });

  const cardCount = deck.cards.filter(c => c.status === 'done').length;
  const backImg = await imageUrlToBase64(deck.back_image_url).catch(() => null);

  for (let page = 0; page < Math.ceil(cardCount / PER_PAGE); page++) {
    if (page > 0) doc.addPage();

    addPageHeader(
      doc,
      `${deck.name} — Card Backs`,
      `Page ${page + 1} · Print on reverse side of fronts sheet · Cut along marks`
    );

    const countOnPage = Math.min(PER_PAGE, cardCount - page * PER_PAGE);

    // For backs, mirror horizontally so they align when double-sided
    for (let i = 0; i < countOnPage; i++) {
      const col = COLS - 1 - (i % COLS); // mirror
      const row = Math.floor(i / COLS);
      const x = MARGIN + col * (CARD_W + GAP);
      const y = MARGIN + 18 + row * (CARD_H + GAP);

      doc.setFillColor(245, 240, 230);
      doc.roundedRect(x, y, CARD_W, CARD_H, 3, 3, 'F');

      if (backImg) {
        try {
          doc.addImage(backImg, 'JPEG', x, y, CARD_W, CARD_H, undefined, 'FAST');
        } catch { /* skip */ }
      }

      drawCutMarks(doc, x, y, CARD_W, CARD_H);
      if (onProgress) onProgress(page * PER_PAGE + i + 1);
    }
  }

  doc.save(`${deck.name.replace(/\s+/g, '_')}_backs.pdf`);
}

// Box net for a ~2.2" × 1.6" × 0.65" box (slightly larger than micro card stack)
export async function generateBoxPDF(deck: Deck): Promise<void> {
  const doc = new jsPDF({ unit: 'pt', format: 'letter', orientation: 'landscape' });

  // Box dimensions in points
  const W = 158; // card width + 2×2pt clearance ≈ 2.2"
  const H = 115; // card height + 2×2pt clearance ≈ 1.6"
  const D = 47;  // depth ≈ 0.65"
  const FLAP = 20;

  const cx = (PAGE_H / 2); // landscape: width is 792
  const cy = PAGE_W / 2;   // landscape: height is 612

  doc.setFontSize(8);
  doc.setTextColor(80, 70, 50);
  doc.text(`${deck.name} — Printable Box`, 396, 20, { align: 'center' });
  doc.setFontSize(6);
  doc.setTextColor(140, 120, 80);
  doc.text('Cut solid lines · Fold dashed lines · Glue tabs', 396, 30, { align: 'center' });

  // Layout: top panel, front panel, bottom panel, back panel, side panels, flaps
  const startX = cx - (W + D * 2 + 30);
  const startY = cy - (H / 2 + D + FLAP + 10);

  const panels: Array<{x: number; y: number; w: number; h: number; label: string}> = [
    { x: startX + D, y: startY, w: W, h: D, label: 'Top Flap' },
    { x: startX + D, y: startY + D, w: W, h: H, label: 'Front' },
    { x: startX + D, y: startY + D + H, w: W, h: D, label: 'Bottom' },
    { x: startX + D, y: startY + D + H + D, w: W, h: H, label: 'Back' },
    { x: startX, y: startY + D, w: D, h: H, label: 'Side' },
    { x: startX + D + W, y: startY + D, w: D, h: H, label: 'Side' },
  ];

  let boxImg: string | null = null;
  if (deck.box_image_url) {
    boxImg = await imageUrlToBase64(deck.box_image_url).catch(() => null);
  }

  panels.forEach(panel => {
    doc.setFillColor(252, 248, 240);
    doc.rect(panel.x, panel.y, panel.w, panel.h, 'F');

    if (boxImg && panel.label === 'Front') {
      try {
        doc.addImage(boxImg, 'JPEG', panel.x, panel.y, panel.w, panel.h);
      } catch { /* skip */ }
    }

    doc.setDrawColor(80, 70, 50);
    doc.setLineWidth(0.8);
    doc.rect(panel.x, panel.y, panel.w, panel.h);

    doc.setFontSize(6);
    doc.setTextColor(100, 90, 70);
    doc.text(panel.label, panel.x + panel.w / 2, panel.y + panel.h / 2 + 2, { align: 'center' });
  });

  // Tabs for gluing
  const tabW = 15;
  doc.setFillColor(240, 230, 210);
  doc.setDrawColor(180, 160, 120);
  doc.setLineWidth(0.5);
  doc.setLineDashPattern([2, 2], 0);

  const leftSide = panels[4];
  // Left tab
  doc.rect(leftSide.x - tabW, leftSide.y, tabW, leftSide.h, 'FD');
  doc.setFontSize(5);
  doc.setTextColor(140, 120, 80);
  doc.text('glue', leftSide.x - tabW / 2, leftSide.y + leftSide.h / 2, { align: 'center', angle: 90 });

  const rightSide = panels[5];
  // Right tab
  doc.rect(rightSide.x + rightSide.w, rightSide.y, tabW, rightSide.h, 'FD');
  doc.text('glue', rightSide.x + rightSide.w + tabW / 2, rightSide.y + rightSide.h / 2, { align: 'center', angle: 90 });

  // Top closure flap
  const topPanel = panels[0];
  doc.rect(topPanel.x, topPanel.y - FLAP, topPanel.w, FLAP, 'FD');
  doc.text('glue inside', topPanel.x + topPanel.w / 2, topPanel.y - FLAP / 2 + 2, { align: 'center' });

  doc.setLineDashPattern([], 0);

  // Fold instructions
  doc.setFontSize(6);
  doc.setTextColor(80, 70, 50);
  const instructions = [
    '1. Cut around outer edge',
    '2. Score & fold dashed lines',
    '3. Fold sides up first',
    '4. Glue tabs to sides',
    '5. Close top flap',
    '6. Slide cards inside!',
  ];
  const instrX = startX + W + D * 2 + tabW + 20;
  instructions.forEach((line, i) => {
    doc.text(line, instrX, startY + D + 15 + i * 12);
  });

  doc.save(`${deck.name.replace(/\s+/g, '_')}_box.pdf`);
}
