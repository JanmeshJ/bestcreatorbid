import { AdminBoard } from "@/components/admin-board";
import { AdminLoginForm } from "@/components/admin-login-form";
import { isAdminAuthenticated } from "@/lib/auth";
import { getAdminBundle } from "@/lib/data";

export const dynamic = "force-dynamic";
export const metadata = { title: "Admin" };

export default async function AdminPage() {
  const authed = await isAdminAuthenticated();
  if (!authed) return <AdminLoginForm />;
  const bundle = await getAdminBundle();
  return <AdminBoard bundle={bundle} />;
}
