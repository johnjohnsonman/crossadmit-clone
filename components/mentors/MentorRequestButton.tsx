"use client";

export default function MentorRequestButton() {
  return (
    <button
      type="button"
      className="mt-8 w-full py-3 rounded-lg bg-purple-600 text-white font-bold hover:bg-purple-700 transition-colors"
      onClick={() => {
        window.alert("Mentoring requests coming soon! (Phase B2)");
      }}
    >
      Request Mentoring
    </button>
  );
}
