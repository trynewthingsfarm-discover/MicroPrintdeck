import type { CardDefinition } from '../types';

const SUITS = ['spades', 'hearts', 'diamonds', 'clubs'] as const;
const VALUES = ['ace', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'jack', 'queen', 'king'] as const;

const SUIT_SYMBOLS: Record<string, string> = {
  spades: '♠ spade symbol, dark ink, powerful',
  hearts: '♥ heart symbol, crimson, passionate',
  diamonds: '♦ diamond gem, brilliant facets, wealth',
  clubs: '♣ clover trefoil, verdant, earthy',
};

const VALUE_HINTS: Record<string, string> = {
  ace: 'single large centered symbol, commanding presence, bold',
  '2': 'two symbols arranged vertically, balanced',
  '3': 'three symbols in triangle arrangement',
  '4': 'four symbols in grid, orderly',
  '5': 'five symbols, cross pattern',
  '6': 'six symbols, two columns',
  '7': 'seven symbols, three columns',
  '8': 'eight symbols, two columns of four',
  '9': 'nine symbols, three columns of three',
  '10': 'ten symbols, dense arrangement',
  jack: 'youthful noble figure, face card portrait, ornate attire, vibrant',
  queen: 'regal queen portrait, crown, jewels, powerful feminine energy',
  king: 'majestic king portrait, crown, scepter, commanding authority',
};

const SUIT_SYMBOLISM: Record<string, string> = {
  spades: 'intellect, challenges, transformation, the mind',
  hearts: 'emotion, love, relationships, intuition',
  diamonds: 'material world, finance, practical matters, earth',
  clubs: 'creativity, ambition, work, fire energy',
};

export function getPlayingCards(): CardDefinition[] {
  const cards: CardDefinition[] = [];
  SUITS.forEach((suit, si) => {
    VALUES.forEach((value, vi) => {
      cards.push({
        key: `${value}_${suit}`,
        name: `${value === 'ace' ? 'Ace' : value.charAt(0).toUpperCase() + value.slice(1)} of ${suit.charAt(0).toUpperCase() + suit.slice(1)}`,
        suit,
        value,
        symbolism: `${SUIT_SYMBOLISM[suit]}, ${value} energy`,
        artPromptHint: `${SUIT_SYMBOLS[suit]}, ${VALUE_HINTS[value]}`,
      });
      void si; void vi;
    });
  });
  cards.push({
    key: 'joker_red',
    name: 'Red Joker',
    suit: 'joker',
    value: 'joker',
    symbolism: 'wild card, chaos, trickster, unlimited potential',
    artPromptHint: 'jester figure, vibrant red costume, bells, mischievous grin, carnival energy',
  });
  cards.push({
    key: 'joker_black',
    name: 'Black Joker',
    suit: 'joker',
    value: 'joker',
    symbolism: 'shadow trickster, mysterious chaos, dark potential',
    artPromptHint: 'dark jester figure, black costume, stars, mysterious smile, shadow energy',
  });
  return cards;
}

