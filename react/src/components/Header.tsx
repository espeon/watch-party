import { useLocation } from "preact-iso";
import { ThemeToggle } from "./ui/themeToggle";

export function Header() {
  const { url } = useLocation();

  return (
    <header>
      <ThemeToggle />
    </header>
  );
}
