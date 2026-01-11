"use client";

import { useState } from "react";
import Link from "next/link";

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
  const [registeredUniversity, setRegisteredUniversity] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [searchTerm, setSearchTerm] = useState<string>("");

  const handleAddUniversity = (university: string) => {
    if (!admittedUniversities.includes(university) && admittedUniversities.length < 10) {
      setAdmittedUniversities([...admittedUniversities, university]);
    }
  };

  const handleRemoveUniversity = (university: string) => {
    setAdmittedUniversities(admittedUniversities.filter((u) => u !== university));
    if (registeredUniversity === university) {
      setRegisteredUniversity("");
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
      <main className="min-h-screen bg-gray-50 flex items-center justify-center">
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
    <main className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <Link
              href="/en/crossadmit"
              className="text-blue-600 hover:text-blue-700 text-sm mb-4 inline-block"
            >
              ← Back to CrossAdmit
            </Link>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Register Your School Choice
            </h1>
            <p className="text-gray-600">
              Simply register where you were admitted and where you actually enrolled
            </p>
          </div>

          <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
            {/* Admitted Universities */}
            <div className="mb-8">
              <label className="block text-lg font-semibold text-gray-900 mb-4">
                1. Select all universities you were admitted to (minimum 2)
              </label>
              
              {/* Selected Universities */}
              {admittedUniversities.length > 0 && (
                <div className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex flex-wrap gap-2">
                    {admittedUniversities.map((uni) => (
                      <span
                        key={uni}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-full text-sm font-medium"
                      >
                        {uni}
                        <button
                          type="button"
                          onClick={() => handleRemoveUniversity(uni)}
                          className="hover:bg-blue-700 rounded-full p-0.5"
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

            {/* Registered University */}
            <div className="mb-8">
              <label className="block text-lg font-semibold text-gray-900 mb-4">
                2. Select the university you actually registered for
              </label>
              
              {admittedUniversities.length === 0 ? (
                <p className="text-gray-500 text-sm mb-4">
                  Please select admitted universities first
                </p>
              ) : (
                <div className="space-y-2">
                  {admittedUniversities.map((uni) => (
                    <label
                      key={uni}
                      className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all ${
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
                        onChange={(e) => setRegisteredUniversity(e.target.value)}
                        className="mr-3 w-5 h-5 text-yellow-500 focus:ring-yellow-500"
                      />
                      <span className="text-lg font-medium text-gray-900">{uni}</span>
                      {registeredUniversity === uni && (
                        <span className="ml-auto text-yellow-600 font-semibold">✓ Selected</span>
                      )}
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* Submit Button */}
            <div className="flex items-center justify-between pt-6 border-t border-gray-200">
              <div className="text-sm text-gray-500">
                {admittedUniversities.length >= 2 && registeredUniversity ? (
                  <span className="text-green-600 font-medium">✓ Ready to register</span>
                ) : (
                  <span>Please select at least 2 universities and choose where you enrolled</span>
                )}
              </div>
              <button
                type="submit"
                disabled={
                  isSubmitting ||
                  admittedUniversities.length < 2 ||
                  !registeredUniversity
                }
                className={`px-8 py-3 rounded-lg font-semibold text-lg transition-colors ${
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
