export const baseSchemaQueries = [
  `CREATE TABLE IF NOT EXISTS app_user (
    user_id VARCHAR(50) PRIMARY KEY,
    phone_number VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(255),
    role VARCHAR(50) DEFAULT 'user',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );`,
  `CREATE TABLE IF NOT EXISTS otp_verification (
    id SERIAL PRIMARY KEY,
    phone_number VARCHAR(20) NOT NULL,
    otp_code VARCHAR(6) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );`,
  `CREATE TABLE IF NOT EXISTS category (
    category_id SERIAL PRIMARY KEY,
    slug VARCHAR(80) UNIQUE NOT NULL,
    name VARCHAR(120) UNIQUE NOT NULL,
    icon_key VARCHAR(80) NOT NULL,
    color VARCHAR(20) NOT NULL DEFAULT '#3b82f6',
    display_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );`,
  `CREATE TABLE IF NOT EXISTS playlist (
    playlist_id SERIAL PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    thumbnail_url TEXT,
    thumbnail_key TEXT,
    category VARCHAR(50),
    category_id INT,
    display_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES category(category_id) ON DELETE SET NULL
  );`,
  `CREATE TABLE IF NOT EXISTS video (
    video_id SERIAL PRIMARY KEY,
    playlist_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    video_url TEXT,
    storage_key TEXT,
    hls_manifest_path TEXT,
    thumbnail_url TEXT,
    thumbnail_key TEXT,
    category VARCHAR(50),
    category_id INT,
    source_type VARCHAR(20) DEFAULT 'hls',
    processing_status VARCHAR(30) DEFAULT 'pending',
    duration INT DEFAULT 0,
    display_order INT DEFAULT 0,
    view_count INT DEFAULT 0,
    like_count INT DEFAULT 0,
    dislike_count INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (playlist_id) REFERENCES playlist(playlist_id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES category(category_id) ON DELETE SET NULL
  );`,
  `CREATE TABLE IF NOT EXISTS user_video_reaction (
    user_id VARCHAR(50) NOT NULL,
    video_id INT NOT NULL,
    reaction VARCHAR(10) NOT NULL CHECK (reaction IN ('like', 'dislike')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, video_id),
    FOREIGN KEY (user_id) REFERENCES app_user(user_id) ON DELETE CASCADE,
    FOREIGN KEY (video_id) REFERENCES video(video_id) ON DELETE CASCADE
  );`,
  `CREATE TABLE IF NOT EXISTS comment (
    comment_id SERIAL PRIMARY KEY,
    video_id INT NOT NULL,
    user_id VARCHAR(50) NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (video_id) REFERENCES video(video_id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES app_user(user_id) ON DELETE CASCADE
  );`,
  `CREATE TABLE IF NOT EXISTS bookmark (
    user_id VARCHAR(50) NOT NULL,
    video_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, video_id),
    FOREIGN KEY (user_id) REFERENCES app_user(user_id) ON DELETE CASCADE,
    FOREIGN KEY (video_id) REFERENCES video(video_id) ON DELETE CASCADE
  );`,
];

export const featureSchemaQueries = [
  `CREATE TABLE IF NOT EXISTS featured_section (
    section_id SERIAL PRIMARY KEY,
    mode VARCHAR(30) NOT NULL CHECK (
      mode IN (
        'manual',
        'most_viewed',
        'most_liked',
        'most_commented',
        'newest',
        'trending'
      )
    ),
    title VARCHAR(150) NOT NULL DEFAULT 'Featured',
    max_items INT NOT NULL DEFAULT 5,
    is_active BOOLEAN DEFAULT TRUE,
    config_json JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );`,
  `CREATE TABLE IF NOT EXISTS featured_video (
    featured_video_id SERIAL PRIMARY KEY,
    section_id INT NOT NULL,
    video_id INT NOT NULL,
    manual_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(section_id, video_id),
    FOREIGN KEY (section_id) REFERENCES featured_section(section_id) ON DELETE CASCADE,
    FOREIGN KEY (video_id) REFERENCES video(video_id) ON DELETE CASCADE
  );`,
  `CREATE TABLE IF NOT EXISTS admin_permission (
    permission_id SERIAL PRIMARY KEY,
    admin_user_id VARCHAR(50) NOT NULL,
    permission_key VARCHAR(80) NOT NULL,
    granted_by VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(admin_user_id, permission_key),
    FOREIGN KEY (admin_user_id) REFERENCES app_user(user_id) ON DELETE CASCADE,
    FOREIGN KEY (granted_by) REFERENCES app_user(user_id) ON DELETE SET NULL
  );`,
];

