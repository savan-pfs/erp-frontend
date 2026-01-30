-- Cannabis Cultivation ERP MVP Database Schema
-- Compliance-first, event-driven design with full audit trails

-- =============================================================================
-- ENUMS
-- =============================================================================

CREATE TYPE public.app_role AS ENUM ('admin', 'cultivation_manager', 'grower', 'harvester', 'qa_specialist', 'inventory_manager', 'viewer');
CREATE TYPE public.growth_stage AS ENUM ('seed', 'germination', 'seedling', 'clone', 'vegetative', 'pre_flower', 'flowering', 'harvest', 'drying', 'curing', 'final', 'destroyed');
CREATE TYPE public.plant_status AS ENUM ('active', 'harvested', 'destroyed', 'transferred', 'quarantine');
CREATE TYPE public.batch_status AS ENUM ('active', 'completed', 'destroyed', 'on_hold');
CREATE TYPE public.task_status AS ENUM ('pending', 'in_progress', 'completed', 'skipped', 'overdue');
CREATE TYPE public.task_priority AS ENUM ('low', 'medium', 'high', 'critical');
CREATE TYPE public.waste_type AS ENUM ('plant_material', 'stems', 'roots', 'leaves', 'trim', 'failed_product', 'contaminated');
CREATE TYPE public.inventory_type AS ENUM ('flower', 'trim', 'shake', 'seeds', 'clones', 'mother_plants');
CREATE TYPE public.compliance_event_type AS ENUM (
  'plant_created', 'plant_destroyed', 'plant_transferred', 'plant_stage_change',
  'batch_created', 'batch_completed', 'batch_destroyed',
  'harvest_started', 'harvest_completed', 'harvest_weight_recorded',
  'inventory_created', 'inventory_adjusted', 'inventory_transferred',
  'waste_recorded', 'room_transfer', 'qa_check', 'audit_performed'
);

-- =============================================================================
-- CORE ORGANIZATION ENTITIES
-- =============================================================================

-- Organizations (License holders)
CREATE TABLE public.organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  license_number TEXT NOT NULL UNIQUE,
  license_type TEXT NOT NULL,
  license_expiry DATE NOT NULL,
  state TEXT NOT NULL,
  address TEXT,
  phone TEXT,
  email TEXT,
  metrc_api_key TEXT, -- Encrypted, for future Metrc integration
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Facilities
CREATE TABLE public.facilities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  license_number TEXT UNIQUE,
  facility_type TEXT NOT NULL DEFAULT 'cultivation',
  address TEXT,
  square_footage INTEGER,
  max_plant_count INTEGER,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Rooms/Zones within Facilities
CREATE TABLE public.rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  facility_id UUID NOT NULL REFERENCES public.facilities(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  room_type TEXT NOT NULL, -- propagation, vegetative, flowering, drying, curing, vault
  allowed_stages growth_stage[] NOT NULL,
  max_plant_capacity INTEGER,
  current_plant_count INTEGER NOT NULL DEFAULT 0,
  target_temp_f DECIMAL(5,2),
  target_humidity DECIMAL(5,2),
  target_vpd DECIMAL(4,2),
  light_schedule TEXT, -- e.g., "18/6", "12/12"
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(facility_id, name)
);

-- =============================================================================
-- USER & ROLE MANAGEMENT
-- =============================================================================

-- User Profiles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES public.organizations(id),
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  employee_id TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- User Roles (separate table for security)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  facility_id UUID REFERENCES public.facilities(id) ON DELETE CASCADE,
  granted_by UUID REFERENCES auth.users(id),
  granted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, role, facility_id)
);

-- =============================================================================
-- GENETICS & PLANT MANAGEMENT
-- =============================================================================

-- Genetics/Strains
CREATE TABLE public.genetics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  strain_type TEXT NOT NULL, -- indica, sativa, hybrid
  thc_potential DECIMAL(5,2),
  cbd_potential DECIMAL(5,2),
  flowering_time_days INTEGER,
  avg_yield_per_plant_oz DECIMAL(6,2),
  source TEXT, -- seed_company, clone_vendor, internal
  source_details TEXT,
  lineage TEXT,
  notes TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(organization_id, name)
);

