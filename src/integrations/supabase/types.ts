export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      audit_logs: {
        Row: {
          action: string
          created_at: string
          id: string
          ip_address: unknown
          new_values: Json | null
          old_values: Json | null
          organization_id: string | null
          record_id: string | null
          table_name: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string
          id?: string
          ip_address?: unknown
          new_values?: Json | null
          old_values?: Json | null
          organization_id?: string | null
          record_id?: string | null
          table_name: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string
          id?: string
          ip_address?: unknown
          new_values?: Json | null
          old_values?: Json | null
          organization_id?: string | null
          record_id?: string | null
          table_name?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      compliance_events: {
        Row: {
          created_at: string
          entity_id: string
          entity_tag: string | null
          entity_type: string
          event_timestamp: string
          event_type: Database["public"]["Enums"]["compliance_event_type"]
          id: string
          ip_address: unknown
          metadata: Json | null
          metrc_id: string | null
          metrc_sync_at: string | null
          metrc_sync_status: string | null
          new_state: Json | null
          organization_id: string
          performed_by: string
          previous_state: Json | null
          user_agent: string | null
        }
        Insert: {
          created_at?: string
          entity_id: string
          entity_tag?: string | null
          entity_type: string
          event_timestamp?: string
          event_type: Database["public"]["Enums"]["compliance_event_type"]
          id?: string
          ip_address?: unknown
          metadata?: Json | null
          metrc_id?: string | null
          metrc_sync_at?: string | null
          metrc_sync_status?: string | null
          new_state?: Json | null
          organization_id: string
          performed_by: string
          previous_state?: Json | null
          user_agent?: string | null
        }
        Update: {
          created_at?: string
          entity_id?: string
          entity_tag?: string | null
          entity_type?: string
          event_timestamp?: string
          event_type?: Database["public"]["Enums"]["compliance_event_type"]
          id?: string
          ip_address?: unknown
          metadata?: Json | null
          metrc_id?: string | null
          metrc_sync_at?: string | null
          metrc_sync_status?: string | null
          new_state?: Json | null
          organization_id?: string
          performed_by?: string
          previous_state?: Json | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "compliance_events_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      environmental_logs: {
        Row: {
          co2_ppm: number | null
          created_at: string
          humidity_percent: number | null
          id: string
          light_intensity_ppfd: number | null
          notes: string | null
          recorded_at: string
          recorded_by: string
          room_id: string
          temperature_f: number | null
          vpd: number | null
        }
        Insert: {
          co2_ppm?: number | null
          created_at?: string
          humidity_percent?: number | null
          id?: string
          light_intensity_ppfd?: number | null
          notes?: string | null
          recorded_at?: string
          recorded_by: string
          room_id: string
          temperature_f?: number | null
          vpd?: number | null
        }
        Update: {
          co2_ppm?: number | null
          created_at?: string
          humidity_percent?: number | null
          id?: string
          light_intensity_ppfd?: number | null
          notes?: string | null
          recorded_at?: string
          recorded_by?: string
          room_id?: string
          temperature_f?: number | null
          vpd?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "environmental_logs_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      facilities: {
        Row: {
          address: string | null
          created_at: string
          facility_type: string
          id: string
          is_active: boolean
          license_number: string | null
          max_plant_count: number | null
          name: string
          organization_id: string
          square_footage: number | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          facility_type?: string
          id?: string
          is_active?: boolean
          license_number?: string | null
          max_plant_count?: number | null
          name: string
          organization_id: string
          square_footage?: number | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          created_at?: string
          facility_type?: string
          id?: string
          is_active?: boolean
          license_number?: string | null
          max_plant_count?: number | null
          name?: string
          organization_id?: string
          square_footage?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "facilities_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      feeding_logs: {
        Row: {
          batch_id: string | null
          created_at: string
          ec_ppm: number | null
          feed_date: string
          id: string
          notes: string | null
          nutrient_solution: string
          performed_by: string
          ph_level: number | null
          plant_id: string | null
          room_id: string
          runoff_ec: number | null
          runoff_ph: number | null
          water_volume_gallons: number | null
        }
        Insert: {
          batch_id?: string | null
          created_at?: string
          ec_ppm?: number | null
          feed_date?: string
          id?: string
          notes?: string | null
          nutrient_solution: string
          performed_by: string
          ph_level?: number | null
          plant_id?: string | null
          room_id: string
          runoff_ec?: number | null
          runoff_ph?: number | null
          water_volume_gallons?: number | null
        }
        Update: {
          batch_id?: string | null
          created_at?: string
          ec_ppm?: number | null
          feed_date?: string
          id?: string
          notes?: string | null
          nutrient_solution?: string
          performed_by?: string
          ph_level?: number | null
          plant_id?: string | null
          room_id?: string
          runoff_ec?: number | null
          runoff_ph?: number | null
          water_volume_gallons?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "feeding_logs_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "plant_batches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feeding_logs_plant_id_fkey"
            columns: ["plant_id"]
            isOneToOne: false
            referencedRelation: "plants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feeding_logs_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      genetics: {
        Row: {
          avg_yield_per_plant_oz: number | null
          cbd_potential: number | null
          created_at: string
          flowering_time_days: number | null
          id: string
          is_active: boolean
          lineage: string | null
          name: string
          notes: string | null
          organization_id: string
          source: string | null
          source_details: string | null
          strain_type: string
          thc_potential: number | null
          updated_at: string
        }
        Insert: {
          avg_yield_per_plant_oz?: number | null
          cbd_potential?: number | null
          created_at?: string
          flowering_time_days?: number | null
          id?: string
          is_active?: boolean
          lineage?: string | null
          name: string
          notes?: string | null
          organization_id: string
          source?: string | null
          source_details?: string | null
          strain_type: string
          thc_potential?: number | null
          updated_at?: string
        }
        Update: {
          avg_yield_per_plant_oz?: number | null
          cbd_potential?: number | null
          created_at?: string
          flowering_time_days?: number | null
          id?: string
          is_active?: boolean
          lineage?: string | null
          name?: string
          notes?: string | null
          organization_id?: string
          source?: string | null
          source_details?: string | null
          strain_type?: string
          thc_potential?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "genetics_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      harvest_batches: {
        Row: {
          created_at: string
          curing_end_date: string | null
          curing_room_id: string | null
          curing_start_date: string | null
          dry_weight_lbs: number | null
          drying_end_date: string | null
          drying_room_id: string | null
          drying_start_date: string | null
          final_weight_lbs: number | null
          harvest_batch_number: string
          harvest_date: string
          harvested_by: string
          id: string
          notes: string | null
          organization_id: string
          plant_batch_id: string
          plant_count: number
          qa_status: string | null
          status: string
          updated_at: string
          waste_weight_lbs: number | null
          wet_weight_lbs: number | null
        }
        Insert: {
          created_at?: string
          curing_end_date?: string | null
          curing_room_id?: string | null
          curing_start_date?: string | null
          dry_weight_lbs?: number | null
          drying_end_date?: string | null
          drying_room_id?: string | null
          drying_start_date?: string | null
          final_weight_lbs?: number | null
          harvest_batch_number: string
          harvest_date: string
          harvested_by: string
          id?: string
          notes?: string | null
          organization_id: string
          plant_batch_id: string
          plant_count: number
          qa_status?: string | null
          status?: string
          updated_at?: string
          waste_weight_lbs?: number | null
          wet_weight_lbs?: number | null
        }
        Update: {
          created_at?: string
          curing_end_date?: string | null
          curing_room_id?: string | null
          curing_start_date?: string | null
          dry_weight_lbs?: number | null
          drying_end_date?: string | null
          drying_room_id?: string | null
          drying_start_date?: string | null
          final_weight_lbs?: number | null
          harvest_batch_number?: string
          harvest_date?: string
          harvested_by?: string
          id?: string
          notes?: string | null
          organization_id?: string
          plant_batch_id?: string
          plant_count?: number
          qa_status?: string | null
          status?: string
          updated_at?: string
          waste_weight_lbs?: number | null
          wet_weight_lbs?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "harvest_batches_curing_room_id_fkey"
            columns: ["curing_room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "harvest_batches_drying_room_id_fkey"
            columns: ["drying_room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "harvest_batches_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "harvest_batches_plant_batch_id_fkey"
            columns: ["plant_batch_id"]
            isOneToOne: false
            referencedRelation: "plant_batches"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_lots: {
        Row: {
          cbd_percent: number | null
          created_at: string
          created_by: string
          current_weight_lbs: number
          expiration_date: string | null
          genetic_id: string
          harvest_batch_id: string | null
          id: string
          initial_weight_lbs: number
          inventory_type: Database["public"]["Enums"]["inventory_type"]
          is_available: boolean
          lot_number: string
          moisture_percent: number | null
          notes: string | null
          organization_id: string
          production_date: string
          qa_status: string
          room_id: string | null
          thc_percent: number | null
          unit_count: number | null
          updated_at: string
        }
        Insert: {
          cbd_percent?: number | null
          created_at?: string
          created_by: string
          current_weight_lbs: number
          expiration_date?: string | null
          genetic_id: string
          harvest_batch_id?: string | null
          id?: string
          initial_weight_lbs: number
          inventory_type: Database["public"]["Enums"]["inventory_type"]
          is_available?: boolean
          lot_number: string
          moisture_percent?: number | null
          notes?: string | null
          organization_id: string
          production_date: string
          qa_status?: string
          room_id?: string | null
          thc_percent?: number | null
          unit_count?: number | null
          updated_at?: string
        }
        Update: {
          cbd_percent?: number | null
          created_at?: string
          created_by?: string
          current_weight_lbs?: number
          expiration_date?: string | null
          genetic_id?: string
          harvest_batch_id?: string | null
          id?: string
          initial_weight_lbs?: number
          inventory_type?: Database["public"]["Enums"]["inventory_type"]
          is_available?: boolean
          lot_number?: string
          moisture_percent?: number | null
          notes?: string | null
          organization_id?: string
          production_date?: string
          qa_status?: string
          room_id?: string | null
          thc_percent?: number | null
          unit_count?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_lots_genetic_id_fkey"
            columns: ["genetic_id"]
            isOneToOne: false
            referencedRelation: "genetics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_lots_harvest_batch_id_fkey"
            columns: ["harvest_batch_id"]
            isOneToOne: false
            referencedRelation: "harvest_batches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_lots_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_lots_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      ipm_logs: {
        Row: {
          application_method: string | null
          batch_id: string | null
          concentration: string | null
          created_at: string
          id: string
          notes: string | null
          performed_by: string
          pest_disease_identified: string | null
          phi_days: number | null
          product_used: string
          rei_hours: number | null
          room_id: string
          treatment_date: string
          treatment_type: string
        }
        Insert: {
          application_method?: string | null
          batch_id?: string | null
          concentration?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          performed_by: string
          pest_disease_identified?: string | null
          phi_days?: number | null
          product_used: string
          rei_hours?: number | null
          room_id: string
          treatment_date?: string
          treatment_type: string
        }
        Update: {
          application_method?: string | null
          batch_id?: string | null
          concentration?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          performed_by?: string
          pest_disease_identified?: string | null
          phi_days?: number | null
          product_used?: string
          rei_hours?: number | null
          room_id?: string
          treatment_date?: string
          treatment_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "ipm_logs_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "plant_batches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ipm_logs_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      mother_plants: {
        Row: {
          age_weeks: number
          created_at: string
          created_by: string
          genetic_id: string
          health_status: string
          id: string
          is_active: boolean
          last_clone_date: string | null
          mother_number: string
          notes: string | null
          organization_id: string
          plant_tag: string
          retired_date: string | null
          room_id: string
          total_clones_taken: number
          updated_at: string
        }
        Insert: {
          age_weeks?: number
          created_at?: string
          created_by: string
          genetic_id: string
          health_status?: string
          id?: string
          is_active?: boolean
          last_clone_date?: string | null
          mother_number: string
          notes?: string | null
          organization_id: string
          plant_tag: string
          retired_date?: string | null
          room_id: string
          total_clones_taken?: number
          updated_at?: string
        }
        Update: {
          age_weeks?: number
          created_at?: string
          created_by?: string
          genetic_id?: string
          health_status?: string
          id?: string
          is_active?: boolean
          last_clone_date?: string | null
          mother_number?: string
          notes?: string | null
          organization_id?: string
          plant_tag?: string
          retired_date?: string | null
          room_id?: string
          total_clones_taken?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "mother_plants_genetic_id_fkey"
            columns: ["genetic_id"]
            isOneToOne: false
            referencedRelation: "genetics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mother_plants_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mother_plants_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          address: string | null
          created_at: string
          email: string | null
          id: string
          license_expiry: string
          license_number: string
          license_type: string
          metrc_api_key: string | null
          name: string
          phone: string | null
          state: string
          updated_at: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          email?: string | null
          id?: string
          license_expiry: string
          license_number: string
          license_type: string
          metrc_api_key?: string | null
          name: string
          phone?: string | null
          state: string
          updated_at?: string
        }
        Update: {
          address?: string | null
          created_at?: string
          email?: string | null
          id?: string
          license_expiry?: string
          license_number?: string
          license_type?: string
          metrc_api_key?: string | null
          name?: string
          phone?: string | null
          state?: string
          updated_at?: string
        }
        Relationships: []
      }
      plant_batches: {
        Row: {
          actual_harvest_date: string | null
          batch_number: string
          batch_type: string
          created_at: string
          created_by: string
          current_count: number
          current_room_id: string | null
          current_stage: Database["public"]["Enums"]["growth_stage"]
          expected_harvest_date: string | null
          facility_id: string
          genetic_id: string
          id: string
          initial_count: number
          notes: string | null
          organization_id: string
          source_mother_id: string | null
          start_date: string
          status: Database["public"]["Enums"]["batch_status"]
          updated_at: string
        }
        Insert: {
          actual_harvest_date?: string | null
          batch_number: string
          batch_type: string
          created_at?: string
          created_by: string
          current_count: number
          current_room_id?: string | null
          current_stage?: Database["public"]["Enums"]["growth_stage"]
          expected_harvest_date?: string | null
          facility_id: string
          genetic_id: string
          id?: string
          initial_count: number
          notes?: string | null
          organization_id: string
          source_mother_id?: string | null
          start_date: string
          status?: Database["public"]["Enums"]["batch_status"]
          updated_at?: string
        }
        Update: {
          actual_harvest_date?: string | null
          batch_number?: string
          batch_type?: string
          created_at?: string
          created_by?: string
          current_count?: number
          current_room_id?: string | null
          current_stage?: Database["public"]["Enums"]["growth_stage"]
          expected_harvest_date?: string | null
          facility_id?: string
          genetic_id?: string
          id?: string
          initial_count?: number
          notes?: string | null
          organization_id?: string
          source_mother_id?: string | null
          start_date?: string
          status?: Database["public"]["Enums"]["batch_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "plant_batches_current_room_id_fkey"
            columns: ["current_room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "plant_batches_facility_id_fkey"
            columns: ["facility_id"]
            isOneToOne: false
            referencedRelation: "facilities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "plant_batches_genetic_id_fkey"
            columns: ["genetic_id"]
            isOneToOne: false
            referencedRelation: "genetics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "plant_batches_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "plant_batches_source_mother_id_fkey"
            columns: ["source_mother_id"]
            isOneToOne: false
            referencedRelation: "mother_plants"
            referencedColumns: ["id"]
          },
        ]
      }
      plants: {
        Row: {
          batch_id: string
          created_at: string
          created_by: string
          current_room_id: string | null
          current_stage: Database["public"]["Enums"]["growth_stage"]
          health_score: number | null
          height_inches: number | null
          id: string
          notes: string | null
          plant_tag: string
          planted_date: string
          stage_changed_at: string
          status: Database["public"]["Enums"]["plant_status"]
          updated_at: string
        }
        Insert: {
          batch_id: string
          created_at?: string
          created_by: string
          current_room_id?: string | null
          current_stage: Database["public"]["Enums"]["growth_stage"]
          health_score?: number | null
          height_inches?: number | null
          id?: string
          notes?: string | null
          plant_tag: string
          planted_date: string
          stage_changed_at?: string
          status?: Database["public"]["Enums"]["plant_status"]
          updated_at?: string
        }
        Update: {
          batch_id?: string
          created_at?: string
          created_by?: string
          current_room_id?: string | null
          current_stage?: Database["public"]["Enums"]["growth_stage"]
          health_score?: number | null
          height_inches?: number | null
          id?: string
          notes?: string | null
          plant_tag?: string
          planted_date?: string
          stage_changed_at?: string
          status?: Database["public"]["Enums"]["plant_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "plants_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "plant_batches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "plants_current_room_id_fkey"
            columns: ["current_room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          employee_id: string | null
          full_name: string
          id: string
          is_active: boolean
          organization_id: string | null
          phone: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          employee_id?: string | null
          full_name: string
          id: string
          is_active?: boolean
          organization_id?: string | null
          phone?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          employee_id?: string | null
          full_name?: string
          id?: string
          is_active?: boolean
          organization_id?: string | null
          phone?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      rooms: {
        Row: {
          allowed_stages: Database["public"]["Enums"]["growth_stage"][]
          created_at: string
          current_plant_count: number
          facility_id: string
          id: string
          is_active: boolean
          light_schedule: string | null
          max_plant_capacity: number | null
          name: string
          room_type: string
          target_humidity: number | null
          target_temp_f: number | null
          target_vpd: number | null
          updated_at: string
        }
        Insert: {
          allowed_stages: Database["public"]["Enums"]["growth_stage"][]
          created_at?: string
          current_plant_count?: number
          facility_id: string
          id?: string
          is_active?: boolean
          light_schedule?: string | null
          max_plant_capacity?: number | null
          name: string
          room_type: string
          target_humidity?: number | null
          target_temp_f?: number | null
          target_vpd?: number | null
          updated_at?: string
        }
        Update: {
          allowed_stages?: Database["public"]["Enums"]["growth_stage"][]
          created_at?: string
          current_plant_count?: number
          facility_id?: string
          id?: string
          is_active?: boolean
          light_schedule?: string | null
          max_plant_capacity?: number | null
          name?: string
          room_type?: string
          target_humidity?: number | null
          target_temp_f?: number | null
          target_vpd?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "rooms_facility_id_fkey"
            columns: ["facility_id"]
            isOneToOne: false
            referencedRelation: "facilities"
            referencedColumns: ["id"]
          },
        ]
      }
      sop_templates: {
        Row: {
          applicable_stages:
            | Database["public"]["Enums"]["growth_stage"][]
            | null
          category: string
          created_at: string
          created_by: string
          description: string | null
          estimated_duration_minutes: number | null
          id: string
          is_active: boolean
          name: string
          organization_id: string
          required_inputs: Json | null
          steps: Json
          updated_at: string
        }
        Insert: {
          applicable_stages?:
            | Database["public"]["Enums"]["growth_stage"][]
            | null
          category: string
          created_at?: string
          created_by: string
          description?: string | null
          estimated_duration_minutes?: number | null
          id?: string
          is_active?: boolean
          name: string
          organization_id: string
          required_inputs?: Json | null
          steps?: Json
          updated_at?: string
        }
        Update: {
          applicable_stages?:
            | Database["public"]["Enums"]["growth_stage"][]
            | null
          category?: string
          created_at?: string
          created_by?: string
          description?: string | null
          estimated_duration_minutes?: number | null
          id?: string
          is_active?: boolean
          name?: string
          organization_id?: string
          required_inputs?: Json | null
          steps?: Json
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sop_templates_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      stage_transitions: {
        Row: {
          batch_id: string | null
          created_at: string
          from_room_id: string | null
          from_stage: Database["public"]["Enums"]["growth_stage"] | null
          id: string
          notes: string | null
          performed_by: string
          plant_id: string | null
          to_room_id: string | null
          to_stage: Database["public"]["Enums"]["growth_stage"]
          transition_date: string
        }
        Insert: {
          batch_id?: string | null
          created_at?: string
          from_room_id?: string | null
          from_stage?: Database["public"]["Enums"]["growth_stage"] | null
          id?: string
          notes?: string | null
          performed_by: string
          plant_id?: string | null
          to_room_id?: string | null
          to_stage: Database["public"]["Enums"]["growth_stage"]
          transition_date?: string
        }
        Update: {
          batch_id?: string | null
          created_at?: string
          from_room_id?: string | null
          from_stage?: Database["public"]["Enums"]["growth_stage"] | null
          id?: string
          notes?: string | null
          performed_by?: string
          plant_id?: string | null
          to_room_id?: string | null
          to_stage?: Database["public"]["Enums"]["growth_stage"]
          transition_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "stage_transitions_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "plant_batches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stage_transitions_from_room_id_fkey"
            columns: ["from_room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stage_transitions_plant_id_fkey"
            columns: ["plant_id"]
            isOneToOne: false
            referencedRelation: "plants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stage_transitions_to_room_id_fkey"
            columns: ["to_room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          assigned_role: Database["public"]["Enums"]["app_role"] | null
          assigned_to: string | null
          batch_id: string | null
          completed_at: string | null
          completion_data: Json | null
          created_at: string
          created_by: string
          description: string | null
          due_date: string | null
          facility_id: string
          id: string
          notes: string | null
          organization_id: string
          plant_id: string | null
          priority: Database["public"]["Enums"]["task_priority"]
          room_id: string | null
          sop_template_id: string | null
          started_at: string | null
          status: Database["public"]["Enums"]["task_status"]
          title: string
          updated_at: string
        }
        Insert: {
          assigned_role?: Database["public"]["Enums"]["app_role"] | null
          assigned_to?: string | null
          batch_id?: string | null
          completed_at?: string | null
          completion_data?: Json | null
          created_at?: string
          created_by: string
          description?: string | null
          due_date?: string | null
          facility_id: string
          id?: string
          notes?: string | null
          organization_id: string
          plant_id?: string | null
          priority?: Database["public"]["Enums"]["task_priority"]
          room_id?: string | null
          sop_template_id?: string | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["task_status"]
          title: string
          updated_at?: string
        }
        Update: {
          assigned_role?: Database["public"]["Enums"]["app_role"] | null
          assigned_to?: string | null
          batch_id?: string | null
          completed_at?: string | null
          completion_data?: Json | null
          created_at?: string
          created_by?: string
          description?: string | null
          due_date?: string | null
          facility_id?: string
          id?: string
          notes?: string | null
          organization_id?: string
          plant_id?: string | null
          priority?: Database["public"]["Enums"]["task_priority"]
          room_id?: string | null
          sop_template_id?: string | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["task_status"]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "plant_batches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_facility_id_fkey"
            columns: ["facility_id"]
            isOneToOne: false
            referencedRelation: "facilities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_plant_id_fkey"
            columns: ["plant_id"]
            isOneToOne: false
            referencedRelation: "plants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_sop_template_id_fkey"
            columns: ["sop_template_id"]
            isOneToOne: false
            referencedRelation: "sop_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          facility_id: string | null
          granted_at: string
          granted_by: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          facility_id?: string | null
          granted_at?: string
          granted_by?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          facility_id?: string | null
          granted_at?: string
          granted_by?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_facility_id_fkey"
            columns: ["facility_id"]
            isOneToOne: false
            referencedRelation: "facilities"
            referencedColumns: ["id"]
          },
        ]
      }
      waste_records: {
        Row: {
          created_at: string
          disposal_date: string | null
          disposal_method: string | null
          facility_id: string
          id: string
          notes: string | null
          organization_id: string
          photo_url: string | null
          reason: string
          recorded_by: string
          source_id: string | null
          source_type: string
          waste_date: string
          waste_type: Database["public"]["Enums"]["waste_type"]
          weight_lbs: number
          witness_id: string | null
        }
        Insert: {
          created_at?: string
          disposal_date?: string | null
          disposal_method?: string | null
          facility_id: string
          id?: string
          notes?: string | null
          organization_id: string
          photo_url?: string | null
          reason: string
          recorded_by: string
          source_id?: string | null
          source_type: string
          waste_date: string
          waste_type: Database["public"]["Enums"]["waste_type"]
          weight_lbs: number
          witness_id?: string | null
        }
        Update: {
          created_at?: string
          disposal_date?: string | null
          disposal_method?: string | null
          facility_id?: string
          id?: string
          notes?: string | null
          organization_id?: string
          photo_url?: string | null
          reason?: string
          recorded_by?: string
          source_id?: string | null
          source_type?: string
          waste_date?: string
          waste_type?: Database["public"]["Enums"]["waste_type"]
          weight_lbs?: number
          witness_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "waste_records_facility_id_fkey"
            columns: ["facility_id"]
            isOneToOne: false
            referencedRelation: "facilities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "waste_records_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_organization_id: { Args: { _user_id: string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      user_belongs_to_org: {
        Args: { _org_id: string; _user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role:
        | "admin"
        | "cultivation_manager"
        | "grower"
        | "harvester"
        | "qa_specialist"
        | "inventory_manager"
        | "viewer"
      batch_status: "active" | "completed" | "destroyed" | "on_hold"
      compliance_event_type:
        | "plant_created"
        | "plant_destroyed"
        | "plant_transferred"
        | "plant_stage_change"
        | "batch_created"
        | "batch_completed"
        | "batch_destroyed"
        | "harvest_started"
        | "harvest_completed"
        | "harvest_weight_recorded"
        | "inventory_created"
        | "inventory_adjusted"
        | "inventory_transferred"
        | "waste_recorded"
        | "room_transfer"
        | "qa_check"
        | "audit_performed"
      growth_stage:
        | "seed"
        | "germination"
        | "seedling"
        | "clone"
        | "vegetative"
        | "pre_flower"
        | "flowering"
        | "harvest"
        | "drying"
        | "curing"
        | "final"
        | "destroyed"
      inventory_type:
        | "flower"
        | "trim"
        | "shake"
        | "seeds"
        | "clones"
        | "mother_plants"
      plant_status:
        | "active"
        | "harvested"
        | "destroyed"
        | "transferred"
        | "quarantine"
      task_priority: "low" | "medium" | "high" | "critical"
      task_status:
        | "pending"
        | "in_progress"
        | "completed"
        | "skipped"
        | "overdue"
      waste_type:
        | "plant_material"
        | "stems"
        | "roots"
        | "leaves"
        | "trim"
        | "failed_product"
        | "contaminated"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: [
        "admin",
        "cultivation_manager",
        "grower",
        "harvester",
        "qa_specialist",
        "inventory_manager",
        "viewer",
      ],
      batch_status: ["active", "completed", "destroyed", "on_hold"],
      compliance_event_type: [
        "plant_created",
        "plant_destroyed",
        "plant_transferred",
        "plant_stage_change",
        "batch_created",
        "batch_completed",
        "batch_destroyed",
        "harvest_started",
        "harvest_completed",
        "harvest_weight_recorded",
        "inventory_created",
        "inventory_adjusted",
        "inventory_transferred",
        "waste_recorded",
        "room_transfer",
        "qa_check",
        "audit_performed",
      ],
      growth_stage: [
        "seed",
        "germination",
        "seedling",
        "clone",
        "vegetative",
        "pre_flower",
        "flowering",
        "harvest",
        "drying",
        "curing",
        "final",
        "destroyed",
      ],
      inventory_type: [
        "flower",
        "trim",
        "shake",
        "seeds",
        "clones",
        "mother_plants",
      ],
      plant_status: [
        "active",
        "harvested",
        "destroyed",
        "transferred",
        "quarantine",
      ],
      task_priority: ["low", "medium", "high", "critical"],
      task_status: [
        "pending",
        "in_progress",
        "completed",
        "skipped",
        "overdue",
      ],
      waste_type: [
        "plant_material",
        "stems",
        "roots",
        "leaves",
        "trim",
        "failed_product",
        "contaminated",
      ],
    },
  },
} as const
