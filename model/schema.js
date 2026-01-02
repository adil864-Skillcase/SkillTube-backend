// Users table (OTP-based auth)
export const createAppUser = `
CREATE TABLE IF NOT EXISTS app_user (
  user_id VARCHAR(50) PRIMARY KEY,
  phone_number VARCHAR(20) UNIQUE NOT NULL,
  name VARCHAR(255),
  role VARCHAR(50) DEFAULT 'user',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
`;

// OTP table
export const createOtpVerification = `
CREATE TABLE IF NOT EXISTS otp_verification (
  id SERIAL PRIMARY KEY,
  phone_number VARCHAR(20) NOT NULL,
  otp_code VARCHAR(6) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
`;

// Playlists/Libraries
export const createPlaylist = `
CREATE TABLE IF NOT EXISTS playlist (
  playlist_id SERIAL PRIMARY KEY,
  name VARCHAR(255) UNIQUE NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  description TEXT,
  thumbnail_url TEXT,
  category VARCHAR(50),
  display_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
`;

// Videos
export const createVideo = `
CREATE TABLE IF NOT EXISTS video (
  video_id SERIAL PRIMARY KEY,
  playlist_id INT NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  video_url TEXT NOT NULL,
  thumbnail_url TEXT,
  category VARCHAR(50),
  duration INT DEFAULT 0,
  display_order INT DEFAULT 0,
  view_count INT DEFAULT 0,
  like_count INT DEFAULT 0,
  dislike_count INT DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (playlist_id) REFERENCES playlist(playlist_id) ON DELETE CASCADE
);
`;

export const createVideoIndexes = `
CREATE INDEX IF NOT EXISTS idx_video_playlist ON video(playlist_id);
CREATE INDEX IF NOT EXISTS idx_video_active ON video(is_active);
CREATE INDEX IF NOT EXISTS idx_video_category ON video(category);
CREATE INDEX IF NOT EXISTS idx_playlist_active ON playlist(is_active);
CREATE INDEX IF NOT EXISTS idx_playlist_category ON playlist(category);
CREATE INDEX IF NOT EXISTS idx_otp_phone ON otp_verification(phone_number);
CREATE INDEX IF NOT EXISTS idx_otp_expires ON otp_verification(expires_at);
`;

export const createUserVideoReaction = `
CREATE TABLE IF NOT EXISTS user_video_reaction (
  user_id VARCHAR(50) NOT NULL,
  video_id INT NOT NULL,
  reaction VARCHAR(10) NOT NULL CHECK (reaction IN ('like', 'dislike')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, video_id),
  FOREIGN KEY (user_id) REFERENCES app_user(user_id) ON DELETE CASCADE,
  FOREIGN KEY (video_id) REFERENCES video(video_id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_reaction_video ON user_video_reaction(video_id);
`;

// Comments
export const createComment = `
CREATE TABLE IF NOT EXISTS comment (
  comment_id SERIAL PRIMARY KEY,
  video_id INT NOT NULL,
  user_id VARCHAR(50) NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (video_id) REFERENCES video(video_id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES app_user(user_id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_comment_video ON comment(video_id);
CREATE INDEX IF NOT EXISTS idx_comment_user ON comment(user_id);
`;

// Bookmarks
export const createBookmark = `
CREATE TABLE IF NOT EXISTS bookmark (
  user_id VARCHAR(50) NOT NULL,
  video_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, video_id),
  FOREIGN KEY (user_id) REFERENCES app_user(user_id) ON DELETE CASCADE,
  FOREIGN KEY (video_id) REFERENCES video(video_id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_bookmark_user ON bookmark(user_id);
`;
