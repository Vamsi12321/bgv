export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
export const revalidate = 0;
export const runtime = "nodejs";

import ResetPasswordClient from "./client";

export default function Page() {
  return <ResetPasswordClient />;
}
