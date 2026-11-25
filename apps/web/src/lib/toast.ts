type ToastVariant = "success" | "info" | "error" | "destructive";

type ToastOptions = {
  durationMs?: number;
  variant?: ToastVariant;
};

const DEFAULT_DURATION_MS = 2000;
const CONTAINER_ID = "dp-toast-container";

const VARIANT_STYLES: Record<ToastVariant, { background: string; border: string }> = {
  success: { background: "#0f2f1b", border: "#1f6f3a" },
  info: { background: "#0f2430", border: "#1a4d64" },
  error: { background: "#2b1010", border: "#6b1f1f" },
  destructive: { background: "#2b1010", border: "#6b1f1f" },
};

function getContainer(): HTMLDivElement | null {
  if (typeof document === "undefined") return null;
  const existing = document.getElementById(CONTAINER_ID) as HTMLDivElement | null;
  if (existing) return existing;

  const container = document.createElement("div");
  container.id = CONTAINER_ID;
  container.style.position = "fixed";
  container.style.bottom = "20px";
  container.style.right = "20px";
  container.style.display = "flex";
  container.style.flexDirection = "column";
  container.style.gap = "8px";
  container.style.alignItems = "flex-end";
  container.style.zIndex = "9999";
  document.body.appendChild(container);
  return container;
}

export function showToast(message: string, options: ToastOptions = {}): void {
  if (!message) return;

  const container = getContainer();
  if (!container) return;

  const durationMs = options.durationMs ?? DEFAULT_DURATION_MS;
  const variant = options.variant ?? "success";
  const { background, border } = VARIANT_STYLES[variant];

  const toast = document.createElement("div");
  toast.textContent = message;
  toast.style.background = background;
  toast.style.color = "#fff";
  toast.style.border = `1px solid ${border}`;
  toast.style.padding = "10px 12px";
  toast.style.borderRadius = "10px";
  toast.style.fontSize = "12px";
  toast.style.fontWeight = "600";
  toast.style.boxShadow = "0 10px 30px rgba(0, 0, 0, 0.35)";
  toast.style.opacity = "0";
  toast.style.transform = "translateY(6px)";
  toast.style.transition = "opacity 160ms ease, transform 160ms ease";

  container.appendChild(toast);

  requestAnimationFrame(() => {
    toast.style.opacity = "1";
    toast.style.transform = "translateY(0)";
  });

  window.setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateY(6px)";

    window.setTimeout(() => {
      toast.remove();
    }, 160);
  }, durationMs);
}
