import { showToast } from "@/lib/toast";

type RouterLike = {
  push: (path: string) => void;
};

type LogoutOptions = {
  logout: () => void;
  router: RouterLike;
  redirectTo?: string;
  toastMessage?: string;
  onAfterLogout?: () => void;
};

export function performLogout({
  logout,
  router,
  redirectTo = "/login",
  toastMessage = "Logged out",
  onAfterLogout,
}: LogoutOptions): void {
  logout();
  document.cookie = "dp_access=; Path=/; Max-Age=0";
  document.cookie = "dp_admin=; Path=/; Max-Age=0";
  document.cookie = "dp_staff=; Path=/; Max-Age=0";
  onAfterLogout?.();
  showToast(toastMessage, { variant: "success" });
  router.push(redirectTo);
  if (typeof window !== "undefined") {
    window.setTimeout(() => {
      if (window.location.pathname !== redirectTo) {
        window.location.assign(redirectTo);
      }
    }, 60);
  }
}
