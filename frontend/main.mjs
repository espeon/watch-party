import { setupJoinSessionForm } from "./lib/join-session.mjs?v=a6a856c";

const main = () => {
  setupJoinSessionForm();
};

if (document.readyState === "complete") {
  main();
} else {
  document.addEventListener("DOMContentLoaded", main);
}
