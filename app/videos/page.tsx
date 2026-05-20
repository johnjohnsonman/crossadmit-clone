"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

interface VideoItem {
  id: string;
  video_id: string;
  title: string;
  description: string | null;
  channel_name: string | null;
  thumbnail_url: string | null;
  view_count: number | null;
  source_url: string;
  language: string | null;
  content_type: string | null;
  university_tags: string[] | null;
}

const PAGE_SIZE = 20;
const SEARCH_DEBOUNCE_MS = 300;

const selectBaseClass =
  "w-full rounded-lg bg-white text-gray-900 text-sm " +
  "border border-[#ddd] px-3 py-2 " +
  "appearance-none bg-[length:12px] bg-[right_12px_center] bg-no-repeat " +
  "pr-10 " +
  "hover:border-tea-600 focus:border-tea-600 focus:outline-none focus:ring-2 focus:ring-tea-500/30 " +
  "transition-colors cursor-pointer";

const selectArrowStyle = {
  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%236b7c5a' d='M6 8L1 3h10z'/%3E%3C/svg%3E")`,
} as const;

function shortUniversityLabel(tag: string): string {
  const map: Record<string, string> = {
    "Seoul National University": "서울대",
    "Yonsei University": "연세대",
    "Korea University": "고려대",
    "Sungkyunkwan University": "성균관",
    "Sogang University": "서강대",
    "Hanyang University": "한양대",
    "Ewha Womans University": "이화",
    "Hongik University": "홍익",
    "Language School": "어학당",
    "Korea (General)": "한국(일반)",
  };
  return map[tag] ?? (tag.length > 14 ? `${tag.slice(0, 12)}…` : tag);
}

function languageBadge(lang: string | null): string {
  switch (lang) {
    case "en":
      return "English";
    case "ko":
      return "한국어";
    case "other":
      return "기타 언어";
    default:
      return lang ?? "";
  }
}

function contentBadge(ct: string | null): string {
  switch (ct) {
    case "vlog":
      return "브이로그";
    case "advice":
      return "조언/팁";
    case "tour":
      return "캠퍼스투어";
    case "review":
      return "후기";
    case "general":
      return "일반";
    default:
      return ct ?? "";
  }
}

