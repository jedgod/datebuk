export const revalidate = 0;

import { AuthLayoutClient } from "./AuthLayoutClient";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <AuthLayoutClient>{children}</AuthLayoutClient>;
}
