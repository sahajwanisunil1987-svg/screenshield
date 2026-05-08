"use client";

import dynamic from "next/dynamic";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Mic, Search as SearchIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { SearchSuggestion } from "@/types";

const SearchAutocomplete = dynamic(
  () => import("@/components/ui/search-autocomplete").then((module) => module.SearchAutocomplete),
  {
    ssr: false,
    loading: () => <div className="h-[50px] w-full rounded-2xl border border-white/10 bg-white/5" />
  }
);

type NavbarSearchProps = {
  placeholder: string;
  buttonLabel: string;
  wrapperClassName?: string;
  inputClassName?: string;
  dropdownClassName?: string;
  buttonClassName?: string;
  onSubmitted?: () => void;
};

export function NavbarSearch({
  placeholder,
  buttonLabel,
  wrapperClassName = "flex items-center gap-3",
  inputClassName,
  dropdownClassName,
  buttonClassName,
  onSubmitted
}: NavbarSearchProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState("");
  const [voiceSupported, setVoiceSupported] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  useEffect(() => {
    if (pathname === "/products") {
      setSearch(searchParams.get("search") ?? "");
      return;
    }

    setSearch("");
  }, [pathname, searchParams]);

  useEffect(() => {
    const SpeechRecognitionApi = window.SpeechRecognition ?? window.webkitSpeechRecognition;
    setVoiceSupported(Boolean(SpeechRecognitionApi));

    return () => {
      recognitionRef.current?.stop();
    };
  }, []);

  const onSearch = (nextSearch = search) => {
    const params = new URLSearchParams();
    if (nextSearch.trim()) {
      params.set("search", nextSearch.trim());
    }

    router.push(`/products${params.toString() ? `?${params.toString()}` : ""}`);
    onSubmitted?.();
  };

  const startVoiceSearch = () => {
    const SpeechRecognitionApi = window.SpeechRecognition ?? window.webkitSpeechRecognition;
    if (!SpeechRecognitionApi || isListening) {
      return;
    }

    const recognition = new SpeechRecognitionApi();
    recognitionRef.current = recognition;
    recognition.lang = "en-IN";
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.onresult = (event) => {
      const transcript = Array.from({ length: event.results.length })
        .map((_, index) => event.results[index]?.[0]?.transcript ?? "")
        .join(" ")
        .trim();

      if (transcript) {
        setSearch(transcript);
        onSearch(transcript);
      }
    };
    recognition.onerror = () => {
      setIsListening(false);
    };
    recognition.onend = () => {
      setIsListening(false);
    };

    setIsListening(true);
    recognition.start();
  };

  return (
    <div className={wrapperClassName} role="search">
      <div className="min-w-0 flex-1">
        <SearchAutocomplete
          name="site-search"
          value={search}
          onChange={setSearch}
          onSubmit={() => onSearch()}
          onSuggestionSelect={(suggestion: SearchSuggestion) => {
            router.push(`/products/${suggestion.slug}`);
            onSubmitted?.();
          }}
          placeholder={placeholder}
          inputClassName={inputClassName}
          dropdownClassName={dropdownClassName}
        />
      </div>
      {voiceSupported ? (
        <button
          type="button"
          onClick={startVoiceSearch}
          className={`inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border text-white transition ${
            isListening
              ? "border-rose-300/60 bg-rose-500/20 text-rose-100 shadow-[0_0_0_4px_rgba(244,63,94,0.12)]"
              : "border-white/10 bg-white/5 hover:bg-white/10"
          }`}
          aria-label={isListening ? "Listening for product search" : "Search products by voice"}
          title={isListening ? "Listening..." : "Voice search"}
        >
          <Mic className="h-4 w-4" />
        </button>
      ) : null}
      <button
        type="button"
        onClick={() => onSearch()}
        className={`${buttonClassName ?? ""} inline-flex items-center justify-center gap-2`}
      >
        <SearchIcon className="hidden h-4 w-4 sm:block" />
        <span>{buttonLabel}</span>
      </button>
    </div>
  );
}
