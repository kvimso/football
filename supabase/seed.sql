-- Seed data for Georgian Football Talent Platform
-- 3 clubs, 12 players (4 per club), 5 matches, skills, season stats, match stats

-- ============================================================
-- CLUBS (3)
-- ============================================================
insert into public.clubs (id, name, name_ka, slug, city, region, description, description_ka, website) values
(
  'a1b2c3d4-0001-4000-8000-000000000001',
  'Dinamo Tbilisi Academy',
  'დინამო თბილისის აკადემია',
  'dinamo-tbilisi-academy',
  'Tbilisi',
  'Tbilisi',
  'The youth academy of FC Dinamo Tbilisi, Georgia''s most decorated club. Developing top talent since 1925 with modern training facilities and Pixellot camera systems.',
  'დინამო თბილისის ახალგაზრდული აკადემია, საქართველოს ყველაზე ტიტულოვანი კლუბი. ტალანტების აღზრდა 1925 წლიდან, თანამედროვე სავარჯიშო ბაზითა და Pixellot კამერებით.',
  'https://fcdinamo.ge'
),
(
  'a1b2c3d4-0002-4000-8000-000000000002',
  'Saburtalo Tbilisi Academy',
  'საბურთალო თბილისის აკადემია',
  'saburtalo-tbilisi-academy',
  'Tbilisi',
  'Tbilisi',
  'FC Saburtalo''s youth development program, known for producing technically gifted midfielders and wingers. One of the strongest academies in the Erovnuli Liga system.',
  'საბურთალოს ახალგაზრდული განვითარების პროგრამა, ცნობილია ტექნიკურად ნიჭიერი ნახევარმცველებისა და მეფრთეების აღზრდით. ეროვნული ლიგის ერთ-ერთი უძლიერესი აკადემია.',
  'https://fcsaburtalo.ge'
),
(
  'a1b2c3d4-0003-4000-8000-000000000003',
  'Torpedo Kutaisi Academy',
  'ტორპედო ქუთაისის აკადემია',
  'torpedo-kutaisi-academy',
  'Kutaisi',
  'Kutaisi',
  'The academy of FC Torpedo Kutaisi, based in western Georgia. Strong tradition of developing physical, combative players with excellent defensive fundamentals.',
  'ტორპედო ქუთაისის აკადემია, დასავლეთ საქართველოში. ძლიერი ტრადიცია ფიზიკურად მომზადებული, მებრძოლი მოთამაშეების აღზრდისა, შესანიშნავი დამცველობითი საფუძვლებით.',
  'https://fctorpedo.ge'
);

-- ============================================================
-- PLAYERS (12 — 4 per club)
-- ============================================================

