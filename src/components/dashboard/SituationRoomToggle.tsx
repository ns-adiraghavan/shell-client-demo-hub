import { Button } from "@/components/ui/button";
import { Monitor } from "lucide-react";
import { cn } from "@/lib/utils";

interface SituationRoomToggleProps {
  isActive: boolean;
  onToggle: () => void;
}

export const SituationRoomToggle = ({ isActive, onToggle }: SituationRoomToggleProps) => {
  return (
    <Button
      variant={isActive ? "default" : "outline"}
      size="sm"
      onClick={onToggle}
      className={cn(
        "gap-2 font-medium transition-all duration-300",
        isActive && "bg-primary text-primary-foreground shadow-beacon animate-pulse-subtle"
      )}
    >
      <Monitor className="h-4 w-4" />
      <span className="hidden sm:inline">Situation Room</span>
    </Button>
  );
};
