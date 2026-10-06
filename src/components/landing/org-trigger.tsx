import Link from "next/link";
import { cn } from "@/lib/utils";

export function OrgTrigger({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <Link href="/organizaciones" className={cn(className)}>
      {children}
    </Link>
  );
}
