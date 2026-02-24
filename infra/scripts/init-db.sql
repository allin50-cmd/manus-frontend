-- FineGuard Database Initialization
-- Runs on first PostgreSQL container start in Docker Compose

-- Create fineguard schema if needed
CREATE SCHEMA IF NOT EXISTS public;

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Ensure database is set to UTC
SET timezone = 'UTC';
