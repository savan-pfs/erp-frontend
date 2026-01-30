// React Query hooks for API integration with real-time updates
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  plantsApi,
  batchesApi,
  mothersApi,
  roomsApi,
  // facilitiesApi, // Removed - no facility logic
  geneticsApi,
  tasksApi,
  environmentalLogsApi,
  feedingLogsApi,
  ipmLogsApi,
  harvestBatchesApi,
  inventoryApi,
  wasteManagementApi,
  dashboardApi,
  calendarApi,
  notificationsApi,
  rolesApi,
  permissionsApi,
  usersApi,
} from "@/lib/api/realApi";

// Query key constants for better cache management
export const QUERY_KEYS = {
  plants: "plants",
  batches: "batches",
  mothers: "mothers",
  rooms: "rooms",
  facilities: "facilities",
  genetics: "genetics",
  tasks: "tasks",
  environmentalLogs: "environmental-logs",
  feedingLogs: "feeding-logs",
  ipmLogs: "ipm-logs",
  harvestBatches: "harvest-batches",
  inventory: "inventory",
  wasteManagement: "waste-management",
  dashboard: "dashboard",
  calendarEvents: "calendar-events",
  notifications: "notifications",
  alerts: "alerts",
  activities: "activities",
};

// Helper to invalidate related queries for real-time updates
const useInvalidateRelated = () => {
  const queryClient = useQueryClient();

  return {
    invalidatePlantRelated: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.plants] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.batches] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.rooms] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.dashboard] });
    },
    invalidateBatchRelated: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.batches] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.plants] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.genetics] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.mothers] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.rooms] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.dashboard] });
    },
    invalidateRoomRelated: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.rooms] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.plants] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.environmentalLogs] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.dashboard] });
    },
    invalidateTaskRelated: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.tasks] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.calendarEvents] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.dashboard] });
    },
    invalidateAll: () => {
      queryClient.invalidateQueries();
    },
  };
};

// ============ PLANTS HOOKS ============
export function usePlants(params?: {
  batchId?: string;
  geneticId?: string;
  roomId?: string;
  growthStage?: string;
  healthStatus?: string;
  isActive?: string;
}) {
  return useQuery({
    queryKey: [QUERY_KEYS.plants, params],
    queryFn: () => plantsApi.getAll(params),
    staleTime: 30000, // 30 seconds
    refetchOnWindowFocus: true,
  });
}

export function usePlant(id: string | number) {
  return useQuery({
    queryKey: [QUERY_KEYS.plants, id],
    queryFn: () => plantsApi.getById(id),
    enabled: !!id,
  });
}

export function useCreatePlant() {
  const { invalidatePlantRelated } = useInvalidateRelated();
  return useMutation({
    mutationFn: plantsApi.create,
    onSuccess: invalidatePlantRelated,
  });
}

export function useUpdatePlant() {
  const { invalidatePlantRelated } = useInvalidateRelated();
  return useMutation({
    mutationFn: ({ id, updates }: { id: string | number; updates: any }) =>
      plantsApi.update(id, updates),
    onSuccess: invalidatePlantRelated,
  });
}

export function useDeletePlant() {
  const { invalidatePlantRelated } = useInvalidateRelated();
  return useMutation({
    mutationFn: (id: string | number) => plantsApi.delete(id),
    onSuccess: invalidatePlantRelated,
  });
}

// Plant cultivation hooks
export function useChangePlantStage() {
  const { invalidatePlantRelated } = useInvalidateRelated();
  return useMutation({
    mutationFn: ({ id, growthStage, stageDate }: { id: string | number; growthStage: string; stageDate?: string }) =>
      plantsApi.changeStage(id, growthStage, stageDate),
    onSuccess: invalidatePlantRelated,
  });
}

export function useMovePlant() {
  const { invalidatePlantRelated, invalidateRoomRelated } = useInvalidateRelated();
  return useMutation({
    mutationFn: ({ id, roomId }: { id: string | number; roomId: string | number }) =>
      plantsApi.move(id, roomId),
    onSuccess: () => {
      invalidatePlantRelated();
      invalidateRoomRelated();
    },
  });
}

