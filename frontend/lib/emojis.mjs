export async function emojify(text) {
  await emojisLoaded;
  let last = 0;
  let nodes = [];
  text.replace(/:([^\s:]+):/g, (match, name, index) => {
    if (last <= index)
      nodes.push(document.createTextNode(text.slice(last, index)));
    let emoji;
    try {
      emoji = emojis[name.toLowerCase()[0]].find((e) => e[0] == name);
    } catch (e) {}
    if (!emoji) {
      nodes.push(document.createTextNode(match));
    } else {
      if (emoji[1][0] !== ":") {
        nodes.push(document.createTextNode(emoji[1]));
      } else {
        nodes.push(
          Object.assign(new Image(), {
            src: `/emojis/${name}${emoji[2]}`,
            className: "emoji",
            alt: name,
          })
        );
      }
    }
    last = index + match.length;
  });
  if (last < text.length) nodes.push(document.createTextNode(text.slice(last)));
  return nodes;
}
const emojis = {};

export const emojisLoaded = Promise.all([
  fetch("/emojis/unicode.json")
    .then((e) => e.json())
    .then((a) => {
      for (let e of a) {
        emojis[e[0][0]] = emojis[e[0][0]] || [];
        emojis[e[0][0]].push([e[0], e[1], null, e[0]]);
      }
    }),
  fetch("/emojos")
    .then((e) => e.json())
    .then((a) => {
      for (let e of a) {
        const name = e.slice(0, -4),
          lower = name.toLowerCase();
        emojis[lower[0]] = emojis[lower[0]] || [];
        emojis[lower[0]].push([name, ":" + name + ":", e.slice(-4), lower]);
      }
    }),
]);

export async function findEmojis(search) {
  await emojisLoaded;
  let groups = [[], []];
  if (search.length < 1) {
    for (let letter of Object.keys(emojis).sort())
      for (let emoji of emojis[letter]) {
        (emoji[1][0] === ":" ? groups[0] : groups[1]).push(emoji);
      }
  } else {
    search = search.toLowerCase();
    for (let emoji of emojis[search[0]]) {
      if (search.length == 1 || emoji[3].startsWith(search)) {
        (emoji[1][0] === ":" ? groups[0] : groups[1]).push(emoji);
      }
    }
  }
  return [...groups[1], ...groups[0]];
}
