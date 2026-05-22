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
      className="inline-flex items-center gap-2 rounded-lg border border-[#E5E5E0] bg-white px-4 py-2 text-sm font-medium text-[#1A1A1A] hover:border-[#2D5A27]/40 hover:bg-[#FAFAF8] transition-colors"
    >
      <span aria-hidden>📤</span>
      공유
    </button>
  );
}
