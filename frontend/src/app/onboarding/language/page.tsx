"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from 'next/image';

const languages = [
  { code: "en", name: "English", flag: "https://d35aaqx5ub95lt.cloudfront.net/vendor/bbe17e16aa4a106032d8e3521eaed13e.svg" },
  { code: "es", name: "Spanish", flag: "https://d35aaqx5ub95lt.cloudfront.net/vendor/59a90a2cedd48b751a8fd22014768fd7.svg" },
  { code: "fr", name: "French", flag: "https://d35aaqx5ub95lt.cloudfront.net/vendor/482fda142ee4abd728ebf4ccce5d3307.svg" },
  { code: "ja", name: "Japanese", flag: "https://d35aaqx5ub95lt.cloudfront.net/vendor/edea4fa18ff3e7d8c0282de3f102aaed.svg" },
  { code: "de", name: "German", flag: "https://d35aaqx5ub95lt.cloudfront.net/vendor/c71db846ffab7e0a74bc6971e34ad82e.svg" },
  { code: "ko", name: "Korean", flag: "https://d35aaqx5ub95lt.cloudfront.net/vendor/ec5835ac9f465ff3dad4b1b8725d4314.svg" },
  { code: "it", name: "Italian", flag: "https://d35aaqx5ub95lt.cloudfront.net/vendor/635a09df9323279d39934a991edd4510.svg" },
  { code: "zh", name: "Chinese", flag: "https://d35aaqx5ub95lt.cloudfront.net/vendor/9905aa3a86fcb9e351b0b3bfaf04d8b9.svg" },
  { code: "hi", name: "Hindi", flag: "https://d35aaqx5ub95lt.cloudfront.net/vendor/73837fa39dbf1bcc4c95a17a58ed0ffb.svg" },
  { code: "ru", name: "Russian", flag: "https://d35aaqx5ub95lt.cloudfront.net/vendor/eadd7804652170c33814a89482f1f353.svg" },
  { code: "ar", name: "Arabic", flag: "https://d35aaqx5ub95lt.cloudfront.net/vendor/9ab6930a263c981b57f9d578ac97cae7.svg" },
  { code: "pt", name: "Portuguese", flag: "https://d35aaqx5ub95lt.cloudfront.net/vendor/27d253ae1272917fc9f4a79459aacd53.svg" },
  { code: "tr", name: "Turkish", flag: "https://d35aaqx5ub95lt.cloudfront.net/vendor/bc80a9518cd6d5af6ae14e8b22b8a1f4.svg" },
  { code: "nl", name: "Dutch", flag: "https://d35aaqx5ub95lt.cloudfront.net/vendor/de945d789e249dcd74333a6996472ef8.svg" },
  { code: "el", name: "Greek", flag: "https://d35aaqx5ub95lt.cloudfront.net/vendor/8db373482261397a3159d3f370eed2f3.svg" },
  { code: "vi", name: "Vietnamese", flag: "https://d35aaqx5ub95lt.cloudfront.net/vendor/2b077d42185bc45d4896ed55f15c4fea.svg" },
  { code: "pl", name: "Polish", flag: "https://d35aaqx5ub95lt.cloudfront.net/vendor/f095084e6ec400e631d62c3d95fefaa2.svg" },
  { code: "sv", name: "Swedish", flag: "https://d35aaqx5ub95lt.cloudfront.net/vendor/f578430c9b7ab617c107893afbb501c0.svg" },
  { code: "la", name: "Latin", flag: "https://d35aaqx5ub95lt.cloudfront.net/vendor/f7cee6cc09270371b097129faf792c2a.svg" },
  { code: "ga", name: "Irish", flag: "https://d35aaqx5ub95lt.cloudfront.net/vendor/ef0bfb96037b127473bd7bcbfde1a6ed.svg" },
  { code: "no", name: "Norwegian", flag: "https://d35aaqx5ub95lt.cloudfront.net/vendor/90b37d97edc66e830dc2286279548f67.svg" },
  { code: "he", name: "Hebrew", flag: "https://d35aaqx5ub95lt.cloudfront.net/vendor/f818f545a703ddaa046ca8786e781742.svg" },
  { code: "val", name: "High Valyrian", flag: "https://d35aaqx5ub95lt.cloudfront.net/vendor/2880099b038848abbfd11104097953ad.svg" },
  { code: "uk", name: "Ukrainian", flag: "https://d35aaqx5ub95lt.cloudfront.net/vendor/7c6e12bc57527843082f7f5bb77c9862.svg" },
  { code: "id", name: "Indonesian", flag: "https://d35aaqx5ub95lt.cloudfront.net/vendor/339c0413e542f19b234971d7740447e7.svg" },
  { code: "ro", name: "Romanian", flag: "https://d35aaqx5ub95lt.cloudfront.net/vendor/357e13bb10cf86fc06552d563957e2e6.svg" },
  { code: "fi", name: "Finnish", flag: "https://d35aaqx5ub95lt.cloudfront.net/vendor/b4d0e4f6451f504e1441eb93efdbea5e.svg" },
  { code: "da", name: "Danish", flag: "https://d35aaqx5ub95lt.cloudfront.net/vendor/6af84a7cb8e99ea8a567c2b9c55b9926.svg" },
  { code: "cs", name: "Czech", flag: "https://d35aaqx5ub95lt.cloudfront.net/vendor/828bf0fea457d3beaaab3d6c0bfcc975.svg" },
  { code: "zu", name: "Zulu", flag: "https://d35aaqx5ub95lt.cloudfront.net/vendor/112e1531d0ac198a9424bd1b0a7166e6.svg" },
  { code: "haw", name: "Hawaiian", flag: "https://d35aaqx5ub95lt.cloudfront.net/vendor/312e21f793c555787d01a45e20ee8191.svg" },
  { code: "cy", name: "Welsh", flag: "https://d35aaqx5ub95lt.cloudfront.net/vendor/f773f1b240623072e48843ecdf90d756.svg" },
  { code: "sw", name: "Swahili", flag: "https://d35aaqx5ub95lt.cloudfront.net/vendor/335311988405b4354e1b6ae9037c02db.svg" },
  { code: "hu", name: "Hungarian", flag: "https://d35aaqx5ub95lt.cloudfront.net/vendor/2ed8d0a73eab3c9cba0290e2b459684a.svg" },
  { code: "gd", name: "Scottish Gaelic", flag: "https://d35aaqx5ub95lt.cloudfront.net/vendor/09eba3135efe8fe93a4662dba813b921.svg" },
  { code: "ht", name: "Haitian Creole", flag: "https://d35aaqx5ub95lt.cloudfront.net/vendor/8cb302b44c183c1a8ec3b90caf90d922.svg" },
  { code: "eo", name: "Esperanto", flag: "https://d35aaqx5ub95lt.cloudfront.net/vendor/6de7e4731b2a82a6458268e1a3d67ce4.svg" },
  { code: "tlh", name: "Klingon", flag: "https://d35aaqx5ub95lt.cloudfront.net/vendor/76d654213a8282b0ebc25b4f535ee003.svg" },
  { code: "nv", name: "Navajo", flag: "https://d35aaqx5ub95lt.cloudfront.net/vendor/bbc8ad0cfe2596d5193376ebdc3e969c.svg" },
  { code: "yi", name: "Yiddish", flag: "https://d35aaqx5ub95lt.cloudfront.net/vendor/55bad151fa6a8d9e2376fc9697c671c8.svg" },
];

