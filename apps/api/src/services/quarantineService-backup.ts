// DISABLED: Schema mismatch
// quarantinedVideo model does not exist in Prisma schema
// This service cannot function without the model definition

export class QuarantineService {
  // Service disabled due to missing Prisma model: quarantinedVideo
  
  async createQuarantine() {
    throw new Error('QuarantineService disabled - missing database model');
  }
  
  async getQuarantineStats() {
    throw new Error('QuarantineService disabled - missing database model');
  }
  
  async reviewQuarantine() {
    throw new Error('QuarantineService disabled - missing database model');
  }
}

export const quarantineService = new QuarantineService()
