import { createClient } from "@supabase/supabase-js";

export type UnivIntlTarget = {
  id: number;
  name_kr: string;
  name_en: string;
  intl_url: string;
};

function admin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Supabase admin env vars missing");
  return createClient(url, key);
}

/** intl_url_verified=true 이고 URL이 있는 대학만 스크래핑 대상 */
export async function loadVerifiedIntlUniversities(): Promise<UnivIntlTarget[]> {
  const supabase = admin();
  const { data, error } = await supabase
    .from("universities")
    .select("id, name_kr, name_en, intl_url")
    .eq("is_active", true)
    .eq("intl_url_verified", true)
    .not("intl_url", "is", null)
    .neq("intl_url", "")
    .order("name_kr", { ascending: true });

  if (error) throw new Error(error.message);

  return (data ?? []).map((row) => ({
    id: row.id as number,
    name_kr: String(row.name_kr ?? ""),
    name_en: String(row.name_en ?? ""),
    intl_url: String(row.intl_url ?? "").trim(),
  }));
}