export const alterSchemaQueries = [
  `ALTER TABLE app_user
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;`,
  `ALTER TABLE app_user
    DROP CONSTRAINT IF EXISTS app_user_role_check;`,
  `ALTER TABLE app_user
    ADD CONSTRAINT app_user_role_check CHECK (role IN ('user', 'admin', 'super_admin'));`,
  `ALTER TABLE playlist ADD COLUMN IF NOT EXISTS thumbnail_key TEXT;`,
  `ALTER TABLE playlist ADD COLUMN IF NOT EXISTS category_id INT;`,
  `ALTER TABLE video ALTER COLUMN video_url DROP NOT NULL;`,
  `ALTER TABLE video ADD COLUMN IF NOT EXISTS storage_key TEXT;`,
  `ALTER TABLE video ADD COLUMN IF NOT EXISTS hls_manifest_path TEXT;`,
  `ALTER TABLE video ADD COLUMN IF NOT EXISTS thumbnail_key TEXT;`,
  `ALTER TABLE video ADD COLUMN IF NOT EXISTS category_id INT;`,
  `ALTER TABLE video ADD COLUMN IF NOT EXISTS source_type VARCHAR(20) DEFAULT 'hls';`,
  `ALTER TABLE video ADD COLUMN IF NOT EXISTS processing_status VARCHAR(30) DEFAULT 'pending';`,
  `ALTER TABLE app_user ADD COLUMN IF NOT EXISTS fcm_token TEXT;`,
  `ALTER TABLE app_user ADD COLUMN IF NOT EXISTS fcm_token_updated_at TIMESTAMP;`,
];

export const seedSchemaQueries = [
  `INSERT INTO featured_section (mode, title, max_items, is_active)
   SELECT 'most_viewed', 'Top Videos', 5, TRUE
   WHERE NOT EXISTS (SELECT 1 FROM featured_section);`,
];

export const indexSchemaQueries = [
  `CREATE INDEX IF NOT EXISTS idx_video_playlist ON video(playlist_id);`,
  `CREATE INDEX IF NOT EXISTS idx_video_active ON video(is_active);`,
  `CREATE INDEX IF NOT EXISTS idx_video_category ON video(category);`,
  `CREATE INDEX IF NOT EXISTS idx_video_category_id ON video(category_id);`,
  `CREATE INDEX IF NOT EXISTS idx_video_processing_status ON video(processing_status);`,
  `CREATE INDEX IF NOT EXISTS idx_video_created_at ON video(created_at DESC);`,
  `CREATE INDEX IF NOT EXISTS idx_playlist_active ON playlist(is_active);`,
  `CREATE INDEX IF NOT EXISTS idx_playlist_category ON playlist(category);`,
  `CREATE INDEX IF NOT EXISTS idx_playlist_category_id ON playlist(category_id);`,
  `CREATE INDEX IF NOT EXISTS idx_category_order ON category(display_order, created_at);`,
  `CREATE INDEX IF NOT EXISTS idx_featured_section_active ON featured_section(is_active);`,
  `CREATE INDEX IF NOT EXISTS idx_featured_video_section ON featured_video(section_id, manual_order);`,
  `CREATE INDEX IF NOT EXISTS idx_admin_permission_user ON admin_permission(admin_user_id);`,
  `CREATE INDEX IF NOT EXISTS idx_admin_permission_key ON admin_permission(permission_key);`,
  `CREATE INDEX IF NOT EXISTS idx_reaction_video ON user_video_reaction(video_id);`,
  `CREATE INDEX IF NOT EXISTS idx_comment_video ON comment(video_id);`,
  `CREATE INDEX IF NOT EXISTS idx_comment_user ON comment(user_id);`,
  `CREATE INDEX IF NOT EXISTS idx_bookmark_user ON bookmark(user_id);`,
  `CREATE INDEX IF NOT EXISTS idx_otp_phone ON otp_verification(phone_number);`,
  `CREATE INDEX IF NOT EXISTS idx_otp_expires ON otp_verification(expires_at);`,
];
