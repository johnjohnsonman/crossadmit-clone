"use client";

import { useState } from "react";
import Link from "next/link";
import { UNIQUE_MAJORS } from "@/lib/majors";

// All Korean 4-year universities + International universities
const UNIVERSITIES = [
  // Korean Universities (English names)
  "Seoul National University",
  "Yonsei University",
  "Korea University",
  "Sungkyunkwan University",
  "Chung-Ang University",
  "Hanyang University",
  "University of Seoul",
  "Konkuk University",
  "Hongik University",
  "Kyung Hee University",
  "Ewha Womans University",
  "Dongguk University",
  "Sejong University",
  "Kookmin University",
  "Soongsil University",
  "Kwangwoon University",
  "Myongji University",
  "Sogang University",
  "Seoul National University of Science and Technology",
  "Ajou University",
  "Inha University",
  "Hankuk University of Foreign Studies",
  "Korea Aerospace University",
  "Hansung University",
  "Catholic University of Korea",
  "Kyonggi University",
  "Dankook University",
  "Duksung Women's University",
  "Dongduk Women's University",
  "Sangmyung University",
  "Sungshin Women's University",
  "Sookmyung Women's University",
  "Yonsei University (Wonju Campus)",
  "Chung-Ang University (Anseong Campus)",
  "Korea National University of Education",
  "Korea University of Technology and Education",
  "Sahmyook University",
  "Seoul Women's University",
  "Semyung University",
  "Suwon University",
  "Shinhan University",
  "Asia United Theological University",
  "Yonsei University (Songdo Campus)",
  "Yong In University",
  "Eulji University",
  "Ewha Womans University (Hwaseong Campus)",
  "Incheon National University",
  "Presbyterian University and Theological Seminary",
  "Chung-Ang University (Global Campus)",
  "Chongshin University",
  "Chugye University for the Arts",
  "Korea Bible University",
  "Korea National University of Arts",
  "Korea National University of Cultural Heritage",
  "Korea National Sport University",
  "Hansei University",
  "Hanshin University",
  "Han Young Theological University",
  "Hyupsung University",
  
  // Regional National Universities
  "Pusan National University",
  "Kyungpook National University",
  "Chonnam National University",
  "Chonbuk National University",
  "Chungnam National University",
  "Chungbuk National University",
  "Kangwon National University",
  "Gyeongsang National University",
  "Kongju National University",
  "Kunsan National University",
  "Mokpo National University",
  "Sunchon National University",
  "Andong National University",
  "Yeungnam University",
  "Ulsan National Institute of Science and Technology",
  "Wonkwang University",
  "Inje University",
  "Jeju National University",
  "Chosun University",
  "Changwon National University",
  "Korea National University of Education",
  "Korea Maritime and Ocean University",
  "Hanbat National University",
  
  // Special Institutes
  "Korea Advanced Institute of Science and Technology (KAIST)",
  "Pohang University of Science and Technology (POSTECH)",
  "Gwangju Institute of Science and Technology (GIST)",
  "Daegu Gyeongbuk Institute of Science and Technology (DGIST)",
  "Ulsan National Institute of Science and Technology (UNIST)",
  
  // US Universities
  "Stanford University",
  "Harvard University",
  "Massachusetts Institute of Technology (MIT)",
  "University of California, Berkeley",
  "University of California, Los Angeles (UCLA)",
  "University of Southern California",
  "Columbia University",
  "Yale University",
  "Princeton University",
  "New York University",
  "University of Pennsylvania",
  "Cornell University",
  "University of Chicago",
  "Duke University",
  "Northwestern University",
  "Johns Hopkins University",
  "Carnegie Mellon University",
  "University of Michigan",
  "University of Virginia",
  "University of North Carolina",
  "University of California, San Diego",
  "University of California, Davis",
  "University of California, Irvine",
  "University of Washington",
  "University of Texas at Austin",
  "University of Wisconsin-Madison",
  "Boston University",
  "University of Illinois",
  "Purdue University",
  "Penn State University",
  "Ohio State University",
  "University of Georgia",
  "University of Florida",
  "University of Maryland",
  "Rutgers University",
  "University of California, Santa Barbara",
  "University of California, Santa Cruz",
  "University of California, Riverside",
  "Indiana University",
  "University of Minnesota",
  "Michigan State University",
  "Arizona State University",
  "University of Arizona",
  "University of Colorado",
  "University of Utah",
  "University of Oregon",
  "Oregon State University",
  "University of California, Merced",
  "University of California, San Francisco",
  
  // UK Universities
  "University of Oxford",
  "University of Cambridge",
  "Imperial College London",
  "London School of Economics",
  "University College London",
  "King's College London",
  "University of Edinburgh",
  "University of Manchester",
  "University of Bristol",
  "University of Warwick",
  
  // Canadian Universities
  "University of Toronto",
  "University of British Columbia",
  "McGill University",
  "University of Alberta",
  "McMaster University",
  "University of Waterloo",
  "Western University",
  "Queen's University",
  "University of Calgary",
  "Simon Fraser University",
  
  // Australian Universities
  "University of Melbourne",
  "Australian National University",
  "University of Sydney",
  "University of New South Wales",
  "University of Queensland",
  "Monash University",
  "University of Western Australia",
  "University of Adelaide",
  
  // Japanese Universities
  "University of Tokyo",
  "Kyoto University",
  "Osaka University",
  "Tohoku University",
  "Nagoya University",
  "Kyushu University",
  "Hokkaido University",
  "Waseda University",
  "Keio University",
  
  // Chinese Universities
  "Peking University",
  "Tsinghua University",
  "Fudan University",
  "Shanghai Jiao Tong University",
  "Zhejiang University",
  "Nanjing University",
  "University of Science and Technology of China",
  "Xi'an Jiaotong University",
  "Harbin Institute of Technology",
  
  // Other Asian Universities
  "National University of Singapore",
  "Nanyang Technological University",
  "University of Hong Kong",
  "Chinese University of Hong Kong",
  "Hong Kong University of Science and Technology",
  "National Taiwan University",
  "National Tsing Hua University",
  "National Cheng Kung University",
];