-- Dinamo Tbilisi Academy (4 players)
insert into public.players (id, club_id, name, name_ka, slug, date_of_birth, position, preferred_foot, height_cm, weight_kg, jersey_number, platform_id, status, is_featured, scouting_report, scouting_report_ka) values
(
  'b1b2c3d4-0001-4000-8000-000000000001',
  'a1b2c3d4-0001-4000-8000-000000000001',
  'Giorgi Mikautadze',
  'გიორგი მიქაუტაძე',
  'giorgi-mikautadze',
  '2008-03-15',
  'ST',
  'Right',
  178, 70, 9,
  'GFP-00001',
  'active', true,
  'Clinical finisher with exceptional movement in the box. Strong off-the-ball runs, good first touch, and composure under pressure. Needs to improve aerial ability and hold-up play. Top prospect for his age group.',
  'კლინიკური დამამთავრებელი, განსაკუთრებული მოძრაობით მოედნის ფართობში. ძლიერი გარბენები ბურთის გარეშე, კარგი პირველი შეხება და სიმშვიდე წნეხის ქვეშ. საჰაერო თამაშისა და ბურთის შეკავების გაუმჯობესება სჭირდება.'
),
(
  'b1b2c3d4-0002-4000-8000-000000000002',
  'a1b2c3d4-0001-4000-8000-000000000001',
  'Luka Zarandia',
  'ლუკა ზარანდია',
  'luka-zarandia',
  '2007-07-22',
  'MID',
  'Both',
  175, 68, 8,
  'GFP-00002',
  'active', true,
  'Creative central midfielder with excellent vision and passing range. Dictates tempo, finds pockets of space, and delivers precise through balls. Defensively needs more discipline. Captain material.',
  'შემოქმედებითი ცენტრალური ნახევარმცველი, შესანიშნავი ხედვითა და პასის დიაპაზონით. არეგულირებს ტემპს, პოულობს თავისუფალ სივრცეებს და აწვდის ზუსტ გამჭოლ პასებს. დამცველობითი დისციპლინის გაუმჯობესება სჭირდება.'
),
(
  'b1b2c3d4-0003-4000-8000-000000000003',
  'a1b2c3d4-0001-4000-8000-000000000001',
  'Davit Lobzhanidze',
  'დავით ლობჟანიძე',
  'davit-lobzhanidze',
  '2008-11-03',
  'DEF',
  'Left',
  184, 76, 4,
  'GFP-00003',
  'active', false,
  'Commanding left-footed centre-back with strong aerial presence. Reads the game well, excellent in 1v1 duels, and comfortable playing out from the back. Could improve pace for recovery runs.',
  'მბრძანებლური მარცხენა ფეხის ცენტრალური მცველი, ძლიერი საჰაერო თამაშით. კარგად კითხულობს თამაშს, შესანიშნავია ერთ-ერთზე დუელებში და კომფორტულად გამოაქვს ბურთი უკნიდან. სისწრაფის გაუმჯობესება სჭირდება.'
),
(
  'b1b2c3d4-0004-4000-8000-000000000004',
  'a1b2c3d4-0001-4000-8000-000000000001',
  'Nika Kvaratskhelia',
  'ნიკა კვარაცხელია',
  'nika-kvaratskhelia',
  '2009-01-28',
  'GK',
  'Right',
  188, 78, 1,
  'GFP-00004',
  'active', false,
  'Tall, agile goalkeeper with quick reflexes and good shot-stopping ability. Commands his area well for his age. Distribution with feet needs refinement. Shows leadership qualities.',
  'მაღალი, მოქნილი მეკარე, სწრაფი რეაქციითა და კარგი დარტყმების მოგერიების უნარით. კარგად მართავს თავის ფართობს ასაკისთვის. ფეხით პასების გაუმჯობესება სჭირდება. ლიდერის თვისებები აქვს.'
);

-- Saburtalo Tbilisi Academy (4 players)
insert into public.players (id, club_id, name, name_ka, slug, date_of_birth, position, preferred_foot, height_cm, weight_kg, jersey_number, platform_id, status, is_featured, scouting_report, scouting_report_ka) values
(
  'b1b2c3d4-0005-4000-8000-000000000005',
  'a1b2c3d4-0002-4000-8000-000000000002',
  'Tornike Basilashvili',
  'თორნიკე ბასილაშვილი',
  'tornike-basilashvili',
  '2007-05-10',
  'WNG',
  'Left',
  172, 65, 11,
  'GFP-00005',
  'active', true,
  'Explosive left winger with blistering pace and excellent dribbling in tight spaces. Cuts inside onto his right foot to shoot or create. End product improving rapidly. One of the most exciting prospects in the U18 league.',
  'ფეთქებადი მარცხენა მეფრთე, აალებული სისწრაფითა და შესანიშნავი დრიბლინგით მჭიდრო სივრცეებში. შეჭრება მარჯვენა ფეხზე დარტყმის ან შექმნისთვის. საბოლოო პროდუქტი სწრაფად უმჯობესდება.'
),
(
  'b1b2c3d4-0006-4000-8000-000000000006',
  'a1b2c3d4-0002-4000-8000-000000000002',
  'Saba Kirtadze',
  'საბა კირთაძე',
  'saba-kirtadze',
  '2008-09-14',
  'ATT',
  'Right',
  180, 72, 10,
  'GFP-00006',
  'active', true,
  'Versatile attacking midfielder who can play as a false 9 or behind the striker. Excellent technique, creative passing, and growing goal threat. Good work rate off the ball. Needs to add physicality.',
  'მრავალმხრივი შემტევი ნახევარმცველი, რომელსაც შეუძლია ცრუ ცხრიანის ან თავდამსხმელის უკან თამაში. შესანიშნავი ტექნიკა, შემოქმედებითი პასები და მზარდი სათამაშო საფრთხე. კარგი მუშაობა ბურთის გარეშე.'
),
(
  'b1b2c3d4-0007-4000-8000-000000000007',
  'a1b2c3d4-0002-4000-8000-000000000002',
  'Aleksandre Jikia',
  'ალექსანდრე ჯიქია',
  'aleksandre-jikia',
  '2007-12-01',
  'DEF',
  'Right',
  182, 75, 5,
  'GFP-00007',
  'active', false,
  'Strong, physical right-sided centre-back. Dominant in aerial duels and tackles. Good recovery pace for his size. Can step forward with the ball confidently. Positional awareness continues to develop.',
  'ძლიერი, ფიზიკური მარჯვენა მხარის ცენტრალური მცველი. დომინანტური საჰაერო დუელებსა და ჩართვებში. კარგი აღდგენის სისწრაფე თავისი ზომისთვის. შეუძლია ბურთით წინ გამოსვლა.'
),
(
  'b1b2c3d4-0008-4000-8000-000000000008',
  'a1b2c3d4-0002-4000-8000-000000000002',
  'Vakhtang Salia',
  'ვახტანგ სალია',
  'vakhtang-salia',
  '2008-04-19',
  'MID',
  'Right',
  176, 69, 6,
  'GFP-00008',
  'active', false,
  'Box-to-box midfielder with tireless running and strong defensive contributions. Wins the ball back high up the pitch and drives forward. Passing in the final third needs improvement. Excellent engine.',
  'ბოქს-თუ-ბოქს ნახევარმცველი, დაუღალავი სირბილითა და ძლიერი დამცველობითი წვლილით. იბრუნებს ბურთს მოედნის მაღალ ნაწილში და მიისწრაფვის წინ. პასი ბოლო მესამედში გაუმჯობესებას საჭიროებს.'
);

