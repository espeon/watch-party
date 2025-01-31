import { getRandomMsg } from "./utils";

const JOIN_MESSAGES = [
  "%username% has joined the party!",
  "welcome, %username%!",
  "welcome to the party, %username%!",
  "%username%, welcome to the party!",
  "welcome to the party, %username%!",
  "%username%, welcome!",
  "%username%, you're in!",
  "%username% brought pizza!",
  "A wild %username% appeared! (Throw Master Ball?) 🎮⚡",
  "%username% enters the battle arena! *Street Fighter theme intensifies* 🥋",
  "Phantom Thief alert! %username% has stolen the chat's spotlight 🎭✨",
  "%username% used 'Join Party'! It's super effective! 🌀",
  "Critical hit! %username% landed a Shoryuken on the lurkers! ↑→↓🔥",
  "New party member: %username% (Class: Chaos Mage) ⚔️📜",
  "Velvet Room update: %username% has forged the 'Chatter Persona'! 🎭",
  "Round 1... FIGHT! %username% vs. Awkward Silence 👊💥",
  "%username% challenged the chat to a Pokémon battle! 🐉🔴",
  "Achievement Unlocked: 'Summoned %username% with Megido Elixir' ☄️📛",
  "Trophy Earned: %username% Joined During Final Boss Music 🏆🎹",
  "%username% is now roaming the Paldea region of this chat! 🌏",
  "ALL OUT ATTACK initiated by %username%!",
  "PK CHAT activated by %username%! 💥🚨",
  "%username% entered the Metaverse. Shadow selves trembling 😈",
  "New summon: %username% (MP Cost: All your coffee) ☕💫",
  "Battle log: %username% used 'Mimic' on the last meme 📋",
  "Level Up! Chat's charisma +50 (%username% joined party) 💬✨",
  "Gym Leader %username% wants to battle! Rules: 6 memes only",
  "%username% found a save point! (99% chance of lingering)",
  "Critical join! %username% breaks the combo meter! 💢🎯",
  "New Quest: Keep %username% from mentioning FF7 for 24h ⏳❌",
  "%username% activated Chrono Trigger! (Channel history repeating) ⏳🌀",
];

const getJoinMessage = (username: string, roomId: string) => {
  return getRandomMsg(username, roomId, JOIN_MESSAGES);
};

export default getJoinMessage;
