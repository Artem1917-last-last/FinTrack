/** --- УПРАВЛЕНИЕ ДОСТУПОМ (access_list) --- */

export async function getAllowedUsers() {
    const { data, error } = await supabaseAdmin
      .from("access_list") // Твое название таблицы
      .select("telegram_id, name"); // Твои колонки
    if (error) throw error;
    return data;
  }
  
  export async function addUser(targetId: string | number, name: string = "Пользователь") {
    const { error } = await supabaseAdmin
      .from("access_list")
      .insert([{ telegram_id: targetId.toString(), name }]);
    if (error) throw error;
  }
  
  export async function deleteUser(targetId: string | number) {
    const { error } = await supabaseAdmin
      .from("access_list")
      .delete()
      .eq("telegram_id", targetId.toString());
    if (error) throw error;
  }