-- Torpedo Kutaisi Academy (4 players)
insert into public.players (id, club_id, name, name_ka, slug, date_of_birth, position, preferred_foot, height_cm, weight_kg, jersey_number, platform_id, status, is_featured, scouting_report, scouting_report_ka) values
(
  'b1b2c3d4-0009-4000-8000-000000000009',
  'a1b2c3d4-0003-4000-8000-000000000003',
  'Zurab Davitashvili',
  'ზურაბ დავითაშვილი',
  'zurab-davitashvili',
  '2008-06-30',
  'WNG',
  'Right',
  170, 64, 7,
  'GFP-00009',
  'active', false,
  'Tricky right winger with quick feet and ability to beat defenders 1v1. Delivers dangerous crosses and can cut inside. Inconsistent decision-making but raw talent is clear. Needs more end product.',
  'ეშმაკი მარჯვენა მეფრთე, სწრაფი ფეხებითა და მცველების 1v1-ში გავლის უნარით. საშიში გადაცემები და შეჭრის უნარი. არათანმიმდევრული გადაწყვეტილებები, მაგრამ ნედლი ტალანტი აშკარაა.'
),
(
  'b1b2c3d4-0010-4000-8000-000000000010',
  'a1b2c3d4-0003-4000-8000-000000000003',
  'Levan Shengelia',
  'ლევან შენგელია',
  'levan-shengelia',
  '2007-08-25',
  'ST',
  'Left',
  183, 77, 9,
  'GFP-00010',
  'active', false,
  'Powerful target striker with a lethal left foot. Holds the ball up well, brings others into play, and is a constant threat from set pieces. Pace is limited but compensates with positioning and strength.',
  'ძლიერი სამიზნე თავდამსხმელი, სასიკვდილო მარცხენა ფეხით. კარგად აკავებს ბურთს, სხვებს რთავს თამაშში და მუდმივი საფრთხეა სტანდარტებზე. სისწრაფე შეზღუდულია, მაგრამ ანაზღაურებს პოზიციონირებითა და ძალით.'
),
(
  'b1b2c3d4-0011-4000-8000-000000000011',
  'a1b2c3d4-0003-4000-8000-000000000003',
  'Giorgi Tsitaishvili',
  'გიორგი ციტაიშვილი',
  'giorgi-tsitaishvili',
  '2008-02-14',
  'MID',
  'Right',
  179, 71, 14,
  'GFP-00011',
  'active', false,
  'Deep-lying playmaker with an outstanding passing range. Sprays long balls with precision and controls the rhythm of play. Needs to improve defensive intensity and mobility. Technical quality is top-tier for his age.',
  'ღრმა პლეიმეიკერი, შესანიშნავი პასის დიაპაზონით. ზუსტად ასრულებს გრძელ გადაცემებს და აკონტროლებს თამაშის რიტმს. დამცველობითი ინტენსივობისა და მობილურობის გაუმჯობესება სჭირდება.'
),
(
  'b1b2c3d4-0012-4000-8000-000000000012',
  'a1b2c3d4-0003-4000-8000-000000000003',
  'Mate Tsintsadze',
  'მათე ცინცაძე',
  'mate-tsintsadze',
  '2007-10-07',
  'GK',
  'Right',
  191, 82, 1,
  'GFP-00012',
  'active', false,
  'Imposing goalkeeper with excellent shot-stopping and command of his area. Brave in 1v1 situations and communicates well with his defence. Distribution is improving. Potential to play at a high level.',
  'შთამბეჭდავი მეკარე, შესანიშნავი დარტყმების მოგერიებითა და ფართობის მართვით. მამაცია ერთ-ერთზე სიტუაციებში და კარგად კომუნიკაციობს თავის დაცვასთან. პასი უმჯობესდება.'
);

