import { Logger, Module } from "@nestjs/common";
import { AuditModule } from "../common/audit/audit.module";
import { IdentityController } from "./identity.controller";
import { IdentityService } from "./identity.service";
import { SmsModule } from "../sms/sms.module";
import { IDENTITY_PROVIDER } from "./providers/identity-provider";
import { AwsIdentityProvider, awsIdentityConfigured } from "./providers/aws-identity.provider";
import { MockIdentityProvider } from "./providers/mock-identity.provider";

/**
 * IDENTITY_PROVIDER=aws  -> Textract + Rekognition (required in production)
 * IDENTITY_PROVIDER=mock -> no real checks; local development only
 * unset                  -> aws when AWS credentials are present, otherwise mock (non-production)
 */
function chooseProvider() {
  const log = new Logger("IdentityModule");
  const prod = process.env.NODE_ENV === "production";
  const wanted = (process.env.IDENTITY_PROVIDER || "").toLowerCase();

  if (wanted === "mock") {
    if (prod) throw new Error("IDENTITY_PROVIDER=mock is not allowed in production");
    log.warn("Identity provider: MOCK - no real OCR or face matching is performed");
    return new MockIdentityProvider();
  }
  if (wanted === "aws" || prod || (!wanted && awsIdentityConfigured() && process.env.AWS_ACCESS_KEY_ID)) {
    if (!awsIdentityConfigured()) throw new Error("IDENTITY_PROVIDER=aws requires AWS_REGION and a complete AWS credential pair");
    return new AwsIdentityProvider();
  }
  log.warn("AWS credentials not configured - using the MOCK identity provider (development only)");
  return new MockIdentityProvider();
}

@Module({
  imports: [AuditModule, SmsModule],
  controllers: [IdentityController],
  providers: [IdentityService, { provide: IDENTITY_PROVIDER, useFactory: chooseProvider }],
})
export class IdentityModule {}
