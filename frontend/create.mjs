import { setupCreateSessionForm } from "./lib/create-session.mjs?v=a6a856c";

const main = () => {
  setupCreateSessionForm();
};

if (document.readyState === "complete") {
  main();
} else {
  document.addEventListener("DOMContentLoaded", main);
}