-- ============================================================
-- PLAYER SKILLS (all 12 players)
-- ============================================================
insert into public.player_skills (player_id, pace, shooting, passing, dribbling, defending, physical) values
-- Dinamo
('b1b2c3d4-0001-4000-8000-000000000001', 78, 85, 62, 72, 28, 70),  -- Giorgi M. (ST)
('b1b2c3d4-0002-4000-8000-000000000002', 68, 58, 88, 82, 55, 60),  -- Luka Z. (MID)
('b1b2c3d4-0003-4000-8000-000000000003', 58, 30, 65, 45, 85, 82),  -- Davit L. (DEF)
('b1b2c3d4-0004-4000-8000-000000000004', 50, 15, 55, 20, 18, 65),  -- Nika K. (GK)
-- Saburtalo
('b1b2c3d4-0005-4000-8000-000000000005', 92, 70, 68, 90, 22, 55),  -- Tornike B. (WNG)
('b1b2c3d4-0006-4000-8000-000000000006', 72, 75, 82, 85, 35, 62),  -- Saba K. (ATT)
('b1b2c3d4-0007-4000-8000-000000000007', 65, 28, 58, 40, 83, 85),  -- Aleksandre J. (DEF)
('b1b2c3d4-0008-4000-8000-000000000008', 75, 52, 65, 60, 78, 80),  -- Vakhtang S. (MID)
-- Torpedo
('b1b2c3d4-0009-4000-8000-000000000009', 88, 60, 65, 85, 20, 52),  -- Zurab D. (WNG)
('b1b2c3d4-0010-4000-8000-000000000010', 55, 82, 58, 48, 25, 88),  -- Levan S. (ST)
('b1b2c3d4-0011-4000-8000-000000000011', 52, 45, 86, 72, 50, 58),  -- Giorgi T. (MID)
('b1b2c3d4-0012-4000-8000-000000000012', 45, 12, 50, 18, 15, 72);  -- Mate T. (GK)

