// Real API client for backend integration
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3004/api';

class ApiClient {
  private baseURL: string;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  async request<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;

    // Don't set Content-Type for FormData - browser will set it with boundary
    const isFormData = options.body instanceof FormData;
    const config: RequestInit = {
      headers: isFormData
        ? { ...options.headers }
        : {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      ...options,
    };

    // Add auth token if available
    const token = localStorage.getItem('authToken');
    const currentOrg = localStorage.getItem('current_organization');

    if (token) {
      config.headers = {
        ...config.headers,
        Authorization: `Bearer ${token}`,
      };
    }

    // Add Organization Context if available (for Multi-tenancy)
    if (currentOrg) {
      try {
        const orgData = JSON.parse(currentOrg);
        if (orgData && orgData.id) {
          config.headers = {
            ...config.headers,
            'x-organization-id': orgData.id.toString()
          };
        }
      } catch (e) {
        // Ignore parse error
      }
    }

    const response = await fetch(url, config);

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Network error' }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    return response.json();
  }

  // Generic CRUD methods
  async get<T = any>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint);
  }

  async post<T = any>(endpoint: string, data: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async put<T = any>(endpoint: string, data: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async delete<T = any>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'DELETE',
    });
  }
}

const apiClient = new ApiClient(API_BASE_URL);

// Helper to build query string
const buildQueryString = (params?: Record<string, any>): string => {
  if (!params) return '';
  const filtered = Object.entries(params).filter(([_, v]) => v !== undefined && v !== null && v !== '');
  if (filtered.length === 0) return '';
  return `?${new URLSearchParams(filtered.map(([k, v]) => [k, String(v)]))}`;
};

// ============ AUTH API ============
export const authApi = {
  async login(email: string, password: string) {
    return apiClient.post('/auth/login', { email, password });
  },

  async register(userData: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone?: string;
    role?: string;
    organizationId?: number;
  }) {
    return apiClient.post('/auth/register', userData);
  },

  async registerOrgAdmin(userData: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone?: string;
    organizationName: string;
    legalName?: string;
    taxId?: string;
    locationStateCode?: string;
    locationCountryCode?: string;
    description?: string;
  }) {
    return apiClient.post('/auth/register-org-admin', userData);
  },

  async verify() {
    return apiClient.get('/auth/verify');
  },
};

// ============ DASHBOARD API ============
export const dashboardApi = {
  async getStats() {
    return apiClient.get('/dashboard/stats');
  },

  async getActivities(limit?: number) {
    const queryString = limit ? `?limit=${limit}` : '';
    return apiClient.get(`/dashboard/activities${queryString}`);
  },

  async getAlerts() {
    return apiClient.get('/dashboard/alerts');
  },
};

// ============ PLANTS API ============
export const plantsApi = {
  async getAll(params?: {
    batchId?: string;
    geneticId?: string;
    roomId?: string;
    growthStage?: string;
    healthStatus?: string;
    isActive?: string;
  }) {
    const queryString = buildQueryString(params);
    return apiClient.get(`/plants${queryString}`);
  },

  async getById(id: string | number) {
    return apiClient.get(`/plants/${id}`);
  },

  async create(data: {
    batchId?: number;
    geneticId?: number;
    roomId: number; // Required now
    plantName?: string;
    plantNumber: number;
    growthStage?: string;
    healthStatus?: string;
    gender?: string;
    plantingDate?: string;
    germinationDate?: string;
    height?: number;
    potSize?: number;
    medium?: string;
    notes?: string;
  }) {
    return apiClient.post('/plants', data);
  },

  async update(id: string | number, data: Partial<{
    batchId: number;
    geneticId: number;
    roomId: number;
    plantName: string;
    plantNumber: number;
    growthStage: string;
    healthStatus: string;
    gender: string;
    plantingDate: string;
    germinationDate: string;
    vegetativeStartDate: string;
    floweringStartDate: string;
    harvestDate: string;
    expectedHarvestDate: string;
    height: number;
    canopyWidth: number;
    potSize: number;
    medium: string;
    trainingMethod: string;
    feedingSchedule: string;
    lastWatered: string;
    lastFed: string;
    lastTransplantDate: string;
    transplantCount: number;
    trichomeStatus: string;
    aromaIntensity: string;
    pestIssues: string;
    diseaseIssues: string;
    notes: string;
    isActive: boolean;
  }>) {
    return apiClient.put(`/plants/${id}`, data);
  },

  async delete(id: string | number) {
    return apiClient.delete(`/plants/${id}`);
  },

  // Cultivation endpoints
  async changeStage(id: string | number, growthStage: string, stageDate?: string) {
    return apiClient.post(`/plants/${id}/stage`, { growthStage, stageDate });
  },

  async move(id: string | number, roomId: string | number) {
    return apiClient.post(`/plants/${id}/move`, { roomId });
  },

  async water(id: string | number, waterDate?: string) {
    return apiClient.post(`/plants/${id}/water`, { waterDate });
  },

  async feed(id: string | number, feedDate?: string, feedingSchedule?: string) {
    return apiClient.post(`/plants/${id}/feed`, { feedDate, feedingSchedule });
  },

  async transplant(id: string | number, transplantDate?: string, potSize?: number, medium?: string) {
    return apiClient.post(`/plants/${id}/transplant`, { transplantDate, potSize, medium });
  },
};

