import { Injectable, OnModuleInit } from "@nestjs/common";
import { PgBossService } from "../../common/pgboss/pgboss.service";
import { UploadsService } from "../../uploads/uploads.service";

@Injectable()
export class UploadsProcessor implements OnModuleInit {
  constructor(private uploads: UploadsService, private pgBoss: PgBossService) {}

  async onModuleInit() {
    await this.pgBoss.work("uploads", async (job: { data: { key: string } }) => {
      // Downloads, scans, and generates resized variants if S3 configured.
      return this.uploads.processImage(job.data.key);
    });
  }
}
