import { sample } from "es-toolkit";

export async function getRandomCodeword() {
  const storage = useStorage("assets:server");

  const codewords = await storage.getItem<string[]>("codewords.json");
  if (!codewords) throw new Error("Codewords not found");

  return sample(codewords);
}