// ============ BATCHES API ============
export const batchesApi = {
  async getAll(params?: {
    geneticId?: string;
    motherId?: string;
    batchType?: string;
    isActive?: string;
  }) {
    const queryString = buildQueryString(params);
    return apiClient.get(`/batches${queryString}`);
  },

  async getById(id: string | number) {
    return apiClient.get(`/batches/${id}`);
  },

  async create(data: {
    batchName: string;
    batchType?: string;
    geneticId?: number;
    motherId?: number;
    roomId?: number;
    sourceSupplier?: string;
    sourceDate?: string;
    totalSeeds?: number;
    totalClones?: number;
    germinationRate?: number;
    successRate?: number;
    purchasePrice?: number;
    purchaseCurrency?: string;
    storageLocation?: string;
    storageConditions?: string;
    notes?: string;
  }) {
    return apiClient.post('/batches', data);
  },

  async update(id: string | number, data: Partial<{
    batchName: string;
    batchType: string;
    geneticId: number;
    motherId: number;
    roomId: number;
    sourceSupplier: string;
    sourceDate: string;
    totalSeeds: number;
    totalClones: number;
    germinationRate: number;
    successRate: number;
    purchasePrice: number;
    purchaseCurrency: string;
    storageLocation: string;
    storageConditions: string;
    notes: string;
    isActive: boolean;
  }>) {
    return apiClient.put(`/batches/${id}`, data);
  },

  async delete(id: string | number) {
    return apiClient.delete(`/batches/${id}`);
  },

  // Cultivation endpoints
  async germinate(id: string | number, seedCount: number, roomId?: string | number, germinationDate?: string) {
    return apiClient.post(`/batches/${id}/germinate`, { seedCount, roomId, germinationDate });
  },

  async move(id: string | number, roomId: string | number) {
    return apiClient.post(`/batches/${id}/move`, { roomId });
  },
};

// ============ MOTHERS API ============
export const mothersApi = {
  async getAll(params?: {
    geneticId?: string;
    roomId?: string;
    isActive?: string;
  }) {
    const queryString = buildQueryString(params);
    return apiClient.get(`/mothers${queryString}`);
  },

  async getById(id: string | number) {
    return apiClient.get(`/mothers/${id}`);
  },

  async create(data: {
    motherName: string;
    geneticId?: number;
    roomId?: number;
    cloneCount?: number;
    ageDays?: number;
    healthStatus?: string;
    lastCloneDate?: string;
    nextCloneDate?: string;
    floweringCompatible?: boolean;
    notes?: string;
  }) {
    return apiClient.post('/mothers', data);
  },

  async update(id: string | number, data: Partial<{
    motherName: string;
    geneticId: number;
    roomId: number;
    cloneCount: number;
    ageDays: number;
    healthStatus: string;
    lastCloneDate: string;
    nextCloneDate: string;
    floweringCompatible: boolean;
    notes: string;
    isActive: boolean;
  }>) {
    return apiClient.put(`/mothers/${id}`, data);
  },

  async delete(id: string | number) {
    return apiClient.delete(`/mothers/${id}`);
  },

  // Cultivation endpoint
  async clone(id: string | number, cloneCount: number, batchName?: string, roomId?: string | number) {
    return apiClient.post(`/mothers/${id}/clone`, { cloneCount, batchName, roomId });
  },
};

