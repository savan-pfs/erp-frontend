// Seed data for the cultivation management system
import { supabase } from "@/integrations/supabase/client";

export async function seedDatabase(userId: string, _organizationId?: string) {
  console.log("Starting database seed...");

  try {
    // 0. First, create or get organization
    let organizationId = _organizationId;

    // Check if user already has an organization via profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("organization_id")
      .eq("id", userId)
      .single();

    if (profile?.organization_id) {
      organizationId = profile.organization_id;
      console.log("✓ Using existing organization:", organizationId);
    } else {
      // Create new organization
      const { data: newOrg, error: orgError } = await supabase
        .from("organizations")
        .insert({
          name: "CannaCultivate Demo",
          license_number: "LIC-2024-DEMO-001",
          license_type: "cultivation",
          license_expiry: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
            .toISOString()
            .split("T")[0],
          state: "CO",
          address: "123 Green Valley Road, Denver, CO 80202",
          email: "demo@cannacultivate.com",
          phone: "(303) 555-0123",
        })
        .select()
        .single();

      if (orgError) {
        console.error("Organization error:", orgError);
        throw orgError;
      }

      organizationId = newOrg.id;
      console.log("✓ Organization created:", newOrg.name);

      // Update user profile with organization
      const { error: profileError } = await supabase
        .from("profiles")
        .update({ organization_id: organizationId })
        .eq("id", userId);

      if (profileError) {
        console.warn("Could not update profile:", profileError);
      }

      // Create admin role for user
      await supabase.from("user_roles").insert({
        user_id: userId,
        role: "admin",
      });
    }

    if (!organizationId) {
      throw new Error("Could not create or find organization");
    }

    // 1. Create Facility
    const { data: facility, error: facilityError } = await supabase
      .from("facilities")
      .insert({
        name: "Main Cultivation Facility",
        organization_id: organizationId,
        facility_type: "cultivation",
        license_number: "LIC-2024-001",
        address: "123 Green Valley Road, Denver, CO 80202",
        square_footage: 25000,
        max_plant_count: 2000,
        is_active: true,
      })
      .select()
      .single();

    if (facilityError) throw facilityError;
    console.log("✓ Facility created:", facility.name);

    // 2. Create Rooms
    const roomsData = [
      {
        name: "Clone Room",
        facility_id: facility.id,
        room_type: "clone",
        allowed_stages: ["clone", "seedling"] as any,
        max_plant_capacity: 500,
        current_plant_count: 200,
        target_temp_f: 78,
        target_humidity: 75,
        target_vpd: 0.8,
        light_schedule: "18/6",
      },
      {
        name: "Veg Room 1",
        facility_id: facility.id,
        room_type: "vegetative",
        allowed_stages: ["vegetative", "pre_flower"] as any,
        max_plant_capacity: 400,
        current_plant_count: 350,
        target_temp_f: 76,
        target_humidity: 60,
        target_vpd: 1.0,
        light_schedule: "18/6",
      },
      {
        name: "Veg Room 2",
        facility_id: facility.id,
        room_type: "vegetative",
        allowed_stages: ["vegetative", "pre_flower"] as any,
        max_plant_capacity: 400,
        current_plant_count: 280,
        target_temp_f: 76,
        target_humidity: 60,
        target_vpd: 1.0,
        light_schedule: "18/6",
      },
      {
        name: "Flower Room A",
        facility_id: facility.id,
        room_type: "flower",
        allowed_stages: ["flowering"] as any,
        max_plant_capacity: 350,
        current_plant_count: 300,
        target_temp_f: 75,
        target_humidity: 50,
        target_vpd: 1.2,
        light_schedule: "12/12",
      },
      {
        name: "Flower Room B",
        facility_id: facility.id,
        room_type: "flower",
        allowed_stages: ["flowering"] as any,
        max_plant_capacity: 350,
        current_plant_count: 280,
        target_temp_f: 75,
        target_humidity: 50,
        target_vpd: 1.2,
        light_schedule: "12/12",
      },
      {
        name: "Drying Room",
        facility_id: facility.id,
        room_type: "drying",
        allowed_stages: ["drying"] as any,
        max_plant_capacity: 200,
        current_plant_count: 50,
        target_temp_f: 65,
        target_humidity: 55,
        target_vpd: 0.9,
        light_schedule: "0/24",
      },
    ];

    const { data: rooms, error: roomsError } = await supabase
      .from("rooms")
      .insert(roomsData)
      .select();

    if (roomsError) throw roomsError;
    console.log("✓ Rooms created:", rooms.length);

    // 3. Create Genetics/Strains
    const geneticsData = [
      {
        name: "Blue Dream",
        organization_id: organizationId,
        strain_type: "hybrid",
        lineage: "Blueberry x Haze",
        thc_potential: 24,
        cbd_potential: 0.5,
        flowering_time_days: 65,
        avg_yield_per_plant_oz: 3.5,
        source: "clone",
        notes: "Popular sativa-dominant hybrid with balanced effects",
      },
      {
        name: "OG Kush",
        organization_id: organizationId,
        strain_type: "hybrid",
        lineage: "Chemdawg x Hindu Kush",
        thc_potential: 26,
        cbd_potential: 0.3,
        flowering_time_days: 60,
        avg_yield_per_plant_oz: 3.0,
        source: "clone",
        notes: "Classic strain with strong earthy aroma",
      },
      {
        name: "Gelato",
        organization_id: organizationId,
        strain_type: "hybrid",
        lineage: "Sunset Sherbet x Thin Mint GSC",
        thc_potential: 25,
        cbd_potential: 0.2,
        flowering_time_days: 58,
        avg_yield_per_plant_oz: 2.8,
        source: "clone",
        notes: "Sweet, dessert-like flavor profile",
      },
      {
        name: "Sour Diesel",
        organization_id: organizationId,
        strain_type: "sativa",
        lineage: "Chemdawg x Super Skunk",
        thc_potential: 22,
        cbd_potential: 0.4,
        flowering_time_days: 70,
        avg_yield_per_plant_oz: 3.2,
        source: "seed",
        notes: "Energizing sativa with pungent diesel aroma",
      },
      {
        name: "Granddaddy Purple",
        organization_id: organizationId,
        strain_type: "indica",
        lineage: "Purple Urkle x Big Bud",
        thc_potential: 23,
        cbd_potential: 0.1,
        flowering_time_days: 55,
        avg_yield_per_plant_oz: 3.0,
        source: "clone",
        notes: "Deep purple buds with grape and berry flavors",
      },
    ];

    const { data: genetics, error: geneticsError } = await supabase
      .from("genetics")
      .insert(geneticsData)
      .select();

    if (geneticsError) throw geneticsError;
    console.log("✓ Genetics created:", genetics.length);

    // 4. Create Plant Batches
    const today = new Date();
    const batchesData = [
      {
        batch_number: "B-2024-001",
        organization_id: organizationId,
        facility_id: facility.id,
        genetic_id: genetics[0].id, // Blue Dream
        batch_type: "clone",
        start_date: new Date(today.getTime() - 42 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split("T")[0],
        current_stage: "flowering" as any,
        current_room_id: rooms.find((r) => r.name === "Flower Room A")?.id,
        initial_count: 150,
        current_count: 148,
        status: "active" as any,
        expected_harvest_date: new Date(
          today.getTime() + 23 * 24 * 60 * 60 * 1000
        )
          .toISOString()
          .split("T")[0],
        created_by: userId,
      },
      {
        batch_number: "B-2024-002",
        organization_id: organizationId,
        facility_id: facility.id,
        genetic_id: genetics[1].id, // OG Kush
        batch_type: "clone",
        start_date: new Date(today.getTime() - 28 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split("T")[0],
        current_stage: "vegetative" as any,
        current_room_id: rooms.find((r) => r.name === "Veg Room 1")?.id,
        initial_count: 200,
        current_count: 198,
        status: "active" as any,
        expected_harvest_date: new Date(
          today.getTime() + 46 * 24 * 60 * 60 * 1000
        )
          .toISOString()
          .split("T")[0],
        created_by: userId,
      },
      {
        batch_number: "B-2024-003",
        organization_id: organizationId,
        facility_id: facility.id,
        genetic_id: genetics[2].id, // Gelato
        batch_type: "clone",
        start_date: new Date(today.getTime() - 14 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split("T")[0],
        current_stage: "clone" as any,
        current_room_id: rooms.find((r) => r.name === "Clone Room")?.id,
        initial_count: 100,
        current_count: 95,
        status: "active" as any,
        expected_harvest_date: new Date(
          today.getTime() + 72 * 24 * 60 * 60 * 1000
        )
          .toISOString()
          .split("T")[0],
        created_by: userId,
      },
      {
        batch_number: "B-2024-004",
        organization_id: organizationId,
        facility_id: facility.id,
        genetic_id: genetics[3].id, // Sour Diesel
        batch_type: "seed",
        start_date: new Date(today.getTime() - 56 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split("T")[0],
        current_stage: "flowering" as any,
        current_room_id: rooms.find((r) => r.name === "Flower Room B")?.id,
        initial_count: 120,
        current_count: 115,
        status: "active" as any,
        expected_harvest_date: new Date(
          today.getTime() + 14 * 24 * 60 * 60 * 1000
        )
          .toISOString()
          .split("T")[0],
        created_by: userId,
      },
    ];

    const { data: batches, error: batchesError } = await supabase
      .from("plant_batches")
      .insert(batchesData)
      .select();

    if (batchesError) throw batchesError;
    console.log("✓ Batches created:", batches.length);

    // 5. Create Individual Plants
    const plantsData: any[] = [];

    batches.forEach((batch, batchIndex) => {
      const plantCount = Math.min(batch.current_count, 10); // Create 10 plants per batch for demo
      for (let i = 1; i <= plantCount; i++) {
        plantsData.push({
          plant_tag: `PLT-${String(batchIndex + 1).padStart(3, "0")}-${String(
            i
          ).padStart(3, "0")}`,
          batch_id: batch.id,
          current_stage: batch.current_stage,
          current_room_id: batch.current_room_id,
          planted_date: batch.start_date,
          status: i === 4 && batchIndex === 0 ? "quarantine" : "active",
          health_score: Math.floor(Math.random() * 20) + 80,
          height_inches:
            batch.current_stage === "flowering"
              ? Math.floor(Math.random() * 20) + 40
              : batch.current_stage === "vegetative"
              ? Math.floor(Math.random() * 15) + 20
              : Math.floor(Math.random() * 10) + 5,
          created_by: userId,
        });
      }
    });

    const { data: plants, error: plantsError } = await supabase
      .from("plants")
      .insert(plantsData)
      .select();

    if (plantsError) throw plantsError;
    console.log("✓ Plants created:", plants.length);

    // 6. Create Environmental Logs
    const envLogsData: any[] = [];
    const envRooms = rooms.filter((r) => r.room_type !== "drying");

    for (let day = 0; day < 7; day++) {
      for (const room of envRooms) {
        envLogsData.push({
          room_id: room.id,
          recorded_by: userId,
          recorded_at: new Date(
            today.getTime() - day * 24 * 60 * 60 * 1000
          ).toISOString(),
          temperature_f: (room.target_temp_f || 75) + (Math.random() * 4 - 2),
          humidity_percent:
            (room.target_humidity || 60) + (Math.random() * 10 - 5),
          co2_ppm: 800 + Math.floor(Math.random() * 400),
          light_intensity_ppfd:
            room.room_type === "flower"
              ? 800 + Math.floor(Math.random() * 200)
              : 400 + Math.floor(Math.random() * 100),
          vpd: (room.target_vpd || 1.0) + (Math.random() * 0.3 - 0.15),
        });
      }
    }

    const { error: envLogsError } = await supabase
      .from("environmental_logs")
      .insert(envLogsData);

    if (envLogsError) throw envLogsError;
    console.log("✓ Environmental logs created:", envLogsData.length);

    // 7. Create Feeding Logs
    const feedingLogsData: any[] = [];

    for (let day = 0; day < 5; day++) {
      for (const batch of batches.slice(0, 2)) {
        feedingLogsData.push({
          room_id: batch.current_room_id,
          batch_id: batch.id,
          performed_by: userId,
          feed_date: new Date(today.getTime() - day * 24 * 60 * 60 * 1000)
            .toISOString()
            .split("T")[0],
          nutrient_solution: day % 2 === 0 ? "Veg A+B" : "Bloom A+B",
          ph_level: 6.0 + (Math.random() * 0.4 - 0.2),
          ec_ppm: 1200 + Math.floor(Math.random() * 400),
          water_volume_gallons: 50 + Math.floor(Math.random() * 30),
          runoff_ph: 6.2 + (Math.random() * 0.4 - 0.2),
          runoff_ec: 1400 + Math.floor(Math.random() * 300),
        });
      }
    }

    const { error: feedingLogsError } = await supabase
      .from("feeding_logs")
      .insert(feedingLogsData);

    if (feedingLogsError) throw feedingLogsError;
    console.log("✓ Feeding logs created:", feedingLogsData.length);

    // 8. Create IPM Logs
    const ipmLogsData = [
      {
        room_id: rooms.find((r) => r.name === "Flower Room A")?.id,
        batch_id: batches[0].id,
        performed_by: userId,
        treatment_date: new Date(today.getTime() - 3 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split("T")[0],
        treatment_type: "preventive",
        product_used: "Neem Oil",
        concentration: "1:100",
        application_method: "foliar_spray",
        phi_days: 7,
        rei_hours: 4,
        notes: "Routine preventive spray",
      },
      {
        room_id: rooms.find((r) => r.name === "Veg Room 1")?.id,
        batch_id: batches[1].id,
        performed_by: userId,
        treatment_date: new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split("T")[0],
        treatment_type: "treatment",
        product_used: "Pyrethrin",
        concentration: "1:200",
        application_method: "foliar_spray",
        pest_disease_identified: "Spider Mites",
        phi_days: 3,
        rei_hours: 12,
        notes: "Treated spider mite outbreak",
      },
    ];

    const { error: ipmLogsError } = await supabase
      .from("ipm_logs")
      .insert(ipmLogsData);

    if (ipmLogsError) throw ipmLogsError;
    console.log("✓ IPM logs created:", ipmLogsData.length);

    // 9. Create Tasks
    const tasksData = [
      {
        title: "Daily Environmental Check - Flower Room A",
        description: "Record temperature, humidity, CO2, and VPD readings",
        organization_id: organizationId,
        facility_id: facility.id,
        room_id: rooms.find((r) => r.name === "Flower Room A")?.id,
        batch_id: batches[0].id,
        due_date: today.toISOString().split("T")[0],
        priority: "high" as any,
        status: "pending" as any,
        created_by: userId,
      },
      {
        title: "Nutrient Feed - Veg Room 1",
        description: "Apply Veg A+B solution at 1200 PPM",
        organization_id: organizationId,
        facility_id: facility.id,
        room_id: rooms.find((r) => r.name === "Veg Room 1")?.id,
        batch_id: batches[1].id,
        due_date: today.toISOString().split("T")[0],
        priority: "medium" as any,
        status: "in_progress" as any,
        created_by: userId,
      },
      {
        title: "Defoliation - Flower Room B",
        description: "Remove lower fan leaves for better airflow",
        organization_id: organizationId,
        facility_id: facility.id,
        room_id: rooms.find((r) => r.name === "Flower Room B")?.id,
        batch_id: batches[3].id,
        due_date: new Date(today.getTime() + 2 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split("T")[0],
        priority: "medium" as any,
        status: "pending" as any,
        created_by: userId,
      },
      {
        title: "Clone Transplant",
        description: "Move rooted clones to Veg Room 2",
        organization_id: organizationId,
        facility_id: facility.id,
        room_id: rooms.find((r) => r.name === "Clone Room")?.id,
        batch_id: batches[2].id,
        due_date: new Date(today.getTime() + 5 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split("T")[0],
        priority: "high" as any,
        status: "pending" as any,
        created_by: userId,
      },
      {
        title: "Harvest Preparation - Batch B-2024-004",
        description: "Prepare drying room and harvest equipment",
        organization_id: organizationId,
        facility_id: facility.id,
        room_id: rooms.find((r) => r.name === "Flower Room B")?.id,
        batch_id: batches[3].id,
        due_date: new Date(today.getTime() + 12 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split("T")[0],
        priority: "critical" as any,
        status: "pending" as any,
        created_by: userId,
      },
    ];

    const { error: tasksError } = await supabase
      .from("tasks")
      .insert(tasksData);

    if (tasksError) throw tasksError;
    console.log("✓ Tasks created:", tasksData.length);

    // 10. Create Inventory Lots (from previous harvests)
    const inventoryData = [
      {
        lot_number: "INV-2024-001",
        organization_id: organizationId,
        genetic_id: genetics[4].id, // Granddaddy Purple
        inventory_type: "flower" as any,
        production_date: new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split("T")[0],
        initial_weight_lbs: 45.5,
        current_weight_lbs: 38.2,
        thc_percent: 23.5,
        cbd_percent: 0.12,
        moisture_percent: 12.5,
        qa_status: "approved",
        is_available: true,
        created_by: userId,
      },
      {
        lot_number: "INV-2024-002",
        organization_id: organizationId,
        genetic_id: genetics[0].id, // Blue Dream
        inventory_type: "flower" as any,
        production_date: new Date(today.getTime() - 45 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split("T")[0],
        initial_weight_lbs: 52.0,
        current_weight_lbs: 12.5,
        thc_percent: 24.2,
        cbd_percent: 0.45,
        moisture_percent: 11.8,
        qa_status: "approved",
        is_available: true,
        created_by: userId,
      },
      {
        lot_number: "INV-2024-003",
        organization_id: organizationId,
        genetic_id: genetics[1].id, // OG Kush
        inventory_type: "trim" as any,
        production_date: new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split("T")[0],
        initial_weight_lbs: 15.0,
        current_weight_lbs: 15.0,
        thc_percent: 12.5,
        cbd_percent: 0.3,
        moisture_percent: 13.0,
        qa_status: "pending",
        is_available: false,
        created_by: userId,
      },
    ];

    const { error: inventoryError } = await supabase
      .from("inventory_lots")
      .insert(inventoryData);

    if (inventoryError) throw inventoryError;
    console.log("✓ Inventory lots created:", inventoryData.length);

    console.log("\n✅ Database seeded successfully!");
    return { success: true };
  } catch (error) {
    console.error("❌ Error seeding database:", error);
    throw error;
  }
}

// Function to clear all seed data (for testing)
export async function clearSeedData(organizationId: string) {
  try {
    // Delete in reverse order of dependencies
    await supabase.from("tasks").delete().eq("organization_id", organizationId);
    await supabase.from("ipm_logs").delete().match({});
    await supabase.from("feeding_logs").delete().match({});
    await supabase.from("environmental_logs").delete().match({});
    await supabase.from("plants").delete().match({});
    await supabase
      .from("plant_batches")
      .delete()
      .eq("organization_id", organizationId);
    await supabase
      .from("inventory_lots")
      .delete()
      .eq("organization_id", organizationId);
    await supabase
      .from("genetics")
      .delete()
      .eq("organization_id", organizationId);
    await supabase.from("rooms").delete().match({});
    await supabase
      .from("facilities")
      .delete()
      .eq("organization_id", organizationId);

    console.log("✅ Seed data cleared successfully!");
    return { success: true };
  } catch (error) {
    console.error("❌ Error clearing seed data:", error);
    throw error;
  }
}
