import { webhookCallback } from 'https://deno.land/x/grammy@v1.21.1/mod.ts';
import { bot } from './modules/interface/index.ts';

// Это точка входа Edge Function
Deno.serve(async (req) => {
  try {
    // Просто сразу передаем запрос в Телеграм-бота
    return await webhookCallback(bot, 'std/http')(req);
  } catch (err) {
    console.error(err);
    return new Response('Internal Error', { status: 500 });
  }
});