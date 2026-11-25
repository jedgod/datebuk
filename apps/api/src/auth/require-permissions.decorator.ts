import { SetMetadata } from "@nestjs/common";
import type { Permission } from "./permissions";

export const PERMS_KEY = "required_permissions";
export const RequirePermissions = (...perms: Permission[]) => SetMetadata(PERMS_KEY, perms);
