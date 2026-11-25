// DISABLED: Schema mismatch
// quarantinedVideo model does not exist in Prisma schema

export class QuarantineService {
  async createQuarantine() {
    throw new Error('disabled');
  }
  async getQuarantineItems() {
    throw new Error('disabled');
  }
  async getQuarantineItem() {
    throw new Error('disabled');
  }
  async releaseQuarantine() {
    throw new Error('disabled');
  }
  async deleteQuarantine() {
    throw new Error('disabled');
  }
  async escalateQuarantine() {
    throw new Error('disabled');
  }
  async bulkRelease() {
    throw new Error('disabled');
  }
  async bulkDelete() {
    throw new Error('disabled');
  }
  async bulkEscalate() {
    throw new Error('disabled');
  }
  async getQuarantineStats() {
    throw new Error('disabled');
  }
}

export const quarantineService = new QuarantineService()
