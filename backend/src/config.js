import dotenv from 'dotenv';

dotenv.config();

const {
  DATABASE_URL = 'postgresql://postgres:postgres@localhost:5432/nes_frequencia',
  SECRET_KEY = 'change-me-in-production-use-openssl-rand-hex-32',
  ALGORITHM = 'HS256',
  ACCESS_TOKEN_EXPIRE_MINUTES = '480',
  TOKEN_ROTATION_SECONDS = '20',
  TOKEN_LENGTH = '6',
  CORS_ORIGINS = '["http://localhost:5173","http://localhost:3000","http://localhost"]',
} = process.env;

export const databaseUrl = DATABASE_URL;
export const secretKey = SECRET_KEY;
export const algorithm = ALGORITHM;
export const accessTokenExpireMinutes = Number(ACCESS_TOKEN_EXPIRE_MINUTES);
export const tokenRotationSeconds = Number(TOKEN_ROTATION_SECONDS);
export const tokenLength = Number(TOKEN_LENGTH);

export const corsOrigins = (() => {
  try {
    return JSON.parse(CORS_ORIGINS);
  } catch (error) {
    return [CORS_ORIGINS];
  }
})();
