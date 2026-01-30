// API hooks for static data store
import { staticData, getData, findById, findByField } from '@/lib/staticData';

// Re-export for convenience
export { getData, staticData };

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Helper to enrich data with relations
function enrichPlant(plant: any, data: any) {
  const batch = findById(data.plant_batches, plant.batch_id);
  const room = findById(data.rooms, plant.current_room_id);
  const genetic = batch ? findById(data.genetics, batch.genetic_id) : null;
  
  return {
    ...plant,
    batch: batch ? { ...batch, genetic } : null,
    room: room ? { ...room, facility: findById(data.facilities, room.facility_id) } : null,
  };
}

function enrichBatch(batch: any, data: any) {
  const genetic = findById(data.genetics, batch.genetic_id);
  const room = findById(data.rooms, batch.current_room_id);
  const facility = findById(data.facilities, batch.facility_id);
  const plants = findByField(data.plants, 'batch_id', batch.id);
  
  return {
    ...batch,
    genetic,
    room: room ? { ...room, facility } : null,
    facility,
    plants,
  };
}

function enrichRoom(room: any, data: any) {
  const facility = findById(data.facilities, room.facility_id);
  return {
    ...room,
    facility,
  };
}

function enrichFacility(facility: any, data: any) {
  const rooms = findByField(data.rooms, 'facility_id', facility.id);
  return {
    ...facility,
    rooms,
  };
}

function enrichTask(task: any, data: any) {
  const batch = task.batch_id ? findById(data.plant_batches, task.batch_id) : null;
  const room = task.room_id ? findById(data.rooms, task.room_id) : null;
  const facility = task.facility_id ? findById(data.facilities, task.facility_id) : null;
  
  return {
    ...task,
    batch,
    room,
    facility,
  };
}

function enrichEnvironmentalLog(log: any, data: any) {
  const room = findById(data.rooms, log.room_id);
  return {
    ...log,
    room,
  };
}

function enrichFeedingLog(log: any, data: any) {
  const room = log.room_id ? findById(data.rooms, log.room_id) : null;
  const batch = log.batch_id ? findById(data.plant_batches, log.batch_id) : null;
  return {
    ...log,
    room,
    batch,
  };
}

function enrichIpmLog(log: any, data: any) {
  const room = log.room_id ? findById(data.rooms, log.room_id) : null;
  const batch = log.batch_id ? findById(data.plant_batches, log.batch_id) : null;
  return {
    ...log,
    room,
    batch,
  };
}

function enrichHarvestBatch(harvest: any, data: any) {
  const batch = findById(data.plant_batches, harvest.plant_batch_id);
  const genetic = batch ? findById(data.genetics, batch.genetic_id) : null;
  return {
    ...harvest,
    plant_batch: batch ? { ...batch, genetic } : null,
  };
}

function enrichInventoryLot(lot: any, data: any) {
  const genetic = findById(data.genetics, lot.genetic_id);
  const room = lot.room_id ? findById(data.rooms, lot.room_id) : null;
  return {
    ...lot,
    genetic,
    room,
  };
}

// ============ PLANTS API ============
export const plantsApi = {
  async getAll() {
    const data = getData();
    return data.plants
      .map(plant => enrichPlant(plant, data))
      .sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
  },

  async getById(id: string) {
    const data = getData();
    const plant = findById(data.plants, id);
    if (!plant) throw new Error('Plant not found');
    return enrichPlant(plant, data);
  },

  async create(plant: any) {
    const data = getData();
    const newPlant = {
      ...plant,
      id: plant.id || generateId(),
      created_at: plant.created_at || new Date().toISOString(),
    };
    data.plants.push(newPlant);
    staticData.set(data);
    return enrichPlant(newPlant, data);
  },

  async update(id: string, updates: any) {
    const data = getData();
    const index = data.plants.findIndex(p => p.id === id);
    if (index === -1) throw new Error('Plant not found');
    data.plants[index] = { ...data.plants[index], ...updates };
    staticData.set(data);
    return enrichPlant(data.plants[index], data);
  },

  async delete(id: string) {
    const data = getData();
    const index = data.plants.findIndex(p => p.id === id);
    if (index === -1) throw new Error('Plant not found');
    data.plants.splice(index, 1);
    staticData.set(data);
  },
};

