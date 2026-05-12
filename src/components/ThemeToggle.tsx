import { Sun, Moon, Monitor, Check } from "lucide-react";
import { useTheme, type ThemeMode } from "@/lib/theme";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const options: { value: ThemeMode; label: string; icon: typeof Sun }[] = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: Monitor },
];

type Props = {
  variant?: "icon" | "compact" | "inline";
  className?: string;
};

export function ThemeToggle({ variant = "icon", className }: Props) {
  const { theme, resolved, setTheme } = useTheme();

  if (variant === "inline") {
    return (
      <div className={`grid grid-cols-3 gap-1 rounded-lg border border-border/60 bg-card/40 p-1 ${className ?? ""}`}>
        {options.map(({ value, label, icon: Icon }) => {
          const active = theme === value;
          return (
            <button
              key={value}
              type="button"
              onClick={() => setTheme(value)}
              className={`flex items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-xs transition-colors ${
                active
                  ? "bg-gradient-gold text-gold-foreground shadow-gold"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground"
              }`}
              aria-pressed={active}
              aria-label={`Use ${label.toLowerCase()} theme`}
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size={variant === "compact" ? "sm" : "icon"}
          className={`rounded-full ${className ?? ""}`}
          aria-label="Change theme"
        >
          {resolved === "dark" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
          {variant === "compact" && <span className="ml-1 text-xs capitalize">{theme}</span>}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        {options.map(({ value, label, icon: Icon }) => (
          <DropdownMenuItem
            key={value}
            onClick={() => setTheme(value)}
            className="flex items-center gap-2"
          >
            <Icon className="h-4 w-4" />
            <span className="flex-1">{label}</span>
            {theme === value && <Check className="h-3.5 w-3.5 text-gold" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}