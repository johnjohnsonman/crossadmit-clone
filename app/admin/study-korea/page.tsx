"use client";

import {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useSearchParams } from "next/navigation";
import { CATEGORY_LABELS_KR } from "@/lib/study-korea/constants";
import MentorUniversityRematchCard from "@/components/admin/MentorUniversityRematchCard";
import {
  STUDY_KOREA_SOURCE_META,
  getSourceCardBorder,
  type SourceStatus,
} from "@/lib/pipeline/study-korea/sources-registry";
import { ADMISSION_QUERY_COUNT } from "@/lib/pipeline/study-korea/admission-queries";

type PipelineRun = {
  id: string;
  source: string;
  query: string;
  collected: number;
  processed: number;
  saved: number;
  failed: number;
  routed_admissions?: number;
  routed_review?: number;
  routed_general?: number;
  status: string;
  error_message: string;
  created_at: string;
};

type AdminPost = {
  id: string;
  source: string;
  title: string;
  category: string;
  university: string;
  is_published: boolean;
  is_featured: boolean;
  upvotes: number;
  created_at: string;
  ai_summary?: string;
  ai_summary_kr?: string;
  ai_title_en?: string;
  ai_summary_en?: string;
};

type AdminUniv = {
  id: number;
  name_kr: string;
  name_en: string;
  intl_url: string;
  intl_url_verified: boolean;
};

