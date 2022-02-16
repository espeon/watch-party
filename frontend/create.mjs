import { setupCreateSessionForm } from "./lib/create-session.mjs?v=1e57e6";

const main = () => {
  setupCreateSessionForm();
};

if (document.readyState === "complete") {
  main();
} else {
  document.addEventListener("DOMContentLoaded", main);
}