-- ============================================================
-- PLAYER SEASON STATS (2025-26 season)
-- ============================================================
insert into public.player_season_stats (player_id, season, matches_played, goals, assists, minutes_played, pass_accuracy, shots_on_target, tackles, interceptions, clean_sheets, distance_covered_km, sprints, source) values
-- Dinamo
('b1b2c3d4-0001-4000-8000-000000000001', '2025-26', 14, 11, 3, 1180, 72.50, 28, 8, 3, 0, 108.40, 185, 'pixellot'),
('b1b2c3d4-0002-4000-8000-000000000002', '2025-26', 16, 4, 9, 1385, 88.30, 12, 32, 18, 0, 142.60, 210, 'pixellot'),
('b1b2c3d4-0003-4000-8000-000000000003', '2025-26', 15, 1, 1, 1350, 82.10, 2, 48, 35, 7, 118.20, 145, 'pixellot'),
('b1b2c3d4-0004-4000-8000-000000000004', '2025-26', 16, 0, 0, 1440, 65.00, 0, 0, 0, 6, 62.50, 42, 'pixellot'),
-- Saburtalo
('b1b2c3d4-0005-4000-8000-000000000005', '2025-26', 15, 7, 8, 1260, 76.40, 22, 6, 2, 0, 138.90, 245, 'pixellot'),
('b1b2c3d4-0006-4000-8000-000000000006', '2025-26', 14, 8, 6, 1150, 81.20, 20, 12, 5, 0, 125.30, 178, 'pixellot'),
('b1b2c3d4-0007-4000-8000-000000000007', '2025-26', 16, 2, 0, 1430, 78.50, 4, 52, 38, 8, 120.80, 155, 'pixellot'),
('b1b2c3d4-0008-4000-8000-000000000008', '2025-26', 15, 3, 4, 1310, 79.60, 10, 42, 28, 0, 152.40, 230, 'pixellot'),
-- Torpedo
('b1b2c3d4-0009-4000-8000-000000000009', '2025-26', 13, 5, 6, 1050, 74.80, 15, 5, 3, 0, 122.70, 220, 'pixellot'),
('b1b2c3d4-0010-4000-8000-000000000010', '2025-26', 14, 10, 2, 1200, 68.30, 25, 10, 4, 0, 98.60, 135, 'pixellot'),
('b1b2c3d4-0011-4000-8000-000000000011', '2025-26', 15, 2, 7, 1290, 87.10, 8, 28, 22, 0, 135.20, 168, 'pixellot'),
('b1b2c3d4-0012-4000-8000-000000000012', '2025-26', 14, 0, 0, 1260, 62.40, 0, 0, 0, 5, 58.30, 38, 'pixellot');

-- ============================================================
-- MATCHES (5)
-- ============================================================
insert into public.matches (id, home_club_id, away_club_id, slug, home_score, away_score, competition, match_date, venue, match_report, match_report_ka, camera_source) values
(
  'c1b2c3d4-0001-4000-8000-000000000001',
  'a1b2c3d4-0001-4000-8000-000000000001',
  'a1b2c3d4-0002-4000-8000-000000000002',
  'dinamo-vs-saburtalo-2025-09-15',
  3, 1,
  'Erovnuli Liga U19',
  '2025-09-15',
  'Dinamo Academy Arena, Tbilisi',
  'Dinamo dominated from the start with Luka Zarandia pulling the strings in midfield. Giorgi Mikautadze scored a brace, including a brilliant solo goal in the 67th minute. Tornike Basilashvili pulled one back for Saburtalo with a trademark cut inside and finish.',
  'დინამომ თავიდანვე იდომინირა, ლუკა ზარანდიამ შუა მოედანი მართა. გიორგი მიქაუტაძემ ორი გოლი გაიტანა, მათ შორის ბრწყინვალე სოლო გოლი 67-ე წუთზე. თორნიკე ბასილაშვილმა ერთი გოლი გაიტანა საბურთალოსთვის.',
  'pixellot'
),
(
  'c1b2c3d4-0002-4000-8000-000000000002',
  'a1b2c3d4-0003-4000-8000-000000000003',
  'a1b2c3d4-0001-4000-8000-000000000001',
  'torpedo-vs-dinamo-2025-10-03',
  2, 2,
  'Erovnuli Liga U19',
  '2025-10-03',
  'Ramaz Shengelia Stadium, Kutaisi',
  'An intense derby in Kutaisi. Levan Shengelia opened the scoring with a powerful header. Dinamo equalized through Mikautadze before halftime. Zurab Davitashvili restored Torpedo''s lead with a brilliant run, but Zarandia''s late free kick earned Dinamo a point.',
  'ინტენსიური დერბი ქუთაისში. ლევან შენგელიამ ძლიერი თავით გახსნა ანგარიში. დინამომ მიქაუტაძით გაათანაბრა შესვენებამდე. ზურაბ დავითაშვილმა ბრწყინვალე გარბენით აღადგინა ტორპედოს უპირატესობა, მაგრამ ზარანდიას გვიანმა თავისუფალმა დარტყმამ ქულა მოუტანა დინამოს.',
  'pixellot'
),
(
  'c1b2c3d4-0003-4000-8000-000000000003',
  'a1b2c3d4-0002-4000-8000-000000000002',
  'a1b2c3d4-0003-4000-8000-000000000003',
  'saburtalo-vs-torpedo-2025-10-20',
  2, 0,
  'Erovnuli Liga U19',
  '2025-10-20',
  'Saburtalo Stadium, Tbilisi',
  'Saburtalo controlled possession throughout and were rewarded with goals from Saba Kirtadze and Tornike Basilashvili. Aleksandre Jikia was immense at the back, winning every aerial duel. Torpedo struggled to create chances.',
  'საბურთალომ მთელი თამაში მართა მფლობელობით და დაჯილდოვდა საბა კირთაძისა და თორნიკე ბასილაშვილის გოლებით. ალექსანდრე ჯიქია შეუჩერებელი იყო უკან, ყველა საჰაერო დუელი მოიგო. ტორპედომ ვერ შექმნა შანსები.',
  'pixellot'
),
(
  'c1b2c3d4-0004-4000-8000-000000000004',
  'a1b2c3d4-0001-4000-8000-000000000001',
  'a1b2c3d4-0003-4000-8000-000000000003',
  'dinamo-vs-torpedo-2025-11-10',
  4, 1,
  'Erovnuli Liga U19',
  '2025-11-10',
  'Dinamo Academy Arena, Tbilisi',
  'A dominant Dinamo performance. Mikautadze scored a hat-trick, taking his season tally to double figures. Zarandia added the fourth with a superb long-range effort. Shengelia scored a consolation for Torpedo from the penalty spot.',
  'დინამოს დომინანტური თამაში. მიქაუტაძემ ჰეტ-ტრიკი გააკეთა და სეზონის მაჩვენებელი ორნიშნა რიცხვამდე გაზარდა. ზარანდიამ მეოთხე ბრწყინვალე შორეული დარტყმით გაიტანა. შენგელიამ ტორპედოსთვის საპატიო გოლი პენალტიდან გაიტანა.',
  'pixellot'
),
(
  'c1b2c3d4-0005-4000-8000-000000000005',
  'a1b2c3d4-0002-4000-8000-000000000002',
  'a1b2c3d4-0001-4000-8000-000000000001',
  'saburtalo-vs-dinamo-2025-12-01',
  1, 1,
  'Georgian U19 Cup Semifinal',
  '2025-12-01',
  'Saburtalo Stadium, Tbilisi',
  'A tense cup semifinal. Kirtadze gave Saburtalo the lead with a clever chip over the goalkeeper. Dinamo pushed hard and equalized through Lobzhanidze''s towering header from a corner. Both goalkeepers made outstanding saves in the second half.',
  'დაძაბული თასის ნახევარფინალი. კირთაძემ საბურთალოს უპირატესობა მოიტანა ჭკვიანი ჩიპით მეკარეს ზემოთ. დინამომ ძლიერად იბრძოლა და ლობჟანიძის ძლიერი თავით გაათანაბრა კუთხურიდან. ორივე მეკარემ ბრწყინვალე სეივები გააკეთა მეორე ტაიმში.',
  'pixellot'
);