// ============ ROOMS API ============
export const roomsApi = {
  async getAll(params?: {
    roomType?: string;
    isActive?: string;
  }) {
    const queryString = buildQueryString(params);
    return apiClient.get(`/rooms${queryString}`);
  },

  async getById(id: string | number) {
    return apiClient.get(`/rooms/${id}`);
  },

  async create(data: {
    name: string;
    description?: string;
    roomType?: string;
    capacity?: number;
    dimensions?: { length?: number; width?: number; height?: number };
    temperature?: { min?: number; max?: number };
    humidity?: { min?: number; max?: number };
    lightingType?: string;
    ventilationSystem?: boolean;
    co2System?: boolean;
  }) {
    return apiClient.post('/rooms', data);
  },

  async update(id: string | number, data: Partial<{
    name: string;
    description: string;
    roomType: string;
    capacity: number;
    dimensions: { length?: number; width?: number; height?: number };
    temperature: { min?: number; max?: number };
    humidity: { min?: number; max?: number };
    lightingType: string;
    ventilationSystem: boolean;
    co2System: boolean;
    isActive: boolean;
  }>) {
    return apiClient.put(`/rooms/${id}`, data);
  },

  async delete(id: string | number) {
    return apiClient.delete(`/rooms/${id}`);
  },

  // Cultivation endpoints
  async getPlants(id: string | number) {
    return apiClient.get(`/rooms/${id}/plants`);
  },

  async movePlants(id: string | number, plantIds: (string | number)[]) {
    return apiClient.post(`/rooms/${id}/move-plants`, { plantIds });
  },

  async getEnvironment(id: string | number) {
    return apiClient.get(`/rooms/${id}/environment`);
  },
};

// ============ GENETICS API ============
export const geneticsApi = {
  async getAll(params?: {
    strainName?: string;
    isActive?: string;
  }) {
    const queryString = buildQueryString(params);
    return apiClient.get(`/genetics${queryString}`);
  },

  async getById(id: string | number) {
    return apiClient.get(`/genetics/${id}`);
  },

  async create(data: {
    strainName: string;
    breeder?: string;
    geneticLineage?: string;
    percentages?: { indica?: number; sativa?: number; ruderalis?: number };
    cannabinoids?: { thc?: number; cbd?: number };
    timing?: { flowering?: number; harvest?: number };
    difficulty?: string;
    yield?: { indoor?: number; outdoor?: number };
    height?: {
      indoor?: { min?: number; max?: number };
      outdoor?: { min?: number; max?: number };
    };
    climatePreference?: string;
    aromaProfile?: string;
    effects?: string;
    medicalUses?: string;
    growthNotes?: string;
  }) {
    return apiClient.post('/genetics', data);
  },

  async update(id: string | number, data: Partial<{
    strainName: string;
    breeder: string;
    geneticLineage: string;
    percentages: { indica?: number; sativa?: number; ruderalis?: number };
    cannabinoids: { thc?: number; cbd?: number };
    timing: { flowering?: number; harvest?: number };
    difficulty: string;
    yield: { indoor?: number; outdoor?: number };
    height: {
      indoor?: { min?: number; max?: number };
      outdoor?: { min?: number; max?: number };
    };
    climatePreference: string;
    aromaProfile: string;
    effects: string;
    medicalUses: string;
    growthNotes: string;
  }>) {
    return apiClient.put(`/genetics/${id}`, data);
  },

  async delete(id: string | number) {
    return apiClient.delete(`/genetics/${id}`);
  },

  // Cultivation endpoints
  async getPlants(id: string | number) {
    return apiClient.get(`/genetics/${id}/plants`);
  },

  async getBatches(id: string | number) {
    return apiClient.get(`/genetics/${id}/batches`);
  },

  async getMothers(id: string | number) {
    return apiClient.get(`/genetics/${id}/mothers`);
  },

  async getSummary(id: string | number) {
    return apiClient.get(`/genetics/${id}/summary`);
  },
};

// ============ TASKS API ============
export const tasksApi = {
  async getAll(params?: {
    status?: string;
    priority?: string;
    assignedTo?: string;
    roomId?: string;
    batchId?: string;
  }) {
    const queryString = buildQueryString(params);
    return apiClient.get(`/tasks${queryString}`);
  },

  async create(data: {
    title: string;
    description?: string;
    taskType?: string;
    priority?: string;
    status?: string;
    assignedTo?: number;
    relatedEntityType?: string;
    relatedEntityId?: number;
    roomId?: number;
    batchId?: number;
    dueDate?: string;
  }) {
    return apiClient.post('/tasks', data);
  },

  async update(id: string | number, data: Partial<{
    title: string;
    description: string;
    status: string;
    priority: string;
    assignedTo: number;
    dueDate: string;
  }>) {
    return apiClient.put(`/tasks/${id}`, data);
  },

  async delete(id: string | number) {
    return apiClient.delete(`/tasks/${id}`);
  },
};

