"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { AdmissionRecord } from "@/lib/types";

interface Props {
  universityName: string;
}

export default function UniversityAdmissions({ universityName }: Props) {
  const [records, setRecords] = useState<AdmissionRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admissions")
      .then((res) => res.json())
      .then((data: AdmissionRecord[]) => {
        // 해당 대학교의 합격자만 필터링
        const filtered = data
          .filter((record) => record.university === universityName)
          .slice(0, 10); // 최근 10개만
        setRecords(filtered);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Failed to fetch records:", error);
        setLoading(false);
      });
  }, [universityName]);

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-sage-200 p-6">
        <h2 className="text-2xl font-serif text-sage-800 mb-4">합격 DB</h2>
        <p className="text-sage-600">로딩 중...</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-sage-200 p-6">
      <h2 className="text-2xl font-serif text-sage-800 mb-4">합격 DB</h2>
      {records.length === 0 ? (
        <p className="text-sage-600">합격 데이터가 없습니다.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-sage-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-sage-700">
                  전공
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-sage-700">
                  연도
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-sage-700">
                  전형
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-sage-700">
                  상태
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sage-200">
              {records.map((record) => (
                <tr
                  key={record.id}
                  className="hover:bg-tea-50 cursor-pointer"
                >
                  <td className="px-4 py-2 text-sm text-sage-700">
                    <Link
                      href={`/admissions/${record.id}`}
                      className="block hover:text-tea-600 transition-colors"
                    >
                      {record.major}
                    </Link>
                  </td>
                  <td className="px-4 py-2 text-sm text-sage-700">
                    <Link
                      href={`/admissions/${record.id}`}
                      className="block hover:text-tea-600 transition-colors"
                    >
                      {record.year}
                    </Link>
                  </td>
                  <td className="px-4 py-2 text-sm text-sage-700">
                    <Link
                      href={`/admissions/${record.id}`}
                      className="block hover:text-tea-600 transition-colors"
                    >
                      {record.admissionType}
                    </Link>
                  </td>
                  <td className="px-4 py-2">
                    <Link
                      href={`/admissions/${record.id}`}
                      className="block"
                    >
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${
                          record.status === "합격"
                            ? "bg-tea-100 text-tea-800"
                            : "bg-sage-100 text-sage-800"
                        }`}
                      >
                        {record.status}
                      </span>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