// ============ BATCHES API ============
export const batchesApi = {
  async getAll() {
    const data = getData();
    return data.plant_batches
      .map(batch => enrichBatch(batch, data))
      .sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
  },

  async getById(id: string) {
    const data = getData();
    const batch = findById(data.plant_batches, id);
    if (!batch) throw new Error('Batch not found');
    return enrichBatch(batch, data);
  },

  async create(batch: any) {
    const data = getData();
    const newBatch = {
      ...batch,
      id: batch.id || generateId(),
      created_at: batch.created_at || new Date().toISOString(),
    };
    data.plant_batches.push(newBatch);
    staticData.set(data);
    return enrichBatch(newBatch, data);
  },

  async update(id: string, updates: any) {
    const data = getData();
    const index = data.plant_batches.findIndex(b => b.id === id);
    if (index === -1) throw new Error('Batch not found');
    data.plant_batches[index] = { ...data.plant_batches[index], ...updates };
    staticData.set(data);
    return enrichBatch(data.plant_batches[index], data);
  },
};

// ============ ROOMS API ============
export const roomsApi = {
  async getAll() {
    const data = getData();
    return data.rooms
      .map(room => enrichRoom(room, data))
      .sort((a, b) => (a.name || '').localeCompare(b.name || ''));
  },

  async getById(id: string) {
    const data = getData();
    const room = findById(data.rooms, id);
    if (!room) throw new Error('Room not found');
    return enrichRoom(room, data);
  },

  async create(room: any) {
    const data = getData();
    const newRoom = {
      ...room,
      id: room.id || generateId(),
      created_at: room.created_at || new Date().toISOString(),
    };
    data.rooms.push(newRoom);
    staticData.set(data);
    return enrichRoom(newRoom, data);
  },

  async update(id: string, updates: any) {
    const data = getData();
    const index = data.rooms.findIndex(r => r.id === id);
    if (index === -1) throw new Error('Room not found');
    data.rooms[index] = { ...data.rooms[index], ...updates };
    staticData.set(data);
    return enrichRoom(data.rooms[index], data);
  },
};

// ============ FACILITIES API ============
// Facilities API removed - no facility logic
export const facilitiesApi_DEPRECATED = {
  async getAll() {
    const data = getData();
    return data.facilities
      .map(facility => enrichFacility(facility, data))
      .sort((a, b) => (a.name || '').localeCompare(b.name || ''));
  },

  async getById(id: string) {
    const data = getData();
    const facility = findById(data.facilities, id);
    if (!facility) throw new Error('Facility not found');
    return enrichFacility(facility, data);
  },

  async create(facility: any) {
    const data = getData();
    const newFacility = {
      ...facility,
      id: facility.id || generateId(),
      created_at: facility.created_at || new Date().toISOString(),
    };
    data.facilities.push(newFacility);
    staticData.set(data);
    return enrichFacility(newFacility, data);
  },
};

// ============ GENETICS API ============
export const geneticsApi = {
  async getAll() {
    const data = getData();
    return data.genetics.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
  },

  async create(genetic: any) {
    const data = getData();
    const newGenetic = {
      ...genetic,
      id: genetic.id || generateId(),
      created_at: genetic.created_at || new Date().toISOString(),
    };
    data.genetics.push(newGenetic);
    staticData.set(data);
    return newGenetic;
  },
};

// ============ TASKS API ============
export const tasksApi = {
  async getAll() {
    const data = getData();
    return data.tasks
      .map(task => enrichTask(task, data))
      .sort((a, b) => {
        const dateA = a.due_date ? new Date(a.due_date).getTime() : 0;
        const dateB = b.due_date ? new Date(b.due_date).getTime() : 0;
        return dateA - dateB;
      });
  },

  async create(task: any) {
    const data = getData();
    const newTask = {
      ...task,
      id: task.id || generateId(),
      created_at: task.created_at || new Date().toISOString(),
    };
    data.tasks.push(newTask);
    staticData.set(data);
    return enrichTask(newTask, data);
  },

  async update(id: string, updates: any) {
    const data = getData();
    const index = data.tasks.findIndex(t => t.id === id);
    if (index === -1) throw new Error('Task not found');
    data.tasks[index] = { ...data.tasks[index], ...updates };
    staticData.set(data);
    return enrichTask(data.tasks[index], data);
  },
};

// ============ ENVIRONMENTAL LOGS API ============
export const environmentalLogsApi = {
  async getAll(roomId?: string) {
    const data = getData();
    let logs = data.environmental_logs.map(log => enrichEnvironmentalLog(log, data));
    
    if (roomId) {
      logs = logs.filter(log => log.room_id === roomId);
    }
    
    return logs.sort((a, b) => {
      const dateA = a.recorded_at ? new Date(a.recorded_at).getTime() : 0;
      const dateB = b.recorded_at ? new Date(b.recorded_at).getTime() : 0;
      return dateB - dateA;
    });
  },

  async create(log: any) {
    const data = getData();
    const newLog = {
      ...log,
      id: log.id || generateId(),
      recorded_at: log.recorded_at || new Date().toISOString(),
    };
    data.environmental_logs.push(newLog);
    staticData.set(data);
    return enrichEnvironmentalLog(newLog, data);
  },
};

