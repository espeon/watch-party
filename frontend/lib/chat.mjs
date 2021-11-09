const setupChatboxEvents = (socket) => {
  // clear events by just reconstructing the form
  const oldChatForm = document.querySelector("#chatbox-send");
  const chatForm = oldChatForm.cloneNode(true);
  oldChatForm.replaceWith(chatForm);

  chatForm.addEventListener("submit", (e) => {
    e.preventDefault();

    const input = chatForm.querySelector("input");
    const content = input.value;
    if (content.trim().length) {
      input.value = "";

      socket.send(
        JSON.stringify({
          op: "ChatMessage",
          data: {
            message: content,
          },
        })
      );
    }
  });
};

const fixChatSize = () => {
  const video = document.querySelector("video");
  const chatbox = document.querySelector("#chatbox");
  const chatboxContainer = document.querySelector("#chatbox-container");

  if (video && chatbox && chatboxContainer) {
    const delta = chatboxContainer.clientHeight - chatbox.clientHeight;

    chatbox.style["height"] = `calc(${
      window.innerHeight - video.clientHeight
    }px - ${delta}px - 1em)`;
  }
};

/**
 * @param {WebSocket} socket
 */
export const setupChat = async (socket) => {
  document.querySelector("#chatbox-container").style["display"] = "block";
  setupChatboxEvents(socket);

  fixChatSize();
  window.addEventListener("resize", () => {
    fixChatSize();
  });
};

const printToChat = (elem) => {
  const chatbox = document.querySelector("#chatbox");
  chatbox.appendChild(elem);
  chatbox.scrollTop = chatbox.scrollHeight;
};

export const handleChatEvent = (event) => {
  switch (event.op) {
    case "UserJoin": {
      // print something to the chat
      const chatMessage = document.createElement("div");
      chatMessage.classList.add("chat-message");
      chatMessage.classList.add("user-join");
      const userName = document.createElement("strong");
      userName.textContent = event.data;
      chatMessage.appendChild(userName);
      chatMessage.appendChild(document.createTextNode(" joined"));
      printToChat(chatMessage);

      break;
    }
    case "UserLeave": {
      const chatMessage = document.createElement("div");
      chatMessage.classList.add("chat-message");
      chatMessage.classList.add("user-leave");
      const userName = document.createElement("strong");
      userName.textContent = event.data;
      chatMessage.appendChild(userName);
      chatMessage.appendChild(document.createTextNode(" left"));
      printToChat(chatMessage);

      break;
    }
    case "ChatMessage": {
      const chatMessage = document.createElement("div");
      chatMessage.classList.add("chat-message");
      const userName = document.createElement("strong");
      userName.innerText = event.data.user;
      chatMessage.appendChild(userName);
      chatMessage.appendChild(document.createTextNode(" "));
      const messageContent = document.createElement("span");
      messageContent.classList.add("message-content");
      messageContent.textContent = event.data.message;
      chatMessage.appendChild(messageContent);
      printToChat(chatMessage);
      break;
    }
  }
};
