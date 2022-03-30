import { setupJoinSessionForm } from "./lib/join-session.mjs?v=ee93fb";

const main = () => {
  setupJoinSessionForm();
};

if (document.readyState === "complete") {
  main();
} else {
  document.addEventListener("DOMContentLoaded", main);
}