export function useWaterPlant() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, waterDate }: { id: string | number; waterDate?: string }) =>
      plantsApi.water(id, waterDate),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.plants] });
    },
  });
}

export function useFeedPlant() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, feedDate, feedingSchedule }: { id: string | number; feedDate?: string; feedingSchedule?: string }) =>
      plantsApi.feed(id, feedDate, feedingSchedule),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.plants] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.feedingLogs] });
    },
  });
}

export function useTransplantPlant() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, transplantDate, potSize, medium }: { id: string | number; transplantDate?: string; potSize?: number; medium?: string }) =>
      plantsApi.transplant(id, transplantDate, potSize, medium),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.plants] });
    },
  });
}

// ============ BATCHES HOOKS ============
export function useBatches(params?: {
  geneticId?: string;
  motherId?: string;
  batchType?: string;
  isActive?: string;
}) {
  return useQuery({
    queryKey: [QUERY_KEYS.batches, params],
    queryFn: () => batchesApi.getAll(params),
    staleTime: 30000,
    refetchOnWindowFocus: true,
  });
}

export function useBatch(id: string | number) {
  return useQuery({
    queryKey: [QUERY_KEYS.batches, id],
    queryFn: () => batchesApi.getById(id),
    enabled: !!id,
  });
}

export function useCreateBatch() {
  const { invalidateBatchRelated } = useInvalidateRelated();
  return useMutation({
    mutationFn: batchesApi.create,
    onSuccess: invalidateBatchRelated,
  });
}

export function useUpdateBatch() {
  const { invalidateBatchRelated } = useInvalidateRelated();
  return useMutation({
    mutationFn: ({ id, updates }: { id: string | number; updates: any }) =>
      batchesApi.update(id, updates),
    onSuccess: invalidateBatchRelated,
  });
}

export function useDeleteBatch() {
  const { invalidateBatchRelated } = useInvalidateRelated();
  return useMutation({
    mutationFn: (id: string | number) => batchesApi.delete(id),
    onSuccess: invalidateBatchRelated,
  });
}

// Batch cultivation hooks
export function useGerminateBatch() {
  const { invalidateBatchRelated, invalidatePlantRelated } = useInvalidateRelated();
  return useMutation({
    mutationFn: ({ id, seedCount, roomId, germinationDate }: { id: string | number; seedCount: number; roomId?: string | number; germinationDate?: string }) =>
      batchesApi.germinate(id, seedCount, roomId, germinationDate),
    onSuccess: () => {
      invalidateBatchRelated();
      invalidatePlantRelated();
    },
  });
}

export function useMoveBatch() {
  const { invalidateBatchRelated, invalidateRoomRelated } = useInvalidateRelated();
  return useMutation({
    mutationFn: ({ id, roomId }: { id: string | number; roomId: string | number }) =>
      batchesApi.move(id, roomId),
    onSuccess: () => {
      invalidateBatchRelated();
      invalidateRoomRelated();
    },
  });
}

// ============ MOTHERS HOOKS ============
export function useMothers(params?: {
  geneticId?: string;
  roomId?: string;
  isActive?: string;
}) {
  return useQuery({
    queryKey: [QUERY_KEYS.mothers, params],
    queryFn: () => mothersApi.getAll(params),
    staleTime: 30000,
    refetchOnWindowFocus: true,
  });
}

export function useMother(id: string | number) {
  return useQuery({
    queryKey: [QUERY_KEYS.mothers, id],
    queryFn: () => mothersApi.getById(id),
    enabled: !!id,
  });
}

export function useCreateMother() {
  const { invalidateRoomRelated } = useInvalidateRelated();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: mothersApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.mothers] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.genetics] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.dashboard] });
      invalidateRoomRelated();
    },
  });
}