-- ============================================================
-- MATCH PLAYER STATS (key performers from each match)
-- ============================================================

-- Match 1: Dinamo 3-1 Saburtalo
insert into public.match_player_stats (match_id, player_id, minutes_played, goals, assists, pass_accuracy, shots, shots_on_target, tackles, interceptions, distance_km, sprints, top_speed_kmh, rating, source) values
('c1b2c3d4-0001-4000-8000-000000000001', 'b1b2c3d4-0001-4000-8000-000000000001', 90, 2, 0, 70.50, 5, 4, 1, 0, 9.80, 18, 31.2, 8.5, 'pixellot'),   -- Mikautadze
('c1b2c3d4-0001-4000-8000-000000000001', 'b1b2c3d4-0002-4000-8000-000000000002', 90, 0, 2, 91.20, 2, 1, 3, 2, 10.50, 16, 28.5, 8.2, 'pixellot'),  -- Zarandia
('c1b2c3d4-0001-4000-8000-000000000001', 'b1b2c3d4-0003-4000-8000-000000000003', 90, 0, 0, 85.00, 0, 0, 5, 4, 8.90, 12, 27.1, 7.3, 'pixellot'),   -- Lobzhanidze
('c1b2c3d4-0001-4000-8000-000000000001', 'b1b2c3d4-0004-4000-8000-000000000004', 90, 0, 0, 62.00, 0, 0, 0, 0, 4.20, 3, 18.0, 7.0, 'pixellot'),    -- Nika K. (GK)
('c1b2c3d4-0001-4000-8000-000000000001', 'b1b2c3d4-0005-4000-8000-000000000005', 90, 1, 0, 72.30, 4, 2, 0, 0, 10.20, 22, 33.1, 7.5, 'pixellot'),  -- Basilashvili
('c1b2c3d4-0001-4000-8000-000000000001', 'b1b2c3d4-0006-4000-8000-000000000006', 85, 0, 1, 78.60, 3, 1, 2, 1, 9.40, 15, 29.8, 6.8, 'pixellot'),   -- Kirtadze