// ============ CALENDAR API ============
export const calendarApi = {
  async getAll(params?: {
    startDate?: string;
    endDate?: string;
    eventType?: string;
    status?: string;
    roomId?: string;
    batchId?: string;
  }) {
    const queryString = buildQueryString(params);
    return apiClient.get(`/calendar${queryString}`);
  },

  async getById(id: string | number) {
    return apiClient.get(`/calendar/${id}`);
  },

  async create(data: {
    title: string;
    description?: string;
    eventType?: string;
    relatedEntityType?: string;
    relatedEntityId?: number;
    roomId?: number;
    batchId?: number;
    startDate: string;
    endDate?: string;
    allDay?: boolean;
    recurring?: boolean;
    recurrencePattern?: string;
    color?: string;
    priority?: string;
    status?: string;
    reminderMinutes?: number;
    attendees?: string;
  }) {
    return apiClient.post('/calendar', data);
  },

  async update(id: string | number, data: Partial<{
    title: string;
    description: string;
    eventType?: string;
    startDate: string;
    endDate?: string;
    status?: string;
    priority?: string;
    reminderMinutes?: number;
    attendees?: string;
    roomId?: number;
    batchId?: number;
  }>) {
    return apiClient.put(`/calendar/${id}`, data);
  },

  async delete(id: string | number) {
    return apiClient.delete(`/calendar/${id}`);
  },
};

// ============ ENVIRONMENTAL LOGS API ============
export const environmentalLogsApi = {
  async getAll(roomId?: string, startDate?: string, endDate?: string) {
    const params: Record<string, string> = {};
    if (roomId) params.roomId = roomId;
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    const queryString = buildQueryString(params);
    return apiClient.get(`/environmental-logs${queryString}`);
  },

  async create(data: {
    roomId: number;
    temperature?: number;
    humidity?: number;
    vpd?: number;
    co2Level?: number;
    lightIntensity?: number;
    airCirculation?: string;
    notes?: string;
    recordedAt?: string;
  }) {
    return apiClient.post('/environmental-logs', data);
  },

  async getLatest(roomId: string | number) {
    return apiClient.get(`/environmental-logs/latest/${roomId}`);
  },

  async delete(id: string | number) {
    return apiClient.delete(`/environmental-logs/${id}`);
  },
};

// ============ FEEDING LOGS API ============
export const feedingLogsApi = {
  async getAll(params?: {
    roomId?: string;
    batchId?: string;
    plantId?: string;
    feedingType?: string;
  }) {
    const queryString = buildQueryString(params);
    return apiClient.get(`/feeding-logs${queryString}`);
  },

  async create(data: {
    roomId?: number;
    batchId?: number;
    plantId?: number;
    feedingType?: string;
    nutrientName?: string;
    nutrientBrand?: string;
    ecLevel?: number;
    phLevel?: number;
    ppm?: number;
    volume?: number;
    volumeUnit?: string;
    feedingSchedule?: string;
    notes?: string;
    fedAt?: string;
  }) {
    return apiClient.post('/feeding-logs', data);
  },
};

// ============ IPM LOGS API ============
export const ipmLogsApi = {
  async getAll(params?: {
    roomId?: string;
    batchId?: string;
    plantId?: string;
    issueType?: string;
    severity?: string;
  }) {
    const queryString = buildQueryString(params);
    return apiClient.get(`/ipm-logs${queryString}`);
  },

  async create(data: {
    roomId?: number;
    batchId?: number;
    plantId?: number;
    issueType?: string;
    pestName?: string;
    severity?: string;
    treatmentMethod?: string;
    productUsed?: string;
    productConcentration?: string;
    applicationMethod?: string;
    affectedArea?: string;
    treatmentResult?: string;
    followUpRequired?: boolean;
    followUpDate?: string;
    notes?: string;
    images?: string;
    detectedAt?: string;
    treatedAt?: string;
  }) {
    return apiClient.post('/ipm-logs', data);
  },

  async update(id: string | number, updates: {
    roomId?: number;
    batchId?: number;
    plantId?: number;
    issueType?: string;
    pestName?: string;
    severity?: string;
    treatmentMethod?: string;
    productUsed?: string;
    productConcentration?: string;
    applicationMethod?: string;
    affectedArea?: string;
    treatmentResult?: string;
    followUpRequired?: boolean;
    followUpDate?: string;
    notes?: string;
    images?: string;
    detectedAt?: string;
    treatedAt?: string;
  }) {
    return apiClient.put(`/ipm-logs/${id}`, updates);
  },

  async delete(id: string | number) {
    return apiClient.delete(`/ipm-logs/${id}`);
  },
};

