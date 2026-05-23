"use client";

export default function MentorRequestButton() {
  return (
    <button
      type="button"
      className="mt-8 w-full py-3 rounded-lg bg-orange-500 text-white font-bold hover:bg-orange-600 transition-colors"
      onClick={() => {
        window.alert("Mentoring requests coming soon! (Phase B2)");
      }}
    >
      Request Mentoring
    </button>
  );
}
