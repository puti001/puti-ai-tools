/* Bright Classroom Index — visual cards with thumbnail support, responsive grid, and sound effects */
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ExternalLink,
  Image as ImageIcon,
  Search,
  LibraryBig,
  AlertTriangle,
  Volume2,
  VolumeX,
  LayoutGrid,
  List,
  Sparkles,
} from "lucide-react";
import importedTools from "@/data/tools.json";

const PADLET_URL = "https://padlet.com/clongwh/puti_ai_tools";

type Tool = {
  id: string;
  title: string;
  category: string;
  url: string;
  source?: string;
  image?: string;
};

type SourceTool = {
  id?: string;
  title: string;
  category: string;
  url: string;
  source?: string;
  image?: string;
};

const starterTools: Tool[] = (importedTools as SourceTool[]).map((tool, index) => ({
  ...tool,
  id: tool.id || `padlet-${index}`,
}));

const categoryEmojis = ["✨", "📚", "🧠", "🎮", "✍️", "🧮", "🗂️", "🌱", "🎨", "🤖", "🎵", "🌈"];
const accent = ["#ffd54f", "#8de2db", "#ffc3b4", "#c9bcff", "#b7e39b", "#a9d4ff"];
const gradients = [
  "linear-gradient(135deg, #fff3c4 0%, #ffd54f 100%)",
  "linear-gradient(135deg, #d1f4f0 0%, #8de2db 100%)",
  "linear-gradient(135deg, #ffe4dc 0%, #ffc3b4 100%)",
  "linear-gradient(135deg, #ebe6ff 0%, #c9bcff 100%)",
  "linear-gradient(135deg, #e3f6d7 0%, #b7e39b 100%)",
  "linear-gradient(135deg, #ddedff 0%, #a9d4ff 100%)",
];

const getCategoryIndex = (category: string) =>
  [...category].reduce((n, c) => n + c.charCodeAt(0), 0);

const iconFor = (category: string) =>
  categoryEmojis[getCategoryIndex(category) % categoryEmojis.length];

const colorFor = (category: string) =>
  accent[getCategoryIndex(category) % accent.length];

const gradientFor = (category: string) =>
  gradients[getCategoryIndex(category) % gradients.length];

// Robust Thumbnail Component with Error Fallback & No-Referrer
function CardThumbnail({
  src,
  title,
  category,
}: {
  src?: string;
  title: string;
  category: string;
}) {
  const [error, setError] = useState(false);
  const [loaded, setLoaded] = useState(false);

  if (!src || error) {
    return (
      <div
        className="flex h-full w-full flex-col items-center justify-center p-4 text-center transition-transform duration-300 group-hover:scale-105"
        style={{ background: gradientFor(category) }}
      >
        <span className="text-4xl drop-shadow-sm">{iconFor(category)}</span>
        <span className="mt-2 text-xs font-bold text-[#1e2a38]/80">{category}</span>
      </div>
    );
  }

  return (
    <div className="relative h-full w-full bg-[#edf2f6]">
      {!loaded && (
        <div className="absolute inset-0 animate-pulse bg-[#e2e9ef]" />
      )}
      <img
        src={src}
        alt={title}
        loading="lazy"
        referrerPolicy="no-referrer"
        crossOrigin="anonymous"
        onLoad={() => setLoaded(true)}
        onError={() => setError(true)}
        className={`h-full w-full object-cover object-top transition-all duration-300 group-hover:scale-105 ${
          loaded ? "opacity-100" : "opacity-0"
        }`}
      />
    </div>
  );
}

