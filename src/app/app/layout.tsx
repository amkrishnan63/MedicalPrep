import { Suspense } from "react";
import { requireUser } from "@/lib/auth";
import { AppNav } from "@/components/AppNav";
import { Disclaimer } from "@/components/Disclaimer";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  return (
    <>
      <Suspense fallback={null}>
        <AppNav userName={user.name} />
      </Suspense>
      <main className="shell">{children}</main>
      <div className="shell" style={{ paddingTop: 0 }}>
        <Disclaimer />
      </div>
    </>
  );
}