-- Match 2: Torpedo 2-2 Dinamo
('c1b2c3d4-0002-4000-8000-000000000002', 'b1b2c3d4-0001-4000-8000-000000000001', 90, 1, 0, 68.20, 4, 2, 0, 1, 9.60, 17, 31.0, 7.5, 'pixellot'),   -- Mikautadze
('c1b2c3d4-0002-4000-8000-000000000002', 'b1b2c3d4-0002-4000-8000-000000000002', 90, 1, 0, 85.50, 3, 2, 4, 3, 10.80, 15, 28.0, 7.8, 'pixellot'),  -- Zarandia
('c1b2c3d4-0002-4000-8000-000000000002', 'b1b2c3d4-0009-4000-8000-000000000009', 90, 1, 0, 70.10, 3, 2, 1, 0, 10.10, 20, 32.5, 7.8, 'pixellot'),  -- Zurab D.
('c1b2c3d4-0002-4000-8000-000000000002', 'b1b2c3d4-0010-4000-8000-000000000010', 90, 1, 0, 65.40, 4, 2, 2, 1, 8.50, 10, 26.8, 7.2, 'pixellot'),  -- Shengelia
('c1b2c3d4-0002-4000-8000-000000000002', 'b1b2c3d4-0011-4000-8000-000000000011', 90, 0, 1, 89.20, 1, 0, 3, 3, 10.40, 14, 27.0, 7.4, 'pixellot'),  -- Tsitaishvili

-- Match 3: Saburtalo 2-0 Torpedo
('c1b2c3d4-0003-4000-8000-000000000003', 'b1b2c3d4-0005-4000-8000-000000000005', 90, 1, 0, 75.00, 3, 2, 1, 0, 10.50, 24, 33.5, 8.0, 'pixellot'),  -- Basilashvili
('c1b2c3d4-0003-4000-8000-000000000003', 'b1b2c3d4-0006-4000-8000-000000000006', 90, 1, 1, 83.40, 4, 3, 1, 0, 9.80, 16, 30.2, 8.3, 'pixellot'),   -- Kirtadze
('c1b2c3d4-0003-4000-8000-000000000003', 'b1b2c3d4-0007-4000-8000-000000000007', 90, 0, 0, 80.20, 1, 0, 6, 5, 8.60, 11, 26.5, 7.8, 'pixellot'),   -- Jikia
('c1b2c3d4-0003-4000-8000-000000000003', 'b1b2c3d4-0008-4000-8000-000000000008', 90, 0, 1, 81.00, 2, 1, 5, 3, 11.20, 19, 29.0, 7.5, 'pixellot'),  -- Vakhtang S.
('c1b2c3d4-0003-4000-8000-000000000003', 'b1b2c3d4-0010-4000-8000-000000000010', 90, 0, 0, 62.50, 3, 1, 1, 0, 8.20, 9, 26.0, 5.5, 'pixellot'),    -- Shengelia

-- Match 4: Dinamo 4-1 Torpedo
('c1b2c3d4-0004-4000-8000-000000000004', 'b1b2c3d4-0001-4000-8000-000000000001', 90, 3, 0, 74.00, 7, 5, 0, 0, 10.00, 20, 31.5, 9.2, 'pixellot'),  -- Mikautadze hat-trick
('c1b2c3d4-0004-4000-8000-000000000004', 'b1b2c3d4-0002-4000-8000-000000000002', 90, 1, 2, 90.50, 2, 2, 2, 1, 10.60, 14, 28.2, 8.8, 'pixellot'),  -- Zarandia
('c1b2c3d4-0004-4000-8000-000000000004', 'b1b2c3d4-0003-4000-8000-000000000003', 90, 0, 0, 88.00, 0, 0, 4, 3, 8.80, 10, 26.8, 7.5, 'pixellot'),   -- Lobzhanidze
('c1b2c3d4-0004-4000-8000-000000000004', 'b1b2c3d4-0010-4000-8000-000000000010', 90, 1, 0, 60.20, 3, 2, 1, 0, 8.10, 8, 25.5, 6.2, 'pixellot'),    -- Shengelia (pen)
('c1b2c3d4-0004-4000-8000-000000000004', 'b1b2c3d4-0012-4000-8000-000000000012', 90, 0, 0, 58.00, 0, 0, 0, 0, 4.00, 3, 17.5, 5.0, 'pixellot'),    -- Mate T. (GK)

