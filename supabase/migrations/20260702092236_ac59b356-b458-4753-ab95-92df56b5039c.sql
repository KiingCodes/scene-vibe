-- Add country column to relevant tables. Default 'ZA' for existing data.
ALTER TABLE public.clubs ADD COLUMN IF NOT EXISTS country text NOT NULL DEFAULT 'ZA';
ALTER TABLE public.pending_clubs ADD COLUMN IF NOT EXISTS country text NOT NULL DEFAULT 'ZA';
ALTER TABLE public.experiences ADD COLUMN IF NOT EXISTS country text NOT NULL DEFAULT 'ZA';
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS country text NOT NULL DEFAULT 'ZA';
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS country text NOT NULL DEFAULT 'ZA';

CREATE INDEX IF NOT EXISTS idx_clubs_country ON public.clubs(country);
CREATE INDEX IF NOT EXISTS idx_experiences_country ON public.experiences(country);
CREATE INDEX IF NOT EXISTS idx_messages_country ON public.messages(country);
CREATE INDEX IF NOT EXISTS idx_pending_clubs_country ON public.pending_clubs(country);

-- Seed curated Zimbabwean clubs
INSERT INTO public.clubs (name, area, address, description, genre, country, opening_hours, lat, lng)
VALUES
  ('Pariah State', 'Harare', 'Sam Levy''s Village, Borrowdale, Harare', 'Popular gastropub and nightlife spot in Borrowdale.', 'House, Hip-Hop', 'ZW', 'Mon-Sun 11:00-02:00', -17.7549, 31.0866),
  ('Club Sankayi', 'Harare', 'Mount Pleasant, Harare', 'Trendy nightclub with resident DJs and live acts.', 'Afrobeats, House', 'ZW', 'Thu-Sat 20:00-04:00', -17.7756, 31.0523),
  ('Jazz 105', 'Harare', 'Kwame Nkrumah Ave, Harare CBD', 'Iconic live jazz venue in the city center.', 'Jazz, Live Music', 'ZW', 'Wed-Sun 18:00-02:00', -17.8292, 31.0522),
  ('The Sports Diner', 'Harare', 'Newlands Shopping Centre, Harare', 'Sports bar with weekend DJ nights.', 'Commercial, Hip-Hop', 'ZW', 'Mon-Sun 10:00-02:00', -17.7898, 31.0745),
  ('Stone''s Throw', 'Harare', 'Kensington, Harare', 'Rooftop lounge with cocktails and house music.', 'House, Deep House', 'ZW', 'Wed-Sun 17:00-02:00', -17.7935, 31.0611),
  ('Club Xtreme', 'Bulawayo', 'Joshua Mqabuko Nkomo St, Bulawayo', 'Bulawayo''s hottest late-night club.', 'Hip-Hop, Amapiano', 'ZW', 'Fri-Sat 21:00-04:00', -20.1539, 28.5878),
  ('Cape to Cairo', 'Bulawayo', 'Hillside, Bulawayo', 'Chilled lounge bar with weekend live bands.', 'Live, Jazz', 'ZW', 'Tue-Sun 16:00-01:00', -20.1732, 28.6234),
  ('The Palace', 'Victoria Falls', 'Livingstone Way, Victoria Falls', 'Riverside nightclub near the falls.', 'Afro-House, Dancehall', 'ZW', 'Thu-Sun 20:00-03:00', -17.9243, 25.8572),
  ('Shoestrings Backpackers Bar', 'Victoria Falls', 'West Dr, Victoria Falls', 'Backpacker favourite with pool parties.', 'Reggae, House', 'ZW', 'Mon-Sun 12:00-02:00', -17.9315, 25.8321),
  ('Tin Roof', 'Harare', 'Avondale, Harare', 'Craft beer and live acoustic sets.', 'Live, Indie', 'ZW', 'Tue-Sun 16:00-00:00', -17.7972, 31.0387),
  ('Habana', 'Harare', 'Borrowdale, Harare', 'Latin-inspired lounge with salsa nights.', 'Latin, Amapiano', 'ZW', 'Wed-Sat 18:00-02:00', -17.7601, 31.0912),
  ('Chez Nando', 'Harare', 'Msasa, Harare', 'Long-running local nightclub.', 'Sungura, House', 'ZW', 'Fri-Sun 20:00-04:00', -17.8492, 31.1123)
ON CONFLICT DO NOTHING;

-- Seed curated Zimbabwean experiences
INSERT INTO public.experiences (name, area, address, category, description, country, status, lat, lng, opening_hours)
VALUES
  ('Victoria Falls Sunset Cruise', 'Victoria Falls', 'Zambezi River, Victoria Falls', 'popup', 'Iconic sunset booze cruise on the Zambezi.', 'ZW', 'approved', -17.9243, 25.8572, 'Daily 16:00-18:30'),
  ('Doon Estate Craft Market', 'Harare', 'Msasa, Harare', 'market', 'Curated craft, art and food market.', 'ZW', 'approved', -17.8412, 31.1198, 'Sat-Sun 09:00-16:00'),
  ('Unity Square Food Market', 'Harare', 'Unity Square, Harare CBD', 'food', 'Street food and local vendors.', 'ZW', 'approved', -17.8283, 31.0501, 'Daily 10:00-20:00'),
  ('Alliance Française Harare', 'Harare', '328 Herbert Chitepo Ave, Harare', 'workshop', 'French cultural workshops and art shows.', 'ZW', 'approved', -17.8245, 31.0489, 'Mon-Fri 09:00-17:00'),
  ('Bulawayo Amakhosi Theatre', 'Bulawayo', 'JMN Way, Bulawayo', 'workshop', 'Dance and drama workshops.', 'ZW', 'approved', -20.1512, 28.5843, 'Mon-Sat 10:00-18:00'),
  ('Mbare Musika Market', 'Harare', 'Mbare, Harare', 'market', 'Largest open-air market in Zimbabwe.', 'ZW', 'approved', -17.8712, 31.0432, 'Daily 06:00-18:00'),
  ('Cafe Nush', 'Harare', 'Sam Levy''s Village, Borrowdale', 'food', 'Trendy brunch spot with rooftop seating.', 'ZW', 'approved', -17.7551, 31.0871, 'Daily 07:00-21:00'),
  ('Lola''s Lounge', 'Harare', 'Avondale, Harare', 'lounge', 'Cocktail lounge with resident DJs.', 'ZW', 'approved', -17.7981, 31.0402, 'Wed-Sun 17:00-02:00'),
  ('First Street Live', 'Harare', 'First Street Mall, Harare CBD', 'street_event', 'Weekly street performances and pop-ups.', 'ZW', 'approved', -17.8281, 31.0492, 'Fri 17:00-22:00')
ON CONFLICT DO NOTHING;