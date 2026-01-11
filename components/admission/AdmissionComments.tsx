"use client";

import { useState } from "react";
import { Comment } from "@/lib/types";

interface Props {
  admissionId: string;
  comments: Comment[];
}

export default function AdmissionComments({ admissionId, comments: initialComments }: Props) {
  const [comments, setComments] = useState<Comment[]>(initialComments);
  const [newComment, setNewComment] = useState("");
  const [author, setAuthor] = useState("");
  const [password, setPassword] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/admissions/${admissionId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "comment",
          comment: {
            author: isAnonymous ? "익명" : author || "익명",
            content: newComment,
            isAnonymous,
          },
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setComments(data.comments || comments);
        setNewComment("");
        setAuthor("");
        setPassword("");
      } else {
        console.error("Failed to submit comment");
      }
    } catch (error) {
      console.error("Error submitting comment:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h2 className="text-xl font-bold text-gray-900 mb-4">
        댓글 ({comments.length})
      </h2>

      {/* 댓글 목록 */}
      <div className="space-y-4 mb-6">
        {comments.length === 0 ? (
          <p className="text-gray-500 text-sm">아직 댓글이 없습니다.</p>
        ) : (
          comments.map((comment) => (
            <div
              key={comment.id}
              className="p-4 bg-gray-50 rounded-lg border border-gray-200"
            >
              <div className="flex items-start justify-between mb-2">
                <span className="text-sm font-medium text-gray-800">
                  {comment.author}
                </span>
                <span className="text-xs text-gray-500">
                  {new Date(comment.createdAt).toLocaleDateString("ko-KR")}
                </span>
              </div>
              <p className="text-gray-700 text-sm">{comment.content}</p>
            </div>
          ))
        )}
      </div>

      {/* 댓글 작성 폼 */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder:text-gray-400"
            rows={4}
            placeholder="댓글을 작성해주세요"
          />
        </div>

        <div className="flex items-center gap-4">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={isAnonymous}
              onChange={(e) => setIsAnonymous(e.target.checked)}
              className="mr-2"
            />
            <span className="text-sm text-gray-600">익명</span>
          </label>
          {!isAnonymous && (
            <div className="flex-1">
              <input
                type="text"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                className="w-full px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder:text-gray-400"
                placeholder="닉네임"
              />
            </div>
          )}
        </div>

        <div>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder:text-gray-400"
            placeholder="비밀번호"
          />
        </div>

        <div className="flex items-center justify-between">
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            {isSubmitting ? "등록 중..." : "댓글 쓰기"}
          </button>
          <button
            type="button"
            className="px-4 py-2 text-sage-600 hover:text-sage-800 text-sm"
          >
            인증하기
          </button>
        </div>
      </form>
    </div>
  );
}


