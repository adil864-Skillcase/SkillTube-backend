export const dbConfig = {
  connectionString: process.env.DATABASE_URL,
};

export const jwtConfig = {
  secret: process.env.JWT_SECRET,
  expiresIn: process.env.JWT_EXPIRES_IN || "7d",
};
