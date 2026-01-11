"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { AdmissionRecord } from "@/lib/types";

export default function PopularAdmissions() {
  const [records, setRecords] = useState<AdmissionRecord[]>([]);

  useEffect(() => {
    fetch("/api/admissions")
      .then((res) => res.json())
      .then((data: AdmissionRecord[]) => {
        // 인기순으로 정렬 (좋아요 수 기준)
        const sorted = data
          .sort((a, b) => (b.likes || 0) - (a.likes || 0))
          .slice(0, 5);
        setRecords(sorted);
      });
  }, []);

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-gray-900">인기 합격DB</h3>
        <Link href="/admissions" className="text-sm text-blue-600 hover:text-blue-700">
          more &gt;
        </Link>
      </div>
      <div className="space-y-3">
        {records.map((record) => (
          <Link
            key={record.id}
            href={`/admissions/${record.id}`}
            className="block p-3 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-blue-300 transition-all"
          >
            <div className="flex items-start justify-between mb-1">
              <h4 className="text-sm font-medium text-gray-900 line-clamp-1">
                {record.university} {record.major}
              </h4>
            </div>
            <div className="flex items-center gap-2 mt-2">
              <span
                className={`px-2 py-0.5 text-xs font-medium rounded ${
                  record.status === "합격"
                    ? "bg-green-100 text-green-800"
                    : "bg-blue-100 text-blue-800"
                }`}
              >
                {record.status}
              </span>
              <span className="text-xs text-gray-500">
                {record.year}년도
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}