export default function VideosPage() {
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [university, setUniversity] = useState("");
  const [language, setLanguage] = useState("");
  const [contentType, setContentType] = useState("");
  const [offset, setOffset] = useState(0);

  const canLoadMore = useMemo(() => videos.length < total, [videos.length, total]);

  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(searchInput.trim());
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [searchInput]);

  const fetchVideos = useCallback(
    async (reset: boolean, nextOffset: number) => {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          limit: String(PAGE_SIZE),
          offset: String(nextOffset),
        });
        if (debouncedSearch) params.set("search", debouncedSearch);
        if (university) params.set("university", university);
        if (language) params.set("language", language);
        if (contentType) params.set("content_type", contentType);

        const response = await fetch(`/api/videos?${params.toString()}`);
        const json = await response.json();
        const incoming: VideoItem[] = json.data ?? [];
        setTotal(json.total ?? 0);
        setVideos((prev) => (reset ? incoming : [...prev, ...incoming]));
      } catch (error) {
        console.error("Failed to fetch videos:", error);
        if (reset) setVideos([]);
      } finally {
        setLoading(false);
      }
    },
    [debouncedSearch, university, language, contentType]
  );

  useEffect(() => {
    setOffset(0);
    void fetchVideos(true, 0);
  }, [debouncedSearch, university, language, contentType, fetchVideos]);

  const loadMore = () => {
    setOffset((prev) => {
      const next = prev + PAGE_SIZE;
      void fetchVideos(false, next);
      return next;
    });
  };

  const resetFilters = () => {
    setSearchInput("");
    setDebouncedSearch("");
    setUniversity("");
    setLanguage("");
    setContentType("");
    setOffset(0);
  };

  return (
    <main className="min-h-screen bg-[#f5f3f0] py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">유학영상</h1>

        <div className="mb-4">
          <label htmlFor="video-school-search" className="sr-only">
            학교 이름 검색
          </label>
          <input
            id="video-school-search"
            type="search"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="학교 이름으로 검색... (예: Seoul National, Yonsei, KAIST)"
            className="w-full px-4 py-3 text-sm md:text-base border border-[#ddd] rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-tea-500 focus:border-tea-600 text-gray-900 placeholder:text-gray-400 bg-white"
            autoComplete="off"
          />
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between md:gap-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 flex-1">
              <div>
                <label className="block text-xs font-semibold text-sage-700 mb-1.5">
                  대학
                </label>
                <select
                  value={university}
                  onChange={(e) => setUniversity(e.target.value)}
                  className={selectBaseClass}
                  style={selectArrowStyle}
                >
                  <option value="">전체 대학</option>
                  <option value="Seoul National University">
                    서울대학교 (SNU)
                  </option>
                  <option value="Yonsei University">연세대학교</option>
                  <option value="Korea University">고려대학교</option>
                  <option value="KAIST">KAIST</option>
                  <option value="Sungkyunkwan University">
                    성균관대학교 (SKKU)
                  </option>
                  <option value="Sogang University">서강대학교</option>
                  <option value="Hanyang University">한양대학교</option>
                  <option value="Ewha Womans University">이화여자대학교</option>
                  <option value="Hongik University">홍익대학교</option>
                  <option value="Language School">어학당/언어학교</option>
                  <option value="Korea (General)">한국 (일반)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-sage-700 mb-1.5">
                  언어
                </label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className={selectBaseClass}
                  style={selectArrowStyle}
                >
                  <option value="">전체 언어</option>
                  <option value="en">🇺🇸 English</option>
                  <option value="ko">🇰🇷 한국어</option>
                  <option value="other">🌏 기타 언어</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-sage-700 mb-1.5">
                  콘텐츠
                </label>
                <select
                  value={contentType}
                  onChange={(e) => setContentType(e.target.value)}
                  className={selectBaseClass}
                  style={selectArrowStyle}
                >
                  <option value="">전체 콘텐츠</option>
                  <option value="vlog">📹 브이로그</option>
                  <option value="advice">💡 조언/팁</option>
                  <option value="tour">🏫 캠퍼스투어</option>
                  <option value="review">⭐ 후기/리뷰</option>
                  <option value="general">📌 일반</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end md:pb-0.5">
              <button
                type="button"
                onClick={resetFilters}
                className="text-sm text-gray-500 hover:text-sage-700 underline-offset-2 hover:underline transition-colors"
              >
                필터 초기화
              </button>
            </div>
          </div>
        </div>

        {videos.length === 0 && !loading ? (
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center text-gray-500">
            아직 영상이 없습니다
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {videos.map((video) => (
                <a
                  key={video.id}
                  href={video.source_url}
                  target="_blank"
                  rel="noreferrer"
                  className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
                >
                  <img
                    src={video.thumbnail_url || "https://picsum.photos/640/360"}
                    alt={video.title}
                    className="w-full h-44 object-cover"
                  />
                  <div className="p-4">
                    {(video.university_tags?.length ||
                      video.language ||
                      video.content_type) && (
                      <div className="flex flex-wrap gap-1.5 mb-2">
                        {(video.university_tags ?? []).map((tag) => (
                          <span
                            key={tag}
                            className="inline-block rounded-full border border-sage-200 bg-sage-50 px-2 py-0.5 text-[11px] font-medium text-sage-800"
                          >
                            {shortUniversityLabel(tag)}
                          </span>
                        ))}
                        {video.language ? (
                          <span className="inline-block rounded-full border border-tea-200 bg-tea-50 px-2 py-0.5 text-[11px] font-medium text-tea-800">
                            {languageBadge(video.language)}
                          </span>
                        ) : null}
                        {video.content_type ? (
                          <span className="inline-block rounded-full border border-gray-200 bg-gray-50 px-2 py-0.5 text-[11px] font-medium text-gray-700">
                            {contentBadge(video.content_type)}
                          </span>
                        ) : null}
                      </div>
                    )}
                    <h3 className="text-sm font-semibold text-gray-900 line-clamp-2 min-h-[2.75rem]">
                      {video.title}
                    </h3>
                    <p className="text-xs text-gray-500 mt-2">
                      {video.channel_name || "Unknown"}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      조회수 {(video.view_count ?? 0).toLocaleString()}
                    </p>
                  </div>
                </a>
              ))}
            </div>

            {canLoadMore && (
              <div className="text-center mt-8">
                <button
                  type="button"
                  onClick={loadMore}
                  disabled={loading}
                  className="px-5 py-2 rounded-md bg-tea-600 text-white hover:bg-tea-700 disabled:opacity-60"
                >
                  {loading ? "불러오는 중..." : "더보기"}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}
