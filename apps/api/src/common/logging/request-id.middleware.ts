import { Injectable, NestMiddleware } from "@nestjs/common";
import { randomUUID } from "crypto";
import { runWithRequestContext } from "./request-context";

@Injectable()
export class RequestIdMiddleware implements NestMiddleware {
  use(req: any, res: any, next: () => void) {
    const incoming = req.headers["x-request-id"];
    const id = (typeof incoming === "string" && incoming.trim()) ? incoming.trim() : randomUUID();
    req.requestId = id;
    res.setHeader("x-request-id", id);
    // Everything downstream in this request's async chain — including AuditService.log()
    // calls several layers deep in unrelated services — can now read this id back via
    // getRequestId() without needing it passed in explicitly.
    runWithRequestContext({ requestId: id }, next);
  }
}
