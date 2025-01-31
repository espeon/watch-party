import { LocationProvider, Router, Route, hydrate } from "preact-iso";

import { Home } from "./pages/Home/index.jsx";
import { NotFound } from "./pages/_404.jsx";
import "./style.css";
import { ThemeProvider } from "./context/themeProvider.js";
import { Video } from "./pages/Video/index.js";
import Test from "./pages/vidtest.js";

export function App() {
  return (
    <LocationProvider>
      <ThemeProvider>
        <main className="bg-background max-h-screen h-screen">
          <Router>
            <Route path="/" component={Home} />
            <Route default component={NotFound} />
            <Route path="/video" component={Video} />
            <Route path="/test" component={Test} />
          </Router>
        </main>
      </ThemeProvider>
    </LocationProvider>
  );
}

if (typeof window !== "undefined") {
  hydrate(<App />, document.getElementById("app"));
}
