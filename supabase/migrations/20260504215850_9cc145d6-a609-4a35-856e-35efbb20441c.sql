
-- updated_at trigger for experiences
DROP TRIGGER IF EXISTS experiences_set_updated_at ON public.experiences;
CREATE TRIGGER experiences_set_updated_at
BEFORE UPDATE ON public.experiences
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- enable scheduling extensions
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;
