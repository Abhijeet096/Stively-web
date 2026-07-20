import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

function initials(name: string | null): string {
  if (!name) return "M";
  const parts = name.trim().split(/\s+/);
  return parts
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

interface MentorAvatarProps {
  name: string | null;
  photoUrl?: string | null;
  className?: string;
}

function MentorAvatar({ name, photoUrl, className }: MentorAvatarProps) {
  return (
    <Avatar className={cn(className)}>
      {photoUrl && <AvatarImage src={photoUrl} alt={name ?? "Mentor"} />}
      <AvatarFallback>{initials(name)}</AvatarFallback>
    </Avatar>
  );
}

export { MentorAvatar };