function AdminStudyKoreaInner() {
  const searchParams = useSearchParams();
  const keyFromUrl = searchParams.get("key") ?? "";
  const [key, setKey] = useState(keyFromUrl);
  const [authorized, setAuthorized] = useState(false);
  const [loadErr, setLoadErr] = useState<string | null>(null);
  const [runs, setRuns] = useState<PipelineRun[]>([]);
  const [statsByCategory, setStatsByCategory] = useState<Record<string, number>>({});
  const [statsBySource, setStatsBySource] = useState<Record<string, number>>({});
  const [posts, setPosts] = useState<AdminPost[]>([]);
  const [universities, setUniversities] = useState<AdminUniv[]>([]);
  const [univEdits, setUnivEdits] = useState<
    Record<number, { intl_url: string; intl_url_verified: boolean }>
  >({});
  const [loading, setLoading] = useState(false);
  const [runningSource, setRunningSource] = useState<string | null>(null);
  const [runMsg, setRunMsg] = useState<string | null>(null);
  const [saving, setSaving] = useState<string | null>(null);
  const [sourceFilter, setSourceFilter] = useState<string>("all");
  const [enRows, setEnRows] = useState<Set<string>>(new Set());
  const [enBackfill, setEnBackfill] = useState({
    total: 0,
    translated: 0,
    remaining: 0,
  });
  const [enBackfillLoading, setEnBackfillLoading] = useState(false);
  const [enBackfillRunning, setEnBackfillRunning] = useState(false);
  const [enBackfillAuto, setEnBackfillAuto] = useState(false);
  const [enBackfillLog, setEnBackfillLog] = useState<string | null>(null);
  const enBackfillStopRef = useRef(false);
  const [reclassify, setReclassify] = useState({
    total: 0,
    reclassified: 0,
    remaining: 0,
    kept_published: 0,
    hidden: 0,
  });
  const [reclassifyLoading, setReclassifyLoading] = useState(false);
  const [reclassifyRunning, setReclassifyRunning] = useState(false);
  const [reclassifyAuto, setReclassifyAuto] = useState(false);
  const [reclassifyLog, setReclassifyLog] = useState<string | null>(null);
  const reclassifyStopRef = useRef(false);
  const [redditTestLoading, setRedditTestLoading] = useState(false);
  const [redditTestResult, setRedditTestResult] = useState<string | null>(null);
  const [isRedditRunning, setIsRedditRunning] = useState(false);
  const [redditRunLog, setRedditRunLog] = useState<string | null>(null);
  const [slugBackfill, setSlugBackfill] = useState({
    total: 0,
    with_slug: 0,
    remaining: 0,
  });
  const [slugBackfillLoading, setSlugBackfillLoading] = useState(false);
  const [slugBackfillRunning, setSlugBackfillRunning] = useState(false);
  const [slugBackfillLog, setSlugBackfillLog] = useState<string | null>(null);
  const [aiGuides, setAiGuides] = useState({
    total: 0,
    pending: 0,
    generating_kr: 0,
    completed: 0,
    topics: [] as {
      id: string;
      topic_title: string;
      category: string;
      priority: number;
      status: string;
      generated_post_id: string | null;
    }[],
    generated_posts: [] as {
      id: string;
      topic_title: string;
      path: string | null;
    }[],
  });
  const [aiGuidesLoading, setAiGuidesLoading] = useState(false);
  const [aiGuidesRunning, setAiGuidesRunning] = useState(false);
  const [aiGuidesAuto, setAiGuidesAuto] = useState(false);
  const [aiGuidesLog, setAiGuidesLog] = useState<string | null>(null);
  const [aiGuidesLogError, setAiGuidesLogError] = useState(false);
  const aiGuidesStopRef = useRef(false);
  const [aiTopicModal, setAiTopicModal] = useState(false);
  const [aiTopicForm, setAiTopicForm] = useState({
    topic_title: "",
    category: "visa",
    keywords: "",
    priority: 5,
  });
  const [aiTopicSaving, setAiTopicSaving] = useState(false);
  const [mentorTranslate, setMentorTranslate] = useState({
    total: 141,
    translated: 0,
    remaining: 141,
    inactive: 9,
  });
  const [mentorTranslateLoading, setMentorTranslateLoading] = useState(false);
  const [mentorTranslateRunning, setMentorTranslateRunning] = useState(false);
  const [mentorTranslateAuto, setMentorTranslateAuto] = useState(false);
  const [mentorTranslateLog, setMentorTranslateLog] = useState<string | null>(null);
  const mentorTranslateStopRef = useRef(false);
  const [mentorViewStats, setMentorViewStats] = useState({
    today_views: 0,
    week_views: 0,
    top_today: [] as { nickname: string; views: number }[],
    daily_last_7: [] as { date: string; views: number }[],
  });
  const [mentorViewStatsLoading, setMentorViewStatsLoading] = useState(false);
  const [admissionPending, setAdmissionPending] = useState<number | null>(null);
  const [admissionCollectRunning, setAdmissionCollectRunning] = useState(false);
  const [admissionCollectStatus, setAdmissionCollectStatus] = useState("");
  const [admissionCollectStats, setAdmissionCollectStats] = useState<{
    new?: number;
    duplicates?: number;
    filtered?: number;
    queries_used?: number;
    sample_titles?: string[];
    aborted?: boolean;
    next_start_index?: number;
  } | null>(null);
  const admissionAbortRef = useRef<AbortController | null>(null);
  const [krIntlStats, setKrIntlStats] = useState({
    total_kr: 0,
    verified: 0,
    pending: 0,
  });
  const [krIntlRunning, setKrIntlRunning] = useState(false);
  const [krIntlFailures, setKrIntlFailures] = useState<
    { id: number; name_kr: string; name_en: string; reason: string }[]
  >([]);
  const [krIntlLog, setKrIntlLog] = useState<string | null>(null);
  const [reviewPending, setReviewPending] = useState(0);
  const [classifierUsage, setClassifierUsage] = useState({
    dailyCalls: 0,
    dailyLimit: 500,
    runCalls: 0,
    perRunLimit: 100,
  });

  const AI_GUIDE_CATEGORIES = [
    "visa",
    "scholarship",
    "admission",
    "living_cost",
    "language",
    "settlement",
    "dormitory",
    "employment",
    "culture",
  ] as const;

  const REDDIT_SUBREDDITS = [
    "StudyInKorea",
    "koreanstudents",
    "IntltoKorea",
    "Korea",
    "learnkorean",
    "IWantOut",
    "movingtokorea",
  ] as const;

  useEffect(() => {
    if (keyFromUrl && keyFromUrl !== key) setKey(keyFromUrl);
  }, [keyFromUrl]); // eslint-disable-line react-hooks/exhaustive-deps

  const hdrs = useCallback(
    (json = false): HeadersInit => ({
      ...(json ? { "Content-Type": "application/json" } : {}),
      ...(key.trim() ? { "x-admin-secret": key.trim() } : {}),
    }),
    [key]
  );

  const loadReclassifyStatus = useCallback(async () => {
    if (!key.trim()) return;
    setReclassifyLoading(true);
    try {
      const res = await fetch("/api/admin/reclassify", { headers: hdrs() });
      if (res.status === 401) return;
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "재분류 상태 조회 실패");
      setReclassify({
        total: json.total ?? 0,
        reclassified: json.reclassified ?? 0,
        remaining: json.remaining ?? 0,
        kept_published: json.kept_published ?? 0,
        hidden: json.hidden ?? 0,
      });
    } catch (e) {
      setReclassifyLog(
        e instanceof Error ? e.message : "재분류 상태 조회 오류"
      );
    } finally {
      setReclassifyLoading(false);
    }
  }, [key, hdrs]);

  const loadSlugBackfillStatus = useCallback(async () => {
    if (!key.trim()) return;
    setSlugBackfillLoading(true);
    try {
      const res = await fetch("/api/admin/backfill-slug", { headers: hdrs() });
      if (res.status === 401) return;
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Slug 상태 조회 실패");
      setSlugBackfill({
        total: json.total ?? 0,
        with_slug: json.with_slug ?? 0,
        remaining: json.remaining ?? 0,
      });
    } catch (e) {
      setSlugBackfillLog(
        e instanceof Error ? e.message : "Slug 백필 상태 조회 오류"
      );
    } finally {
      setSlugBackfillLoading(false);
    }
  }, [key, hdrs]);

  const runSlugBackfillBatch = async () => {
    if (!key.trim()) return;
    setSlugBackfillRunning(true);
    setSlugBackfillLog(null);
    try {
      const res = await fetch("/api/admin/backfill-slug", {
        method: "POST",
        headers: hdrs(true),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Slug 백필 실패");
      setSlugBackfill({
        total: json.total ?? 0,
        with_slug: json.with_slug ?? 0,
        remaining: json.remaining ?? 0,
      });
      setSlugBackfillLog(
        `처리 ${json.batch?.processed ?? 0}건 · 업데이트 ${json.batch?.updated ?? 0}건 · 실패 ${json.batch?.failed ?? 0}건`
      );
    } catch (e) {
      setSlugBackfillLog(e instanceof Error ? e.message : "Slug 백필 오류");
    } finally {
      setSlugBackfillRunning(false);
    }
  };

  const loadKrIntlStats = useCallback(async () => {
    if (!key.trim()) return;
    try {
      const res = await fetch("/api/admin/universities/auto-verify-kr", {
        headers: hdrs(),
      });
      if (res.status === 401) return;
      const json = await res.json();
      if (!res.ok) return;
      setKrIntlStats({
        total_kr: json.total_kr ?? 0,
        verified: json.verified ?? 0,
        pending: json.pending ?? 0,
      });
    } catch {
      /* ignore */
    }
  }, [key, hdrs]);

  const loadAdmissionPendingCount = useCallback(async () => {
    if (!key.trim()) return;
    try {
      const res = await fetch("/api/admin/admission-posts/pending-count", {
        headers: hdrs(),
      });
      if (res.status === 401) return;
      const json = await res.json();
      if (!res.ok) return;
      setAdmissionPending(json.count ?? 0);
    } catch {
      /* migration 019 미적용 시 무시 */
    }
  }, [key, hdrs]);

  const loadMentorViewStats = useCallback(async () => {
    if (!key.trim()) return;
    setMentorViewStatsLoading(true);
    try {
      const res = await fetch("/api/admin/mentors/view-stats", {
        headers: hdrs(),
      });
      if (res.status === 401) return;
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "조회 통계 로드 실패");
      setMentorViewStats({
        today_views: json.today_views ?? 0,
        week_views: json.week_views ?? 0,
        top_today: json.top_today ?? [],
        daily_last_7: json.daily_last_7 ?? [],
      });
    } catch {
      /* table may not exist until migration 018 */
    } finally {
      setMentorViewStatsLoading(false);
    }
  }, [key, hdrs]);

  const loadMentorTranslateStatus = useCallback(async () => {
    if (!key.trim()) return;
    setMentorTranslateLoading(true);
    try {
      const res = await fetch("/api/admin/mentors/translate", { headers: hdrs() });
      if (res.status === 401) return;
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "멘토 번역 상태 조회 실패");
      setMentorTranslate({
        total: json.total ?? 0,
        translated: json.translated ?? 0,
        remaining: json.remaining ?? 0,
        inactive: json.inactive ?? 0,
      });
    } catch (e) {
      setMentorTranslateLog(
        e instanceof Error ? e.message : "멘토 번역 상태 오류"
      );
    } finally {
      setMentorTranslateLoading(false);
    }
  }, [key, hdrs]);

  const runMentorTranslateBatch = async () => {
    if (!key.trim()) return;
    setMentorTranslateRunning(true);
    setMentorTranslateLog(null);
    try {
      const res = await fetch("/api/admin/mentors/translate", {
        method: "POST",
        headers: hdrs(true),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "번역 실패");
      setMentorTranslate({
        total: json.total ?? 0,
        translated: json.translated ?? 0,
        remaining: json.remaining ?? 0,
        inactive: json.inactive ?? 0,
      });
      const b = json.batch;
      setMentorTranslateLog(
        `10건 처리 — 성공 ${b?.updated ?? 0} · 실패 ${b?.failed ?? 0} · 남은 ${json.remaining ?? 0}`
      );
    } catch (e) {
      setMentorTranslateLog(e instanceof Error ? e.message : "오류");
    } finally {
      setMentorTranslateRunning(false);
    }
  };

  const runMentorTranslateAuto = async () => {
    if (!key.trim() || mentorTranslateAuto) return;
    setMentorTranslateAuto(true);
    mentorTranslateStopRef.current = false;
    setMentorTranslateLog("멘토 전체 번역 시작…");
    try {
      while (!mentorTranslateStopRef.current && mentorTranslate.remaining > 0) {
        setMentorTranslateRunning(true);
        const res = await fetch("/api/admin/mentors/translate", {
          method: "POST",
          headers: hdrs(true),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "번역 실패");
        setMentorTranslate({
          total: json.total ?? 0,
          translated: json.translated ?? 0,
          remaining: json.remaining ?? 0,
          inactive: json.inactive ?? 0,
        });
        if ((json.batch?.processed ?? 0) === 0) break;
        setMentorTranslateLog(
          `진행: ${json.translated}/${json.total} (남은 ${json.remaining})`
        );
        await new Promise((r) => setTimeout(r, 2000));
      }
      setMentorTranslateLog((p) => `${p ?? ""}\n완료`);
    } catch (e) {
      setMentorTranslateLog(e instanceof Error ? e.message : "자동 번역 오류");
    } finally {
      setMentorTranslateRunning(false);
      setMentorTranslateAuto(false);
    }
  };

  const loadAiGuidesStatus = useCallback(async () => {
    if (!key.trim()) return;
    setAiGuidesLoading(true);
    try {
      const res = await fetch("/api/admin/ai-guides/generate", {
        headers: hdrs(),
      });
      if (res.status === 401) return;
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "AI 가이드 상태 조회 실패");
      setAiGuides({
        total: json.total ?? 0,
        pending: json.pending ?? 0,
        generating_kr: json.generating_kr ?? 0,
        completed: json.completed ?? 0,
        topics: json.topics ?? [],
        generated_posts: json.generated_posts ?? [],
      });
    } catch (e) {
      setAiGuidesLogError(true);
      setAiGuidesLog(
        e instanceof Error ? e.message : "AI 가이드 상태 조회 오류"
      );
    } finally {
      setAiGuidesLoading(false);
    }
  }, [key, hdrs]);

  const applyAiGuideStatus = (json: Record<string, unknown>) => {
    setAiGuides({
      total: Number(json.total ?? 0),
      pending: Number(json.pending ?? 0),
      generating_kr: Number(json.generating_kr ?? 0),
      completed: Number(json.completed ?? 0),
      topics: (json.topics as typeof aiGuides.topics) ?? [],
      generated_posts:
        (json.generated_posts as typeof aiGuides.generated_posts) ?? [],
    });
  };

  const parseApiJson = async (res: Response, step: string) => {
    const text = await res.text();
    try {
      return JSON.parse(text) as Record<string, unknown>;
    } catch {
      throw new Error(
        `${step} failed: ${text.substring(0, 120) || res.statusText}`
      );
    }
  };

  const runAiGuideOnce = async (): Promise<boolean> => {
    if (!key.trim()) return false;

    setAiGuidesLogError(false);
    setAiGuidesLog("Step 1/2: Generating English guide…");

    const res1 = await fetch("/api/admin/ai-guides/generate", {
      method: "POST",
      headers: hdrs(true),
    });
    const data1 = await parseApiJson(res1, "Step 1");
    if (!res1.ok) {
      throw new Error(String(data1.error ?? "Step 1 failed"));
    }
    if (!data1.success) {
      const msg = String(data1.error ?? "Step 1 failed");
      if (msg.includes("No pending")) return false;
      throw new Error(msg);
    }
    applyAiGuideStatus(data1);

    const postId = String(data1.post_id ?? "");
    if (!postId) {
      throw new Error("Step 1: missing post_id");
    }

    const topicTitle = String(data1.topic_title ?? "Guide");
    setAiGuidesLog(
      `Step 1 done: "${topicTitle}". Step 2/2: Translating to Korean…`
    );

    const res2 = await fetch("/api/admin/ai-guides/translate", {
      method: "POST",
      headers: hdrs(true),
      body: JSON.stringify({ post_id: postId }),
    });
    const data2 = await parseApiJson(res2, "Step 2");
    if (!res2.ok || !data2.success) {
      throw new Error(String(data2.error ?? "Step 2 failed"));
    }
    applyAiGuideStatus(data2);

    const redirect = String(data2.redirect ?? "");
    setAiGuidesLog(
      `✅ Done: ${String(data2.topic_title ?? topicTitle)}${redirect ? ` → ${redirect}` : ""}`
    );
    return true;
  };

  const runAiGuideBatch = async () => {
    if (!key.trim() || aiGuidesRunning) return;
    setAiGuidesRunning(true);
    setAiGuidesLog(null);
    setAiGuidesLogError(false);
    try {
      const ok = await runAiGuideOnce();
      if (!ok) {
        setAiGuidesLogError(true);
        setAiGuidesLog("대기 중인 토픽이 없습니다.");
      }
      await loadAiGuidesStatus();
    } catch (e) {
      setAiGuidesLogError(true);
      setAiGuidesLog(`❌ ${e instanceof Error ? e.message : "AI 가이드 생성 오류"}`);
    } finally {
      setAiGuidesRunning(false);
    }
  };

  const runAiGuideAuto = async () => {
    if (!key.trim() || aiGuidesAuto) return;
    setAiGuidesAuto(true);
    aiGuidesStopRef.current = false;
    setAiGuidesLogError(false);
    setAiGuidesLog("5개 자동 생성 시작…");
    let done = 0;
    try {
      for (let i = 0; i < 5; i++) {
        if (aiGuidesStopRef.current) break;
        setAiGuidesRunning(true);
        setAiGuidesLog(`[${i + 1}/5] 시작…`);
        try {
          const ok = await runAiGuideOnce();
          if (!ok) break;
          done++;
        } catch (e) {
          setAiGuidesLogError(true);
          setAiGuidesLog(
            `❌ [${i + 1}/5] ${e instanceof Error ? e.message : "오류"}`
          );
          break;
        }
        if (i < 4 && !aiGuidesStopRef.current) {
          setAiGuidesLog((prev) => `${prev ?? ""}\n3초 후 다음 토픽…`);
          await new Promise((r) => setTimeout(r, 3000));
        }
      }
      if (!aiGuidesStopRef.current) {
        setAiGuidesLog((prev) => `${prev ?? ""}\n완료 ${done}건`);
      }
      await loadAiGuidesStatus();
    } catch (e) {
      setAiGuidesLogError(true);
      setAiGuidesLog(`❌ ${e instanceof Error ? e.message : "자동 생성 오류"}`);
    } finally {
      setAiGuidesRunning(false);
      setAiGuidesAuto(false);
    }
  };

  const stopAiGuideAuto = () => {
    aiGuidesStopRef.current = true;
    setAiGuidesAuto(false);
  };

  const submitAiTopic = async () => {
    if (!key.trim() || !aiTopicForm.topic_title.trim()) return;
    setAiTopicSaving(true);
    try {
      const res = await fetch("/api/admin/ai-guides/topics", {
        method: "POST",
        headers: hdrs(true),
        body: JSON.stringify(aiTopicForm),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "토픽 추가 실패");
      setAiTopicModal(false);
      setAiTopicForm({
        topic_title: "",
        category: "visa",
        keywords: "",
        priority: 5,
      });
      await loadAiGuidesStatus();
      setAiGuidesLog(`토픽 추가: ${json.topic?.topic_title}`);
    } catch (e) {
      setAiGuidesLog(e instanceof Error ? e.message : "토픽 추가 오류");
    } finally {
      setAiTopicSaving(false);
    }
  };

  const loadBackfillStatus = useCallback(async () => {
    if (!key.trim()) return;
    setEnBackfillLoading(true);
    try {
      const res = await fetch("/api/admin/backfill-english", {
        headers: hdrs(),
      });
      if (res.status === 401) return;
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "상태 조회 실패");
      setEnBackfill({
        total: json.total ?? 0,
        translated: json.translated ?? 0,
        remaining: json.remaining ?? 0,
      });
    } catch (e) {
      setEnBackfillLog(
        e instanceof Error ? e.message : "영어 백필 상태 조회 오류"
      );
    } finally {
      setEnBackfillLoading(false);
    }
  }, [key, hdrs]);

  const loadAll = useCallback(async () => {
    if (!key.trim()) {
      setLoadErr("ADMIN_SECRET 또는 ?key= 로 키를 입력하세요.");
      return;
    }
    setLoading(true);
    setLoadErr(null);
    try {
      const res = await fetch("/api/admin/study-korea", { headers: hdrs() });
      if (res.status === 401) {
        setAuthorized(false);
        setLoadErr("키가 올바르지 않거나 ADMIN_SECRET 미설정입니다.");
        return;
      }
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "로드 실패");
      setAuthorized(true);
      setRuns(json.runs ?? []);
      setStatsByCategory(json.stats ?? {});
      setStatsBySource(json.statsBySource ?? {});
      setPosts(json.posts ?? []);
      const univs = (json.universities ?? []) as AdminUniv[];
      setUniversities(univs);
      const edits: Record<
        number,
        { intl_url: string; intl_url_verified: boolean }
      > = {};
      for (const u of univs) {
        edits[u.id] = {
          intl_url: u.intl_url ?? "",
          intl_url_verified: Boolean(u.intl_url_verified),
        };
      }
      setUnivEdits(edits);
      setReviewPending(Number(json.reviewPending ?? 0));
      if (json.classifier) {
        setClassifierUsage({
          dailyCalls: json.classifier.dailyCalls ?? 0,
          dailyLimit: json.classifier.dailyLimit ?? 500,
          runCalls: json.classifier.runCalls ?? 0,
          perRunLimit: json.classifier.perRunLimit ?? 100,
        });
      }
      void loadBackfillStatus();
      void loadSlugBackfillStatus();
      void loadReclassifyStatus();
      void loadAiGuidesStatus();
      void loadMentorTranslateStatus();
      void loadMentorViewStats();
      void loadAdmissionPendingCount();
      void loadKrIntlStats();
    } catch (e) {
      setAuthorized(false);
      setLoadErr(e instanceof Error ? e.message : "오류");
    } finally {
      setLoading(false);
    }
  }, [hdrs, key, loadBackfillStatus, loadReclassifyStatus, loadAiGuidesStatus, loadMentorTranslateStatus, loadMentorViewStats, loadAdmissionPendingCount, loadKrIntlStats]);

  const runKrIntlAutoVerify = async () => {
    if (!key.trim()) return;
    setKrIntlRunning(true);
    setKrIntlLog(null);
    setKrIntlFailures([]);
    try {
      const res = await fetch("/api/admin/universities/auto-verify-kr", {
        method: "POST",
        headers: hdrs(true),
        body: JSON.stringify({ limit: 15 }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "자동 verify 실패");
      if (json.stats) {
        setKrIntlStats(json.stats);
      } else {
        await loadKrIntlStats();
      }
      setKrIntlFailures(json.failed ?? []);
      setKrIntlLog(
        `${json.success_count ?? 0}개 verify 완료, ${json.fail_count ?? 0}개 실패 (배치 15건)`
      );
      await loadAll();
    } catch (e) {
      setKrIntlLog(e instanceof Error ? e.message : "오류");
    } finally {
      setKrIntlRunning(false);
    }
  };

  const collectAdmissionSmall = async (limit: number) => {
    if (!key.trim()) return;
    setAdmissionCollectRunning(true);
    setAdmissionCollectStatus(`${limit}건 수집 중…`);
    setAdmissionCollectStats(null);
    setRunMsg(null);

    const ac = new AbortController();
    admissionAbortRef.current = ac;

    try {
      const res = await fetch("/api/admin/scrape-admissions-small", {
        method: "POST",
        signal: ac.signal,
        headers: {
          "Content-Type": "application/json",
          "x-admin-secret": key.trim(),
        },
        body: JSON.stringify({ limit }),
      });
      const json = (await res.json()) as {
        error?: string;
        new?: number;
        duplicates?: number;
        filtered?: number;
        queries_used?: number;
        sample_titles?: string[];
        aborted?: boolean;
        next_start_index?: number;
        message?: string;
      };
      if (!res.ok) throw new Error(String(json.error || "수집 실패"));
      setAdmissionCollectStats(json);
      const label = json.aborted ? "중단됨" : "완료";
      setAdmissionCollectStatus(
        `${label}: 신규 ${json.new ?? 0}건, 중복 ${json.duplicates ?? 0}건` +
          (json.filtered ? `, 필터 제외 ${json.filtered}건` : "")
      );
      setRunMsg(
        `합격 후기 수집 — 신규 ${json.new ?? 0}건 (검토 대기 목록 갱신)`
      );
      await loadAdmissionPendingCount();
    } catch (e) {
      if (e instanceof Error && e.name === "AbortError") {
        setAdmissionCollectStatus("중단됨 (클라이언트)");
      } else {
        setAdmissionCollectStatus(
          `실패: ${e instanceof Error ? e.message : "오류"}`
        );
      }
    } finally {
      setAdmissionCollectRunning(false);
      admissionAbortRef.current = null;
    }
  };

  const abortAdmissionCollect = () => {
    admissionAbortRef.current?.abort();
  };

  const runAdmissionCollect = async () => {
    await collectAdmissionSmall(200);
  };

  useEffect(() => {
    if (keyFromUrl.trim()) void loadAll();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const statusBadge = (status: SourceStatus, label?: string) => {
    if (status === "active") return null;
    const text =
      label ??
      (status === "config_required" ? "설정 필요" : "지원 불가");
    const cls =
      status === "config_required"
        ? "bg-amber-100 text-amber-900"
        : "bg-slate-200 text-slate-600";
    return (
      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded ${cls}`}>
        {text}
      </span>
    );
  };

  const runBackfillBatch = async () => {
    if (!key.trim() || enBackfillRunning) return;
    setEnBackfillRunning(true);
    setEnBackfillLog(null);
    try {
      const res = await fetch("/api/admin/backfill-english", {
        method: "POST",
        headers: hdrs(),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "번역 실패");
      setEnBackfill({
        total: json.total ?? 0,
        translated: json.translated ?? 0,
        remaining: json.remaining ?? 0,
      });
      const batch = json.batch;
      if (batch?.updated) {
        setEnBackfillLog(
          `10건 처리 — 성공 ${batch.updated}건, 실패 ${batch.failed ?? 0}건`
        );
      } else if (batch?.processed === 0) {
        setEnBackfillLog("번역할 게시물이 없습니다.");
      } else {
        setEnBackfillLog("배치 완료");
      }
      await loadAll();
    } catch (e) {
      setEnBackfillLog(e instanceof Error ? e.message : "번역 오류");
    } finally {
      setEnBackfillRunning(false);
    }
  };

  const stopBackfillAuto = () => {
    enBackfillStopRef.current = true;
    setEnBackfillAuto(false);
    setEnBackfillLog("자동 실행 중지됨");
  };

  const runBackfillAuto = async () => {
    if (!key.trim() || enBackfillAuto) return;
    enBackfillStopRef.current = false;
    setEnBackfillAuto(true);
    setEnBackfillLog("전체 자동 실행 시작…");
    try {
      while (!enBackfillStopRef.current) {
        const statusRes = await fetch("/api/admin/backfill-english", {
          headers: hdrs(),
        });
        const statusJson = await statusRes.json();
        if (!statusRes.ok) {
          throw new Error(statusJson.error || "상태 조회 실패");
        }
        setEnBackfill({
          total: statusJson.total ?? 0,
          translated: statusJson.translated ?? 0,
          remaining: statusJson.remaining ?? 0,
        });
        if ((statusJson.remaining ?? 0) === 0) {
          setEnBackfillLog("전체 번역 완료");
          break;
        }

        const postRes = await fetch("/api/admin/backfill-english", {
          method: "POST",
          headers: hdrs(),
        });
        const postJson = await postRes.json();
        if (!postRes.ok) {
          throw new Error(postJson.error || "번역 실패");
        }
        setEnBackfill({
          total: postJson.total ?? 0,
          translated: postJson.translated ?? 0,
          remaining: postJson.remaining ?? 0,
        });
        const u = postJson.batch?.updated ?? 0;
        const f = postJson.batch?.failed ?? 0;
        setEnBackfillLog(
          `진행 중… ${postJson.translated}/${postJson.total} (이번 배치 +${u}, 실패 ${f})`
        );

        if ((postJson.batch?.processed ?? 0) === 0) {
          setEnBackfillLog("더 이상 처리할 항목이 없습니다.");
          break;
        }

        if (enBackfillStopRef.current) break;
        await new Promise((r) => setTimeout(r, 2000));
      }
      await loadAll();
    } catch (e) {
      setEnBackfillLog(e instanceof Error ? e.message : "자동 실행 오류");
    } finally {
      setEnBackfillAuto(false);
      enBackfillStopRef.current = false;
    }
  };

  const runReclassifyBatch = async () => {
    if (!key.trim() || reclassifyRunning) return;
    setReclassifyRunning(true);
    setReclassifyLog(null);
    try {
      const res = await fetch("/api/admin/reclassify", {
        method: "POST",
        headers: hdrs(true),
        body: JSON.stringify({ batch: 10 }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "재분류 실패");
      setReclassify({
        total: json.total ?? 0,
        reclassified: json.reclassified ?? 0,
        remaining: json.remaining ?? 0,
        kept_published: json.kept_published ?? 0,
        hidden: json.hidden ?? 0,
      });
      const logs = (json.logs as string[] | undefined)?.join("\n") ?? "";
      setReclassifyLog(
        `처리 ${json.processed}건 — 유지 ${json.kept_published} · 비공개 ${json.hidden} · 실패 ${json.failed ?? 0}\n${logs}`
      );
      await loadAll();
    } catch (e) {
      setReclassifyLog(e instanceof Error ? e.message : "재분류 오류");
    } finally {
      setReclassifyRunning(false);
    }
  };

  const stopReclassifyAuto = () => {
    reclassifyStopRef.current = true;
    setReclassifyAuto(false);
    setReclassifyLog("재분류 자동 실행 중지됨");
  };

  const runReclassifyAuto = async () => {
    if (!key.trim() || reclassifyAuto) return;
    reclassifyStopRef.current = false;
    setReclassifyAuto(true);
    setReclassifyLog("전체 재분류 시작…");
    try {
      while (!reclassifyStopRef.current) {
        const statusRes = await fetch("/api/admin/reclassify", {
          headers: hdrs(),
        });
        const statusJson = await statusRes.json();
        if (!statusRes.ok) {
          throw new Error(statusJson.error || "상태 조회 실패");
        }
        setReclassify({
          total: statusJson.total ?? 0,
          reclassified: statusJson.reclassified ?? 0,
          remaining: statusJson.remaining ?? 0,
          kept_published: statusJson.kept_published ?? 0,
          hidden: statusJson.hidden ?? 0,
        });
        if ((statusJson.remaining ?? 0) === 0) {
          setReclassifyLog("재분류 완료");
          break;
        }

        const postRes = await fetch("/api/admin/reclassify", {
          method: "POST",
          headers: hdrs(true),
          body: JSON.stringify({ batch: 10 }),
        });
        const postJson = await postRes.json();
        if (!postRes.ok) {
          throw new Error(postJson.error || "재분류 실패");
        }
        setReclassify({
          total: postJson.total ?? 0,
          reclassified: postJson.reclassified ?? 0,
          remaining: postJson.remaining ?? 0,
          kept_published: postJson.kept_published ?? 0,
          hidden: postJson.hidden ?? 0,
        });
        const logs = (postJson.logs as string[] | undefined)?.join("\n") ?? "";
        setReclassifyLog(
          `진행… 평가 ${postJson.reclassified}/${postJson.total} · 남음 ${postJson.remaining}\n${logs}`
        );

        if ((postJson.processed ?? 0) === 0) break;
        if (reclassifyStopRef.current) break;
        await new Promise((r) => setTimeout(r, 2000));
      }
      await loadAll();
    } catch (e) {
      setReclassifyLog(e instanceof Error ? e.message : "자동 재분류 오류");
    } finally {
      setReclassifyAuto(false);
      reclassifyStopRef.current = false;
    }
  };

  const runRedditTest = async () => {
    if (!key.trim()) return;
    setRedditTestLoading(true);
    setRedditTestResult(null);
    try {
      const res = await fetch("/api/admin/test-reddit", { headers: hdrs() });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "테스트 실패");
      setRedditTestResult(JSON.stringify(json, null, 2));
    } catch (e) {
      setRedditTestResult(
        e instanceof Error ? e.message : "Reddit 접근 테스트 오류"
      );
    } finally {
      setRedditTestLoading(false);
    }
  };

  const parseCronJson = async (
    res: Response
  ): Promise<{ ok: true; data: Record<string, unknown> } | { ok: false; error: string }> => {
    const text = await res.text();
    try {
      return { ok: true, data: JSON.parse(text) as Record<string, unknown> };
    } catch {
      return {
        ok: false,
        error: `Invalid response (${res.status}): ${text.substring(0, 120)}`,
      };
    }
  };

  const runRedditBatched = async () => {
    if (!key.trim()) return;
    setIsRedditRunning(true);
    setRunningSource("Reddit");
    setRunMsg(null);
    setRedditRunLog("Reddit 배치 수집 시작…\n");
    const lines: string[] = [];
    let totalSaved = 0;

    try {
      for (const sub of REDDIT_SUBREDDITS) {
        const url = `/api/cron/scrape-reddit-study-korea?subreddit=${encodeURIComponent(sub)}&feed=hot&limit=10`;
        const res = await fetch(url, {
          headers: { "x-admin-secret": key.trim() },
        });
        const parsed = await parseCronJson(res);

        if (!parsed.ok) {
          lines.push(`${sub}: 오류 — ${parsed.error}`);
          setRedditRunLog(lines.join("\n"));
          setRunMsg(`Reddit 중단: ${parsed.error}`);
          break;
        }

        const data = parsed.data;
        if (!res.ok || data.error) {
          const err = String(data.error ?? `HTTP ${res.status}`);
          lines.push(`${sub}: 오류 — ${err}`);
          setRedditRunLog(lines.join("\n"));
          setRunMsg(`Reddit 중단: ${err}`);
          break;
        }

        const fetched = Number(data.fetched ?? 0);
        const saved = Number(data.saved ?? 0);
        const adm = Number(data.routed_admissions ?? 0);
        const rev = Number(data.routed_review ?? 0);
        const gen = Number(data.routed_general ?? 0);
        totalSaved += saved;
        lines.push(
          `${sub}: ${fetched} posts → ✅ ${adm} admissions / 📋 ${rev} review / 📚 ${gen} general`
        );
        setRedditRunLog(lines.join("\n"));

        await new Promise((r) => setTimeout(r, 2000));
      }

      if (lines.length === REDDIT_SUBREDDITS.length) {
        setRunMsg(`Reddit 완료 — 총 저장 ${totalSaved}건`);
      }
      await loadAll();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "오류";
      setRunMsg(`Reddit: ${msg}`);
      setRedditRunLog((prev) => `${prev ?? ""}\n${msg}`);
    } finally {
      setIsRedditRunning(false);
      setRunningSource(null);
    }
  };

  const runCron = async (path: string, label: string) => {
    if (!key.trim()) return;
    setRunningSource(label);
    setRunMsg(null);
    try {
      const res = await fetch(path, { headers: { "x-admin-secret": key.trim() } });
      const parsed = await parseCronJson(res);
      if (!parsed.ok) throw new Error(parsed.error);
      const json = parsed.data;
      if (!res.ok) throw new Error(String(json.error || "실행 실패"));
      const saved =
        Number(json.saved) ||
        Number(json.totalSaved) ||
        Number((json.reddit as { saved?: number } | undefined)?.saved) ||
        0;
      setRunMsg(`${label} 완료 — 저장 ${saved}건`);
      await loadAll();
    } catch (e) {
      setRunMsg(`${label}: ${e instanceof Error ? e.message : "오류"}`);
    } finally {
      setRunningSource(null);
    }
  };

  const patchPost = async (
    id: string,
    field: "is_published" | "is_featured",
    value: boolean
  ) => {
    setSaving(id + field);
    try {
      const res = await fetch("/api/admin/study-korea", {
        method: "PATCH",
        headers: hdrs(true),
        body: JSON.stringify({ id, [field]: value }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "저장 실패");
      setPosts((prev) =>
        prev.map((p) => (p.id === id ? { ...p, [field]: value } : p))
      );
    } catch (e) {
      alert(e instanceof Error ? e.message : "오류");
    } finally {
      setSaving(null);
    }
  };

  const saveUniversityIntl = async (univ: AdminUniv) => {
    const edit = univEdits[univ.id];
    if (!edit) return;
    setSaving(`univ-${univ.id}`);
    try {
      const res = await fetch("/api/admin/study-korea", {
        method: "PATCH",
        headers: hdrs(true),
        body: JSON.stringify({
          universityId: univ.id,
          intl_url: edit.intl_url,
          intl_url_verified: edit.intl_url_verified,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "저장 실패");
      const updated = json.university as AdminUniv;
      setUniversities((prev) =>
        prev.map((u) => (u.id === updated.id ? { ...u, ...updated } : u))
      );
      setUnivEdits((prev) => ({
        ...prev,
        [updated.id]: {
          intl_url: updated.intl_url ?? "",
          intl_url_verified: Boolean(updated.intl_url_verified),
        },
      }));
    } catch (e) {
      alert(e instanceof Error ? e.message : "오류");
    } finally {
      setSaving(null);
    }
  };

  const filteredPosts = useMemo(() => {
    if (sourceFilter === "all") return posts;
    return posts.filter((p) => p.source === sourceFilter);
  }, [posts, sourceFilter]);

  const togglePostEn = (id: string) => {
    setEnRows((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const postTitleDisplay = (p: AdminPost) => {
    if (enRows.has(p.id)) {
      return p.ai_title_en?.trim() || p.title;
    }
    return p.title;
  };

  const postSummaryDisplay = (p: AdminPost) => {
    if (enRows.has(p.id)) {
      return p.ai_summary_en?.trim() || p.ai_summary || "";
    }
    return p.ai_summary_kr?.trim() || p.ai_summary || "";
  };

  const totalPosts = posts.length;
  const backfillPct =
    enBackfill.total > 0
      ? Math.round((enBackfill.translated / enBackfill.total) * 100)
      : 0;
  const reclassifyPct =
    reclassify.total > 0
      ? Math.round((reclassify.reclassified / reclassify.total) * 100)
      : 0;
  const slugPct =
    slugBackfill.total > 0
      ? Math.round((slugBackfill.with_slug / slugBackfill.total) * 100)
      : 0;
  const aiGuidePct =
    aiGuides.total > 0
      ? Math.round((aiGuides.completed / aiGuides.total) * 100)
      : 0;
  const mentorTranslatePct =
    mentorTranslate.total > 0
      ? Math.round((mentorTranslate.translated / mentorTranslate.total) * 100)
      : 0;

  const postPathByTopicId = (topicId: string) => {
    const t = aiGuides.topics.find((x) => x.id === topicId);
    if (!t?.generated_post_id) return null;
    return aiGuides.generated_posts.find((p) => p.id === t.generated_post_id)
      ?.path;
  };

  return (
    <div className="min-h-screen bg-slate-100 text-gray-900">
      <header className="bg-white border-b border-slate-200 shadow-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <h1 className="text-xl font-bold text-gray-900">
            Study Korea Pipeline
          </h1>
          <p className="text-sm text-gray-600 mt-0.5">
            Furniblog-style · 6 sources · Claude classifier + Supabase
          </p>
          <div className="flex flex-wrap gap-2 mt-3">
            <input
              type="password"
              placeholder="Admin secret"
              value={key}
              onChange={(e) => setKey(e.target.value)}
              className="flex-1 min-w-[180px] border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white text-gray-900"
            />
            <button
              type="button"
              onClick={() => void loadAll()}
              disabled={loading}
              className="px-4 py-2 rounded-lg bg-slate-800 text-white text-sm font-medium"
            >
              {loading ? "…" : "새로고침"}
            </button>
            <button
              type="button"
              disabled={!authorized || runningSource !== null || isRedditRunning}
              onClick={() =>
                void runCron("/api/cron/scrape-study-korea", "전체")
              }
              className="px-4 py-2 rounded-lg bg-orange-500 text-white text-sm font-semibold disabled:opacity-50"
            >
              {runningSource === "전체" ? "실행 중…" : "▶ Run All"}
            </button>
          </div>
          {loadErr && (
            <p className="text-red-600 text-sm mt-2 font-medium">{loadErr}</p>
          )}
          {runMsg && (
            <p className="text-teal-800 text-sm mt-2 font-medium bg-teal-50 px-3 py-2 rounded-lg">
              {runMsg}
            </p>
          )}
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        {authorized && (
          <>
            {reviewPending > 0 && (
              <section className="bg-amber-50 rounded-xl border border-amber-300 p-4 shadow-sm flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm font-semibold text-amber-900">
                  ⚠️ 검토 대기 {reviewPending}건
                </p>
                <Link
                  href={
                    key.trim()
                      ? `/admin/admissions/review?key=${encodeURIComponent(key.trim())}`
                      : "/admin/admissions/review"
                  }
                  className="text-sm font-medium text-amber-900 underline hover:no-underline"
                >
                  검토하러 가기 →
                </Link>
              </section>
            )}

            <p className="text-xs text-gray-600 -mt-2">
              오늘 LLM 호출 {classifierUsage.dailyCalls}건 / 한도{" "}
              {classifierUsage.dailyLimit}건 (이번 실행 {classifierUsage.runCalls}/
              {classifierUsage.perRunLimit})
            </p>

            <section className="bg-orange-50 rounded-xl border border-orange-200 p-4 shadow-sm">
              <h2 className="text-sm font-bold text-orange-900 mb-2">
                🔍 Reddit 접근 테스트
              </h2>
              <p className="text-sm text-orange-800 mb-3">
                www / old.reddit / RSS 진단. 수집은{" "}
                <strong>RSS(method_c)만</strong> 사용합니다. OAuth 불필요.
              </p>
              <button
                type="button"
                disabled={redditTestLoading}
                onClick={() => void runRedditTest()}
                className="px-4 py-2 rounded-lg bg-orange-600 text-white text-sm font-semibold hover:bg-orange-700 disabled:opacity-50"
              >
                {redditTestLoading ? "테스트 중…" : "Reddit 접근 테스트"}
              </button>
              {redditTestResult && (
                <pre className="mt-3 p-2 bg-white border border-orange-200 rounded text-xs font-mono whitespace-pre-wrap max-h-64 overflow-y-auto text-gray-800">
                  {redditTestResult}
                </pre>
              )}
            </section>

            <section className="bg-violet-50 rounded-xl border border-violet-200 p-4 shadow-sm">
              <h2 className="text-sm font-bold text-violet-900 mb-2">
                🎯 합격 후기 자동 수집 (Naver webkr)
              </h2>
              <p className="text-xs text-violet-800 mb-2">
                외국인의 한국 유학 합격·장학금 후기를 영어/한국어/중국어/베트남어로
                검색해{" "}
                <code className="text-xs bg-white px-1 rounded">study_korea_posts</code>{" "}
                에 저장합니다. (한국인 수능·수시·정시 입시 후기는 자동 제외)
              </p>
              <p className="text-xs text-violet-700 mb-3">
                Naver webkr 쿼리 {ADMISSION_QUERY_COUNT}개 · Reddit{" "}
                <code className="bg-white px-1 rounded text-[10px]">r/studyinkorea</code>
                ,{" "}
                <code className="bg-white px-1 rounded text-[10px]">
                  r/koreanuniversity
                </code>{" "}
                등 · 로그{" "}
                <code className="bg-white px-1 rounded text-[10px]">[ADMISSION]</code>
                {" · "}
                pending 한국인 입시 정리:{" "}
                <code className="bg-white px-1 rounded text-[10px]">
                  021_reject_korean_domestic_admissions.sql
                </code>
              </p>
              <div className="flex gap-2 flex-wrap">
                <button
                  type="button"
                  disabled={admissionCollectRunning}
                  onClick={() => void collectAdmissionSmall(10)}
                  className="px-3 py-1.5 rounded-lg bg-violet-600 text-white text-sm font-semibold hover:bg-violet-700 disabled:opacity-50"
                >
                  ▶ 10건 수집
                </button>
                <button
                  type="button"
                  disabled={admissionCollectRunning}
                  onClick={() => void collectAdmissionSmall(50)}
                  className="px-3 py-1.5 rounded-lg bg-violet-700 text-white text-sm font-semibold hover:bg-violet-800 disabled:opacity-50"
                >
                  ▶▶ 50건 수집
                </button>
                <button
                  type="button"
                  disabled={admissionCollectRunning}
                  onClick={() => void runAdmissionCollect()}
                  className="px-3 py-1.5 rounded-lg bg-violet-800 text-white text-sm font-semibold hover:bg-violet-900 disabled:opacity-50"
                >
                  ▶▶▶ 200건 수집
                </button>
                {admissionCollectRunning && (
                  <button
                    type="button"
                    onClick={abortAdmissionCollect}
                    className="px-3 py-1.5 rounded-lg bg-red-600 text-white text-sm font-semibold hover:bg-red-700"
                  >
                    ⏸ 중단
                  </button>
                )}
              </div>
              {(admissionCollectRunning || admissionCollectStatus) && (
                <div className="mt-3 p-3 bg-white dark:bg-gray-900 rounded border border-violet-100 text-xs">
                  {admissionCollectRunning && (
                    <div className="text-violet-600 font-medium">
                      ⏳ {admissionCollectStatus}
                    </div>
                  )}
                  {!admissionCollectRunning && admissionCollectStatus && (
                    <div className="text-green-700 dark:text-green-400 font-semibold">
                      {admissionCollectStatus}
                    </div>
                  )}
                  {admissionCollectStats?.queries_used != null && (
                    <div className="text-gray-500 mt-1">
                      쿼리 {admissionCollectStats.queries_used}개 사용
                      {admissionCollectStats.next_start_index != null &&
                        admissionCollectStats.next_start_index > 0 && (
                          <>
                            {" "}
                            · 다음 시작 인덱스{" "}
                            {admissionCollectStats.next_start_index}
                          </>
                        )}
                    </div>
                  )}
                  {(admissionCollectStats?.sample_titles?.length ?? 0) > 0 && (
                    <div className="mt-2">
                      <div className="text-gray-500 mb-1">새로 들어온 글:</div>
                      <ul className="space-y-1">
                        {admissionCollectStats!.sample_titles!.map(
                          (title, i) => (
                            <li
                              key={i}
                              className="text-gray-700 dark:text-gray-300 truncate"
                            >
                              · {title}
                            </li>
                          )
                        )}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </section>

            <section className="bg-slate-100 rounded-xl border border-slate-300 p-4 shadow-sm">
              <h2 className="text-sm font-bold text-slate-900 mb-2">
                합격 후기 검토 대기
              </h2>
              <p className="text-sm text-slate-700 mb-3">
                대기 중{" "}
                <span className="font-bold tabular-nums">
                  {admissionPending ?? "—"}
                </span>
                건 · AI 추출 후 합격DB로 이관
              </p>
              <a
                href={
                  key.trim()
                    ? `/admin/admissions-review?key=${encodeURIComponent(key.trim())}`
                    : "/admin/admissions-review"
                }
                className="inline-block px-4 py-2 rounded-lg bg-slate-800 text-white text-sm font-semibold hover:bg-slate-900"
              >
                검토 페이지 열기 →
              </a>
            </section>

            <section className="bg-sky-50 rounded-xl border border-sky-200 p-4 shadow-sm">
              <h2 className="text-sm font-bold text-sky-900 mb-2">
                한국 대학 국제처 자동 verify
              </h2>
              <p className="text-sm text-sky-800 mb-3">
                <span className="font-semibold tabular-nums">
                  country=kr
                </span>{" "}
                한국 대학{" "}
                <span className="font-bold tabular-nums">
                  {krIntlStats.total_kr}
                </span>
                개 중 verified:{" "}
                <span className="font-bold tabular-nums text-green-700">
                  {krIntlStats.verified}
                </span>
                개 · 미검증{" "}
                <span className="font-bold tabular-nums text-amber-700">
                  {krIntlStats.pending}
                </span>
                개. 성공 시{" "}
                <code className="text-xs bg-white px-1 rounded">
                  intl_url_verified=true
                </code>{" "}
                → University Intl 크론에 자동 포함.
              </p>
              <button
                type="button"
                disabled={krIntlRunning}
                onClick={() => void runKrIntlAutoVerify()}
                className="px-4 py-2 rounded-lg bg-sky-600 text-white text-sm font-semibold hover:bg-sky-700 disabled:opacity-50"
              >
                {krIntlRunning ? "탐색 중…" : "자동 verify 시작 (15건)"}
              </button>
              {krIntlLog && (
                <p className="text-sm text-sky-900 mt-2 font-medium">{krIntlLog}</p>
              )}
              {krIntlFailures.length > 0 && (
                <div className="mt-3 max-h-48 overflow-y-auto rounded-lg border border-sky-200 bg-white p-2 text-xs">
                  <p className="font-semibold text-gray-800 mb-1">
                    실패 — 수동 URL 입력 필요
                  </p>
                  <ul className="space-y-1 text-gray-700">
                    {krIntlFailures.map((f) => (
                      <li key={f.id}>
                        <span className="font-medium">{f.name_kr}</span>
                        <span className="text-gray-500"> ({f.name_en})</span>
                        {": "}
                        {f.reason}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </section>

            <section className="bg-violet-50 rounded-xl border border-violet-200 p-4 shadow-sm">
              <h2 className="text-sm font-bold text-violet-900 mb-2">
                🔗 Slug 백필 (SEO URL)
              </h2>
              <p className="text-sm text-violet-800 mb-3">
                <span className="font-semibold tabular-nums">
                  {slugBackfill.with_slug}
                </span>
                {" / "}
                <span className="font-semibold tabular-nums">
                  {slugBackfill.total}
                </span>
                {slugBackfillLoading ? (
                  <span className="text-violet-600 ml-2">(불러오는 중…)</span>
                ) : (
                  <span className="text-violet-700 ml-2">
                    (남은 {slugBackfill.remaining}건)
                  </span>
                )}
              </p>
              <div className="h-3 w-full rounded-full bg-violet-100 overflow-hidden mb-3">
                <div
                  className="h-full bg-violet-600 transition-all duration-300"
                  style={{ width: `${slugPct}%` }}
                />
              </div>
              <button
                type="button"
                disabled={
                  slugBackfillRunning || slugBackfill.remaining === 0
                }
                onClick={() => void runSlugBackfillBatch()}
                className="px-4 py-2 rounded-lg bg-violet-600 text-white text-sm font-semibold hover:bg-violet-700 disabled:opacity-50"
              >
                {slugBackfillRunning ? "생성 중…" : "▶ 50건 Slug 생성"}
              </button>
              {slugBackfillLog && (
                <p className="text-xs text-violet-800 mt-3 bg-violet-100/80 px-3 py-2 rounded-lg">
                  {slugBackfillLog}
                </p>
              )}
            </section>

            <section className="bg-purple-50 rounded-xl border border-purple-300 p-4 shadow-sm">
              <h2 className="text-sm font-bold text-purple-900 mb-2">
                🤖 AI Knowledge Hub Generator
              </h2>
              <p className="text-sm text-purple-800 mb-3">
                사실 기반 한국 유학 가이드를 AI로 생성합니다. 거짓 경험담은
                생성하지 않습니다.
              </p>
              <p className="text-sm text-purple-800 mb-3">
                <span className="font-semibold tabular-nums">
                  {aiGuides.completed}
                </span>
                {" / "}
                <span className="font-semibold tabular-nums">
                  {aiGuides.total}
                </span>
                {aiGuidesLoading ? (
                  <span className="text-purple-600 ml-2">(불러오는 중…)</span>
                ) : (
                  <span className="text-purple-700 ml-2">
                    (대기 {aiGuides.pending}
                    {aiGuides.generating_kr > 0
                      ? ` · 번역 중 ${aiGuides.generating_kr}`
                      : ""}
                    )
                  </span>
                )}
              </p>
              <div className="h-3 w-full rounded-full bg-purple-100 overflow-hidden mb-3">
                <div
                  className="h-full bg-purple-600 transition-all duration-300"
                  style={{ width: `${aiGuidePct}%` }}
                />
              </div>
              <div className="flex flex-wrap gap-2 mb-4">
                <button
                  type="button"
                  disabled={
                    aiGuidesRunning || aiGuidesAuto || aiGuides.pending === 0
                  }
                  onClick={() => void runAiGuideBatch()}
                  className="px-4 py-2 rounded-lg bg-purple-600 text-white text-sm font-semibold hover:bg-purple-700 disabled:opacity-50"
                >
                  {aiGuidesRunning && !aiGuidesAuto ? "생성 중…" : "▶ 1개 생성"}
                </button>
                <button
                  type="button"
                  disabled={
                    aiGuidesRunning || aiGuidesAuto || aiGuides.pending === 0
                  }
                  onClick={() => void runAiGuideAuto()}
                  className="px-4 py-2 rounded-lg bg-purple-700 text-white text-sm font-semibold hover:bg-purple-800 disabled:opacity-50"
                >
                  {aiGuidesAuto ? "자동 생성 중…" : "▶▶ 5개 자동 생성"}
                </button>
                <button
                  type="button"
                  disabled={!aiGuidesAuto}
                  onClick={stopAiGuideAuto}
                  className="px-4 py-2 rounded-lg bg-white border border-purple-300 text-purple-900 text-sm font-medium hover:bg-purple-100 disabled:opacity-50"
                >
                  ⏹ 중지
                </button>
                <button
                  type="button"
                  onClick={() => setAiTopicModal(true)}
                  className="px-4 py-2 rounded-lg bg-white border border-purple-400 text-purple-900 text-sm font-medium hover:bg-purple-100"
                >
                  + 새 토픽 추가
                </button>
              </div>
              {aiGuidesLog && (
                <p
                  className={`text-xs mb-3 px-3 py-2 rounded-lg whitespace-pre-wrap ${
                    aiGuidesLogError
                      ? "text-red-800 bg-red-50 border border-red-200"
                      : "text-purple-800 bg-purple-100/80"
                  }`}
                >
                  {aiGuidesLog}
                </p>
              )}
              <ul className="max-h-64 overflow-y-auto space-y-1 text-xs">
                {aiGuides.topics.map((t) => {
                  const path = postPathByTopicId(t.id);
                  return (
                    <li
                      key={t.id}
                      className="flex flex-wrap items-center gap-2 py-1 border-b border-purple-100"
                    >
                      <span
                        className={`px-1.5 py-0.5 rounded font-semibold ${
                          t.status === "completed"
                            ? "bg-green-100 text-green-800"
                            : t.status === "generating_kr"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-amber-100 text-amber-900"
                        }`}
                      >
                        {t.status}
                      </span>
                      <span className="text-purple-950 font-medium flex-1 min-w-[12rem]">
                        {t.topic_title}
                      </span>
                      <span className="text-purple-600">
                        P{t.priority} · {t.category}
                      </span>
                      {path && (
                        <a
                          href={path}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-purple-700 underline"
                        >
                          미리보기
                        </a>
                      )}
                    </li>
                  );
                })}
              </ul>
            </section>

            {aiTopicModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
                <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">
                    새 AI 가이드 토픽
                  </h3>
                  <label className="block text-sm font-medium mb-1">
                    Topic Title
                  </label>
                  <input
                    type="text"
                    value={aiTopicForm.topic_title}
                    onChange={(e) =>
                      setAiTopicForm((f) => ({
                        ...f,
                        topic_title: e.target.value,
                      }))
                    }
                    placeholder='e.g. "How to apply for spouse visa F-3"'
                    className="w-full border rounded-lg px-3 py-2 text-sm mb-3"
                  />
                  <label className="block text-sm font-medium mb-1">
                    Category
                  </label>
                  <select
                    value={aiTopicForm.category}
                    onChange={(e) =>
                      setAiTopicForm((f) => ({ ...f, category: e.target.value }))
                    }
                    className="w-full border rounded-lg px-3 py-2 text-sm mb-3"
                  >
                    {AI_GUIDE_CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {CATEGORY_LABELS_KR[c] ?? c}
                      </option>
                    ))}
                  </select>
                  <label className="block text-sm font-medium mb-1">
                    Keywords (comma-separated)
                  </label>
                  <input
                    type="text"
                    value={aiTopicForm.keywords}
                    onChange={(e) =>
                      setAiTopicForm((f) => ({
                        ...f,
                        keywords: e.target.value,
                      }))
                    }
                    className="w-full border rounded-lg px-3 py-2 text-sm mb-3"
                  />
                  <label className="block text-sm font-medium mb-1">
                    Priority (1–10)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={aiTopicForm.priority}
                    onChange={(e) =>
                      setAiTopicForm((f) => ({
                        ...f,
                        priority: Number(e.target.value) || 5,
                      }))
                    }
                    className="w-full border rounded-lg px-3 py-2 text-sm mb-4"
                  />
                  <div className="flex gap-2 justify-end">
                    <button
                      type="button"
                      onClick={() => setAiTopicModal(false)}
                      className="px-4 py-2 text-sm rounded-lg border"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      disabled={aiTopicSaving}
                      onClick={() => void submitAiTopic()}
                      className="px-4 py-2 text-sm rounded-lg bg-purple-600 text-white font-semibold disabled:opacity-50"
                    >
                      {aiTopicSaving ? "…" : "Add to Queue"}
                    </button>
                  </div>
                </div>
              </div>
            )}

            <section className="bg-sky-50 rounded-xl border border-sky-200 p-4 shadow-sm">
              <h2 className="text-sm font-bold text-sky-900 mb-2">
                🌐 멘토 자기소개 영어 번역 백필
              </h2>
              <p className="text-sm text-sky-800 mb-3">
                <span className="font-semibold tabular-nums">
                  {mentorTranslate.translated}
                </span>
                {" / "}
                <span className="font-semibold tabular-nums">
                  {mentorTranslate.total}
                </span>
                {mentorTranslateLoading ? (
                  <span className="text-sky-600 ml-2">(불러오는 중…)</span>
                ) : (
                  <span className="text-sky-700 ml-2">
                    (남은 {mentorTranslate.remaining}건)
                  </span>
                )}
              </p>
              <div className="h-3 w-full rounded-full bg-sky-100 overflow-hidden mb-3">
                <div
                  className="h-full bg-sky-600 transition-all duration-300"
                  style={{ width: `${mentorTranslatePct}%` }}
                />
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={
                    mentorTranslateRunning ||
                    mentorTranslateAuto ||
                    mentorTranslate.remaining === 0
                  }
                  onClick={() => void runMentorTranslateBatch()}
                  className="px-4 py-2 rounded-lg bg-sky-600 text-white text-sm font-semibold hover:bg-sky-700 disabled:opacity-50"
                >
                  {mentorTranslateRunning && !mentorTranslateAuto
                    ? "번역 중…"
                    : "▶ 10개 번역"}
                </button>
                <button
                  type="button"
                  disabled={
                    mentorTranslateRunning ||
                    mentorTranslateAuto ||
                    mentorTranslate.remaining === 0
                  }
                  onClick={() => void runMentorTranslateAuto()}
                  className="px-4 py-2 rounded-lg bg-sky-700 text-white text-sm font-semibold disabled:opacity-50"
                >
                  {mentorTranslateAuto ? "자동 실행 중…" : "▶▶ 전체 번역"}
                </button>
                <button
                  type="button"
                  disabled={!mentorTranslateAuto}
                  onClick={() => {
                    mentorTranslateStopRef.current = true;
                    setMentorTranslateAuto(false);
                  }}
                  className="px-4 py-2 rounded-lg bg-white border border-sky-300 text-sky-900 text-sm disabled:opacity-50"
                >
                  ⏹ 중지
                </button>
              </div>
              {mentorTranslateLog && (
                <p className="text-xs text-sky-800 mt-3 bg-sky-100/80 px-3 py-2 rounded-lg whitespace-pre-wrap">
                  {mentorTranslateLog}
                </p>
              )}
            </section>

            <MentorUniversityRematchCard adminKey={key} />

            <section className="bg-slate-100 rounded-xl border border-slate-300 p-4 shadow-sm">
              <h2 className="text-sm font-bold text-slate-800 mb-2">
                🎯 비활성 멘토 검토
              </h2>
              <p className="text-sm text-slate-600 mb-3">
                <span className="font-semibold tabular-nums">
                  {mentorTranslate.inactive}
                </span>
                명 검토 대기 중
              </p>
              <a
                href={`/admin/mentors-inactive?key=${encodeURIComponent(key)}`}
                className="inline-block px-4 py-2 rounded-lg bg-slate-700 text-white text-sm font-semibold hover:bg-slate-800"
              >
                검토하기 →
              </a>
            </section>

            <section className="bg-zinc-100 rounded-xl border border-zinc-300 p-4 shadow-sm">
              <h2 className="text-sm font-bold text-zinc-800 mb-2">
                📊 멘토 조회 통계
              </h2>
              {mentorViewStatsLoading ? (
                <p className="text-sm text-zinc-600">불러오는 중…</p>
              ) : (
                <>
                  <p className="text-sm text-zinc-700 mb-2">
                    오늘 조회수:{" "}
                    <span className="font-semibold tabular-nums">
                      {mentorViewStats.today_views}
                    </span>
                    {" · "}
                    이번 주:{" "}
                    <span className="font-semibold tabular-nums">
                      {mentorViewStats.week_views}
                    </span>
                  </p>
                  {mentorViewStats.top_today.length > 0 && (
                    <div className="mb-3">
                      <p className="text-xs font-bold text-zinc-600 mb-1">
                        오늘 Top 5
                      </p>
                      <ul className="text-sm text-zinc-800 space-y-0.5">
                        {mentorViewStats.top_today.map((t) => (
                          <li key={t.nickname}>
                            {t.nickname}{" "}
                            <span className="text-zinc-500">({t.views})</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {mentorViewStats.daily_last_7.length > 0 && (
                    <p className="text-xs text-zinc-600">
                      최근 7일:{" "}
                      {mentorViewStats.daily_last_7
                        .map((d) => `${d.date.slice(5)}:${d.views}`)
                        .join(" · ")}
                    </p>
                  )}
                  {mentorViewStats.today_views === 0 &&
                    mentorViewStats.week_views === 0 && (
                      <p className="text-xs text-zinc-500">
                        018 마이그레이션 적용 후 조회가 기록됩니다.
                      </p>
                    )}
                </>
              )}
            </section>

            {/* English backfill */}
            <section className="bg-blue-50 rounded-xl border border-blue-200 p-4 shadow-sm">
              <h2 className="text-sm font-bold text-blue-900 mb-2">
                🌐 영어 번역 백필
              </h2>
              <p className="text-sm text-blue-800 mb-3">
                <span className="font-semibold tabular-nums">
                  {enBackfill.translated}
                </span>
                {" / "}
                <span className="font-semibold tabular-nums">
                  {enBackfill.total}
                </span>
                {enBackfillLoading ? (
                  <span className="text-blue-600 ml-2">(불러오는 중…)</span>
                ) : (
                  <span className="text-blue-700 ml-2">
                    (남은 {enBackfill.remaining}건)
                  </span>
                )}
              </p>
              <div className="h-3 w-full rounded-full bg-blue-100 overflow-hidden mb-3">
                <div
                  className="h-full bg-blue-600 transition-all duration-300"
                  style={{ width: `${backfillPct}%` }}
                />
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={
                    enBackfillRunning ||
                    enBackfillAuto ||
                    enBackfill.remaining === 0
                  }
                  onClick={() => void runBackfillBatch()}
                  className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-50"
                >
                  {enBackfillRunning ? "번역 중…" : "▶ 10건 번역"}
                </button>
                <button
                  type="button"
                  disabled={
                    enBackfillRunning ||
                    enBackfillAuto ||
                    enBackfill.remaining === 0
                  }
                  onClick={() => void runBackfillAuto()}
                  className="px-4 py-2 rounded-lg bg-blue-700 text-white text-sm font-semibold hover:bg-blue-800 disabled:opacity-50"
                >
                  {enBackfillAuto ? "자동 실행 중…" : "▶▶ 전체 자동 실행"}
                </button>
                <button
                  type="button"
                  disabled={!enBackfillAuto}
                  onClick={stopBackfillAuto}
                  className="px-4 py-2 rounded-lg bg-white border border-blue-300 text-blue-900 text-sm font-medium hover:bg-blue-100 disabled:opacity-50"
                >
                  ⏹ 중지
                </button>
              </div>
              {enBackfillLog && (
                <p className="text-xs text-blue-800 mt-3 bg-blue-100/80 px-3 py-2 rounded-lg">
                  {enBackfillLog}
                </p>
              )}
            </section>

            <section className="rounded-lg border border-amber-200 bg-amber-50 p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-amber-900">
                🎯 콘텐츠 재분류
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                외국인 유학생 관점에서 무관한 콘텐츠를 재평가하여 자동으로
                비공개 처리합니다.
              </p>
              <div className="mt-4">
                <div className="flex justify-between text-sm mb-1 text-amber-900">
                  <span>진행 상태</span>
                  <span>
                    {reclassify.reclassified} / {reclassify.total} 평가 완료
                    {reclassifyLoading ? " (불러오는 중…)" : ""}
                  </span>
                </div>
                <div className="w-full h-2 bg-amber-100 rounded overflow-hidden">
                  <div
                    className="h-2 bg-amber-500 rounded transition-all duration-300"
                    style={{ width: `${reclassifyPct}%` }}
                  />
                </div>
                <p className="text-xs text-gray-600 mt-1">
                  유지(공개): {reclassify.kept_published} · 비공개:{" "}
                  {reclassify.hidden} · 대기: {reclassify.remaining}
                </p>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={
                    reclassifyRunning ||
                    reclassifyAuto ||
                    reclassify.remaining === 0
                  }
                  onClick={() => void runReclassifyBatch()}
                  className="px-4 py-2 bg-amber-600 text-white text-sm font-semibold rounded-lg hover:bg-amber-700 disabled:opacity-50"
                >
                  {reclassifyRunning ? "재분류 중…" : "▶ 10건 재분류"}
                </button>
                <button
                  type="button"
                  disabled={
                    reclassifyRunning ||
                    reclassifyAuto ||
                    reclassify.remaining === 0
                  }
                  onClick={() => void runReclassifyAuto()}
                  className="px-4 py-2 bg-amber-700 text-white text-sm font-semibold rounded-lg hover:bg-amber-800 disabled:opacity-50"
                >
                  {reclassifyAuto ? "자동 실행 중…" : "▶▶ 전체 자동 실행"}
                </button>
                <button
                  type="button"
                  disabled={!reclassifyAuto}
                  onClick={stopReclassifyAuto}
                  className="px-4 py-2 bg-white border border-amber-300 text-amber-900 text-sm font-medium rounded-lg hover:bg-amber-100 disabled:opacity-50"
                >
                  ⏹ 중지
                </button>
              </div>
              {reclassifyLog && (
                <div className="mt-3 p-2 bg-white border border-amber-200 rounded text-xs font-mono whitespace-pre-wrap max-h-48 overflow-y-auto text-gray-800">
                  {reclassifyLog}
                </div>
              )}
            </section>

            {/* Run for specific source */}
            <section className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
              <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-3">
                Run for specific source
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {STUDY_KOREA_SOURCE_META.map((src) => {
                  const showRun = src.status === "active" && src.cronPath;

                  return (
                    <div
                      key={src.id}
                      className={`rounded-lg p-3 flex flex-col gap-2 ${getSourceCardBorder(src.status)}`}
                    >
                      <div className="flex items-center justify-between gap-1 flex-wrap">
                        <span
                          className={`text-xs font-semibold px-2 py-0.5 rounded-full ${src.color}`}
                        >
                          {src.label}
                        </span>
                        {statusBadge(src.status, src.statusLabel)}
                      </div>
                      <span className="text-xs text-gray-600">
                        {statsBySource[src.id] ?? 0} posts
                      </span>
                      {src.note && (
                        <p className="text-[10px] text-gray-500">{src.note}</p>
                      )}
                      {src.requiresEnv && src.status === "active" && (
                        <p className="text-[10px] text-amber-700">
                          Env: {src.requiresEnv.join(", ")}
                        </p>
                      )}
                      {src.statusLabel && src.status !== "active" && (
                        <p className="text-[10px] text-gray-600 leading-snug">
                          {src.statusLabel}
                        </p>
                      )}
                      {showRun ? (
                        <button
                          type="button"
                          disabled={runningSource !== null || isRedditRunning}
                          onClick={() =>
                            void (src.id === "reddit"
                              ? runRedditBatched()
                              : runCron(src.cronPath!, src.label))
                          }
                          className="w-full py-2 rounded-md bg-slate-100 hover:bg-slate-200 text-gray-900 text-sm font-medium disabled:opacity-50"
                        >
                          {runningSource === src.label || (src.id === "reddit" && isRedditRunning)
                            ? "Running…"
                            : "Run"}
                        </button>
                      ) : null}
                      {src.id === "reddit" && redditRunLog && (
                        <pre className="text-[10px] font-mono whitespace-pre-wrap bg-orange-50 border border-orange-100 rounded p-2 max-h-32 overflow-y-auto text-gray-800">
                          {redditRunLog}
                        </pre>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-white rounded-xl border p-4">
                <p className="text-xs text-gray-600">Total posts</p>
                <p className="text-2xl font-bold text-gray-900">{totalPosts}</p>
              </div>
              <div className="bg-white rounded-xl border p-4 col-span-1 md:col-span-3">
                <p className="text-xs text-gray-600 mb-2">By category</p>
                <div className="flex flex-wrap gap-1.5">
                  {Object.entries(statsByCategory).map(([cat, n]) => (
                    <span
                      key={cat}
                      className="text-xs bg-slate-100 text-gray-900 px-2 py-1 rounded-full"
                    >
                      {CATEGORY_LABELS_KR[cat] ?? cat}: {n}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Pipeline runs */}
            <section className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <h2 className="text-sm font-semibold text-gray-900 px-4 py-3 border-b bg-slate-50">
                Recent pipeline runs
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-gray-900">
                  <thead>
                    <tr className="border-b text-left bg-slate-50">
                      <th className="p-2">Time</th>
                      <th className="p-2">Source</th>
                      <th className="p-2">Col</th>
                      <th className="p-2">Saved</th>
                      <th className="p-2">Adm</th>
                      <th className="p-2">Rev</th>
                      <th className="p-2">Gen</th>
                      <th className="p-2">Fail</th>
                      <th className="p-2">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {runs.map((r) => (
                      <tr key={r.id} className="border-b border-slate-100">
                        <td className="p-2 whitespace-nowrap text-gray-900">
                          {new Date(r.created_at).toLocaleString("ko-KR")}
                        </td>
                        <td className="p-2 font-medium">{r.source}</td>
                        <td className="p-2">{r.collected}</td>
                        <td className="p-2 text-green-700 font-medium">
                          {r.saved}
                        </td>
                        <td className="p-2 text-emerald-700">
                          {r.routed_admissions ?? "—"}
                        </td>
                        <td className="p-2 text-amber-700">
                          {r.routed_review ?? "—"}
                        </td>
                        <td className="p-2 text-blue-700">
                          {r.routed_general ?? "—"}
                        </td>
                        <td className="p-2">{r.failed}</td>
                        <td className="p-2">
                          <span
                            className={
                              r.status === "success"
                                ? "text-green-700"
                                : r.status === "failed"
                                  ? "text-red-600"
                                  : "text-amber-700"
                            }
                          >
                            {r.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {runs.length === 0 && (
                      <tr>
                        <td colSpan={6} className="p-4 text-gray-600 text-center">
                          실행 기록 없음
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>

            {/* Posts */}
            <section className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <div className="px-4 py-3 border-b bg-slate-50 flex flex-wrap items-center gap-2">
                <h2 className="text-sm font-semibold text-gray-900">
                  Posts ({filteredPosts.length})
                </h2>
                <div className="flex flex-wrap gap-1 ml-auto">
                  <button
                    type="button"
                    onClick={() => setSourceFilter("all")}
                    className={`text-xs px-2 py-1 rounded-full ${sourceFilter === "all" ? "bg-orange-500 text-white" : "bg-slate-200 text-gray-900"}`}
                  >
                    all
                  </button>
                  {STUDY_KOREA_SOURCE_META.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setSourceFilter(s.id)}
                      className={`text-xs px-2 py-1 rounded-full ${sourceFilter === s.id ? "bg-orange-500 text-white" : "bg-slate-200 text-gray-900"}`}
                    >
                      {s.id}
                    </button>
                  ))}
                </div>
              </div>
              <div className="max-h-[420px] overflow-y-auto">
                <table className="w-full text-xs text-gray-900">
                  <thead className="sticky top-0 bg-white">
                    <tr className="border-b text-left">
                      <th className="p-2 w-12">EN</th>
                      <th className="p-2">Title</th>
                      <th className="p-2">Cat</th>
                      <th className="p-2">Pub</th>
                      <th className="p-2">★</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPosts.map((p) => (
                      <tr key={p.id} className="border-b border-slate-50">
                        <td className="p-2">
                          <button
                            type="button"
                            onClick={() => togglePostEn(p.id)}
                            className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                              enRows.has(p.id)
                                ? "bg-orange-500 text-white"
                                : "bg-slate-200 text-gray-700"
                            }`}
                          >
                            EN
                          </button>
                        </td>
                        <td className="p-2 max-w-[280px]">
                          <span className="text-gray-500">[{p.source}] </span>
                          <span className="truncate block font-medium">
                            {postTitleDisplay(p)}
                          </span>
                          {postSummaryDisplay(p) && (
                            <span className="text-gray-500 line-clamp-2 block mt-0.5">
                              {postSummaryDisplay(p)}
                            </span>
                          )}
                        </td>
                        <td className="p-2 text-gray-900">
                          {CATEGORY_LABELS_KR[p.category] ?? p.category}
                        </td>
                        <td className="p-2">
                          <button
                            type="button"
                            disabled={saving === p.id + "is_published"}
                            onClick={() =>
                              void patchPost(p.id, "is_published", !p.is_published)
                            }
                            className={`px-2 py-0.5 rounded text-xs font-medium ${p.is_published ? "bg-green-100 text-green-800" : "bg-slate-200 text-gray-900"}`}
                          >
                            {p.is_published ? "ON" : "OFF"}
                          </button>
                        </td>
                        <td className="p-2">
                          <button
                            type="button"
                            disabled={saving === p.id + "is_featured"}
                            onClick={() =>
                              void patchPost(p.id, "is_featured", !p.is_featured)
                            }
                            className={`px-2 py-0.5 rounded text-xs ${p.is_featured ? "text-amber-700" : "text-gray-500"}`}
                          >
                            {p.is_featured ? "★" : "—"}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="bg-white rounded-xl border border-slate-200 overflow-hidden mt-6">
              <div className="px-4 py-3 border-b bg-slate-50">
                <h2 className="text-sm font-semibold text-gray-900">
                  대학 국제처 URL ({universities.length})
                </h2>
                <p className="text-xs text-gray-600 mt-1">
                  intl_url_verified=true 인 대학만 University Intl 크론이
                  스크래핑합니다.
                </p>
              </div>
              <div className="max-h-[480px] overflow-y-auto p-4 space-y-3">
                {universities.map((u) => {
                  const edit = univEdits[u.id] ?? {
                    intl_url: "",
                    intl_url_verified: false,
                  };
                  return (
                    <div
                      key={u.id}
                      className="border border-slate-200 rounded-lg p-3 text-sm"
                    >
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <span className="font-semibold text-gray-900">
                          {u.name_kr}
                        </span>
                        <span className="text-gray-500 text-xs">
                          {u.name_en}
                        </span>
                        <label className="ml-auto flex items-center gap-1.5 text-xs text-gray-800">
                          <input
                            type="checkbox"
                            checked={edit.intl_url_verified}
                            onChange={(e) =>
                              setUnivEdits((prev) => ({
                                ...prev,
                                [u.id]: {
                                  ...edit,
                                  intl_url_verified: e.target.checked,
                                },
                              }))
                            }
                          />
                          verified (스크래핑)
                        </label>
                      </div>
                      <input
                        type="url"
                        value={edit.intl_url}
                        onChange={(e) =>
                          setUnivEdits((prev) => ({
                            ...prev,
                            [u.id]: { ...edit, intl_url: e.target.value },
                          }))
                        }
                        placeholder="https://..."
                        className="w-full border border-slate-300 rounded px-2 py-1.5 text-xs text-gray-900 bg-white"
                      />
                      <button
                        type="button"
                        disabled={saving === `univ-${u.id}`}
                        onClick={() => void saveUniversityIntl(u)}
                        className="mt-2 px-3 py-1 rounded bg-orange-500 text-white text-xs font-medium disabled:opacity-50"
                      >
                        {saving === `univ-${u.id}` ? "저장 중…" : "저장"}
                      </button>
                    </div>
                  );
                })}
                {universities.length === 0 && (
                  <p className="text-gray-600 text-sm text-center py-6">
                    name_en 이 있는 대학이 없습니다.
                  </p>
                )}
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  );
}

export default function AdminStudyKoreaPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-100 text-gray-900 p-8">
          로딩…
        </div>
      }
    >
      <AdminStudyKoreaInner />
    </Suspense>
  );
}