export const MAJOR_ARCANA: CardDefinition[] = [
  { key: 'the_fool', name: 'The Fool', number: '0', arcana: 'major', element: 'air', symbolism: 'new beginnings, innocence, spontaneity, free spirit', artPromptHint: 'carefree wanderer at cliff edge, small dog, bright sun, white rose, mountains' },
  { key: 'the_magician', name: 'The Magician', number: 'I', arcana: 'major', element: 'air', symbolism: 'willpower, skill, manifestation, resourcefulness', artPromptHint: 'robed figure at altar, wand raised to heaven, infinity symbol overhead, four element tools' },
  { key: 'high_priestess', name: 'The High Priestess', number: 'II', arcana: 'major', element: 'water', symbolism: 'intuition, subconscious, mystery, inner knowledge', artPromptHint: 'veiled feminine figure between pillars, crescent moon at feet, pomegranate veil, scroll' },
  { key: 'the_empress', name: 'The Empress', number: 'III', arcana: 'major', element: 'earth', symbolism: 'fertility, abundance, nature, feminine power', artPromptHint: 'crowned goddess in lush forest, wheat field, waterfall, twelve stars, Venus symbol' },
  { key: 'the_emperor', name: 'The Emperor', number: 'IV', arcana: 'major', element: 'fire', symbolism: 'authority, structure, stability, fatherhood', artPromptHint: 'armored emperor on stone throne, rams head, orb and scepter, mountains, red cloak' },
  { key: 'the_hierophant', name: 'The Hierophant', number: 'V', arcana: 'major', element: 'earth', symbolism: 'tradition, conformity, spiritual wisdom, institutions', artPromptHint: 'pope-like figure on throne, triple crown, two supplicants, crossed keys, pillars' },
  { key: 'the_lovers', name: 'The Lovers', number: 'VI', arcana: 'major', element: 'air', symbolism: 'love, harmony, relationships, values, choices', artPromptHint: 'man and woman under angel Raphael, sun, tree of knowledge, tree of flames, Eden garden' },
  { key: 'the_chariot', name: 'The Chariot', number: 'VII', arcana: 'major', element: 'water', symbolism: 'control, willpower, victory, assertion, determination', artPromptHint: 'crowned warrior in chariot drawn by black and white sphinxes, stars, city walls, wand' },
  { key: 'strength', name: 'Strength', number: 'VIII', arcana: 'major', element: 'fire', symbolism: 'courage, compassion, inner strength, patience, taming', artPromptHint: 'woman gently closing lion\'s mouth, infinity symbol overhead, flowers, gentle power' },
  { key: 'the_hermit', name: 'The Hermit', number: 'IX', arcana: 'major', element: 'earth', symbolism: 'soul searching, introspection, inner guidance, solitude', artPromptHint: 'robed old man on snowy peak, lantern with star, walking staff, grey cloak, alone' },
  { key: 'wheel_of_fortune', name: 'Wheel of Fortune', number: 'X', arcana: 'major', element: 'fire', symbolism: 'fate, karma, life cycles, destiny, turning point', artPromptHint: 'great spinning wheel with Hebrew letters, Sphinx, TARO symbols, four winged creatures at corners' },
  { key: 'justice', name: 'Justice', number: 'XI', arcana: 'major', element: 'air', symbolism: 'fairness, truth, cause and effect, law, balance', artPromptHint: 'enthroned figure with scales and sword, red cloak, crown, two pillars, grey stone' },
  { key: 'the_hanged_man', name: 'The Hanged Man', number: 'XII', arcana: 'major', element: 'water', symbolism: 'suspension, restriction, letting go, sacrifice, perspective', artPromptHint: 'man hanging upside down from T-cross tree by one leg, halo, serene expression, free leg bent' },
  { key: 'death', name: 'Death', number: 'XIII', arcana: 'major', element: 'water', symbolism: 'endings, transformation, transition, beginnings, change', artPromptHint: 'skeleton knight in black armor on white horse, black flag with white rose, sunrise, fallen king' },
  { key: 'temperance', name: 'Temperance', number: 'XIV', arcana: 'major', element: 'fire', symbolism: 'balance, moderation, patience, purpose, meaning', artPromptHint: 'winged angel pouring water between two cups, one foot in water one on land, triangle in square, iris flowers' },
  { key: 'the_devil', name: 'The Devil', number: 'XV', arcana: 'major', element: 'earth', symbolism: 'shadow self, attachment, addiction, restriction, materialism', artPromptHint: 'horned Baphomet on black pedestal, two chained figures, inverted pentagram, torch, bat wings' },
  { key: 'the_tower', name: 'The Tower', number: 'XVI', arcana: 'major', element: 'fire', symbolism: 'sudden change, upheaval, chaos, revelation, awakening', artPromptHint: 'lightning-struck tower on cliff, crown blown off, two figures falling, flames, dark sky' },
  { key: 'the_star', name: 'The Star', number: 'XVII', arcana: 'major', element: 'air', symbolism: 'hope, faith, renewal, inspiration, serenity', artPromptHint: 'naked woman pouring water into pool and onto land, large star overhead, seven smaller stars, ibis in tree' },
  { key: 'the_moon', name: 'The Moon', number: 'XVIII', arcana: 'major', element: 'water', symbolism: 'illusion, fear, subconscious, uncertainty, dreams', artPromptHint: 'moon with profile face, two dogs howling, crawfish in pool, path between two towers, dew drops' },
  { key: 'the_sun', name: 'The Sun', number: 'XIX', arcana: 'major', element: 'fire', symbolism: 'positivity, success, vitality, joy, enlightenment', artPromptHint: 'radiant sun with face, naked child on white horse, sunflowers, red banner, walled garden, pure joy' },
  { key: 'judgement', name: 'Judgement', number: 'XX', arcana: 'major', element: 'fire', symbolism: 'reflection, reckoning, awakening, absolution, redemption', artPromptHint: 'angel Gabriel with trumpet, nude figures rising from coffins, cross flag, icy blue mountains' },
  { key: 'the_world', name: 'The World', number: 'XXI', arcana: 'major', element: 'earth', symbolism: 'completion, integration, accomplishment, whole, travel', artPromptHint: 'dancing figure in laurel wreath, purple sash, four creatures at corners, wands in each hand' },
];