// ============ FEEDING LOGS API ============
export const feedingLogsApi = {
  async getAll() {
    const data = getData();
    return data.feeding_logs
      .map(log => enrichFeedingLog(log, data))
      .sort((a, b) => {
        const dateA = a.feed_date ? new Date(a.feed_date).getTime() : 0;
        const dateB = b.feed_date ? new Date(b.feed_date).getTime() : 0;
        return dateB - dateA;
      });
  },

  async create(log: any) {
    const data = getData();
    const newLog = {
      ...log,
      id: log.id || generateId(),
      feed_date: log.feed_date || new Date().toISOString().split('T')[0],
    };
    data.feeding_logs.push(newLog);
    staticData.set(data);
    return enrichFeedingLog(newLog, data);
  },
};

// ============ IPM LOGS API ============
export const ipmLogsApi = {
  async getAll() {
    const data = getData();
    return data.ipm_logs
      .map(log => enrichIpmLog(log, data))
      .sort((a, b) => {
        const dateA = a.treatment_date ? new Date(a.treatment_date).getTime() : 0;
        const dateB = b.treatment_date ? new Date(b.treatment_date).getTime() : 0;
        return dateB - dateA;
      });
  },

  async create(log: any) {
    const data = getData();
    const newLog = {
      ...log,
      id: log.id || generateId(),
      treatment_date: log.treatment_date || new Date().toISOString().split('T')[0],
    };
    data.ipm_logs.push(newLog);
    staticData.set(data);
    return enrichIpmLog(newLog, data);
  },
};

// ============ HARVEST BATCHES API ============
export const harvestBatchesApi = {
  async getAll() {
    const data = getData();
    return data.harvest_batches
      .map(harvest => enrichHarvestBatch(harvest, data))
      .sort((a, b) => {
        const dateA = a.harvest_date ? new Date(a.harvest_date).getTime() : 0;
        const dateB = b.harvest_date ? new Date(b.harvest_date).getTime() : 0;
        return dateB - dateA;
      });
  },

  async create(harvest: any) {
    const data = getData();
    const newHarvest = {
      ...harvest,
      id: harvest.id || generateId(),
      harvest_date: harvest.harvest_date || new Date().toISOString().split('T')[0],
    };
    data.harvest_batches.push(newHarvest);
    staticData.set(data);
    return enrichHarvestBatch(newHarvest, data);
  },
};

// ============ INVENTORY API ============
export const inventoryApi = {
  async getAll() {
    const data = getData();
    return data.inventory_lots
      .map(lot => enrichInventoryLot(lot, data))
      .sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
  },

  async create(lot: any) {
    const data = getData();
    const newLot = {
      ...lot,
      id: lot.id || generateId(),
      created_at: lot.created_at || new Date().toISOString(),
    };
    data.inventory_lots.push(newLot);
    staticData.set(data);
    return enrichInventoryLot(newLot, data);
  },

  async update(id: string, updates: any) {
    const data = getData();
    const index = data.inventory_lots.findIndex(l => l.id === id);
    if (index === -1) throw new Error('Inventory lot not found');
    data.inventory_lots[index] = { ...data.inventory_lots[index], ...updates };
    staticData.set(data);
    return enrichInventoryLot(data.inventory_lots[index], data);
  },
};

// ============ DASHBOARD STATS API ============
export const dashboardApi = {
  async getStats() {
    const data = getData();
    
    const activePlants = data.plants.filter(p => p.status === 'active').length;
    const activeBatches = data.plant_batches.filter(b => b.status === 'active').length;
    const activeRooms = data.rooms.filter(r => (r.current_plant_count || 0) > 0).length;
    const pendingTasks = data.tasks.filter(t => t.status === 'pending').length;
    const completedTasks = data.tasks.filter(t => t.status === 'completed').length;
    const inventoryLots = data.inventory_lots.filter(i => i.is_available).length;

    // Calculate capacity
    const totalCapacity = data.rooms.reduce((sum, r) => sum + (r.max_plant_capacity || 0), 0);
    const usedCapacity = data.rooms.reduce((sum, r) => sum + (r.current_plant_count || 0), 0);
    const capacityPercent = totalCapacity > 0 ? Math.round((usedCapacity / totalCapacity) * 100) : 0;

    return {
      totalPlants: activePlants,
      activeBatches,
      activeRooms,
      inventoryLots,
      pendingTasks,
      completedToday: completedTasks,
      capacityPercent,
      complianceScore: 98,
    };
  },
};
