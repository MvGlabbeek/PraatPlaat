/*
  # Create Praatplaat Application Tables

  1. New Tables
    - `diagrams`
      - `id` (serial, primary key) - Auto-incrementing diagram identifier
      - `name` (text, not null) - Diagram name/title
      - `description` (text, nullable) - Optional diagram description
      - `style` (text, not null, default 'corporate') - Visual style identifier
      - `data` (jsonb, not null) - Full diagram data (elements, relations, viewport)
      - `visible_types` (text[], not null) - Array of visible element types
      - `visible_relations` (text[], not null) - Array of visible relation types
      - `created_at` (timestamptz, default now()) - Creation timestamp
      - `updated_at` (timestamptz, default now()) - Last update timestamp

    - `chat_messages`
      - `id` (serial, primary key) - Auto-incrementing message identifier
      - `diagram_id` (integer, not null, foreign key) - References diagrams table
      - `role` (text, not null) - Message role ('user' or 'assistant')
      - `content` (text, not null) - Message content
      - `timestamp` (bigint, not null) - Unix timestamp in milliseconds

    - `custom_styles`
      - `id` (text, primary key) - Custom style identifier
      - `name` (text, not null) - Display name
      - `org_name` (text, not null) - Organization name
      - `primary_color` (text, not null) - Primary brand color (hex)
      - `accent_color` (text, not null) - Accent brand color (hex)
      - `bg_color` (text, not null) - Background color (hex)
      - `text_color` (text, not null) - Text color (hex)
      - `border_color` (text, not null) - Border color (hex)
      - `font_family` (text, not null) - Font family CSS value
      - `element_icons` (jsonb, not null, default '{}') - Per-element custom icons
      - `is_preset` (boolean, not null, default false) - Whether this is a built-in preset

  2. Security
    - Enable RLS on all tables
    - Add policies for public access (no authentication in current app version)

  3. Indexes
    - Index on diagram_id for chat_messages for efficient queries
    - Index on timestamp for chat_messages for chronological sorting

  4. Important Notes
    - Uses JSONB for flexible diagram data storage
    - Array types for element/relation visibility filters
    - Foreign key cascade delete ensures chat messages are removed when diagram deleted
    - Timestamps track creation and updates for audit trail
*/

CREATE TABLE IF NOT EXISTS diagrams (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  style TEXT NOT NULL DEFAULT 'corporate',
  data JSONB NOT NULL,
  visible_types TEXT[] NOT NULL DEFAULT ARRAY['actor','process','application','data','transaction','system','event','decision','service','infrastructure'],
  visible_relations TEXT[] NOT NULL DEFAULT ARRAY['uses','triggers','flows','association','realization','composition','aggregation','assignment','access','influence'],
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS chat_messages (
  id SERIAL PRIMARY KEY,
  diagram_id INTEGER NOT NULL REFERENCES diagrams(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  timestamp BIGINT NOT NULL
);

CREATE TABLE IF NOT EXISTS custom_styles (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  org_name TEXT NOT NULL,
  primary_color TEXT NOT NULL,
  accent_color TEXT NOT NULL,
  bg_color TEXT NOT NULL,
  text_color TEXT NOT NULL,
  border_color TEXT NOT NULL,
  font_family TEXT NOT NULL,
  element_icons JSONB NOT NULL DEFAULT '{}',
  is_preset BOOLEAN NOT NULL DEFAULT false
);

CREATE INDEX IF NOT EXISTS idx_chat_messages_diagram_id ON chat_messages(diagram_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_timestamp ON chat_messages(timestamp);

ALTER TABLE diagrams ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_styles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to diagrams"
  ON diagrams FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow public insert to diagrams"
  ON diagrams FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Allow public update to diagrams"
  ON diagrams FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow public delete from diagrams"
  ON diagrams FOR DELETE
  TO public
  USING (true);

CREATE POLICY "Allow public read access to chat_messages"
  ON chat_messages FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow public insert to chat_messages"
  ON chat_messages FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Allow public update to chat_messages"
  ON chat_messages FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow public delete from chat_messages"
  ON chat_messages FOR DELETE
  TO public
  USING (true);

CREATE POLICY "Allow public read access to custom_styles"
  ON custom_styles FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow public insert to custom_styles"
  ON custom_styles FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Allow public update to custom_styles"
  ON custom_styles FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow public delete from custom_styles"
  ON custom_styles FOR DELETE
  TO public
  USING (true);

INSERT INTO custom_styles (id, name, org_name, primary_color, accent_color, bg_color, text_color, border_color, font_family, element_icons, is_preset)
VALUES ('digigo', 'digiGO', 'digiGO', '#000000', '#ffe103', '#ffffff', '#111111', '#000000', '''Inter'', ''DM Sans'', sans-serif', '{}', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO diagrams (id, name, description, style, data, visible_types, visible_relations)
VALUES (
  1,
  'Demo: Digitaal Loket',
  'Voorbeeld praatplaat voor een digitaal loket proces',
  'corporate',
  '{"elements":[{"id":"e1","type":"actor","label":"Burger","position":{"x":80,"y":200},"style":"corporate","description":"Eindgebruiker van het loket"},{"id":"e2","type":"application","label":"Digitaal Loket","position":{"x":300,"y":200},"style":"corporate","description":"Webportaal voor aanvragen"},{"id":"e3","type":"process","label":"Aanvraag verwerken","position":{"x":520,"y":200},"style":"corporate","description":"Backoffice verwerking"},{"id":"e4","type":"system","label":"GBA Koppeling","position":{"x":520,"y":380},"style":"corporate","description":"Basisregistratie Personen"},{"id":"e5","type":"data","label":"Aanvraagdossier","position":{"x":300,"y":380},"style":"corporate","description":"Opgeslagen aanvragen"},{"id":"e6","type":"actor","label":"Behandelaar","position":{"x":740,"y":200},"style":"corporate","description":"Gemeentelijk medewerker"}],"relations":[{"id":"r1","sourceId":"e1","targetId":"e2","type":"uses","label":"dient in via"},{"id":"r2","sourceId":"e2","targetId":"e3","type":"triggers","label":"start"},{"id":"r3","sourceId":"e3","targetId":"e4","type":"uses","label":"raadpleegt"},{"id":"r4","sourceId":"e2","targetId":"e5","type":"flows","label":"slaat op"},{"id":"r5","sourceId":"e6","targetId":"e3","type":"assignment","label":"behandelt"}]}',
  ARRAY['actor','process','application','data','transaction','system','event','decision','service','infrastructure'],
  ARRAY['uses','triggers','flows','association','realization','composition','aggregation','assignment','access','influence']
)
ON CONFLICT (id) DO NOTHING;

SELECT setval('diagrams_id_seq', (SELECT MAX(id) FROM diagrams), true);