// ============ HARVEST BATCHES API ============
export const harvestBatchesApi = {
  async getAll(params?: {
    status?: string;
    batchId?: string;
    roomId?: string;
  }) {
    const queryString = buildQueryString(params);
    return apiClient.get(`/harvest${queryString}`);
  },

  async getById(id: string | number) {
    return apiClient.get(`/harvest/${id}`);
  },

  async create(data: {
    batchId?: number;
    roomId?: number;
    harvestName: string;
    harvestDate: string;
    plantCount?: number;
    wetWeight?: number;
    dryWeight?: number;
    weightUnit?: string;
    trimWeight?: number;
    wasteWeight?: number;
    dryingMethod?: string;
    dryingStartDate?: string;
    dryingEndDate?: string;
    curingStartDate?: string;
    curingEndDate?: string;
    storageLocation?: string;
    qualityGrade?: string;
    thcPercentage?: number;
    cbdPercentage?: number;
    terpeneProfile?: string;
    notes?: string;
    status?: string;
  }) {
    return apiClient.post('/harvest', data);
  },

  async update(id: string | number, data: Partial<{
    dryWeight: number;
    trimWeight: number;
    wasteWeight: number;
    dryingEndDate: string;
    curingStartDate: string;
    curingEndDate: string;
    qualityGrade: string;
    thcPercentage: number;
    cbdPercentage: number;
    terpeneProfile: string;
    status: string;
    notes: string;
  }>) {
    return apiClient.put(`/harvest/${id}`, data);
  },

  async delete(id: string | number) {
    return apiClient.delete(`/harvest/${id}`);
  },
};

// ============ INVENTORY API ============
export const inventoryApi = {
  async getAll(params?: {
    itemType?: string;
    status?: string;
    location?: string;
  }) {
    const queryString = buildQueryString(params);
    return apiClient.get(`/inventory${queryString}`);
  },

  async getById(id: string | number) {
    return apiClient.get(`/inventory/${id}`);
  },

  async create(data: {
    harvestBatchId: number; // Required now (batch-first)
    geneticId?: number;
    lotNumber?: string;
    itemType?: string;
    itemName: string;
    quantity: number;
    unit?: string;
    roomId: number; // Required now (room-scoped)
    containerType?: string;
    packageDate?: string;
    expirationDate?: string;
    batchNumber?: string;
    testResults?: string;
    complianceTag?: string;
    pricePerUnit?: number;
    totalValue?: number;
    currency?: string;
    status?: string;
    notes?: string;
  }) {
    return apiClient.post('/inventory', data);
  },

  async update(id: string | number, data: Partial<{
    quantity: number;
    location: string;
    status: string;
    pricePerUnit: number;
    totalValue: number;
    testResults: string;
    complianceTag: string;
    notes: string;
  }>) {
    return apiClient.put(`/inventory/${id}`, data);
  },

  async delete(id: string | number) {
    return apiClient.delete(`/inventory/${id}`);
  },
};

// ============ WASTE MANAGEMENT API ============
export const wasteManagementApi = {
  async getAll(params?: {
    wasteType?: string;
    roomId?: string;
    batchId?: string;
    startDate?: string;
    endDate?: string;
  }) {
    const queryString = buildQueryString(params);
    return apiClient.get(`/waste-management${queryString}`);
  },

  async create(data: {
    roomId?: number;
    batchId?: number;
    plantId?: number;
    wasteType?: string;
    reason?: string;
    quantity: number;
    unit?: string;
    disposalMethod?: string;
    disposedBy?: number;
    complianceNotes?: string;
    witnessName?: string;
    authorizationCode?: string;
    images?: string;
    disposedAt?: string;
  }) {
    return apiClient.post('/waste-management', data);
  },

  async getStats(startDate?: string, endDate?: string) {
    const params: Record<string, string> = {};
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    const queryString = buildQueryString(params);
    return apiClient.get(`/waste-management/stats${queryString}`);
  },
};

