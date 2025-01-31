import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getRandomMsg(
  username: string,
  roomId: string,
  msgsArray: string[],
) {
  const base = username + roomId;
  const hash = Math.abs(
    base.split("").reduce((a, b) => a + b.charCodeAt(0), 0),
  );
  const index = Math.floor(hash % msgsArray.length);
  const randomMsg = msgsArray[index];
  return randomMsg.replace("%username%", username).replace("%roomId%", roomId);
}
