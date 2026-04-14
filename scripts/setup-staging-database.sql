-- Setup script for staging database separation
-- This creates the necessary databases and users for the staging environment

-- Create databases for different services
CREATE DATABASE chat_db;
CREATE DATABASE user_db;
CREATE DATABASE vendfinder_db;

-- Create staging user with appropriate permissions
CREATE USER vendfinder WITH PASSWORD 'vendfinder_staging_pass';

-- Grant permissions to staging user
GRANT ALL PRIVILEGES ON DATABASE chat_db TO vendfinder;
GRANT ALL PRIVILEGES ON DATABASE user_db TO vendfinder;
GRANT ALL PRIVILEGES ON DATABASE vendfinder_db TO vendfinder;

-- Connect to each database and set up schemas
\c chat_db;
GRANT ALL ON SCHEMA public TO vendfinder;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO vendfinder;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO vendfinder;

\c user_db;
GRANT ALL ON SCHEMA public TO vendfinder;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO vendfinder;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO vendfinder;

\c vendfinder_db;
GRANT ALL ON SCHEMA public TO vendfinder;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO vendfinder;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO vendfinder;