import { setupJoinSessionForm } from "./lib/join-session.mjs?v=048af96";

const main = () => {
  setupJoinSessionForm();
};

if (document.readyState === "complete") {
  main();
} else {
  document.addEventListener("DOMContentLoaded", main);
}
