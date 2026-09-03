import { Sun, Moon } from "lucide-react";
import { useTheme } from "@/lib/theme";
import { Button } from "@/components/ui/button";

type Props = {
  variant?: "icon" | "compact" | "inline";
  className?: string;
};

export function ThemeToggle({ variant = "icon", className }: Props) {
  const { resolved, setTheme } = useTheme();

  const toggle = () => {
    const next = resolved === "dark" ? "light" : "dark";
    setTheme(next);
  };

  if (variant === "inline") {
    return (
      <div className={`grid grid-cols-2 gap-1 rounded-lg border border-border/70 bg-card p-1 shadow-2xs ${className ?? ""}`}>
        <button
          type="button"
          onClick={() => setTheme("light")}
          className={`flex items-center justify-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-all duration-200 ${
            resolved === "light"
              ? "bg-primary text-primary-foreground shadow-2xs"
              : "text-muted-foreground hover:bg-accent/60 hover:text-foreground"
          }`}
          aria-pressed={resolved === "light"}
          aria-label="Use light mode"
        >
          <Sun className="h-3.5 w-3.5" />
          Light
        </button>
        <button
          type="button"
          onClick={() => setTheme("dark")}
          className={`flex items-center justify-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-all duration-200 ${
            resolved === "dark"
              ? "bg-primary text-primary-foreground shadow-2xs"
              : "text-muted-foreground hover:bg-accent/60 hover:text-foreground"
          }`}
          aria-pressed={resolved === "dark"}
          aria-label="Use dark mode"
        >
          <Moon className="h-3.5 w-3.5" />
          Dark
        </button>
      </div>
    );
  }

  return (
    <Button
      variant="ghost"
      size={variant === "compact" ? "sm" : "icon"}
      onClick={toggle}
      className={`relative h-9 w-9 rounded-full border border-border/70 bg-card/60 transition-all duration-300 hover:scale-105 hover:border-primary/40 hover:bg-accent active:scale-95 ${className ?? ""}`}
      aria-label={`Switch to ${resolved === "dark" ? "light" : "dark"} mode`}
      title={`Switch to ${resolved === "dark" ? "light" : "dark"} mode`}
    >
      <Sun className="h-4 w-4 rotate-0 scale-100 transition-transform duration-300 dark:-rotate-90 dark:scale-0 text-amber-500" />
      <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-transform duration-300 dark:rotate-0 dark:scale-100 text-primary" />
      {variant === "compact" && (
        <span className="ml-1 text-xs capitalize text-muted-foreground">
          {resolved === "dark" ? "Dark" : "Light"}
        </span>
      )}
    </Button>
  );
}