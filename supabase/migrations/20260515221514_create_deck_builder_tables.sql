/*
  # Deck Builder Tables

  ## Overview
  Creates the full schema for the Pocket Deck Builder SaaS app.

  ## New Tables

  ### `decks`
  - `id` - UUID primary key
  - `user_id` - links to Supabase auth.uid() (supports anonymous auth)
  - `name` - user-given deck name
  - `deck_type` - 'playing' or 'tarot'
  - `style_prompt` - the user's style description
  - `style_image_url` - optional reference image URL
  - `back_image_url` - generated card back image
  - `box_image_url` - generated box art image
  - `lead_magnet_image_url` - generated lead magnet image
  - `lead_magnet_copy` - generated marketing copy text
  - `status` - 'generating', 'complete', 'error'
  - `seed` - base seed for deterministic generation
  - `created_at` - timestamp

  ### `deck_cards`
  - `id` - UUID primary key
  - `deck_id` - foreign key to decks
  - `card_index` - position in the deck
  - `card_key` - machine-readable card identifier (e.g., 'ace_spades', 'the_moon')
  - `card_name` - human-readable card name
  - `card_suit` - suit for playing cards (spades/hearts/diamonds/clubs) or arcana type for tarot
  - `front_image_url` - Pollinations image URL for card front
  - `seed` - seed used for this specific card
  - `created_at` - timestamp

  ## Security
  - RLS enabled on both tables
  - Users can only read/write their own data via auth.uid()
  - Supports anonymous auth users
*/

-- Decks table
CREATE TABLE IF NOT EXISTS decks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL DEFAULT 'My Deck',
  deck_type text NOT NULL CHECK (deck_type IN ('playing', 'tarot')),
  style_prompt text NOT NULL DEFAULT '',
  style_image_url text,
  back_image_url text,
  box_image_url text,
  lead_magnet_image_url text,
  lead_magnet_copy text,
  status text NOT NULL DEFAULT 'generating' CHECK (status IN ('generating', 'complete', 'error')),
  seed integer NOT NULL DEFAULT 1000,
  total_cards integer NOT NULL DEFAULT 0,
  generated_count integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE decks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own decks"
  ON decks FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own decks"
  ON decks FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own decks"
  ON decks FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own decks"
  ON decks FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Deck cards table
CREATE TABLE IF NOT EXISTS deck_cards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  deck_id uuid NOT NULL REFERENCES decks(id) ON DELETE CASCADE,
  card_index integer NOT NULL,
  card_key text NOT NULL,
  card_name text NOT NULL,
  card_suit text,
  front_image_url text,
  seed integer NOT NULL DEFAULT 1000,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE deck_cards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own deck cards"
  ON deck_cards FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM decks
      WHERE decks.id = deck_cards.deck_id
      AND decks.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own deck cards"
  ON deck_cards FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM decks
      WHERE decks.id = deck_cards.deck_id
      AND decks.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own deck cards"
  ON deck_cards FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM decks
      WHERE decks.id = deck_cards.deck_id
      AND decks.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own deck cards"
  ON deck_cards FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM decks
      WHERE decks.id = deck_cards.deck_id
      AND decks.user_id = auth.uid()
    )
  );

-- Index for fast deck card lookups
CREATE INDEX IF NOT EXISTS idx_deck_cards_deck_id ON deck_cards(deck_id);
CREATE INDEX IF NOT EXISTS idx_deck_cards_deck_index ON deck_cards(deck_id, card_index);
CREATE INDEX IF NOT EXISTS idx_decks_user_id ON decks(user_id);
