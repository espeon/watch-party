import { joinSession } from "./watch-session.mjs?v=9";

/**
 * @param {HTMLInputElement} field
 */
const loadNickname = (field) => {
  try {
    const savedNickname = localStorage.getItem("watch-party-nickname");
    field.value = savedNickname;
  } catch (_err) {
    // Sometimes localStorage is blocked from use
  }
};

/**
 * @param {HTMLInputElement} field
 */
const saveNickname = (field) => {
  try {
    localStorage.setItem("watch-party-nickname", field.value);
  } catch (_err) {
    // see loadNickname
  }
};

/**
 * @param {HTMLInputElement} field
 */
const loadColour = (field) => {
  try {
    const savedColour = localStorage.getItem("watch-party-colour");
    if (savedColour != null && savedColour != "") {
      field.value = savedColour;
    }
  } catch (_err) {
    // Sometimes localStorage is blocked from use
  }
};

/**
 * @param {HTMLInputElement} field
 */
const saveColour = (field) => {
  try {
    localStorage.setItem("watch-party-colour", field.value);
  } catch (_err) {
    // see loadColour
  }
};

const displayPostCreateMessage = () => {
  const params = new URLSearchParams(window.location.search);
  if (params.get("created") == "true") {
    document.querySelector("#post-create-message").style["display"] = "block";
    window.history.replaceState({}, document.title, `/${window.location.hash}`);
  }
};

export const setupJoinSessionForm = () => {
  displayPostCreateMessage();

  const form = document.querySelector("#join-session-form");
  const nickname = form.querySelector("#join-session-nickname");
  const colour = form.querySelector("#join-session-colour");
  const sessionId = form.querySelector("#join-session-id");
  const button = form.querySelector("#join-session-button");

  loadNickname(nickname);
  loadColour(colour);

  if (window.location.hash.match(/#[0-9a-f\-]+/)) {
    sessionId.value = window.location.hash.substring(1);
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    button.disabled = true;

    saveNickname(nickname);
    saveColour(colour);
    try {
      await joinSession(nickname.value, sessionId.value, colour.value.replace(/^#/, ""));
    } catch (e) {
      alert(e.message)
	  button.disabled = false;
    }
  });
};
