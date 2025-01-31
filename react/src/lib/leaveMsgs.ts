import { getRandomMsg } from "./utils";

const LEAVE_MESSAGES = [
  "%username% has returned to the real world. (Shadow Selves rejoice?)",
  "Game Over... for %username%'s Wi-Fi connection.",
  "Critical Failure! %username% forgot to save before quitting!",
  "A wild %username% fled the battle! Better luck next time!",
  "%username% used 'Teleport'! ...But it hurt itself in confusion!",
  "KO! %username% left the server! Finish him... with DMs!",
  "Party member %username% despawned. Respawn timer: ∞ ",
  "%username% vanished like a Persona during low SP!",
  "Achievement Lost: %username% rage-quit the raid!",
  "GAME OVER MAN! %username% just unplugged the router.",
  "%username% was defeated by the final boss (irl responsibilities)",
  "Error: Player '%username%' disconnected. (Too much salt?)",
  "%username% wandered into the Lost Woods... and never returned",
  "FATALITY... %username% forgot to mute their mic first.",
  "%username% has left the Metaverse.",
  "Quest Failed: %username% didn’t ‘git gud’ in time",
  "%username%’s Pokémon Center visit took an unexpected forever…",
  "Eternal Punishment: %username%’s last message was ‘brb’",
  "%username% used ‘Alt+F4’! The chat’s in shambles!",
  "The party wipes... because %username% took the healer!",
  "%username% got Joker-ed (disappeared mid-convo)",
  "Blue screen of death detected. User: %username%.",
  "%username% ragequit! (C-C-C-COMBO BREAKER!!!)",
  "Save file corrupted. Last backup: %username%’s departure",
  "%username%’s health reached 0. Phoenix Down stocks: empty.",
];

const getLeaveMessage = (username: string, roomId: string) => {
  return getRandomMsg(username, roomId, LEAVE_MESSAGES);
};

export default getLeaveMessage;