-- Mother Plants
CREATE TABLE public.mother_plants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  genetic_id UUID NOT NULL REFERENCES public.genetics(id),
  room_id UUID NOT NULL REFERENCES public.rooms(id),
  plant_tag TEXT NOT NULL UNIQUE,
  mother_number TEXT NOT NULL,
  age_weeks INTEGER NOT NULL DEFAULT 0,
  health_status TEXT NOT NULL DEFAULT 'healthy',
  total_clones_taken INTEGER NOT NULL DEFAULT 0,
  last_clone_date DATE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  retired_date DATE,
  notes TEXT,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Plant Batches
CREATE TABLE public.plant_batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  facility_id UUID NOT NULL REFERENCES public.facilities(id),
  genetic_id UUID NOT NULL REFERENCES public.genetics(id),
  batch_number TEXT NOT NULL UNIQUE,
  batch_type TEXT NOT NULL, -- seed, clone
  source_mother_id UUID REFERENCES public.mother_plants(id),
  current_room_id UUID REFERENCES public.rooms(id),
  current_stage growth_stage NOT NULL DEFAULT 'seed',
  status batch_status NOT NULL DEFAULT 'active',
  initial_count INTEGER NOT NULL,
  current_count INTEGER NOT NULL,
  start_date DATE NOT NULL,
  expected_harvest_date DATE,
  actual_harvest_date DATE,
  notes TEXT,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Individual Plants
CREATE TABLE public.plants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id UUID NOT NULL REFERENCES public.plant_batches(id),
  plant_tag TEXT NOT NULL UNIQUE, -- Compliance tag
  current_room_id UUID REFERENCES public.rooms(id),
  current_stage growth_stage NOT NULL,
  status plant_status NOT NULL DEFAULT 'active',
  planted_date DATE NOT NULL,
  stage_changed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  health_score INTEGER CHECK (health_score >= 0 AND health_score <= 100),
  height_inches DECIMAL(6,2),
  notes TEXT,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Stage Transitions Log
CREATE TABLE public.stage_transitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plant_id UUID REFERENCES public.plants(id) ON DELETE CASCADE,
  batch_id UUID REFERENCES public.plant_batches(id) ON DELETE CASCADE,
  from_stage growth_stage,
  to_stage growth_stage NOT NULL,
  from_room_id UUID REFERENCES public.rooms(id),
  to_room_id UUID REFERENCES public.rooms(id),
  transition_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  performed_by UUID NOT NULL REFERENCES auth.users(id),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (plant_id IS NOT NULL OR batch_id IS NOT NULL)
);

-- =============================================================================
-- CULTIVATION LOGS
-- =============================================================================

-- Environmental Logs (Manual Input)
CREATE TABLE public.environmental_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES public.rooms(id),
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  temperature_f DECIMAL(5,2),
  humidity_percent DECIMAL(5,2),
  vpd DECIMAL(4,2),
  co2_ppm INTEGER,
  light_intensity_ppfd INTEGER,
  notes TEXT,
  recorded_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Feeding/Nutrient Logs
CREATE TABLE public.feeding_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id UUID REFERENCES public.plant_batches(id),
  plant_id UUID REFERENCES public.plants(id),
  room_id UUID NOT NULL REFERENCES public.rooms(id),
  feed_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  water_volume_gallons DECIMAL(8,2),
  nutrient_solution TEXT NOT NULL,
  ec_ppm INTEGER,
  ph_level DECIMAL(4,2),
  runoff_ec INTEGER,
  runoff_ph DECIMAL(4,2),
  notes TEXT,
  performed_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (batch_id IS NOT NULL OR plant_id IS NOT NULL)
);

-- IPM (Integrated Pest Management) Logs
CREATE TABLE public.ipm_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES public.rooms(id),
  batch_id UUID REFERENCES public.plant_batches(id),
  treatment_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  treatment_type TEXT NOT NULL, -- preventive, curative
  pest_disease_identified TEXT,
  product_used TEXT NOT NULL,
  application_method TEXT,
  concentration TEXT,
  rei_hours INTEGER, -- Re-entry interval
  phi_days INTEGER, -- Pre-harvest interval
  notes TEXT,
  performed_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =============================================================================
-- HARVEST & POST-HARVEST
-- =============================================================================

