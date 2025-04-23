import dotenv from 'dotenv';
dotenv.config();

// Environment
export const NODE_ENV = process.env.NODE_ENV || 'development';
export const PORT = process.env.PORT || 3000;

// API Configuration
export const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';

// Database Configuration
export const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/airoadmap';

// Authentication
export const SESSION_SECRET = process.env.SESSION_SECRET || 'your-secret-key';
export const JWT_SECRET = process.env.JWT_SECRET || 'your-jwt-secret';

// LinkedIn Configuration
export const LINKEDIN_EMAIL = process.env.LINKEDIN_EMAIL || '';
export const LINKEDIN_PASSWORD = process.env.LINKEDIN_PASSWORD || '';

// Job Search Configuration
export const JOB_SEARCH_CONFIG = {
  keywords: (process.env.JOB_KEYWORDS || 'AI,Machine Learning,Data Science,Python,React,TypeScript').split(','),
  locations: (process.env.JOB_LOCATIONS || 'United States,Remote').split(','),
  experienceLevels: (process.env.JOB_EXPERIENCE_LEVELS || 'Entry level,Mid-Senior level').split(','),
  datePosted: process.env.JOB_DATE_POSTED || 'past-24h',
  jobType: process.env.JOB_TYPE || 'F',
};

// Storage Configuration
export const BLOB_READ_WRITE_TOKEN = process.env.BLOB_READ_WRITE_TOKEN || '';
export const STORAGE_TYPE = process.env.STORAGE_TYPE || 'local'; // 'local', 'vercel', 'aws'

// AWS Configuration (for future use)
export const AWS_ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID || '';
export const AWS_SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY || '';
export const AWS_REGION = process.env.AWS_REGION || 'us-east-1';
export const AWS_BUCKET_NAME = process.env.AWS_BUCKET_NAME || '';

// Environment Validation
const requiredEnvVars = {
  production: ['DATABASE_URL', 'SESSION_SECRET', 'JWT_SECRET'],
  development: ['DATABASE_URL'],
};

const missingVars = requiredEnvVars[NODE_ENV as keyof typeof requiredEnvVars]?.filter(
  (envVar) => !process.env[envVar]
);

if (missingVars?.length) {
  throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
}

// Export environment-specific configurations
export const isProduction = NODE_ENV === 'production';
export const isDevelopment = NODE_ENV === 'development';
export const isTest = NODE_ENV === 'test'; 