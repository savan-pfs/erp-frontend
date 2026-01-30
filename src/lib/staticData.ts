// Static data store with localStorage persistence
// This replaces Supabase for a fully static application

export interface User {
  id: string;
  email: string;
  full_name?: string;
}

export interface StaticDataStore {
  users: User[];
  profiles: Array<{
    id: string;
    user_id: string;
    full_name?: string;
    organization_id?: string;
  }>;
  organizations: Array<{
    id: string;
    name: string;
    license_number: string;
    license_type: string;
    license_expiry: string;
    state: string;
    address: string;
    email: string;
    phone: string;
  }>;
  facilities: Array<any>;
  rooms: Array<any>;
  genetics: Array<any>;
  plant_batches: Array<any>;
  plants: Array<any>;
  tasks: Array<any>;
  environmental_logs: Array<any>;
  feeding_logs: Array<any>;
  ipm_logs: Array<any>;
  harvest_batches: Array<any>;
  inventory_lots: Array<any>;
  waste_records: Array<any>;
  audit_logs: Array<any>;
  user_roles: Array<{
    id: string;
    user_id: string;
    role: string;
  }>;
}

const STORAGE_KEY = 'cannacultivate_static_data';

// Generate a unique ID
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Initialize default data
function getDefaultData(): StaticDataStore {
  const today = new Date();
  const orgId = generateId();
  const facilityId = generateId();
  
  const rooms = [
    {
      id: generateId(),
      name: "Clone Room",
      facility_id: facilityId,
      room_type: "clone",
      allowed_stages: ["clone", "seedling"],
      max_plant_capacity: 500,
      current_plant_count: 200,
      target_temp_f: 78,
      target_humidity: 75,
      target_vpd: 0.8,
      light_schedule: "18/6",
      is_active: true,
      created_at: today.toISOString(),
    },
    {
      id: generateId(),
      name: "Veg Room 1",
      facility_id: facilityId,
      room_type: "vegetative",
      allowed_stages: ["vegetative", "pre_flower"],
      max_plant_capacity: 400,
      current_plant_count: 350,
      target_temp_f: 76,
      target_humidity: 60,
      target_vpd: 1.0,
      light_schedule: "18/6",
      is_active: true,
      created_at: today.toISOString(),
    },
    {
      id: generateId(),
      name: "Veg Room 2",
      facility_id: facilityId,
      room_type: "vegetative",
      allowed_stages: ["vegetative", "pre_flower"],
      max_plant_capacity: 400,
      current_plant_count: 280,
      target_temp_f: 76,
      target_humidity: 60,
      target_vpd: 1.0,
      light_schedule: "18/6",
      is_active: true,
      created_at: today.toISOString(),
    },
    {
      id: generateId(),
      name: "Flower Room A",
      facility_id: facilityId,
      room_type: "flower",
      allowed_stages: ["flowering"],
      max_plant_capacity: 350,
      current_plant_count: 300,
      target_temp_f: 75,
      target_humidity: 50,
      target_vpd: 1.2,
      light_schedule: "12/12",
      is_active: true,
      created_at: today.toISOString(),
    },
    {
      id: generateId(),
      name: "Flower Room B",
      facility_id: facilityId,
      room_type: "flower",
      allowed_stages: ["flowering"],
      max_plant_capacity: 350,
      current_plant_count: 280,
      target_temp_f: 75,
      target_humidity: 50,
      target_vpd: 1.2,
      light_schedule: "12/12",
      is_active: true,
      created_at: today.toISOString(),
    },
    {
      id: generateId(),
      name: "Drying Room",
      facility_id: facilityId,
      room_type: "drying",
      allowed_stages: ["drying"],
      max_plant_capacity: 200,
      current_plant_count: 50,
      target_temp_f: 65,
      target_humidity: 55,
      target_vpd: 0.9,
      light_schedule: "0/24",
      is_active: true,
      created_at: today.toISOString(),
    },
  ];

  const genetics = [
    {
      id: generateId(),
      name: "Blue Dream",
      organization_id: orgId,
      strain_type: "hybrid",
      lineage: "Blueberry x Haze",
      thc_potential: 24,
      cbd_potential: 0.5,
      flowering_time_days: 65,
      avg_yield_per_plant_oz: 3.5,
      source: "clone",
      notes: "Popular sativa-dominant hybrid with balanced effects",
      created_at: today.toISOString(),
    },
    {
      id: generateId(),
      name: "OG Kush",
      organization_id: orgId,
      strain_type: "hybrid",
      lineage: "Chemdawg x Hindu Kush",
      thc_potential: 26,
      cbd_potential: 0.3,
      flowering_time_days: 60,
      avg_yield_per_plant_oz: 3.0,
      source: "clone",
      notes: "Classic strain with strong earthy aroma",
      created_at: today.toISOString(),
    },
    {
      id: generateId(),
      name: "Gelato",
      organization_id: orgId,
      strain_type: "hybrid",
      lineage: "Sunset Sherbet x Thin Mint GSC",
      thc_potential: 25,
      cbd_potential: 0.2,
      flowering_time_days: 58,
      avg_yield_per_plant_oz: 2.8,
      source: "clone",
      notes: "Sweet, dessert-like flavor profile",
      created_at: today.toISOString(),
    },
    {
      id: generateId(),
      name: "Sour Diesel",
      organization_id: orgId,
      strain_type: "sativa",
      lineage: "Chemdawg x Super Skunk",
      thc_potential: 22,
      cbd_potential: 0.4,
      flowering_time_days: 70,
      avg_yield_per_plant_oz: 3.2,
      source: "seed",
      notes: "Energizing sativa with pungent diesel aroma",
      created_at: today.toISOString(),
    },
    {
      id: generateId(),
      name: "Granddaddy Purple",
      organization_id: orgId,
      strain_type: "indica",
      lineage: "Purple Urkle x Big Bud",
      thc_potential: 23,
      cbd_potential: 0.1,
      flowering_time_days: 55,
      avg_yield_per_plant_oz: 3.0,
      source: "clone",
      notes: "Deep purple buds with grape and berry flavors",
      created_at: today.toISOString(),
    },
  ];

  const batches = [
    {
      id: generateId(),
      batch_number: "B-2024-001",
      organization_id: orgId,
      facility_id: facilityId,
      genetic_id: genetics[0].id,
      batch_type: "clone",
      start_date: new Date(today.getTime() - 42 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      current_stage: "flowering",
      current_room_id: rooms[3].id,
      initial_count: 150,
      current_count: 148,
      status: "active",
      expected_harvest_date: new Date(today.getTime() + 23 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      created_at: today.toISOString(),
    },
    {
      id: generateId(),
      batch_number: "B-2024-002",
      organization_id: orgId,
      facility_id: facilityId,
      genetic_id: genetics[1].id,
      batch_type: "clone",
      start_date: new Date(today.getTime() - 28 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      current_stage: "vegetative",
      current_room_id: rooms[1].id,
      initial_count: 200,
      current_count: 198,
      status: "active",
      expected_harvest_date: new Date(today.getTime() + 46 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      created_at: today.toISOString(),
    },
  ];

  return {
    users: [],
    profiles: [],
    organizations: [{
      id: orgId,
      name: "CannaCultivate Demo",
      license_number: "LIC-2024-DEMO-001",
      license_type: "cultivation",
      license_expiry: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      state: "CO",
      address: "123 Green Valley Road, Denver, CO 80202",
      email: "demo@cannacultivate.com",
      phone: "(303) 555-0123",
    }],
    facilities: [{
      id: facilityId,
      name: "Main Cultivation Facility",
      organization_id: orgId,
      facility_type: "cultivation",
      license_number: "LIC-2024-001",
      address: "123 Green Valley Road, Denver, CO 80202",
      square_footage: 25000,
      max_plant_count: 2000,
      is_active: true,
      created_at: today.toISOString(),
    }],
    rooms,
    genetics,
    plant_batches: batches,
    plants: [],
    tasks: [],
    environmental_logs: [],
    feeding_logs: [],
    ipm_logs: [],
    harvest_batches: [],
    inventory_lots: [],
    waste_records: [],
    audit_logs: [],
    user_roles: [],
  };
}

// Load data from localStorage or initialize
function loadData(): StaticDataStore {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.warn('Failed to load data from localStorage', e);
  }
  const defaultData = getDefaultData();
  saveData(defaultData);
  return defaultData;
}

// Save data to localStorage
function saveData(data: StaticDataStore): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.warn('Failed to save data to localStorage', e);
  }
}

// Get the data store
let dataStore: StaticDataStore = loadData();

// Helper to get fresh data
export function getData(): StaticDataStore {
  dataStore = loadData();
  return dataStore;
}

// Helper to save data
export function persistData(): void {
  saveData(dataStore);
}

// Helper to reset data
export function resetData(): void {
  dataStore = getDefaultData();
  saveData(dataStore);
}

// Helper functions for querying
export function findById<T extends { id: string }>(array: T[], id: string): T | undefined {
  return array.find(item => item.id === id);
}

export function findByField<T>(array: T[], field: keyof T, value: any): T[] {
  return array.filter(item => item[field] === value);
}

// Export the data store getter/setter
export const staticData = {
  get: getData,
  set: (data: StaticDataStore) => {
    dataStore = data;
    persistData();
  },
  update: (updates: Partial<StaticDataStore>) => {
    dataStore = { ...dataStore, ...updates };
    persistData();
  },
  reset: resetData,
};