-- Harvest Batches
CREATE TABLE public.harvest_batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  plant_batch_id UUID NOT NULL REFERENCES public.plant_batches(id),
  harvest_batch_number TEXT NOT NULL UNIQUE,
  harvest_date DATE NOT NULL,
  harvested_by UUID NOT NULL REFERENCES auth.users(id),
  plant_count INTEGER NOT NULL,
  wet_weight_lbs DECIMAL(10,4),
  dry_weight_lbs DECIMAL(10,4),
  final_weight_lbs DECIMAL(10,4),
  waste_weight_lbs DECIMAL(10,4),
  drying_room_id UUID REFERENCES public.rooms(id),
  curing_room_id UUID REFERENCES public.rooms(id),
  drying_start_date DATE,
  drying_end_date DATE,
  curing_start_date DATE,
  curing_end_date DATE,
  status TEXT NOT NULL DEFAULT 'harvesting',
  qa_status TEXT DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Post-Harvest Lots (Final packaged product)
CREATE TABLE public.inventory_lots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  harvest_batch_id UUID REFERENCES public.harvest_batches(id),
  lot_number TEXT NOT NULL UNIQUE,
  inventory_type inventory_type NOT NULL,
  genetic_id UUID NOT NULL REFERENCES public.genetics(id),
  room_id UUID REFERENCES public.rooms(id),
  initial_weight_lbs DECIMAL(10,4) NOT NULL,
  current_weight_lbs DECIMAL(10,4) NOT NULL,
  unit_count INTEGER,
  thc_percent DECIMAL(5,2),
  cbd_percent DECIMAL(5,2),
  moisture_percent DECIMAL(5,2),
  production_date DATE NOT NULL,
  expiration_date DATE,
  qa_status TEXT NOT NULL DEFAULT 'pending',
  is_available BOOLEAN NOT NULL DEFAULT true,
  notes TEXT,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =============================================================================
-- WASTE MANAGEMENT
-- =============================================================================

CREATE TABLE public.waste_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  facility_id UUID NOT NULL REFERENCES public.facilities(id),
  waste_type waste_type NOT NULL,
  source_type TEXT NOT NULL, -- plant, batch, harvest, inventory
  source_id UUID,
  weight_lbs DECIMAL(10,4) NOT NULL,
  waste_date DATE NOT NULL,
  reason TEXT NOT NULL,
  disposal_method TEXT,
  disposal_date DATE,
  witness_id UUID REFERENCES auth.users(id),
  photo_url TEXT,
  notes TEXT,
  recorded_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =============================================================================
-- TASK MANAGEMENT
-- =============================================================================

-- SOP Templates
CREATE TABLE public.sop_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT NOT NULL, -- propagation, vegetation, flowering, harvest, post-harvest, ipm
  description TEXT,
  steps JSONB NOT NULL DEFAULT '[]',
  required_inputs JSONB DEFAULT '[]',
  estimated_duration_minutes INTEGER,
  applicable_stages growth_stage[],
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tasks
CREATE TABLE public.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  facility_id UUID NOT NULL REFERENCES public.facilities(id),
  sop_template_id UUID REFERENCES public.sop_templates(id),
  title TEXT NOT NULL,
  description TEXT,
  room_id UUID REFERENCES public.rooms(id),
  batch_id UUID REFERENCES public.plant_batches(id),
  plant_id UUID REFERENCES public.plants(id),
  assigned_to UUID REFERENCES auth.users(id),
  assigned_role app_role,
  status task_status NOT NULL DEFAULT 'pending',
  priority task_priority NOT NULL DEFAULT 'medium',
  due_date TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  completion_data JSONB,
  notes TEXT,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =============================================================================
-- COMPLIANCE & AUDIT
-- =============================================================================

-- Compliance Events (Immutable log for seed-to-sale tracking)
CREATE TABLE public.compliance_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id),
  event_type compliance_event_type NOT NULL,
  event_timestamp TIMESTAMPTZ NOT NULL DEFAULT now(),
  entity_type TEXT NOT NULL, -- plant, batch, harvest, inventory, waste
  entity_id UUID NOT NULL,
  entity_tag TEXT, -- Plant tag or batch number for quick lookup
  previous_state JSONB,
  new_state JSONB,
  metadata JSONB,
  performed_by UUID NOT NULL REFERENCES auth.users(id),
  ip_address INET,
  user_agent TEXT,
  metrc_sync_status TEXT DEFAULT 'pending', -- pending, synced, failed, not_required
  metrc_sync_at TIMESTAMPTZ,
  metrc_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Audit Log (Immutable, append-only)
CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  action TEXT NOT NULL,
  table_name TEXT NOT NULL,
  record_id UUID,
  old_values JSONB,
  new_values JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =============================================================================
-- INDEXES FOR PERFORMANCE
-- =============================================================================

CREATE INDEX idx_plants_batch ON public.plants(batch_id);
CREATE INDEX idx_plants_room ON public.plants(current_room_id);
CREATE INDEX idx_plants_tag ON public.plants(plant_tag);
CREATE INDEX idx_plants_status ON public.plants(status);
CREATE INDEX idx_batches_org ON public.plant_batches(organization_id);
CREATE INDEX idx_batches_facility ON public.plant_batches(facility_id);
CREATE INDEX idx_batches_status ON public.plant_batches(status);
CREATE INDEX idx_compliance_events_org ON public.compliance_events(organization_id);
CREATE INDEX idx_compliance_events_type ON public.compliance_events(event_type);
CREATE INDEX idx_compliance_events_entity ON public.compliance_events(entity_type, entity_id);
CREATE INDEX idx_compliance_events_timestamp ON public.compliance_events(event_timestamp DESC);
CREATE INDEX idx_audit_logs_org ON public.audit_logs(organization_id);
CREATE INDEX idx_audit_logs_table ON public.audit_logs(table_name);
CREATE INDEX idx_audit_logs_timestamp ON public.audit_logs(created_at DESC);
CREATE INDEX idx_tasks_facility ON public.tasks(facility_id);
CREATE INDEX idx_tasks_assigned ON public.tasks(assigned_to);
CREATE INDEX idx_tasks_status ON public.tasks(status);
CREATE INDEX idx_tasks_due ON public.tasks(due_date);
CREATE INDEX idx_rooms_facility ON public.rooms(facility_id);
CREATE INDEX idx_harvest_batches_org ON public.harvest_batches(organization_id);
CREATE INDEX idx_inventory_lots_org ON public.inventory_lots(organization_id);

-- =============================================================================
-- ENABLE ROW LEVEL SECURITY
-- =============================================================================

ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.facilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.genetics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mother_plants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plant_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stage_transitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.environmental_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feeding_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ipm_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.harvest_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_lots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.waste_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sop_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.compliance_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- SECURITY DEFINER FUNCTIONS (Prevent RLS recursion)
-- =============================================================================

-- Check if user has a specific role
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Get user's organization ID
CREATE OR REPLACE FUNCTION public.get_user_organization_id(_user_id UUID)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT organization_id FROM public.profiles WHERE id = _user_id
$$;

-- Check if user belongs to organization
CREATE OR REPLACE FUNCTION public.user_belongs_to_org(_user_id UUID, _org_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = _user_id AND organization_id = _org_id
  )
$$;

-- =============================================================================
-- RLS POLICIES
-- =============================================================================

-- Organizations: Users can only see their own organization
CREATE POLICY "Users can view own organization" ON public.organizations
  FOR SELECT USING (public.user_belongs_to_org(auth.uid(), id));

CREATE POLICY "Admins can update own organization" ON public.organizations
  FOR UPDATE USING (public.user_belongs_to_org(auth.uid(), id) AND public.has_role(auth.uid(), 'admin'));

-- Facilities: Users can view facilities in their organization
CREATE POLICY "Users can view org facilities" ON public.facilities
  FOR SELECT USING (public.user_belongs_to_org(auth.uid(), organization_id));

CREATE POLICY "Admins can manage facilities" ON public.facilities
  FOR ALL USING (public.user_belongs_to_org(auth.uid(), organization_id) AND public.has_role(auth.uid(), 'admin'));

-- Rooms
CREATE POLICY "Users can view org rooms" ON public.rooms
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.facilities f WHERE f.id = facility_id AND public.user_belongs_to_org(auth.uid(), f.organization_id))
  );

CREATE POLICY "Managers can manage rooms" ON public.rooms
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.facilities f WHERE f.id = facility_id AND public.user_belongs_to_org(auth.uid(), f.organization_id))
    AND (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'cultivation_manager'))
  );

