import dotenv from 'dotenv';

dotenv.config();

export const jwtSecret = process.env.JWT_SECRET || 'your_jwt_secret_key';
export const jwtExpiresIn = '30d';
