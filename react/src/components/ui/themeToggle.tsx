import { useContext } from "preact/hooks";
import { ThemeContext } from "@/context/themeContext";

/// Add a theme toggle button to the bottom right of the screen.
export function ThemeToggle() {
  const { theme, toggleTheme } = useContext(ThemeContext);

  return (
    <button className="fixed bottom-12 right-4 z-20" onClick={toggleTheme}>
      Switch to {theme === "light" ? "dark" : "light"} mode
    </button>
  );
}