const steps = ["Topics", "Language", "Finish"];

export default function LanguageOnboarding() {
  const [selected, setSelected] = useState<string[]>([]);
  const router = useRouter();

  const toggleLanguage = (code: string) => {
    setSelected((prev) => {
      const newSelected = prev.includes(code) 
        ? prev.filter((c) => c !== code) 
        : [...prev, code];
      
      // Save to localStorage
      localStorage.setItem("wikifacts_languages", JSON.stringify(newSelected));
      
      return newSelected;
    });
  };

  // Load saved languages on mount
  useEffect(() => {
    const savedLanguages = JSON.parse(localStorage.getItem("wikifacts_languages") || "[]");
    setSelected(savedLanguages);
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#f6f6f6] px-4 py-8 relative">
      {/* Progress Tracker */}
      <div className="flex items-center justify-center mb-8 mt-2">
        {steps.map((step, idx) => (
          <div key={step} className="flex items-center">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-base border-2 transition-all
                ${idx === 1 ? 'bg-[#1cb760] border-[#1cb760] text-white' : 'bg-white border-[#d3d3d3] text-[#bdbdbd]'}
              `}
            >
              {idx + 1}
            </div>
            {idx < steps.length - 1 && (
              <div className="w-10 h-1 bg-[#e5e5e5] mx-2 rounded" />
            )}
          </div>
        ))}
      </div>
      <h1 className="text-[2rem] md:text-[2.5rem] font-extrabold mb-6 text-center text-black" style={{letterSpacing: '-0.02em'}}>What languages do you speak?</h1>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8 w-full max-w-2xl">
        {languages.map((lang) => (
          <button
            key={lang.code}
            className={`bg-white rounded-xl shadow p-6 flex flex-col items-center border-2 transition hover:scale-105 focus:outline-none ${selected.includes(lang.code) ? 'border-[#1cb760] shadow-lg' : 'border-transparent'}`}
            onClick={() => toggleLanguage(lang.code)}
          >
            <Image 
              src={lang.flag} 
              alt={lang.name} 
              width={64}
              height={64}
              className="w-16 h-16 mb-2 rounded" 
            />
            <span className="font-semibold text-lg mb-1 text-[#bdbdbd]">{lang.name}</span>
          </button>
        ))}
      </div>
      {/* Chevron Navigation */}
      <button
        className="fixed left-4 top-1/2 transform -translate-y-1/2 bg-white rounded-full shadow p-3 flex items-center justify-center border border-[#e5e5e5] hover:bg-[#f0f0f0] z-50"
        aria-label="Back"
        onClick={() => router.push('/onboarding/topics')}
      >
        <svg width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
      </button>
      <button
        className="fixed right-4 top-1/2 transform -translate-y-1/2 bg-[#1cb760] text-white rounded-full shadow p-3 flex items-center justify-center border border-[#1cb760] hover:bg-[#169c4a] disabled:opacity-50 z-50"
        aria-label="Next"
        disabled={selected.length === 0}
        onClick={() => router.push('/onboarding/finish')}
      >
        <svg width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </div>
  );
} 