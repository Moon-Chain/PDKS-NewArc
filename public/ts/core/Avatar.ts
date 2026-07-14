/**
 * renderAvatar — DOM modal'larda (innerHTML ile oluşturulan) kullanılır.
 * Gerçek değerler (name, avatarPath) zaten elimizde olduğunda.
 */
export function renderAvatar(name: string, avatarPath?: string | null, sizePx = 36): string {
  const initial = (name?.[0] ?? '?').toUpperCase();
  const base    = `width:${sizePx}px;height:${sizePx}px;border-radius:50%;flex-shrink:0;`;
  if (avatarPath) {
    return `<img src="${avatarPath}" alt="${initial}" style="${base}object-fit:cover;display:block;" />`;
  }
  return `<span style="${base}display:inline-flex;align-items:center;justify-content:center;">${initial}</span>`;
}

/**
 * alpineAvatar — Alpine x-data template'leri içinde kullanılır.
 * Wrapper div'in inner content'ini oluşturur; wrapper'da padding:0;overflow:hidden ekleyin avatar varsa.
 * avatarExpr: Alpine expression (ör: "row.avatar_path", "selectedUser?.avatar_path")
 * nameExpr:   Alpine expression (ör: "row.user_name", "selectedUser?.name")
 */
export function alpineAvatar(avatarExpr: string, nameExpr: string): string {
  return `
    <template x-if="${avatarExpr}">
      <img :src="${avatarExpr}" alt="" style="width:100%;height:100%;object-fit:cover;border-radius:50%;display:block" />
    </template>
    <template x-if="!(${avatarExpr})">
      <span x-text="(${nameExpr})?.[0]?.toUpperCase()??'?'" style="width:100%;height:100%;display:flex;align-items:center;justify-content:center"></span>
    </template>`;
}
