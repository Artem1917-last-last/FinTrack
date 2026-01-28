-- 1. Таблица доступа
CREATE TABLE access_list (
    telegram_id text PRIMARY KEY,
    name text,
    added_at timestamp with time zone DEFAULT now()
);

-- 2. Категории
CREATE TABLE categories (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    user_id text,
    is_archived boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now()
);

-- 3. Расходы
CREATE TABLE expenses (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id text NOT NULL,
    amount numeric NOT NULL,
    category_id uuid REFERENCES categories(id), -- Связь с категориями
    comment text,
    created_at timestamp with time zone DEFAULT now()
);

-- 4. Сессии бота
CREATE TABLE bot_sessions (
    user_id text PRIMARY KEY,
    amount numeric,
    comment text,
    step text,
    report_from text,
    target_user_id text,
    created_at timestamp with time zone DEFAULT now()
);

-- 5. Включаем защиту RLS (как мы делали ранее)
ALTER TABLE access_list ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE bot_sessions ENABLE ROW LEVEL SECURITY;