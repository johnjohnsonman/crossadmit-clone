"use client";

type Props = { title?: string };

export default function AdmissionShareButton({ title }: Props) {
  const onShare = async () => {
    const url = typeof window !== "undefined" ? window.location.href : "";
    try {
      if (navigator.share) {
        await navigator.share({ title: title ?? "합격DB", url });
        return;
      }
      await navigator.clipboard.writeText(url);
      alert("링크가 복사되었습니다.");
    } catch {
      /* cancelled */
    }
  };

  return (
    <button
      type="button"
      onClick={() => void onShare()}
      className="inline-flex items-center gap-2 rounded-lg border border-gray-800 bg-gray-900 px-4 py-2 text-sm font-medium text-gray-200 hover:border-orange-500/40 hover:bg-gray-800 transition-colors"
    >
      <span aria-hidden>📤</span>
      공유
    </button>
  );
}