-- Match 5: Saburtalo 1-1 Dinamo (Cup Semifinal)
('c1b2c3d4-0005-4000-8000-000000000005', 'b1b2c3d4-0005-4000-8000-000000000005', 90, 0, 0, 73.50, 3, 1, 0, 1, 10.30, 21, 32.8, 6.8, 'pixellot'),  -- Basilashvili
('c1b2c3d4-0005-4000-8000-000000000005', 'b1b2c3d4-0006-4000-8000-000000000006', 90, 1, 0, 80.00, 2, 2, 1, 0, 9.50, 14, 29.5, 7.8, 'pixellot'),   -- Kirtadze (chip goal)
('c1b2c3d4-0005-4000-8000-000000000005', 'b1b2c3d4-0001-4000-8000-000000000001', 90, 0, 0, 66.80, 4, 1, 1, 0, 9.70, 16, 30.8, 6.5, 'pixellot'),   -- Mikautadze
('c1b2c3d4-0005-4000-8000-000000000005', 'b1b2c3d4-0003-4000-8000-000000000003', 90, 1, 0, 82.50, 1, 1, 5, 4, 8.70, 11, 27.0, 7.6, 'pixellot'),   -- Lobzhanidze (header)
('c1b2c3d4-0005-4000-8000-000000000005', 'b1b2c3d4-0004-4000-8000-000000000004', 90, 0, 0, 60.00, 0, 0, 0, 0, 4.10, 4, 18.2, 7.5, 'pixellot');    -- Nika K. (GK, great saves)

-- ============================================================
-- PLAYER CLUB HISTORY (all 12 players — currently at their clubs)
-- ============================================================
insert into public.player_club_history (player_id, club_id, joined_at) values
-- Dinamo Tbilisi Academy
('b1b2c3d4-0001-4000-8000-000000000001', 'a1b2c3d4-0001-4000-8000-000000000001', '2022-08-01'),
('b1b2c3d4-0002-4000-8000-000000000002', 'a1b2c3d4-0001-4000-8000-000000000001', '2021-08-01'),
('b1b2c3d4-0003-4000-8000-000000000003', 'a1b2c3d4-0001-4000-8000-000000000001', '2022-08-01'),
('b1b2c3d4-0004-4000-8000-000000000004', 'a1b2c3d4-0001-4000-8000-000000000001', '2023-08-01'),
-- Saburtalo Tbilisi Academy
('b1b2c3d4-0005-4000-8000-000000000005', 'a1b2c3d4-0002-4000-8000-000000000002', '2021-08-01'),
('b1b2c3d4-0006-4000-8000-000000000006', 'a1b2c3d4-0002-4000-8000-000000000002', '2022-08-01'),
('b1b2c3d4-0007-4000-8000-000000000007', 'a1b2c3d4-0002-4000-8000-000000000002', '2021-08-01'),
('b1b2c3d4-0008-4000-8000-000000000008', 'a1b2c3d4-0002-4000-8000-000000000002', '2022-08-01'),
-- Torpedo Kutaisi Academy
('b1b2c3d4-0009-4000-8000-000000000009', 'a1b2c3d4-0003-4000-8000-000000000003', '2022-08-01'),
('b1b2c3d4-0010-4000-8000-000000000010', 'a1b2c3d4-0003-4000-8000-000000000003', '2021-08-01'),
('b1b2c3d4-0011-4000-8000-000000000011', 'a1b2c3d4-0003-4000-8000-000000000003', '2022-08-01'),
('b1b2c3d4-0012-4000-8000-000000000012', 'a1b2c3d4-0003-4000-8000-000000000003', '2021-08-01');

-- Reset platform_id sequence past seeded players
select setval('public.player_platform_id_seq', 12);
