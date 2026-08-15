/* Bright Classroom Index — full, friendly, bright, crisp and fast. */
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ExternalLink,
  Image as ImageIcon,
  Search,
  LibraryBig,
  AlertTriangle,
  Volume2,
  VolumeX,
} from "lucide-react";
import importedTools from "@/data/tools.json";

const PADLET_URL = "https://padlet.com/clongwh/puti_ai_tools";

type Tool = {
  id: string;
  title: string;
  category: string;
  url: string;
  source?: string;
};

type SourceTool = {
  id?: string;
  title: string;
  category: string;
  url: string;
  source?: string;
};

const starterTools: Tool[] = (importedTools as SourceTool[]).map((tool, index) => ({
  ...tool,
  id: tool.id || `padlet-${index}`,
}));

const categoryEmojis = ["✨", "📚", "🧠", "🎮", "✍️", "🧮", "🗂️", "🌱", "🎨", "🤖", "🎵", "🌈"];
const accent = ["#ffd54f", "#8de2db", "#ffc3b4", "#c9bcff", "#b7e39b", "#a9d4ff"];

const getCategoryIndex = (category: string) =>
  [...category].reduce((n, c) => n + c.charCodeAt(0), 0);

const iconFor = (category: string) =>
  categoryEmojis[getCategoryIndex(category) % categoryEmojis.length];

const colorFor = (category: string) =>
  accent[getCategoryIndex(category) % accent.length];

