type NavItem = {
  url: string;
};

export function isStaffSafeRoute(url: string): boolean {
  return !url.includes("/admin/");
}

export function filterStaffSafeNavItems<T extends NavItem>(items: T[]): T[] {
  return items.filter((item) => isStaffSafeRoute(item.url));
}