-- Profiles
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (id = auth.uid());

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (id = auth.uid());

CREATE POLICY "Admins can view org profiles" ON public.profiles
  FOR SELECT USING (public.user_belongs_to_org(auth.uid(), organization_id) AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "System can insert profiles" ON public.profiles
  FOR INSERT WITH CHECK (true);

-- User Roles
CREATE POLICY "Users can view own roles" ON public.user_roles
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Admins can manage roles" ON public.user_roles
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Genetics
CREATE POLICY "Users can view org genetics" ON public.genetics
  FOR SELECT USING (public.user_belongs_to_org(auth.uid(), organization_id));

CREATE POLICY "Managers can manage genetics" ON public.genetics
  FOR ALL USING (
    public.user_belongs_to_org(auth.uid(), organization_id)
    AND (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'cultivation_manager'))
  );

-- Mother Plants
CREATE POLICY "Users can view org mothers" ON public.mother_plants
  FOR SELECT USING (public.user_belongs_to_org(auth.uid(), organization_id));

CREATE POLICY "Staff can manage mothers" ON public.mother_plants
  FOR ALL USING (
    public.user_belongs_to_org(auth.uid(), organization_id)
    AND (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'cultivation_manager') OR public.has_role(auth.uid(), 'grower'))
  );

-- Plant Batches
CREATE POLICY "Users can view org batches" ON public.plant_batches
  FOR SELECT USING (public.user_belongs_to_org(auth.uid(), organization_id));

CREATE POLICY "Staff can manage batches" ON public.plant_batches
  FOR ALL USING (
    public.user_belongs_to_org(auth.uid(), organization_id)
    AND (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'cultivation_manager') OR public.has_role(auth.uid(), 'grower'))
  );

-- Plants
CREATE POLICY "Users can view org plants" ON public.plants
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.plant_batches pb WHERE pb.id = batch_id AND public.user_belongs_to_org(auth.uid(), pb.organization_id))
  );

CREATE POLICY "Staff can manage plants" ON public.plants
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.plant_batches pb WHERE pb.id = batch_id AND public.user_belongs_to_org(auth.uid(), pb.organization_id))
    AND (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'cultivation_manager') OR public.has_role(auth.uid(), 'grower'))
  );

-- Stage Transitions
CREATE POLICY "Users can view org transitions" ON public.stage_transitions
  FOR SELECT USING (
    (plant_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.plants p JOIN public.plant_batches pb ON p.batch_id = pb.id 
      WHERE p.id = plant_id AND public.user_belongs_to_org(auth.uid(), pb.organization_id)
    ))
    OR
    (batch_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.plant_batches pb WHERE pb.id = batch_id AND public.user_belongs_to_org(auth.uid(), pb.organization_id)
    ))
  );

CREATE POLICY "Staff can insert transitions" ON public.stage_transitions
  FOR INSERT WITH CHECK (
    public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'cultivation_manager') OR public.has_role(auth.uid(), 'grower')
  );

-- Environmental Logs
CREATE POLICY "Users can view env logs" ON public.environmental_logs
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.rooms r JOIN public.facilities f ON r.facility_id = f.id WHERE r.id = room_id AND public.user_belongs_to_org(auth.uid(), f.organization_id))
  );

CREATE POLICY "Staff can insert env logs" ON public.environmental_logs
  FOR INSERT WITH CHECK (
    public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'cultivation_manager') OR public.has_role(auth.uid(), 'grower')
  );

-- Feeding Logs
CREATE POLICY "Users can view feeding logs" ON public.feeding_logs
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.rooms r JOIN public.facilities f ON r.facility_id = f.id WHERE r.id = room_id AND public.user_belongs_to_org(auth.uid(), f.organization_id))
  );

CREATE POLICY "Staff can insert feeding logs" ON public.feeding_logs
  FOR INSERT WITH CHECK (
    public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'cultivation_manager') OR public.has_role(auth.uid(), 'grower')
  );

-- IPM Logs
CREATE POLICY "Users can view ipm logs" ON public.ipm_logs
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.rooms r JOIN public.facilities f ON r.facility_id = f.id WHERE r.id = room_id AND public.user_belongs_to_org(auth.uid(), f.organization_id))
  );

