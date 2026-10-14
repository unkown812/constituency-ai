CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS postgis_topology;

CREATE INDEX IF NOT EXISTS idx_complaints_location ON complaints USING GIST (location);
CREATE INDEX IF NOT EXISTS idx_projects_location ON projects USING GIST (location);