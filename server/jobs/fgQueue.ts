// Stub queue — replace with real BullMQ/Redis queue when infrastructure is available
export const fgQueue = {
  getWaitingCount: async () => 0,
  getActiveCount: async () => 0,
  getCompletedCount: async () => 0,
  getFailedCount: async () => 0,
};
