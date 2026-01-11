"use client";

import { useState } from "react";

interface Props {
  admissionId: string;
  initialLikes: number;
}

export default function LikeButton({ admissionId, initialLikes }: Props) {
  const [likes, setLikes] = useState(initialLikes);
  const [isLiked, setIsLiked] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLike = async () => {
    if (isLiked || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/admissions/${admissionId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "like",
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setLikes(data.likes);
        setIsLiked(true);
      } else {
        console.error("Failed to like");
      }
    } catch (error) {
      console.error("Error liking:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <button
      onClick={handleLike}
      disabled={isLiked || isSubmitting}
      className={`flex items-center gap-1 transition-colors ${
        isLiked
          ? "text-tea-600 cursor-not-allowed"
          : "hover:text-tea-600 cursor-pointer"
      }`}
    >
      <span>{isLiked ? "👍" : "👍"}</span>
      <span>{likes}</span>
    </button>
  );
}
