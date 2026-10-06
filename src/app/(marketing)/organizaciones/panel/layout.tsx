import { connection } from "next/server";

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  await connection();
  return children;
}
