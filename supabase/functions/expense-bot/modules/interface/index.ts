
import { Bot, Context } from 'https://deno.land/x/grammy@v1.20.3/mod.ts';
import { getCategories } from '../accounting/index.ts';

export const bot = new Bot(Deno.env.get('TELEGRAM_BOT_TOKEN') || '');

function parseAmount(text: string) {
  const match = text.match(/(\d+(?:[.,]\d+)?)/);
  if (!match) return null;
  
  return {
    amount: parseFloat(match[0].replace(',', '.')),
    description: text.replace(match[0], '').trim()
  };
}

bot.command('start', (ctx: Context) => ctx.reply('Привет! Пришли сумму и описание (например: 500 нитки)'));

bot.on('message:text', async (ctx: Context) => {
  const text = ctx.message?.text || '';
  const parsed = parseAmount(text);
  
  if (!parsed) {
    return ctx.reply('Не вижу суммы. Попробуй еще раз.');
  }

  const categories = await getCategories();
  const categoryList = categories.map((c: { name: string }) => c.name).join(', ');
  
  await ctx.reply(
    `Вижу сумму: ${parsed.amount}\n` +
    `Описание: ${parsed.description}\n\n` +
    `Доступные категории: ${categoryList}`
  );
});
