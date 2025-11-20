export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
export const revalidate = false;
export const runtime = "nodejs";

import ClientPage from "./client";

export default function Page() {
  return <ClientPage />;
}
