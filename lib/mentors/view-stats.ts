import { createAdminClient } from "@/lib/supabase/admin";

export type MentorViewStats = {
  today_views: number;
  week_views: number;
  top_today: { nickname: string; views: number }[];
  daily_last_7: { date: string; views: number }[];
};

export async function getMentorViewStats(): Promise<MentorViewStats> {
  const admin = createAdminClient();
  const now = new Date();
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);
  const weekStart = new Date(now);
  weekStart.setDate(weekStart.getDate() - 7);

  const { count: todayViews } = await admin
    .from("mentor_view_log")
    .select("id", { count: "exact", head: true })
    .gte("viewed_at", todayStart.toISOString());

  const { count: weekViews } = await admin
    .from("mentor_view_log")
    .select("id", { count: "exact", head: true })
    .gte("viewed_at", weekStart.toISOString());

  const { data: logsToday } = await admin
    .from("mentor_view_log")
    .select("mentor_id")
    .gte("viewed_at", todayStart.toISOString());

  const counts = new Map<string, number>();
  for (const row of logsToday ?? []) {
    const id = row.mentor_id as string;
    counts.set(id, (counts.get(id) ?? 0) + 1);
  }

  const topIds = [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([id]) => id);

  const top_today: MentorViewStats["top_today"] = [];
  if (topIds.length > 0) {
    const { data: mentors } = await admin
      .from("mentors")
      .select("id, nickname")
      .in("id", topIds);

    const nameMap = new Map(
      (mentors ?? []).map((m) => [m.id as string, m.nickname as string])
    );
    for (const id of topIds) {
      top_today.push({
        nickname: nameMap.get(id) ?? id.slice(0, 8),
        views: counts.get(id) ?? 0,
      });
    }
  }

  const { data: weekLogs } = await admin
    .from("mentor_view_log")
    .select("viewed_at")
    .gte("viewed_at", weekStart.toISOString());

  const daily = new Map<string, number>();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    daily.set(d.toISOString().slice(0, 10), 0);
  }
  for (const row of weekLogs ?? []) {
    const day = String(row.viewed_at).slice(0, 10);
    if (daily.has(day)) daily.set(day, (daily.get(day) ?? 0) + 1);
  }

  const daily_last_7 = [...daily.entries()].map(([date, views]) => ({
    date,
    views,
  }));

  return {
    today_views: todayViews ?? 0,
    week_views: weekViews ?? 0,
    top_today,
    daily_last_7,
  };
}