export function useUpdateMother() {
  const { invalidateRoomRelated } = useInvalidateRelated();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, updates }: { id: string | number; updates: any }) =>
      mothersApi.update(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.mothers] });
      invalidateRoomRelated();
    },
  });
}

export function useDeleteMother() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string | number) => mothersApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.mothers] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.dashboard] });
    },
  });
}

export function useCloneMother() {
  const { invalidateBatchRelated, invalidatePlantRelated } = useInvalidateRelated();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, cloneCount, batchName, roomId }: { id: string | number; cloneCount: number; batchName?: string; roomId?: string | number }) =>
      mothersApi.clone(id, cloneCount, batchName, roomId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.mothers] });
      invalidateBatchRelated();
      invalidatePlantRelated();
    },
  });
}

// ============ ROOMS HOOKS ============
export function useRooms(params?: {
  roomType?: string;
  isActive?: string;
}) {
  return useQuery({
    queryKey: [QUERY_KEYS.rooms, params],
    queryFn: () => roomsApi.getAll(params),
    staleTime: 30000,
    refetchOnWindowFocus: true,
  });
}

export function useRoom(id: string | number) {
  return useQuery({
    queryKey: [QUERY_KEYS.rooms, id],
    queryFn: () => roomsApi.getById(id),
    enabled: !!id,
  });
}

export function useCreateRoom() {
  const { invalidateRoomRelated } = useInvalidateRelated();
  return useMutation({
    mutationFn: roomsApi.create,
    onSuccess: invalidateRoomRelated,
  });
}

export function useUpdateRoom() {
  const { invalidateRoomRelated } = useInvalidateRelated();
  return useMutation({
    mutationFn: ({ id, updates }: { id: string | number; updates: any }) =>
      roomsApi.update(id, updates),
    onSuccess: invalidateRoomRelated,
  });
}

export function useDeleteRoom() {
  const { invalidateRoomRelated } = useInvalidateRelated();
  return useMutation({
    mutationFn: (id: string | number) => roomsApi.delete(id),
    onSuccess: invalidateRoomRelated,
  });
}

// Room cultivation hooks
export function useRoomPlants(roomId: string | number) {
  return useQuery({
    queryKey: [QUERY_KEYS.rooms, roomId, "plants"],
    queryFn: () => roomsApi.getPlants(roomId),
    enabled: !!roomId,
  });
}

export function useMovePlantsToRoom() {
  const { invalidateRoomRelated, invalidatePlantRelated } = useInvalidateRelated();
  return useMutation({
    mutationFn: ({ roomId, plantIds }: { roomId: string | number; plantIds: (string | number)[] }) =>
      roomsApi.movePlants(roomId, plantIds),
    onSuccess: () => {
      invalidateRoomRelated();
      invalidatePlantRelated();
    },
  });
}

export function useRoomEnvironment(roomId: string | number) {
  return useQuery({
    queryKey: [QUERY_KEYS.rooms, roomId, "environment"],
    queryFn: () => roomsApi.getEnvironment(roomId),
    enabled: !!roomId,
  });
}

// ============ FACILITIES HOOKS ============
// Facility hooks removed - no facility logic

// ============ GENETICS HOOKS ============
export function useGenetics(params?: {
  strainName?: string;
  isActive?: string;
}) {
  return useQuery({
    queryKey: [QUERY_KEYS.genetics, params],
    queryFn: () => geneticsApi.getAll(params),
    staleTime: 30000,
    refetchOnWindowFocus: true,
  });
}

export function useGenetic(id: string | number) {
  return useQuery({
    queryKey: [QUERY_KEYS.genetics, id],
    queryFn: () => geneticsApi.getById(id),
    enabled: !!id,
  });
}

export function useCreateGenetic() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: geneticsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.genetics] });
    },
  });
}

export function useUpdateGenetic() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, updates }: { id: string | number; updates: any }) =>
      geneticsApi.update(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.genetics] });
    },
  });
}

