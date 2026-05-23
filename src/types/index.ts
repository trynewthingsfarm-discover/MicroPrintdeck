export type DeckType = 'playing' | 'tarot';
export type DeckStatus = 'idle' | 'generating' | 'complete' | 'error';

export type AppPage = 'landing' | 'builder' | 'gallery' | 'export' | 'leadmagnet' | 'mydecks';

export interface CardDefinition {
  key: string;
  name: string;
  suit?: string;
  value?: string;
  number?: string;
  arcana?: 'major' | 'minor';
  element?: string;
  symbolism: string;
  artPromptHint: string;
}

export interface GeneratedCard {
  id?: string;
  deck_id?: string;
  card_index: number;
  card_key: string;
  card_name: string;
  card_suit?: string;
  front_image_url: string;
  seed: number;
  status: 'pending' | 'generating' | 'done' | 'error';
}

export interface Deck {
  id?: string;
  user_id?: string;
  name: string;
  deck_type: DeckType;
  style_prompt: string;
  style_image_url?: string;
  back_image_url?: string;
  box_image_url?: string;
  lead_magnet_image_url?: string;
  lead_magnet_copy?: string;
  status: DeckStatus;
  seed: number;
  total_cards: number;
  generated_count: number;
  cards: GeneratedCard[];
  created_at?: string;
}