// ============ NOTIFICATIONS API ============
export const notificationsApi = {
  async getAll(params?: { unreadOnly?: boolean; limit?: number }) {
    const queryString = buildQueryString(params);
    return apiClient.get(`/notifications${queryString}`);
  },

  async getUnreadCount() {
    return apiClient.get('/notifications/unread-count');
  },

  async markAsRead(id: string | number) {
    return apiClient.put(`/notifications/${id}/read`, {});
  },

  async markAllAsRead() {
    return apiClient.put('/notifications/read-all', {});
  },

  async delete(id: string | number) {
    return apiClient.delete(`/notifications/${id}`);
  },

  async create(data: {
    userId?: number;
    type?: string;
    title: string;
    message?: string;
    entityType?: string;
    entityId?: number;
    metadata?: any;
  }) {
    return apiClient.post('/notifications', data);
  },
};

// ============ ORGANIZATIONS API ============
export const organizationsApi = {
  async getAll() {
    return apiClient.get('/organizations');
  },

  async getPending() {
    return apiClient.get('/organizations/pending');
  },

  async getById(id: string | number) {
    return apiClient.get(`/organizations/${id}`);
  },

  async getUsers(id: string | number) {
    return apiClient.get(`/organizations/${id}/users`);
  },

  async create(data: {
    name: string;
    legalName?: string;
    taxId?: string;
    description?: string;
  }) {
    return apiClient.post('/organizations', data);
  },

  async approve(id: string | number) {
    return apiClient.post(`/organizations/${id}/approve`, {});
  },

  async reject(id: string | number, rejectionReason: string) {
    return apiClient.post(`/organizations/${id}/reject`, { rejectionReason });
  },

  async update(id: string | number, data: Partial<{
    name: string;
    legalName: string;
    taxId: string;
    description: string;
    isActive: boolean;
    locationStateCode?: string;
    locationCountryCode?: string;
  }>) {
    return apiClient.put(`/organizations/${id}`, data);
  },
};

// ============ FACILITIES API - REMOVED ============
// Facility logic has been removed from the system

// ============ USERS API ============
export const usersApi = {
  async getAll(params: any = {}) {
    const queryParams = new URLSearchParams(params).toString();
    return apiClient.get(`/users?${queryParams}`);
  },

  async getById(id: string | number) {
    return apiClient.get(`/users/${id}`);
  },

  async getPermissions(id: string | number) {
    return apiClient.get(`/users/${id}/permissions`);
  },

  async getExplicitPermissions(id: string | number) {
    return apiClient.get(`/permissions/users/${id}/explicit`);
  },

  async grantPermission(userId: string | number, permissionId: number) {
    return apiClient.post(`/permissions/users/${userId}`, { permissionId });
  },

  async revokePermission(userId: string | number, permissionId: number) {
    return apiClient.delete(`/permissions/users/${userId}/${permissionId}`);
  },

  async create(data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone?: string;
    role?: string;
    organizationId?: number;
    roleIds?: number[];
  }) {
    return apiClient.post('/users', data);
  },

  async invite(data: any) {
    return apiClient.post('/users', data);
  },

  async update(id: string | number, data: any) {
    return apiClient.put(`/users/${id}`, data);
  },

  async delete(id: string | number) {
    return apiClient.delete(`/users/${id}`);
  },

  async resetPassword(id: string | number, newPassword: string) {
    return apiClient.post(`/users/${id}/reset-password`, { newPassword });
  }
};