export function useDeleteGenetic() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string | number) => geneticsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.genetics] });
    },
  });
}

// Genetics cultivation hooks
export function useGeneticPlants(geneticId: string | number) {
  return useQuery({
    queryKey: [QUERY_KEYS.genetics, geneticId, "plants"],
    queryFn: () => geneticsApi.getPlants(geneticId),
    enabled: !!geneticId,
  });
}

export function useGeneticBatches(geneticId: string | number) {
  return useQuery({
    queryKey: [QUERY_KEYS.genetics, geneticId, "batches"],
    queryFn: () => geneticsApi.getBatches(geneticId),
    enabled: !!geneticId,
  });
}

export function useGeneticMothers(geneticId: string | number) {
  return useQuery({
    queryKey: [QUERY_KEYS.genetics, geneticId, "mothers"],
    queryFn: () => geneticsApi.getMothers(geneticId),
    enabled: !!geneticId,
  });
}

export function useGeneticSummary(geneticId: string | number) {
  return useQuery({
    queryKey: [QUERY_KEYS.genetics, geneticId, "summary"],
    queryFn: () => geneticsApi.getSummary(geneticId),
    enabled: !!geneticId,
  });
}

// ============ TASKS HOOKS ============
export function useTasks(params?: {
  status?: string;
  priority?: string;
  assignedTo?: string;
  roomId?: string;
  batchId?: string;
}) {
  return useQuery({
    queryKey: [QUERY_KEYS.tasks, params],
    queryFn: () => tasksApi.getAll(params),
    staleTime: 30000,
    refetchOnWindowFocus: true,
  });
}

export function useCreateTask() {
  const { invalidateTaskRelated } = useInvalidateRelated();
  return useMutation({
    mutationFn: tasksApi.create,
    onSuccess: invalidateTaskRelated,
  });
}

export function useUpdateTask() {
  const { invalidateTaskRelated } = useInvalidateRelated();
  return useMutation({
    mutationFn: ({ id, updates }: { id: string | number; updates: any }) =>
      tasksApi.update(id, updates),
    onSuccess: invalidateTaskRelated,
  });
}

export function useDeleteTask() {
  const { invalidateTaskRelated } = useInvalidateRelated();
  return useMutation({
    mutationFn: (id: string | number) => tasksApi.delete(id),
    onSuccess: invalidateTaskRelated,
  });
}

// ============ CALENDAR HOOKS ============
export function useCalendarEvents(params?: {
  startDate?: string;
  endDate?: string;
  eventType?: string;
  status?: string;
  roomId?: string;
  batchId?: string;
}) {
  return useQuery({
    queryKey: [QUERY_KEYS.calendarEvents, params],
    queryFn: () => calendarApi.getAll(params),
    staleTime: 30000,
    refetchOnWindowFocus: true,
  });
}

export function useCalendarEvent(id: string | number) {
  return useQuery({
    queryKey: [QUERY_KEYS.calendarEvents, id],
    queryFn: () => calendarApi.getById(id),
    enabled: !!id,
  });
}

export function useCreateCalendarEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: calendarApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.calendarEvents] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.tasks] });
    },
  });
}

export function useUpdateCalendarEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, updates }: { id: string | number; updates: any }) =>
      calendarApi.update(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.calendarEvents] });
    },
  });
}

export function useDeleteCalendarEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string | number) => calendarApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.calendarEvents] });
    },
  });
}

// ============ ENVIRONMENTAL LOGS HOOKS ============
export function useEnvironmentalLogs(roomId?: string, startDate?: string, endDate?: string) {
  return useQuery({
    queryKey: [QUERY_KEYS.environmentalLogs, roomId, startDate, endDate],
    queryFn: () => environmentalLogsApi.getAll(roomId, startDate, endDate),
    staleTime: 30000,
    refetchOnWindowFocus: true,
  });
}

