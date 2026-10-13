import { connection } from "next/server";

export default async function IngresarLayout({ children }: { children: React.ReactNode }) {
  await connection();
  return children;
}
