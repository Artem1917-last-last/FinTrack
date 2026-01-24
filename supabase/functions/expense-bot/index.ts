import { webhookCallback } from 'https://deno.land/x/grammy@v1.20.3/mod.ts';
import { bot } from './modules/interface/index.ts';

// Это точка входа Edge Function
Deno.serve(async (req) => {
  try {
    const url = new URL(req.url);
    // Простейшая проверка безопасности: токен бота в пути (опционально)
    if (url.searchParams.get('secret') !== Deno.env.get('FUNCTION_SECRET')) {
      return new Response('Not allowed', { status: 403 });
    }

    return await webhookCallback(bot, 'std/http')(req);
  } catch (err) {
    console.error(err);
    return new Response('Internal Error', { status: 500 });
  }
});