export function useLatestEnvironmentalLog(roomId: string | number) {
  return useQuery({
    queryKey: [QUERY_KEYS.environmentalLogs, "latest", roomId],
    queryFn: () => environmentalLogsApi.getLatest(roomId),
    enabled: !!roomId,
    staleTime: 60000, // 1 minute
    refetchInterval: 60000, // Auto-refresh every minute
  });
}

export function useCreateEnvironmentalLog() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: environmentalLogsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.environmentalLogs] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.rooms] });
    },
  });
}

// ============ FEEDING LOGS HOOKS ============
export function useFeedingLogs(params?: {
  roomId?: string;
  batchId?: string;
  plantId?: string;
  feedingType?: string;
}) {
  return useQuery({
    queryKey: [QUERY_KEYS.feedingLogs, params],
    queryFn: () => feedingLogsApi.getAll(params),
    staleTime: 30000,
    refetchOnWindowFocus: true,
  });
}

export function useCreateFeedingLog() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: feedingLogsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.feedingLogs] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.plants] });
    },
  });
}

// ============ IPM LOGS HOOKS ============
export function useIpmLogs(params?: {
  roomId?: string;
  batchId?: string;
  plantId?: string;
  issueType?: string;
  severity?: string;
}) {
  return useQuery({
    queryKey: [QUERY_KEYS.ipmLogs, params],
    queryFn: () => ipmLogsApi.getAll(params),
    staleTime: 30000,
    refetchOnWindowFocus: true,
  });
}

// Alias for consistency with component naming
export const useIPMLogs = useIpmLogs;

export function useCreateIpmLog() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ipmLogsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.ipmLogs] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.dashboard] });
    },
  });
}

// Alias for consistency
export const useCreateIPMLog = useCreateIpmLog;

export function useUpdateIpmLog() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, updates }: { id: string | number; updates: any }) =>
      ipmLogsApi.update(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.ipmLogs] });
    },
  });
}

export function useDeleteIpmLog() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string | number) => ipmLogsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.ipmLogs] });
    },
  });
}

// ============ HARVEST BATCHES HOOKS ============
export function useHarvestBatches(params?: {
  status?: string;
  batchId?: string;
  roomId?: string;
}) {
  return useQuery({
    queryKey: [QUERY_KEYS.harvestBatches, params],
    queryFn: () => harvestBatchesApi.getAll(params),
    staleTime: 30000,
    refetchOnWindowFocus: true,
  });
}

export function useHarvestBatch(id: string | number) {
  return useQuery({
    queryKey: [QUERY_KEYS.harvestBatches, id],
    queryFn: () => harvestBatchesApi.getById(id),
    enabled: !!id,
  });
}

export function useCreateHarvestBatch() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: harvestBatchesApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.harvestBatches] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.batches] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.plants] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.inventory] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.dashboard] });
    },
  });
}

export function useUpdateHarvestBatch() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, updates }: { id: string | number; updates: any }) =>
      harvestBatchesApi.update(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.harvestBatches] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.inventory] });
    },
  });
}

// ============ INVENTORY HOOKS ============
export function useInventory(params?: {
  itemType?: string;
  status?: string;
  location?: string;
}) {
  return useQuery({
    queryKey: [QUERY_KEYS.inventory, params],
    queryFn: () => inventoryApi.getAll(params),
    staleTime: 30000,
    refetchOnWindowFocus: true,
  });
}

export function useInventoryItem(id: string | number) {
  return useQuery({
    queryKey: [QUERY_KEYS.inventory, id],
    queryFn: () => inventoryApi.getById(id),
    enabled: !!id,
  });
}

export function useCreateInventoryLot() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: inventoryApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.inventory] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.dashboard] });
    },
  });
}

export function useUpdateInventoryLot() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, updates }: { id: string | number; updates: any }) =>
      inventoryApi.update(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.inventory] });
    },
  });
}

export function useDeleteInventoryLot() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string | number) => inventoryApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.inventory] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.dashboard] });
    },
  });
}

