-- Fix security warnings: Set search_path on remaining functions

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE OR REPLACE FUNCTION public.update_room_plant_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.rooms SET current_plant_count = current_plant_count + 1 WHERE id = NEW.current_room_id;
  ELSIF TG_OP = 'UPDATE' AND OLD.current_room_id IS DISTINCT FROM NEW.current_room_id THEN
    IF OLD.current_room_id IS NOT NULL THEN
      UPDATE public.rooms SET current_plant_count = current_plant_count - 1 WHERE id = OLD.current_room_id;
    END IF;
    IF NEW.current_room_id IS NOT NULL THEN
      UPDATE public.rooms SET current_plant_count = current_plant_count + 1 WHERE id = NEW.current_room_id;
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.rooms SET current_plant_count = current_plant_count - 1 WHERE id = OLD.current_room_id;
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;