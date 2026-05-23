"use client";

import { useEffect, useRef } from "react";

type Props = {
  mentorId: string;
};

export function ViewTracker({ mentorId }: Props) {
  const tracked = useRef(false);

  useEffect(() => {
    if (tracked.current || !mentorId) return;
    tracked.current = true;

    if (typeof navigator !== "undefined") {
      const ua = navigator.userAgent.toLowerCase();
      if (
        !ua.trim() ||
        ua.includes("bot") ||
        ua.includes("crawler") ||
        ua.includes("spider")
      ) {
        return;
      }
    }

    const timer = setTimeout(() => {
      void fetch(`/api/mentors/${mentorId}/view`, {
        method: "POST",
        keepalive: true,
      }).catch(() => {});
    }, 3000);

    return () => clearTimeout(timer);
  }, [mentorId]);

  return null;
}