// ============ USERS HOOKS ============
export function useUsers(params?: any) {
  return useQuery({
    queryKey: ['users', params],
    queryFn: () => usersApi.getAll(params),
    staleTime: 30000,
  });
}

export function useInviteUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: usersApi.invite,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    }
  });
}

export function useUpdateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, updates }: { id: string | number, updates: any }) => usersApi.update(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    }
  });
}

export function useDeleteUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string | number) => usersApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    }
  });
}

// ============ ROLES & PERMISSIONS HOOKS ============
export function useRoles(params?: any) {
  return useQuery({
    queryKey: ['roles', params],
    queryFn: () => rolesApi.getAll(params),
    staleTime: 30000,
  });
}

export function usePermissions() {
  return useQuery({
    queryKey: ['permissions'],
    queryFn: () => permissionsApi.getAll(),
    staleTime: Infinity, // Permissions rarely change
  });
}

export function useCreateRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: rolesApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
    }
  });
}

export function useUpdateRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, updates }: { id: string | number, updates: any }) => rolesApi.update(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
    }
  });
}

export function useDeleteRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string | number) => rolesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
    }
  });
}

// ============ WASTE MANAGEMENT HOOKS ============
export function useWasteManagement(params?: {
  wasteType?: string;
  roomId?: string;
  batchId?: string;
  startDate?: string;
  endDate?: string;
}) {
  return useQuery({
    queryKey: [QUERY_KEYS.wasteManagement, params],
    queryFn: () => wasteManagementApi.getAll(params),
    staleTime: 30000,
    refetchOnWindowFocus: true,
  });
}

// Alias for useWasteManagement for consistency with other naming conventions
export const useWasteLogs = useWasteManagement;

export function useWasteStats(startDate?: string, endDate?: string) {
  return useQuery({
    queryKey: [QUERY_KEYS.wasteManagement, "stats", startDate, endDate],
    queryFn: () => wasteManagementApi.getStats(startDate, endDate),
    staleTime: 60000,
  });
}

export function useCreateWasteLog() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: wasteManagementApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.wasteManagement] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.plants] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.inventory] });
    },
  });
}

// ============ DASHBOARD HOOKS ============
export function useDashboardStats() {
  return useQuery({
    queryKey: [QUERY_KEYS.dashboard],
    queryFn: dashboardApi.getStats,
    staleTime: 30000,
    refetchInterval: 60000, // Auto-refresh every minute
    refetchOnWindowFocus: true,
  });
}

export function useDashboardActivities(limit?: number) {
  return useQuery({
    queryKey: [QUERY_KEYS.activities, limit],
    queryFn: () => dashboardApi.getActivities(limit),
    staleTime: 30000,
  });
}

export function useDashboardAlerts() {
  return useQuery({
    queryKey: [QUERY_KEYS.alerts],
    queryFn: dashboardApi.getAlerts,
    staleTime: 30000,
    refetchInterval: 60000, // Auto-refresh every minute
  });
}

// ============ NOTIFICATIONS HOOKS ============
export function useNotifications(params?: { unreadOnly?: boolean; limit?: number }) {
  return useQuery({
    queryKey: [QUERY_KEYS.notifications, params],
    queryFn: () => notificationsApi.getAll(params),
    staleTime: 10000, // 10 seconds - refresh frequently for real-time feel
    refetchInterval: 30000, // Poll every 30 seconds for new notifications
    refetchOnWindowFocus: true,
  });
}

export function useUnreadNotificationCount() {
  return useQuery({
    queryKey: [QUERY_KEYS.notifications, 'unread-count'],
    queryFn: () => notificationsApi.getUnreadCount(),
    staleTime: 5000, // 5 seconds
    refetchInterval: 15000, // Poll every 15 seconds for unread count
    refetchOnWindowFocus: true,
  });
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string | number) => notificationsApi.markAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.notifications] });
    },
  });
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => notificationsApi.markAllAsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.notifications] });
    },
  });
}

export function useDeleteNotification() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string | number) => notificationsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.notifications] });
    },
  });
}