CREATE POLICY "Staff can insert ipm logs" ON public.ipm_logs
  FOR INSERT WITH CHECK (
    public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'cultivation_manager') OR public.has_role(auth.uid(), 'grower')
  );

-- Harvest Batches
CREATE POLICY "Users can view org harvests" ON public.harvest_batches
  FOR SELECT USING (public.user_belongs_to_org(auth.uid(), organization_id));

CREATE POLICY "Staff can manage harvests" ON public.harvest_batches
  FOR ALL USING (
    public.user_belongs_to_org(auth.uid(), organization_id)
    AND (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'cultivation_manager') OR public.has_role(auth.uid(), 'harvester'))
  );

-- Inventory Lots
CREATE POLICY "Users can view org inventory" ON public.inventory_lots
  FOR SELECT USING (public.user_belongs_to_org(auth.uid(), organization_id));

CREATE POLICY "Managers can manage inventory" ON public.inventory_lots
  FOR ALL USING (
    public.user_belongs_to_org(auth.uid(), organization_id)
    AND (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'inventory_manager'))
  );

-- Waste Records
CREATE POLICY "Users can view org waste" ON public.waste_records
  FOR SELECT USING (public.user_belongs_to_org(auth.uid(), organization_id));

CREATE POLICY "Staff can record waste" ON public.waste_records
  FOR INSERT WITH CHECK (
    public.user_belongs_to_org(auth.uid(), organization_id)
    AND (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'cultivation_manager') OR public.has_role(auth.uid(), 'grower') OR public.has_role(auth.uid(), 'harvester'))
  );

-- SOP Templates
CREATE POLICY "Users can view org sops" ON public.sop_templates
  FOR SELECT USING (public.user_belongs_to_org(auth.uid(), organization_id));

CREATE POLICY "Managers can manage sops" ON public.sop_templates
  FOR ALL USING (
    public.user_belongs_to_org(auth.uid(), organization_id)
    AND (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'cultivation_manager'))
  );

-- Tasks
CREATE POLICY "Users can view assigned tasks" ON public.tasks
  FOR SELECT USING (
    public.user_belongs_to_org(auth.uid(), organization_id)
    OR assigned_to = auth.uid()
  );

CREATE POLICY "Staff can manage tasks" ON public.tasks
  FOR ALL USING (
    public.user_belongs_to_org(auth.uid(), organization_id)
  );

-- Compliance Events (Read-only for all org users)
CREATE POLICY "Users can view org compliance events" ON public.compliance_events
  FOR SELECT USING (public.user_belongs_to_org(auth.uid(), organization_id));

CREATE POLICY "System can insert compliance events" ON public.compliance_events
  FOR INSERT WITH CHECK (
    public.user_belongs_to_org(auth.uid(), organization_id)
  );

-- Audit Logs (Read-only for admins)
CREATE POLICY "Admins can view audit logs" ON public.audit_logs
  FOR SELECT USING (
    public.user_belongs_to_org(auth.uid(), organization_id) AND public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "System can insert audit logs" ON public.audit_logs
  FOR INSERT WITH CHECK (true);

-- =============================================================================
-- TRIGGERS FOR AUTOMATIC UPDATES
-- =============================================================================

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers
CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON public.organizations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_facilities_updated_at BEFORE UPDATE ON public.facilities FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_rooms_updated_at BEFORE UPDATE ON public.rooms FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_genetics_updated_at BEFORE UPDATE ON public.genetics FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_mother_plants_updated_at BEFORE UPDATE ON public.mother_plants FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_plant_batches_updated_at BEFORE UPDATE ON public.plant_batches FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_plants_updated_at BEFORE UPDATE ON public.plants FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_harvest_batches_updated_at BEFORE UPDATE ON public.harvest_batches FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_inventory_lots_updated_at BEFORE UPDATE ON public.inventory_lots FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_sop_templates_updated_at BEFORE UPDATE ON public.sop_templates FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON public.tasks FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.email),
    NEW.email
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Room plant count trigger
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
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_room_count_on_plant_change
  AFTER INSERT OR UPDATE OR DELETE ON public.plants
  FOR EACH ROW EXECUTE FUNCTION public.update_room_plant_count();