const TAROT_SUITS = [
  { key: 'wands', name: 'Wands', element: 'fire', symbolism: 'creativity, passion, career, ambition, inspiration' },
  { key: 'cups', name: 'Cups', element: 'water', symbolism: 'emotions, relationships, intuition, dreams, the subconscious' },
  { key: 'swords', name: 'Swords', element: 'air', symbolism: 'intellect, conflict, truth, communication, challenges' },
  { key: 'pentacles', name: 'Pentacles', element: 'earth', symbolism: 'material world, work, finances, nature, the physical' },
];

const MINOR_VALUES = [
  { key: 'ace', name: 'Ace', hint: 'pure elemental energy distilled to single point, powerful seed of potential' },
  { key: 'two', name: 'Two', hint: 'duality, balance, choice, partnership between two forces' },
  { key: 'three', name: 'Three', hint: 'initial results, collaboration, group energy, trinity' },
  { key: 'four', name: 'Four', hint: 'stability, foundation, consolidation, rest' },
  { key: 'five', name: 'Five', hint: 'conflict, instability, challenge, change and disruption' },
  { key: 'six', name: 'Six', hint: 'harmony, balance after struggle, progress and movement' },
  { key: 'seven', name: 'Seven', hint: 'reflection, assessment, perseverance, inner work' },
  { key: 'eight', name: 'Eight', hint: 'mastery, momentum, action, power in motion' },
  { key: 'nine', name: 'Nine', hint: 'near completion, fulfillment, peak experience' },
  { key: 'ten', name: 'Ten', hint: 'completion, culmination, end of cycle, fullness' },
  { key: 'page', name: 'Page', hint: 'young messenger, student, new energy, messages and beginnings' },
  { key: 'knight', name: 'Knight', hint: 'active force, movement, quest, youthful action and adventure' },
  { key: 'queen', name: 'Queen', hint: 'mature nurturing energy, mastery of element, compassion and power' },
  { key: 'king', name: 'King', hint: 'highest mastery, authority, command, mature leadership' },
];

export function getTarotCards(): CardDefinition[] {
  const cards: CardDefinition[] = [...MAJOR_ARCANA];
  TAROT_SUITS.forEach(suit => {
    MINOR_VALUES.forEach(val => {
      cards.push({
        key: `${val.key}_${suit.key}`,
        name: `${val.name} of ${suit.name}`,
        suit: suit.key,
        value: val.key,
        arcana: 'minor',
        element: suit.element,
        symbolism: `${suit.symbolism}, ${val.hint}`,
        artPromptHint: `${suit.name} suit energy, ${val.hint}, ${suit.element} element, symbolic scene`,
      });
    });
  });
  return cards;
}

export function getCardsForDeckType(deckType: 'playing' | 'tarot'): CardDefinition[] {
  return deckType === 'playing' ? getPlayingCards() : getTarotCards();
}
