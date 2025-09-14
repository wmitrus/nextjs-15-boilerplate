-- Database initialization script for Next.js PostgreSQL setup
-- This script runs when the PostgreSQL container starts for the first time

-- Create a development database if it doesn't exist
-- (The main database is already created via POSTGRES_DB environment variable)

-- You can add additional database setup here
-- For example:
-- CREATE DATABASE nextjs_test;
-- CREATE USER nextjs_user WITH PASSWORD 'secure_password';
-- GRANT ALL PRIVILEGES ON DATABASE nextjs_db TO nextjs_user;

-- Example: Create a simple users table for testing
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create an index on email for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Insert a test user
INSERT INTO users (email, name) VALUES ('test@example.com', 'Test User')
ON CONFLICT (email) DO NOTHING;
