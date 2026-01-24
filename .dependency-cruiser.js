{
  "tasks": {
    "check-arch": "npx dependency-cruiser supabase/functions/expense-bot/modules --config .dependency-cruiser.js",
    "deploy": "deno task check-arch && supabase functions deploy expense-bot --no-verify-jwt"
  },
  "imports": {
    "@/": "./supabase/functions/expense-bot/modules/",
    "grammy": "https://deno.land/x/grammy@v1.21.1/mod.ts",
    "supabase": "npm:@supabase/supabase-js@2.39.7",
    "sheetjs": "https://cdn.sheetjs.com/xlsx-0.20.1/package/xlsx.mjs",
    "@std/datetime": "https://deno.land/std@0.217.0/datetime/mod.ts"
  },
  "lint": {
    "rules": {
      "tags": ["recommended"]
    }
  }
}