import { setupJoinSessionForm } from "./lib/join-session.mjs?v=e9a1b";

const main = () => {
  setupJoinSessionForm();
};

if (document.readyState === "complete") {
  main();
} else {
  document.addEventListener("DOMContentLoaded", main);
}
