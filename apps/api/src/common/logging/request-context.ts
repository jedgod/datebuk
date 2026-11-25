import { AsyncLocalStorage } from "async_hooks";

type RequestContext = { requestId: string };

const storage = new AsyncLocalStorage<RequestContext>();

export function runWithRequestContext<T>(context: RequestContext, fn: () => T): T {
  return storage.run(context, fn);
}

// Lets AuditService (and anything else) stamp the current request's id onto whatever it
// writes without every call site having to thread it through manually — most audit.log()
// call sites are several layers away from the controller that has req.requestId.
export function getRequestId(): string | undefined {
  return storage.getStore()?.requestId;
}
