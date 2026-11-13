-- The app connects as friday_app: not a superuser, not the table owner and
-- without BYPASSRLS, so row-level security applies to every query it runs.
-- Migrations run as the owner role (friday).
CREATE ROLE friday_app LOGIN PASSWORD 'friday_app' NOSUPERUSER NOBYPASSRLS;
GRANT USAGE ON SCHEMA public TO friday_app;
ALTER DEFAULT PRIVILEGES FOR ROLE friday IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO friday_app;
ALTER DEFAULT PRIVILEGES FOR ROLE friday IN SCHEMA public
  GRANT USAGE, SELECT ON SEQUENCES TO friday_app;
