import { setupJoinSessionForm } from "./lib/join-session.mjs?v=1e57e6";

const main = () => {
  setupJoinSessionForm();
};

if (document.readyState === "complete") {
  main();
} else {
  document.addEventListener("DOMContentLoaded", main);
}
