module.exports = {
  forbidden: [
    {
      name: 'no-interface-in-accounting',
      comment: 'Логика учета не должна зависеть от Telegram (interface)',
      severity: 'error',
      from: { path: '^supabase/functions/expense-bot/modules/accounting' },
      to: { path: '^supabase/functions/expense-bot/modules/interface' }
    },
    {
      name: 'no-telegram-in-reports',
      comment: 'Генератор Excel не должен знать о существовании бота',
      severity: 'error',
      from: { path: '^supabase/functions/expense-bot/modules/reports' },
      to: { path: '^supabase/functions/expense-bot/modules/interface' }
    },
    {
      name: 'circular-dependencies',
      comment: 'Запрет циклических зависимостей (петли в коде)',
      severity: 'error',
      from: {},
      to: { circular: true }
    }
  ]
};