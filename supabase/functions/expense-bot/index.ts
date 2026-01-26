// index.ts
import { webhookCallback } from "https://deno.land/x/grammy@v1.21.1/mod.ts";
import { bot } from "./modules/interface/index.ts";

const handleUpdate = webhookCallback(bot, "std/http");

Deno.serve(async (req) => {
  try {
    // Никаких проверок секретов и URL-параметров!
    return await handleUpdate(req);
  } catch (err) {
    console.error("Ошибка во время обработки запроса:", err);
    return new Response("Error handled", { status: 200 });
  }
});