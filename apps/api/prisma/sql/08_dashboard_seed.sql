-- Sample data for dashboard matches + chat

INSERT INTO users (id, email, display_name, avatar_url, match_percentage, online_status)
VALUES
  (uuid_generate_v4(), 'signnecin@example.com', 'Signnecin', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80', 100, 'online'),
  (uuid_generate_v4(), 'mausia@example.com', 'Mausia', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80', 3.9, 'online'),
  (uuid_generate_v4(), 'puril@example.com', 'Puril', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=80', 6.9, 'offline'),
  (uuid_generate_v4(), 'purthex@example.com', 'Purthex', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80', 100, 'online'),
  (uuid_generate_v4(), 'livek@example.com', 'Livek', 'https://images.unsplash.com/photo-1552058544-f2b84fbe8408?w=80', 4.9, 'offline'),
  (uuid_generate_v4(), 'nagno@example.com', 'Nagno', 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=80', 9.2, 'online'),
  (uuid_generate_v4(), 'anuole@example.com', 'Anuole', 'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=80', 100, 'offline'),
  (uuid_generate_v4(), 'aplick@example.com', 'Aplick', 'https://images.unsplash.com/photo-1503023345310-4f11e747f767?w=80', 9.9, 'online'),
  (uuid_generate_v4(), 'syglo@example.com', 'Syglo', 'https://images.unsplash.com/photo-1552058544-f2b84fbe8408?w=80', 9.7, 'offline'),
  (uuid_generate_v4(), 'geprowd@example.com', 'Geprowd', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80', 9.7, 'online'),
  (uuid_generate_v4(), 'sopyle@example.com', 'Sopyle', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80', 110, 'offline'),
  (uuid_generate_v4(), 'crondrer@example.com', 'Crondrer', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80', 100, 'online'),
  (uuid_generate_v4(), 'pay@example.com', 'Pay', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=80', 100, 'offline');

-- Sample matches (for Signnecin)
INSERT INTO matches (user1_id, user2_id, match_score)
SELECT
  (SELECT id FROM users WHERE display_name = 'Signnecin'),
  id,
  match_percentage
FROM users
WHERE display_name != 'Signnecin'
LIMIT 12;

-- Sample chat conversations
INSERT INTO chat_conversations (user1_id, user2_id, last_message_at, last_message_preview, unread_count_user1)
SELECT
  (SELECT id FROM users WHERE display_name = 'Signnecin'),
  id,
  NOW() - INTERVAL '1 hour' * (random() * 24)::int,
  'Hey, how are you?',
  FLOOR(random() * 5)::int
FROM users
WHERE display_name != 'Signnecin'
LIMIT 8;