export default function RegisterPageEN() {
  const [admittedUniversities, setAdmittedUniversities] = useState<string[]>([]);
  const [admittedMajors, setAdmittedMajors] = useState<Record<string, string>>({}); // 학교별 학과
  const [registeredUniversity, setRegisteredUniversity] = useState<string>("");
  const [registeredMajor, setRegisteredMajor] = useState<string>(""); // 등록한 학과
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [majorSearchTerm, setMajorSearchTerm] = useState<string>("");
  const [selectedUniversityForMajor, setSelectedUniversityForMajor] = useState<string>(""); // 학과 선택 중인 대학

  const handleAddUniversity = (university: string) => {
    if (!admittedUniversities.includes(university) && admittedUniversities.length < 10) {
      setAdmittedUniversities([...admittedUniversities, university]);
    }
  };

  const handleRemoveUniversity = (university: string) => {
    setAdmittedUniversities(admittedUniversities.filter((u) => u !== university));
    const newMajors = { ...admittedMajors };
    delete newMajors[university];
    setAdmittedMajors(newMajors);
    if (registeredUniversity === university) {
      setRegisteredUniversity("");
      setRegisteredMajor("");
    }
    if (selectedUniversityForMajor === university) {
      setSelectedUniversityForMajor("");
    }
  };

  const handleSetMajor = (university: string, major: string) => {
    setAdmittedMajors({
      ...admittedMajors,
      [university]: major,
    });
    setSelectedUniversityForMajor("");
    setMajorSearchTerm("");
  };

  const handleRemoveMajor = (university: string) => {
    const newMajors = { ...admittedMajors };
    delete newMajors[university];
    setAdmittedMajors(newMajors);
    if (registeredUniversity === university && registeredMajor === admittedMajors[university]) {
      setRegisteredMajor("");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (admittedUniversities.length < 2) {
      alert("Please select at least 2 universities you were admitted to.");
      return;
    }

    if (!registeredUniversity) {
      alert("Please select the university you actually registered for.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/crossadmit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          admittedUniversities,
          registeredUniversity,
          admittedMajors: admittedMajors,
          registeredMajor: registeredMajor,
        }),
      });

      if (response.ok) {
        setIsSuccess(true);
        setTimeout(() => {
          window.location.href = "/en/crossadmit";
        }, 2000);
      } else {
        alert("Registration failed. Please try again.");
      }
    } catch (error) {
      console.error("Error submitting:", error);
      alert("Registration failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <main className="min-h-screen bg-[#f5f3f0] flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-12 text-center max-w-md">
          <div className="text-6xl mb-4">✅</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Registration Complete!</h2>
          <p className="text-gray-600 mb-6">
            Your data has been added to CrossAdmit statistics.
          </p>
          <p className="text-sm text-gray-500">Redirecting to main page...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f5f3f0]">
      <div className="container mx-auto px-4 py-6 md:py-12">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="mb-6 md:mb-8">
            <Link
              href="/en/crossadmit"
              className="text-blue-600 hover:text-blue-700 text-xs md:text-sm mb-3 md:mb-4 inline-block"
            >
              ← Back to CrossAdmit
            </Link>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
              Register Your School Choice
            </h1>
            <p className="text-sm md:text-base text-gray-600">
              Simply register where you were admitted and where you actually enrolled
            </p>
          </div>

          <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 md:p-8">
            {/* Admitted Universities */}
            <div className="mb-6 md:mb-8">
              <label className="block text-base md:text-lg font-semibold text-gray-900 mb-3 md:mb-4">
                1. Select all universities you were admitted to (minimum 2)
              </label>
              
              {/* Selected Universities */}
              {admittedUniversities.length > 0 && (
                <div className="mb-4 p-3 md:p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex flex-wrap gap-2">
                    {admittedUniversities.map((uni) => (
                      <span
                        key={uni}
                        className="inline-flex items-center gap-1.5 md:gap-2 px-2.5 md:px-4 py-1.5 md:py-2 bg-blue-600 text-white rounded-full text-xs md:text-sm font-medium break-all"
                      >
                        <span className="max-w-[200px] md:max-w-none truncate">{uni}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveUniversity(uni)}
                          className="hover:bg-blue-700 rounded-full p-0.5 flex-shrink-0"
                          aria-label="Remove"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* University Search and Selection */}
              <div className="space-y-2">
                <input
                  type="text"
                  placeholder="Search university name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                />
                <select
                  onChange={(e) => {
                    if (e.target.value) {
                      handleAddUniversity(e.target.value);
                      e.target.value = "";
                      setSearchTerm("");
                    }
                  }}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                  size={searchTerm ? 8 : 1}
                >
                  <option value="">Select university...</option>
                  {UNIVERSITIES
                    .filter((u) => !admittedUniversities.includes(u))
                    .filter((u) => 
                      searchTerm === "" || 
                      u.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      u.includes(searchTerm)
                    )
                    .map((uni) => (
                      <option key={uni} value={uni}>
                        {uni}
                      </option>
                    ))}
                </select>
                {searchTerm && (
                  <p className="text-xs text-gray-500">
                    {UNIVERSITIES.filter((u) => 
                      !admittedUniversities.includes(u) &&
                      (u.toLowerCase().includes(searchTerm.toLowerCase()) || u.includes(searchTerm))
                    ).length} universities found
                  </p>
                )}
              </div>
              <p className="text-sm text-gray-500 mt-2">
                {admittedUniversities.length} selected
              </p>
            </div>

            {/* Major Selection for Admitted Universities (Optional) */}
            {admittedUniversities.length > 0 && (
              <div className="mb-8">
                <label className="block text-lg font-semibold text-gray-900 mb-4">
                  2. Select major for each admitted university (Optional)
                </label>
                <div className="space-y-4">
                  {admittedUniversities.map((uni) => (
                    <div key={uni} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                      <div className="flex items-center justify-between mb-3">
                        <span className="font-medium text-gray-900">{uni}</span>
                        {admittedMajors[uni] && (
                          <button
                            type="button"
                            onClick={() => handleRemoveMajor(uni)}
                            className="text-xs text-red-600 hover:text-red-700"
                          >
                            Remove Major
                          </button>
                        )}
                      </div>
                      {admittedMajors[uni] ? (
                        <div className="flex items-center gap-2">
                          <span className="px-3 py-1.5 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                            {admittedMajors[uni]}
                          </span>
                          <button
                            type="button"
                            onClick={() => setSelectedUniversityForMajor(uni)}
                            className="text-xs text-blue-600 hover:text-blue-700"
                          >
                            Change
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setSelectedUniversityForMajor(uni)}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-100 transition-colors"
                        >
                          + Select Major
                        </button>
                      )}
                      {selectedUniversityForMajor === uni && (
                        <div className="mt-3 space-y-2">
                          <input
                            type="text"
                            placeholder="Search major name..."
                            value={majorSearchTerm}
                            onChange={(e) => setMajorSearchTerm(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white text-sm"
                            onClick={(e) => e.stopPropagation()}
                          />
                          <select
                            onChange={(e) => {
                              if (e.target.value) {
                                handleSetMajor(uni, e.target.value);
                                e.target.value = "";
                              }
                            }}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white text-sm"
                            size={majorSearchTerm ? 6 : 1}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <option value="">Select major...</option>
                            {UNIQUE_MAJORS
                              .filter((m) => 
                                majorSearchTerm === "" || 
                                m.toLowerCase().includes(majorSearchTerm.toLowerCase()) ||
                                m.includes(majorSearchTerm)
                              )
                              .map((major) => (
                                <option key={major} value={major}>
                                  {major}
                                </option>
                              ))}
                          </select>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedUniversityForMajor("");
                              setMajorSearchTerm("");
                            }}
                            className="text-xs text-gray-500 hover:text-gray-700"
                          >
                            Cancel
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Registered University */}
            <div className="mb-6 md:mb-8">
              <label className="block text-base md:text-lg font-semibold text-gray-900 mb-3 md:mb-4">
                3. Select the university you actually registered for
              </label>
              
              {admittedUniversities.length === 0 ? (
                <p className="text-gray-500 text-xs md:text-sm mb-4">
                  Please select admitted universities first
                </p>
              ) : (
                <div className="space-y-2">
                  {admittedUniversities.map((uni) => (
                    <div key={uni} className="space-y-2">
                      <label
                        className={`flex items-start md:items-center p-3 md:p-4 border-2 rounded-lg cursor-pointer transition-all ${
                          registeredUniversity === uni
                            ? "border-yellow-500 bg-yellow-50"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        <input
                          type="radio"
                          name="registeredUniversity"
                          value={uni}
                          checked={registeredUniversity === uni}
                          onChange={(e) => {
                            setRegisteredUniversity(e.target.value);
                            // 등록한 대학의 학과가 있으면 자동 선택
                            if (admittedMajors[uni]) {
                              setRegisteredMajor(admittedMajors[uni]);
                            } else {
                              setRegisteredMajor("");
                            }
                          }}
                          className="mt-1 md:mt-0 mr-2 md:mr-3 w-4 h-4 md:w-5 md:h-5 text-yellow-500 focus:ring-yellow-500 flex-shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <span className="text-base md:text-lg font-medium text-gray-900 break-words">{uni}</span>
                          {admittedMajors[uni] && (
                            <span className="ml-1 md:ml-2 text-xs md:text-sm text-gray-600 block md:inline">({admittedMajors[uni]})</span>
                          )}
                        </div>
                        {registeredUniversity === uni && (
                          <span className="ml-2 text-yellow-600 font-semibold text-sm md:text-base flex-shrink-0">✓ Selected</span>
                        )}
                      </label>
                      {registeredUniversity === uni && admittedMajors[uni] && (
                        <div className="ml-6 md:ml-12 mb-2">
                          <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1">
                            Registered Major (Optional)
                          </label>
                          <select
                            value={registeredMajor}
                            onChange={(e) => setRegisteredMajor(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 text-gray-900 bg-white text-xs md:text-sm"
                          >
                            <option value="">No major selected</option>
                            <option value={admittedMajors[uni]}>{admittedMajors[uni]}</option>
                            {UNIQUE_MAJORS
                              .filter((m) => m !== admittedMajors[uni])
                              .map((major) => (
                                <option key={major} value={major}>
                                  {major}
                                </option>
                              ))}
                          </select>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Submit Button */}
            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 pt-4 md:pt-6 border-t border-gray-200">
              <div className="text-xs md:text-sm text-gray-500 flex-1">
                {admittedUniversities.length >= 2 && registeredUniversity ? (
                  <span className="text-green-600 font-medium">✓ Ready to register</span>
                ) : (
                  <span className="block">Please select at least 2 universities and choose where you enrolled</span>
                )}
              </div>
              <button
                type="submit"
                disabled={
                  isSubmitting ||
                  admittedUniversities.length < 2 ||
                  !registeredUniversity
                }
                className={`w-full md:w-auto px-6 md:px-8 py-3 rounded-lg font-semibold text-sm md:text-lg transition-colors ${
                  isSubmitting ||
                  admittedUniversities.length < 2 ||
                  !registeredUniversity
                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                    : "bg-yellow-500 hover:bg-yellow-600 text-white shadow-md"
                }`}
              >
                {isSubmitting ? "Registering..." : "Register"}
              </button>
            </div>
          </form>

          {/* Tip */}
          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              💡 <strong>Tip:</strong> If you were admitted to multiple universities, selecting all of them contributes to more accurate statistics.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