export default function Home() {
  const [tools] = useState<Tool[]>(starterTools);
  const [query, setQuery] = useState("");
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
    <main className="mx-auto max-w-6xl px-4 py-6 sm:px-7 sm:py-10">
      {/* Header Banner */}
      <header className="appear relative overflow-hidden rounded-[2rem] border-2 border-[#1e2a38] bg-white px-6 py-8 shadow-[8px_8px_0_#ffcd38] sm:px-10">
        <div className="absolute right-0 top-0 h-32 w-32 rounded-bl-full bg-[#8de2db]" />
        <p className="relative text-xs font-black tracking-[.16em] text-[#239c9d]">
          PUTI-AI 品牌工具索引
        </p>
        <div className="relative mt-2 flex flex-wrap items-end justify-between gap-5">
          <div className="max-w-2xl">
            <h1 className="text-[clamp(1.55rem,6vw,3.5rem)] font-black leading-tight tracking-[-.05em] text-[#1e2a38]">
              Puti-AI 教學工具庫備份站
            </h1>
            <p className="mt-4 text-sm leading-7 text-[#52606d]">
              完整展開、快速搜尋、點一下就開啟。依 Padlet 的 322 張卡片建立，文字連結優先，沒有時才使用圖片／附件目標。缺少網址的卡片會以醒目的「無連結」標示，方便補上。
            </p>
          </div>
          <div className="rounded-2xl bg-[#1e2a38] px-5 py-4 text-center text-white">
            <b className="block text-4xl font-black text-[#ffcd38]">{padletCardCount}</b>
            <span className="text-xs font-bold tracking-wider opacity-85">張 Padlet 卡片</span>
          </div>
        </div>

        <div className="relative mt-6 flex flex-wrap gap-3">
          <a
            href={PADLET_URL}
            target="_blank"
            rel="noreferrer"
            onMouseEnter={() => playTone("hover")}
            onClick={() => playTone("click")}
            className="inline-flex items-center gap-2 rounded-full bg-[#239c9d] px-5 py-3 text-sm font-black text-white shadow-sm transition-transform hover:-translate-y-0.5 hover:bg-[#1e2a38]"
          >
            <LibraryBig size={17} />
            前往原始 Padlet
          </a>
          <button
            type="button"
            aria-pressed={soundOn}
            aria-label={soundOn ? "關閉互動音效" : "啟用互動音效"}
            onMouseEnter={() => playTone("hover")}
            onClick={toggleSound}
            className="inline-flex items-center gap-2 rounded-full border-2 border-[#1e2a38] bg-white px-4 py-3 text-sm font-black transition-colors hover:bg-[#ffcd38]"
          >
            {soundOn ? <Volume2 size={17} /> : <VolumeX size={17} />}
            音效：{soundOn ? "開" : soundReady ? "關" : "點一下啟用"}
          </button>
        </div>
      </header>

      {/* Tool Search & Directory Section */}
      <section className="appear mt-10" style={{ animationDelay: ".1s" }}>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-black tracking-[.14em] text-[#ef7c69]">FIND IT FAST</p>
            <h2 className="mt-1 text-2xl font-black text-[#1e2a38]">所有工具，一次呈現</h2>
          </div>
          <p className="rounded-full bg-[#fff1b9] px-4 py-2 text-sm font-bold text-[#7b5d00]">
            {query
              ? `找到 ${filteredGroups.reduce((n, [, items]) => n + items.length, 0)} 個結果`
              : `${groups.length} 個分類 · ${padletCardCount} 張 Padlet 卡片`}
          </p>
        </div>

        {/* Sticky Search Bar */}
        <div className="sticky top-3 z-10 mt-5 rounded-2xl border border-[#dce3e8] bg-white/95 p-2 shadow-sm backdrop-blur">
          <div className="relative">
            <Search className="absolute left-4 top-3.5 text-[#239c9d]" size={19} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="輸入關鍵字：國語、數學、遊戲、行政、評語……"
              className="w-full rounded-xl bg-[#f5f8fa] py-3 pl-11 pr-4 text-sm font-medium outline-none focus:ring-2 focus:ring-[#ffcd38]"
            />
          </div>
        </div>

        {/* Category Quick Navigation */}
        {!query && (
          <nav
            aria-label="完整分類導覽"
            className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4"
          >
            {groups.map(([category, items]) => (
              <a
                key={category}
                href={`#${encodeURIComponent(category)}`}
                onMouseEnter={() => playTone("hover")}
                onClick={() => playTone("click")}
                className="rounded-xl border border-[#dce3e8] bg-white px-3 py-2 text-xs font-bold leading-5 text-[#45515e] transition-colors hover:bg-[#8de2db]"
              >
                {iconFor(category)} {category}{" "}
                <span className="text-[#80909e]">· {items.length}</span>
              </a>
            ))}
          </nav>
        )}

        {/* Categories and Tool Cards */}
        <div className="mt-8 space-y-10">
          {filteredGroups.map(([category, items]) => (
            <section
              id={encodeURIComponent(category)}
              key={category}
              className="scroll-mt-28"
            >
              <div className="mb-4 flex items-center gap-3">
                <span
                  className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl text-xl"
                  style={{ background: colorFor(category) }}
                >
                  {iconFor(category)}
                </span>
                <h3 className="text-xl font-black text-[#1e2a38]">{category}</h3>
                <span className="text-sm font-bold text-[#80909e]">{items.length}</span>
                <div className="h-px flex-1 bg-[#dfe5e9]" />
              </div>

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
                          ⚠ 無連結｜待補卡片，請補上名稱與網址
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
                      className="tool-link flex min-h-20 items-center gap-3 rounded-2xl border border-[#dde5e9] bg-white p-3.5"
                    >
                      <span
                        className="grid h-10 w-10 shrink-0 place-items-center rounded-xl"
                        style={{ background: colorFor(category) }}
                      >
                        {tool.source === "圖片／附件連結" ? (
                          <ImageIcon size={19} />
                        ) : (
                          <ExternalLink size={19} />
                        )}
                      </span>
                      <span className="min-w-0">
                        <b className="block break-words text-sm leading-5 text-[#273644]">
                          {tool.title}
                        </b>
                        {tool.source === "圖片／附件連結" && (
                          <small className="mt-1 block font-bold text-[#ef7c69]">
                            圖片／附件連結
                          </small>
                        )}
                      </span>
                    </a>
                  )
                )}
              </div>
            </section>
          ))}
        </div>

        {!filteredGroups.length && (
          <p className="py-16 text-center font-bold text-[#80909e]">
            找不到相符工具，換個關鍵字試試。
          </p>
        )}
      </section>

      {/* Footer Copyright */}
      <footer className="mt-14 border-t border-[#dce3e8] py-8 text-center text-xs leading-6 text-[#6c7b87]">
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
