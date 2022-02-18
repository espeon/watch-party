export async function emojify(text) {
  const emojiList = await emojis;
  let last = 0;
  let nodes = [];
  text.replace(/:([^\s:]+):/g, (match, name, index) => {
    if (last <= index)
      nodes.push(document.createTextNode(text.slice(last, index)));
    let emoji = emojiList.find((e) => e[0] == name);
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
export const emojis = Promise.all([
  fetch("/emojis")
    .then((e) => e.json())
    .then((e) => e.map((e) => [e.slice(0, -4), ":" + e.slice(0, -4) + ":", e.slice(-4)])),
  fetch("/emojis/unicode.json").then((e) => e.json()),
]).then((e) => e.flat(1));