export default function Home() {
  const [tools] = useState<Tool[]>(starterTools);
  const [query, setQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [soundOn, setSoundOn] = useState(false);
  const [soundReady, setSoundReady] = useState(false);
  const audioRef = useRef<AudioContext | null>(null);
  const lastHoverRef = useRef(0);

  const getAudio = () => {
    if (!audioRef.current) audioRef.current = new AudioContext();
    if (audioRef.current.state === "suspended") void audioRef.current.resume();
    return audioRef.current;
  };

  const playTone = (kind: "hover" | "click" | "alert", force = false) => {
    if (!soundOn && !force) return;
    if (kind === "hover" && Date.now() - lastHoverRef.current < 110) return;
    if (kind === "hover") lastHoverRef.current = Date.now();
    const ctx = getAudio();
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    const now = ctx.currentTime;
    const settings: { frequency: number; duration: number; volume: number; wave: OscillatorType } =
      kind === "hover"
        ? { frequency: 640, duration: 0.09, volume: 0.065, wave: "sine" }
        : kind === "click"
        ? { frequency: 700, duration: 0.16, volume: 0.13, wave: "triangle" }
        : { frequency: 210, duration: 0.18, volume: 0.11, wave: "square" };

    oscillator.type = settings.wave;
    oscillator.frequency.setValueAtTime(settings.frequency, now);
    if (kind === "click") oscillator.frequency.exponentialRampToValueAtTime(1120, now + settings.duration);
    if (kind === "alert") oscillator.frequency.exponentialRampToValueAtTime(145, now + settings.duration);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(settings.volume, now + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + settings.duration);
    oscillator.connect(gain).connect(ctx.destination);
    oscillator.start(now);
    oscillator.stop(now + settings.duration + 0.01);
  };

  const toggleSound = () => {
    if (soundOn) {
      setSoundOn(false);
      return;
    }
    setSoundOn(true);
    setSoundReady(true);
    playTone("click", true);
  };

  useEffect(() => () => { audioRef.current?.close(); }, []);

  const padletCardCount = tools.filter((tool) => tool.title !== "【01】講師經歷待補卡片").length;
  const toolsWithThumbCount = tools.filter((tool) => !!tool.image).length;

  const groups = useMemo(() => {
    const map = new Map<string, Tool[]>();
    tools.forEach((tool) => {
      if (!map.has(tool.category)) map.set(tool.category, []);
      map.get(tool.category)!.push(tool);
    });
    return [...map.entries()];
  }, [tools]);

  const filteredGroups = useMemo(
    () =>
      groups
        .map(
          ([category, items]) =>
            [
              category,
              items.filter((t) =>
                `${t.title} ${t.category}`.toLowerCase().includes(query.toLowerCase())
              ),
            ] as const
        )
        .filter(([, items]) => items.length),
    [groups, query]
  );

  return (
    <main className="mx-auto max-w-7xl px-4 py-6 sm:px-8 sm:py-10">
      {/* Header Banner */}
      <header className="appear relative overflow-hidden rounded-[2rem] border-2 border-[#1e2a38] bg-white px-6 py-8 shadow-[8px_8px_0_#ffcd38] sm:px-10">
        <div className="absolute right-0 top-0 h-36 w-36 rounded-bl-full bg-[#8de2db]/80" />
        <p className="relative text-xs font-black tracking-[.18em] text-[#239c9d]">
          PUTI-AI 品牌工具索引
        </p>
        <div className="relative mt-2 flex flex-wrap items-end justify-between gap-5">
          <div className="max-w-2xl">
            <h1 className="text-[clamp(1.6rem,5.5vw,3.2rem)] font-black leading-tight tracking-[-.04em] text-[#1e2a38]">
              Puti-AI 教學工具庫備份站
            </h1>
            <p className="mt-4 text-sm leading-7 text-[#52606d]">
              完整分類收錄、視覺縮圖展示、快速搜尋、點選即用。同步 Padlet 322
              張精選教學卡片，已包含{" "}
              <span className="font-bold text-[#239c9d]">{toolsWithThumbCount}</span>{" "}
              張實體操作截圖與工具直連。
            </p>
          </div>
          <div className="flex gap-3">
            <div className="rounded-2xl bg-[#1e2a38] px-5 py-4 text-center text-white shadow-sm">
              <b className="block text-3xl font-black text-[#ffcd38]">{padletCardCount}</b>
              <span className="text-xs font-bold tracking-wider opacity-85">Padlet 卡片</span>
            </div>
            <div className="rounded-2xl border-2 border-[#1e2a38] bg-[#fffdf6] px-5 py-4 text-center text-[#1e2a38]">
              <b className="block text-3xl font-black text-[#239c9d]">{groups.length}</b>
              <span className="text-xs font-bold tracking-wider text-[#607282]">主題分類</span>
            </div>
          </div>
        </div>

        <div className="relative mt-6 flex flex-wrap items-center gap-3">
          <a
            href={PADLET_URL}
            target="_blank"
            rel="noreferrer"
            onMouseEnter={() => playTone("hover")}
            onClick={() => playTone("click")}
            className="inline-flex items-center gap-2 rounded-full bg-[#239c9d] px-5 py-2.5 text-sm font-black text-white shadow-sm transition-transform hover:-translate-y-0.5 hover:bg-[#1e2a38]"
          >
            <LibraryBig size={17} />
            前往原始 Padlet 看板
          </a>

          <button
            type="button"
            aria-pressed={soundOn}
            aria-label={soundOn ? "關閉互動音效" : "啟用互動音效"}
            onMouseEnter={() => playTone("hover")}
            onClick={toggleSound}
            className="inline-flex items-center gap-2 rounded-full border-2 border-[#1e2a38] bg-white px-4 py-2.5 text-sm font-black transition-colors hover:bg-[#ffcd38]"
          >
            {soundOn ? <Volume2 size={17} /> : <VolumeX size={17} />}
            音效：{soundOn ? "開啟" : soundReady ? "關閉" : "點此啟用"}
          </button>
        </div>
      </header>

      {/* Search & Navigation Section */}
      <section className="appear mt-10" style={{ animationDelay: ".1s" }}>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-black tracking-[.14em] text-[#ef7c69]">FIND IT FAST</p>
            <h2 className="mt-1 text-2xl font-black text-[#1e2a38]">探索所有工具</h2>
          </div>

          <div className="flex items-center gap-2">
            {/* View Mode Toggle */}
            <div className="flex rounded-xl border border-[#dce3e8] bg-white p-1 shadow-sm">
              <button
                type="button"
                onClick={() => {
                  setViewMode("grid");
                  playTone("click");
                }}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-black transition-colors ${
                  viewMode === "grid"
                    ? "bg-[#1e2a38] text-white"
                    : "text-[#5e6f7d] hover:bg-[#f2f6f8]"
                }`}
              >
                <LayoutGrid size={15} /> 圖文卡片
              </button>
              <button
                type="button"
                onClick={() => {
                  setViewMode("list");
                  playTone("click");
                }}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-black transition-colors ${
                  viewMode === "list"
                    ? "bg-[#1e2a38] text-white"
                    : "text-[#5e6f7d] hover:bg-[#f2f6f8]"
                }`}
              >
                <List size={15} /> 精簡列表
              </button>
            </div>

            <p className="rounded-full bg-[#fff1b9] px-4 py-2 text-sm font-bold text-[#7b5d00]">
              {query
                ? `找到 ${filteredGroups.reduce((n, [, items]) => n + items.length, 0)} 個結果`
                : `${groups.length} 個分類 · ${padletCardCount} 張卡片`}
            </p>
          </div>
        </div>

        {/* Sticky Search Bar */}
        <div className="sticky top-3 z-20 mt-5 rounded-2xl border border-[#dce3e8] bg-white/95 p-2 shadow-md backdrop-blur">
          <div className="relative">
            <Search className="absolute left-4 top-3.5 text-[#239c9d]" size={19} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="輸入關鍵字搜尋：國語、數學、評語、遊戲、行政、分組、抽籤……"
              className="w-full rounded-xl bg-[#f5f8fa] py-3 pl-11 pr-4 text-sm font-semibold outline-none focus:ring-2 focus:ring-[#ffcd38]"
            />
          </div>
        </div>

        {/* Category Navigation Pills */}
        {!query && (
          <nav
            aria-label="完整分類導覽"
            className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6"
          >
            {groups.map(([category, items]) => (
              <a
                key={category}
                href={`#${encodeURIComponent(category)}`}
                onMouseEnter={() => playTone("hover")}
                onClick={() => playTone("click")}
                className="flex items-center justify-between rounded-xl border border-[#dce3e8] bg-white px-3 py-2 text-xs font-bold leading-5 text-[#45515e] transition-all hover:-translate-y-0.5 hover:bg-[#8de2db] hover:shadow-sm"
              >
                <span className="truncate">
                  {iconFor(category)} {category}
                </span>
                <span className="shrink-0 text-[11px] font-black text-[#80909e]">
                  {items.length}
                </span>
              </a>
            ))}
          </nav>
        )}

        {/* Tool Cards Section */}
        <div className="mt-10 space-y-12">
          {filteredGroups.map(([category, items]) => (
            <section
              id={encodeURIComponent(category)}
              key={category}
              className="scroll-mt-28"
            >
              {/* Category Header */}
              <div className="mb-5 flex items-center gap-3">
                <span
                  className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl text-xl shadow-xs"
                  style={{ background: colorFor(category) }}
                >
                  {iconFor(category)}
                </span>
                <h3 className="text-xl font-black text-[#1e2a38]">{category}</h3>
                <span className="rounded-full bg-[#f0f4f7] px-2.5 py-0.5 text-xs font-black text-[#687a89]">
                  {items.length} 項目
                </span>
                <div className="h-px flex-1 bg-[#dfe5e9]" />
              </div>

              {/* Grid View */}
              {viewMode === "grid" ? (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {items.map((tool) => {
                    const isMissing =
                      tool.source === "Padlet 原卡" ||
                      tool.source === "無連結" ||
                      !tool.url;

                    if (isMissing) {
                      return (
                        <div
                          key={tool.id}
                          onMouseEnter={() => playTone("alert")}
                          className="flex flex-col justify-between rounded-2xl border-2 border-[#ef7c69] bg-[#fff3ef] p-4 shadow-xs"
                        >
                          <div>
                            <div className="flex items-center gap-2 text-xs font-black text-[#bd3425]">
                              <AlertTriangle size={16} />
                              <span>待補卡片</span>
                            </div>
                            <h4 className="mt-2 text-sm font-black leading-snug text-[#273644]">
                              {tool.title}
                            </h4>
                          </div>
                          <span className="mt-4 inline-block text-xs font-bold text-[#d24c3d]">
                            ⚠ 尚無外部連結
                          </span>
                        </div>
                      );
                    }

                    return (
                      <a
                        key={tool.id}
                        href={tool.url}
                        target="_blank"
                        rel="noreferrer"
                        onMouseEnter={() => playTone("hover")}
                        onClick={() => playTone("click")}
                        className="tool-link group flex flex-col overflow-hidden rounded-2xl border border-[#dde5e9] bg-white shadow-xs transition-all duration-200 hover:-translate-y-1 hover:border-[#239c9d] hover:shadow-lg"
                      >
                        {/* Thumbnail Area */}
                        <div className="relative aspect-16/10 w-full overflow-hidden bg-[#f4f7f9]">
                          <CardThumbnail
                            src={tool.image}
                            title={tool.title}
                            category={category}
                          />

                          {/* Category Badge over Thumbnail */}
                          <div className="absolute left-2.5 top-2.5 flex items-center gap-1 rounded-md bg-[#1e2a38]/85 px-2 py-0.5 text-[11px] font-black text-white shadow-xs backdrop-blur-xs">
                            <span>{iconFor(category)}</span>
                            <span className="max-w-[120px] truncate">{category}</span>
                          </div>

                          {tool.source === "圖片／附件連結" && (
                            <span className="absolute right-2.5 top-2.5 rounded-md bg-[#ef7c69] px-2 py-0.5 text-[11px] font-black text-white shadow-xs">
                              圖片附檔
                            </span>
                          )}
                        </div>

                        {/* Card Content */}
                        <div className="flex flex-1 flex-col justify-between p-4">
                          <h4
                            className="line-clamp-2 text-sm font-black leading-snug text-[#22303e] group-hover:text-[#239c9d]"
                            title={tool.title}
                          >
                            {tool.title}
                          </h4>

                          <div className="mt-4 flex items-center justify-between border-t border-[#f0f4f7] pt-3 text-xs font-bold text-[#718290]">
                            <span className="inline-flex items-center gap-1 text-[11px]">
                              <Sparkles size={13} className="text-[#ffcd38]" /> 點選開啟
                            </span>
                            <span className="inline-flex items-center gap-1 font-black text-[#239c9d] transition-transform group-hover:translate-x-0.5">
                              開啟工具 <ExternalLink size={13} />
                            </span>
                          </div>
                        </div>
                      </a>
                    );
                  })}
                </div>
              ) : (
                /* List View */
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {items.map((tool) =>
                    tool.source === "Padlet 原卡" ||
                    tool.source === "無連結" ||
                    !tool.url ? (
                      <div
                        key={tool.id}
                        onMouseEnter={() => playTone("alert")}
                        className="flex min-h-20 items-center gap-3 rounded-2xl border-2 border-[#ef7c69] bg-[#fff0ec] p-3.5"
                      >
                        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#ef7c69] text-white">
                          <AlertTriangle size={19} />
                        </span>
                        <span className="min-w-0">
                          <b className="block break-words text-sm leading-5 text-[#273644]">
                            {tool.title}
                          </b>
                          <small className="mt-1 block font-black text-[#bd3425]">
                            ⚠ 無連結｜待補卡片
                          </small>
                        </span>
                      </div>
                    ) : (
                      <a
                        key={tool.id}
                        href={tool.url}
                        target="_blank"
                        rel="noreferrer"
                        onMouseEnter={() => playTone("hover")}
                        onClick={() => playTone("click")}
                        className="tool-link flex min-h-20 items-center gap-3 rounded-2xl border border-[#dde5e9] bg-white p-3.5 transition-all hover:border-[#239c9d]"
                      >
                        {tool.image ? (
                          <div className="h-12 w-16 shrink-0 overflow-hidden rounded-xl bg-[#f0f4f7]">
                            <img
                              src={tool.image}
                              alt=""
                              loading="lazy"
                              referrerPolicy="no-referrer"
                              className="h-full w-full object-cover"
                            />
                          </div>
                        ) : (
                          <span
                            className="grid h-12 w-12 shrink-0 place-items-center rounded-xl text-lg"
                            style={{ background: colorFor(category) }}
                          >
                            {iconFor(category)}
                          </span>
                        )}

                        <span className="min-w-0 flex-1">
                          <b className="block break-words text-sm leading-5 text-[#273644]">
                            {tool.title}
                          </b>
                          <small className="mt-1 inline-flex items-center gap-1 font-bold text-[#239c9d]">
                            {tool.source === "圖片／附件連結" ? (
                              <>
                                <ImageIcon size={13} /> 圖片／附件
                              </>
                            ) : (
                              <>
                                <ExternalLink size={13} /> 外部連結
                              </>
                            )}
                          </small>
                        </span>
                      </a>
                    )
                  )}
                </div>
              )}
            </section>
          ))}
        </div>

        {!filteredGroups.length && (
          <div className="py-20 text-center">
            <p className="text-4xl">🔍</p>
            <p className="mt-3 font-black text-lg text-[#1e2a38]">找不到相符的教學工具</p>
            <p className="mt-1 text-sm text-[#80909e]">換個關鍵字（例如：數學、抽籤、評語）再試一次。</p>
          </div>
        )}
      </section>

      {/* Footer */}
      <footer className="mt-16 border-t border-[#dce3e8] py-8 text-center text-xs leading-6 text-[#6c7b87]">
        屏東縣後庄國小黃朝榮老師作品，免費分享，歡迎擴散推廣，嚴禁商用與任何侵權、不尊重著作權的行為，更多 Puti-AI 教學工具{" "}
        <a
          className="font-bold text-[#239c9d] underline"
          href="https://padlet.com/clongwh/puti_ai_tools"
          target="_blank"
          rel="noreferrer"
        >
          點此前往(https://padlet.com/clongwh/puti_ai_tools)
        </a>
      </footer>
    </main>
  );
}
