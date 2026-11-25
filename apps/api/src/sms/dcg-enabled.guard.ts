import { CanActivate, Injectable, ServiceUnavailableException } from "@nestjs/common";
import { dcg } from "./dcg-config";

/** Communications admin + webhook surfaces stay dark until DCG_ENABLED=true. */
@Injectable()
export class DcgEnabledGuard implements CanActivate {
  canActivate(): boolean {
    if (!dcg.enabled()) throw new ServiceUnavailableException("Communications module is disabled");
    return true;
  }
}
