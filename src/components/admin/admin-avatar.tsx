import { adminInitials } from "@/lib/admin-profile";
import { cn } from "@/lib/utils";

type Props = {
  name: string;
  lastName: string;
  avatar: string | null;
  className?: string;
};

/** Profile photo, or the initials on a tinted circle when there is none. */
export function AdminAvatar({ name, lastName, avatar, className }: Props) {
  if (avatar) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- a small data URL; next/image cannot optimize it
      <img
        src={avatar}
        alt={`Foto de ${name} ${lastName}`}
        className={cn("size-8 shrink-0 rounded-full object-cover", className)}
      />
    );
  }
  return (
    <div
      aria-hidden
      className={cn(
        "bg-primary/20 text-primary flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-bold",
        className,
      )}
    >
      {adminInitials(name, lastName)}
    </div>
  );
}
