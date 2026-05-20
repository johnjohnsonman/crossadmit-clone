"use client";

import { useEffect, useMemo, useState } from "react";

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

const UNIVERSITY_FILTERS = [
  { label: "전체", value: "all" },
  { label: "서울대", value: "Seoul National University" },
  { label: "연세대", value: "Yonsei University" },
  { label: "고려대", value: "Korea University" },
  { label: "KAIST", value: "KAIST" },
  { label: "성균관대", value: "Sungkyunkwan University" },
  { label: "어학당", value: "Language School" },
];

const LANGUAGE_FILTERS = [
  { label: "전체", value: "all" },
  { label: "English", value: "en" },
  { label: "한국어", value: "ko" },
  { label: "기타", value: "other" },
];

const CONTENT_FILTERS = [
  { label: "전체", value: "all" },
  { label: "브이로그", value: "vlog" },
  { label: "조언", value: "advice" },
  { label: "캠퍼스투어", value: "tour" },
  { label: "후기", value: "review" },
];

const PAGE_SIZE = 20;

export default function VideosPage() {
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [university, setUniversity] = useState("all");
  const [language, setLanguage] = useState("all");
  const [contentType, setContentType] = useState("all");
  const [offset, setOffset] = useState(0);

  const canLoadMore = useMemo(() => videos.length < total, [videos.length, total]);

  useEffect(() => {
    setOffset(0);
    void fetchVideos(true, 0);
  }, [university, language, contentType]);

  async function fetchVideos(reset = false, nextOffset = offset) {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        limit: String(PAGE_SIZE),
        offset: String(nextOffset),
        university,
        language,
        content_type: contentType,
      });
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
  }

  const loadMore = async () => {
    const next = offset + PAGE_SIZE;
    setOffset(next);
    await fetchVideos(false, next);
  };

  return (
    <main className="min-h-screen bg-[#f5f3f0] py-8">
      <div className="container mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">유학영상</h1>

        <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6 space-y-4">
          <FilterRow
            title="대학"
            options={UNIVERSITY_FILTERS}
            value={university}
            onChange={setUniversity}
          />
          <FilterRow
            title="언어"
            options={LANGUAGE_FILTERS}
            value={language}
            onChange={setLanguage}
          />
          <FilterRow
            title="콘텐츠"
            options={CONTENT_FILTERS}
            value={contentType}
            onChange={setContentType}
          />
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
                    <h3 className="text-sm font-semibold text-gray-900 line-clamp-2 min-h-[2.75rem]">
                      {video.title}
                    </h3>
                    <p className="text-xs text-gray-500 mt-2">{video.channel_name || "Unknown"}</p>
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

function FilterRow({
  title,
  options,
  value,
  onChange,
}: {
  title: string;
  options: { label: string; value: string }[];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-sm font-semibold text-gray-700 min-w-16">{title}</span>
      {options.map((option) => (
        <button
          key={option.value}
          onClick={() => onChange(option.value)}
          className={`px-3 py-1.5 text-sm rounded-full border transition-colors ${
            value === option.value
              ? "bg-tea-600 text-white border-tea-600"
              : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
