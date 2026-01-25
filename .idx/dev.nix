{ pkgs, ... }: {
  channel = "stable-24.05"; # Обновляем канал

  packages = [
    pkgs.nodejs_22       # Переходим на 22-ю версию
    pkgs.supabase-cli
    pkgs.deno
  ];

  idx = {
    extensions = [
      "denoland.vscode-deno"
      "dbaeumer.vscode-eslint"
      "esbenp.prettier-vscode"
    ];
    
    workspace = {
      onCreate = {
        install-deps = "npm install";
      };
    };
  };
  services.docker.enable = true;
}