// ============ LOCATION API ============
export const locationApi = {
  async detect(params?: { latitude?: number; longitude?: number }) {
    const queryString = buildQueryString(params);
    // Location detection is public (no auth required during signup)
    const token = localStorage.getItem('authToken');
    const response = await fetch(`${API_BASE_URL}/location/detect${queryString}`, {
      headers: token ? {
        Authorization: `Bearer ${token}`,
      } : {},
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Detection failed' }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }
    return response.json();
  },

  async checkLegality(stateCode: string, countryCode: string = 'US') {
    // Legality check is public (no auth required during signup)
    const token = localStorage.getItem('authToken');
    const response = await fetch(`${API_BASE_URL}/location/legality/${stateCode}?countryCode=${countryCode}`, {
      headers: token ? {
        Authorization: `Bearer ${token}`,
      } : {},
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Check failed' }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }
    return response.json();
  },

  async getStates(countryCode: string = 'US') {
    // States list is public (no auth required during signup)
    const token = localStorage.getItem('authToken');
    const response = await fetch(`${API_BASE_URL}/location/states?countryCode=${countryCode}`, {
      headers: token ? {
        Authorization: `Bearer ${token}`,
      } : {},
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Fetch failed' }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }
    return response.json();
  },
};

// ============ DOCUMENTS API ============
export const documentsApi = {
  async getAll(params?: {
    organizationId?: string;
    documentType?: string;
    status?: string;
  }) {
    const queryString = buildQueryString(params);
    return apiClient.get(`/documents${queryString}`);
  },

  async getById(id: string | number) {
    return apiClient.get(`/documents/${id}`);
  },

  async upload(formData: FormData) {
    const token = localStorage.getItem('authToken');
    const response = await fetch(`${API_BASE_URL}/documents`, {
      method: 'POST',
      body: formData,
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Upload failed' }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }
    return response.json();
  },

  async uploadCultivationLicense(formData: FormData) {
    const token = localStorage.getItem('authToken');
    if (!token) {
      throw new Error('Authentication required. Please log in first.');
    }
    const response = await fetch(`${API_BASE_URL}/documents/cultivation-license`, {
      method: 'POST',
      body: formData,
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Upload failed' }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }
    return response.json();
  },

  async approve(id: string | number) {
    return apiClient.post(`/documents/${id}/approve`, {});
  },

  async reject(id: string | number, rejectionReason: string) {
    return apiClient.post(`/documents/${id}/reject`, { rejectionReason });
  },

  async download(id: string | number) {
    const token = localStorage.getItem('authToken');
    const response = await fetch(`${API_BASE_URL}/documents/${id}/download`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    if (!response.ok) throw new Error('Download failed');
    const blob = await response.blob();
    return blob;
  },
};

// ============ LICENSES API ============
export const licensesApi = {
  async getAll(params?: {
    organizationId?: string;
    licenseType?: string;
    status?: string;
    stateCode?: string;
  }) {
    const queryString = buildQueryString(params);
    return apiClient.get(`/licenses${queryString}`);
  },

  async getById(id: string | number) {
    return apiClient.get(`/licenses/${id}`);
  },

  async create(data: {
    organizationId?: number;
    documentId: number;
    licenseType: string;
    licenseNumber: string;
    stateCode: string;
    countryCode?: string;
    issuedBy?: string;
    issuedDate?: string;
    effectiveDate: string;
    expiresDate?: string;
    notes?: string;
  }) {
    return apiClient.post('/licenses', data);
  },

  async update(id: string | number, data: Partial<{
    licenseNumber: string;
    issuedBy: string;
    issuedDate: string;
    effectiveDate: string;
    expiresDate: string;
    notes: string;
  }>) {
    return apiClient.put(`/licenses/${id}`, data);
  },

  async check(licenseType: string, stateCode: string) {
    return apiClient.get(`/licenses/check/${licenseType}/${stateCode}`);
  },
};

// ============ MANUFACTURING API ============
export const manufacturingApi = {
  // Recipes
  async getRecipes(params?: {
    organizationId?: string;
    recipeType?: string;
    isActive?: string;
  }) {
    const queryString = buildQueryString(params);
    return apiClient.get(`/manufacturing/recipes${queryString}`);
  },

  async getRecipe(id: string | number) {
    return apiClient.get(`/manufacturing/recipes/${id}`);
  },

  async createRecipe(data: {
    organizationId?: number;
    name: string;
    description?: string;
    recipeType: string;
    version?: string;
    ingredients?: Array<{
      ingredientType: string;
      inventoryId?: number;
      itemName: string;
      quantity: number;
      unit?: string;
      sequenceOrder?: number;
      notes?: string;
    }>;
  }) {
    return apiClient.post('/manufacturing/recipes', data);
  },

  // Manufacturing Batches
  async getBatches(params?: {
    organizationId?: string;
    status?: string;
  }) {
    const queryString = buildQueryString(params);
    return apiClient.get(`/manufacturing/batches${queryString}`);
  },

  async createBatch(data: {
    organizationId?: number;
    recipeId: number;
    batchNumber: string;
    batchName: string;
    roomId?: number;
    plannedQuantity: number;
    inputBatches?: Array<{
      batchId: number;
      inventoryId?: number;
      quantity: number;
      unit?: string;
    }>;
  }) {
    return apiClient.post('/manufacturing/batches', data);
  },
};

// ============ ANALYTICS API ============
export const analyticsApi = {
  async getYield(params?: {
    organizationId?: string;
    startDate?: string;
    endDate?: string;
    groupBy?: string;
  }) {
    const queryString = buildQueryString(params);
    return apiClient.get(`/analytics/yield${queryString}`);
  },

  async getWaste(params?: {
    organizationId?: string;
    startDate?: string;
    endDate?: string;
  }) {
    const queryString = buildQueryString(params);
    return apiClient.get(`/analytics/waste${queryString}`);
  },

  async getInventoryAging(params?: any) {
    const queryString = buildQueryString(params);
    return apiClient.get(`/analytics/inventory-aging${queryString}`);
  },

  async getComplianceRisks(params?: any) {
    const queryString = buildQueryString(params);
    return apiClient.get(`/analytics/compliance-risks${queryString}`);
  },



};

// ============ BATCH LINEAGE API ============
export const batchLineageApi = {
  async getLineage(batchId: string | number) {
    return apiClient.get(`/batch-lineage/${batchId}`);
  },

  async splitBatch(data: {
    parentBatchId: number;
    childBatches: Array<{
      harvestBatchId: number;
      quantity: number;
    }>;
    notes?: string;
  }) {
    return apiClient.post('/batch-lineage/split', data);
  },

  async getInventoryLedger(inventoryId: string | number) {
    return apiClient.get(`/batch-lineage/inventory/${inventoryId}/ledger`);
  },
};



export const billingApi = {
  async getOverview() {
    return apiClient.get('/billing/overview');
  },

  async getSubscriptions() {
    return apiClient.get('/billing/subscriptions');
  },

  async getInvoices() {
    return apiClient.get('/billing/invoices');
  },

  async getOrgInvoices(orgId: string | number) {
    return apiClient.get(`/billing/invoices/${orgId}`);
  },

  async updatePlan(orgId: string | number, data: { plan: string; amount: number; cycle?: string }) {
    return apiClient.put(`/billing/subscriptions/${orgId}`, data);
  },

  async cancelSubscription(orgId: string | number) {
    return apiClient.post(`/billing/subscriptions/${orgId}/cancel`, {});
  },

  async exportReport() {
    const response = await fetch(`${API_BASE_URL}/billing/export`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`
      }
    });

    if (!response.ok) throw new Error('Failed to export report');

    // Trigger download
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `billing_report_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  },

  async generateInvoice(orgId: string | number) {
    return apiClient.post('/billing/invoices/generate', { orgId });
  },

  async downloadInvoicePDF(invoiceId: string | number, invoiceNumber: string) {
    const response = await fetch(`${API_BASE_URL}/billing/invoices/${invoiceId}/pdf`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`
      }
    });

    if (!response.ok) throw new Error('Failed to download invoice PDF');

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${invoiceNumber}.pdf`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  }
};

export const integrationsApi = {
  async getAll() {
    return apiClient.get('/integrations');
  },

  async connect(id: string | number, config: any = {}) {
    return apiClient.post(`/integrations/${id}/connect`, { config });
  },

  async disconnect(id: string | number) {
    return apiClient.post(`/integrations/${id}/disconnect`, {});
  }
};



export const systemSettingsApi = {
  async getSettings() {
    return apiClient.get('/system-settings');
  },

  async updateSettings(settings: any) {
    return apiClient.post('/system-settings', settings);
  }
};

export const auditLogsApi = {
  async getLogs(params: any = {}) {
    const queryParams = new URLSearchParams(params).toString();
    return apiClient.get(`/audit-logs?${queryParams}`);
  }
};

export const databaseApi = {
  async getStats() {
    return apiClient.get('/database/stats');
  }
};

export const rolesApi = {
  async getAll(params: any = {}) {
    const queryParams = new URLSearchParams(params).toString();
    return apiClient.get(`/roles?${queryParams}`);
  },

  async getById(id: string | number) {
    return apiClient.get(`/roles/${id}`);
  },

  async create(roleData: any) {
    return apiClient.post('/roles', roleData);
  },

  async update(id: string | number, updates: any) {
    return apiClient.put(`/roles/${id}`, updates);
  },

  async delete(id: string | number) {
    return apiClient.delete(`/roles/${id}`);
  }
};

export const permissionsApi = {
  async getAll() {
    return apiClient.get('/permissions');
  },

  async getUserPermissions(userId: string | number) {
    return apiClient.get(`/permissions/users/${userId}/explicit`);
  },

  async grantPermission(userId: string | number, permissionId: string | number) {
    return apiClient.post(`/permissions/users/${userId}`, { permissionId });
  },

  async revokePermission(userId: string | number, permissionId: string | number) {
    return apiClient.delete(`/permissions/users/${userId}/${permissionId}`);
  }
};

export const reportsApi = {
  async generateReport(data: any) {
    return apiClient.post('/reports/generate', data);
  }
};










