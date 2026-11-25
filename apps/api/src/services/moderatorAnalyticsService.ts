// DISABLED: Schema mismatch with VideoSession

export class ModeratorAnalyticsService {
  async detectFatigue() { throw new Error('disabled'); }
  async getModeratorPerformance() { throw new Error('disabled'); }
  async getBulkAnalytics() { throw new Error('disabled'); }
}

export const moderatorAnalytics = new ModeratorAnalyticsService()
