"use client";

import React, { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { qubartechProductsApi, type QubartechProductInput } from "@/services/qubartechApi";
import type { QubartechProduct } from "@/types";
import { toast } from "@/lib/toast";
import {
  ArrowLeft,
  Save,
  Loader2,
  ExternalLink,
  Sparkles,
  FileText,
  Sliders,
  Columns2,
  Eye,
  Edit3,
  Bold,
  Italic,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Code,
  Quote,
  Link as LinkIcon,
  Heart,
  Plus,
  Trash2,
  Layers,
  Globe,
  Tag
} from "lucide-react";
import Link from "next/link";

function parseInline(text: string): React.ReactNode {
  if (!text) return "";

  // Split by bold (**), italic (*), inline code (`), and markdown links ([text](url))
  const regex = /(\*\*.*?\*\*|\*[^*]+?\*|`.*?`|\[.*?\]\(.*?\))/g;
  const parts = text.split(regex);

  return parts.map((part, idx) => {
    if (!part) return null;

    if (part.startsWith("**") && part.endsWith("**") && part.length >= 4) {
      return (
        <strong key={idx} className="font-bold text-slate-900 dark:text-white">
          {parseInline(part.slice(2, -2))}
        </strong>
      );
    }
    if (part.startsWith("*") && part.endsWith("*") && part.length >= 2) {
      return (
        <em key={idx} className="italic text-slate-700 dark:text-slate-300">
          {parseInline(part.slice(1, -1))}
        </em>
      );
    }
    if (part.startsWith("`") && part.endsWith("`") && part.length >= 2) {
      return (
        <code
          key={idx}
          className="text-xs font-mono bg-slate-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded text-brand-600 dark:text-brand-400 font-semibold border border-slate-200/60 dark:border-zinc-700/60"
        >
          {part.slice(1, -1)}
        </code>
      );
    }
    if (part.startsWith("[") && part.includes("](")) {
      const match = part.match(/\[(.*?)\]\((.*?)\)/);
      if (match) {
        return (
          <a
            key={idx}
            href={match[2]}
            className="text-brand-600 hover:underline dark:text-brand-400 font-semibold inline-flex items-center gap-0.5"
            target="_blank"
            rel="noreferrer"
          >
            <span>{parseInline(match[1])}</span>
            <span className="text-[10px]">↗</span>
          </a>
        );
      }
    }
    return part;
  });
}

type MarkdownBlock =
  | { type: "h1"; content: string }
  | { type: "h2"; content: string }
  | { type: "h3"; content: string; isFaq?: boolean }
  | { type: "h4"; content: string }
  | { type: "ul"; items: string[] }
  | { type: "ol"; items: string[] }
  | { type: "code"; lang: string; content: string }
  | { type: "callout"; calloutType: string; content: string }
  | { type: "blockquote"; content: string }
  | { type: "hr" }
  | { type: "p"; content: string };

function parseMarkdownToBlocks(text: string): MarkdownBlock[] {
  if (!text || !text.trim()) return [];

  const lines = text.split("\n");
  const blocks: MarkdownBlock[] = [];
  let i = 0;
  let inFaqSection = false;

  while (i < lines.length) {
    const rawLine = lines[i];
    const trimmed = rawLine.trim();

    // 1. Empty lines
    if (!trimmed) {
      i++;
      continue;
    }

    // 2. Fenced Code Block: ```lang ... ```
    if (trimmed.startsWith("```")) {
      const lang = trimmed.slice(3).trim();
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith("```")) {
        codeLines.push(lines[i]);
        i++;
      }
      if (i < lines.length) i++; // skip closing ```
      blocks.push({ type: "code", lang, content: codeLines.join("\n") });
      continue;
    }

    // 3. Callout / Alert: > [!NOTE], > [!TIP], > [!IMPORTANT], > [!WARNING]
    if (/^>\s*\[!(NOTE|TIP|IMPORTANT|WARNING)\]/i.test(trimmed)) {
      const match = trimmed.match(/^>\s*\[!(NOTE|TIP|IMPORTANT|WARNING)\]/i);
      const calloutType = match ? match[1].toUpperCase() : "NOTE";
      const calloutLines: string[] = [];
      i++;
      while (i < lines.length && lines[i].trim().startsWith(">")) {
        calloutLines.push(lines[i].trim().replace(/^>\s?/, ""));
        i++;
      }
      blocks.push({ type: "callout", calloutType, content: calloutLines.join("\n") });
      continue;
    }

    // 4. Blockquotes: > quote
    if (trimmed.startsWith("> ")) {
      const quoteLines: string[] = [trimmed.replace(/^>\s+/, "")];
      i++;
      while (i < lines.length && lines[i].trim().startsWith(">")) {
        quoteLines.push(lines[i].trim().replace(/^>\s+/, ""));
        i++;
      }
      blocks.push({ type: "blockquote", content: quoteLines.join("\n") });
      continue;
    }

    // 5. Headings
    if (trimmed.startsWith("# ")) {
      inFaqSection = false;
      blocks.push({ type: "h1", content: trimmed.replace(/^#\s+/, "") });
      i++;
      continue;
    }
    if (trimmed.startsWith("## ")) {
      const headingText = trimmed.replace(/^##\s+/, "");
      inFaqSection = /faq|frequently asked questions/i.test(headingText);
      blocks.push({ type: "h2", content: headingText });
      i++;
      continue;
    }
    if (trimmed.startsWith("### ")) {
      const headingText = trimmed.replace(/^###\s+/, "");
      const isFaq = inFaqSection || headingText.endsWith("?");
      blocks.push({ type: "h3", content: headingText, isFaq });
      i++;
      continue;
    }
    if (trimmed.startsWith("#### ")) {
      blocks.push({ type: "h4", content: trimmed.replace(/^####\s+/, "") });
      i++;
      continue;
    }

    // 6. Horizontal Rule: --- or ***
    if (/^(\-{3,}|\*{3,}|_{3,})$/.test(trimmed)) {
      blocks.push({ type: "hr" });
      i++;
      continue;
    }

    // 7. Bullet Lists (- or *)
    if (/^[-*]\s+/.test(trimmed)) {
      const items: string[] = [trimmed.replace(/^[-*]\s+/, "")];
      i++;
      while (i < lines.length && /^[-*]\s+/.test(lines[i].trim())) {
        items.push(lines[i].trim().replace(/^[-*]\s+/, ""));
        i++;
      }
      blocks.push({ type: "ul", items });
      continue;
    }

    // 8. Numbered Lists (1. )
    if (/^\d+\.\s+/.test(trimmed)) {
      const items: string[] = [trimmed.replace(/^\d+\.\s+/, "")];
      i++;
      while (i < lines.length && /^\d+\.\s+/.test(lines[i].trim())) {
        items.push(lines[i].trim().replace(/^\d+\.\s+/, ""));
        i++;
      }
      blocks.push({ type: "ol", items });
      continue;
    }

    // 9. Standard Paragraph (collect contiguous lines until next block element or blank line)
    const pLines: string[] = [rawLine];
    i++;
    while (
      i < lines.length &&
      lines[i].trim() &&
      !lines[i].trim().startsWith("#") &&
      !lines[i].trim().startsWith("```") &&
      !lines[i].trim().startsWith(">") &&
      !/^[-*]\s+/.test(lines[i].trim()) &&
      !/^\d+\.\s+/.test(lines[i].trim()) &&
      !/^(\-{3,}|\*{3,}|_{3,})$/.test(lines[i].trim())
    ) {
      pLines.push(lines[i]);
      i++;
    }
    blocks.push({ type: "p", content: pLines.join("\n") });
  }

  return blocks;
}

function renderMarkdown(text: string) {
  if (!text || !text.trim()) {
    return (
      <div className="py-12 text-center text-slate-400 dark:text-zinc-500 italic text-sm">
        No Markdown description written yet. Type in the editor to preview live documentation.
      </div>
    );
  }

  const blocks = parseMarkdownToBlocks(text);

  return blocks.map((block, idx) => {
    // 1. Headings
    if (block.type === "h1") {
      return (
        <h2
          key={idx}
          className="text-2xl sm:text-3xl font-black tracking-tight text-slate-950 dark:text-white mt-8 mb-4 border-b pb-2.5 border-slate-200/80 dark:border-zinc-800"
        >
          {parseInline(block.content)}
        </h2>
      );
    }

    if (block.type === "h2") {
      return (
        <h3
          key={idx}
          className="text-lg sm:text-xl font-bold tracking-tight text-slate-900 dark:text-white mt-8 mb-3 flex items-center gap-2"
        >
          <span className="w-2 h-2 rounded-full bg-brand-500 shrink-0"></span>
          <span>{parseInline(block.content)}</span>
        </h3>
      );
    }

    if (block.type === "h3") {
      if (block.isFaq) {
        return (
          <div
            key={idx}
            className="flex items-start gap-2.5 mt-6 mb-2 text-base sm:text-lg font-bold text-slate-900 dark:text-white"
          >
            <span className="px-2 py-0.5 rounded-md text-[11px] font-mono font-bold bg-brand-500/10 text-brand-600 dark:text-brand-400 border border-brand-500/30 shrink-0 mt-0.5">
              FAQ
            </span>
            <span>{parseInline(block.content)}</span>
          </div>
        );
      }
      return (
        <h4
          key={idx}
          className="text-base sm:text-lg font-bold text-slate-800 dark:text-slate-200 mt-6 mb-2"
        >
          {parseInline(block.content)}
        </h4>
      );
    }

    if (block.type === "h4") {
      return (
        <h5
          key={idx}
          className="text-sm sm:text-base font-bold text-slate-700 dark:text-slate-300 mt-4 mb-2"
        >
          {parseInline(block.content)}
        </h5>
      );
    }

    // 2. Callout / Alert
    if (block.type === "callout") {
      const isTip = block.calloutType === "TIP";
      const isWarn = block.calloutType === "WARNING";
      const isImp = block.calloutType === "IMPORTANT";

      return (
        <div
          key={idx}
          className={`p-4 rounded-xl my-4 text-sm border ${
            isTip
              ? "bg-emerald-50/80 dark:bg-emerald-950/20 border-emerald-500/30 text-emerald-800 dark:text-emerald-300"
              : isWarn
              ? "bg-amber-50/80 dark:bg-amber-950/20 border-amber-500/30 text-amber-800 dark:text-amber-300"
              : isImp
              ? "bg-rose-50/80 dark:bg-rose-950/20 border-rose-500/30 text-rose-800 dark:text-rose-300"
              : "bg-blue-50/80 dark:bg-blue-950/20 border-blue-500/30 text-blue-800 dark:text-blue-300"
          }`}
        >
          <div className="font-bold mb-1.5 flex items-center gap-1.5 uppercase tracking-wider text-xs">
            {isTip ? "💡 Pro Tip" : isWarn ? "⚠️ Caution" : isImp ? "⚡ Important" : "ℹ️ Note"}
          </div>
          <div className="leading-relaxed">
            {block.content.split("\n").map((line, lIdx, arr) => (
              <React.Fragment key={lIdx}>
                {parseInline(line)}
                {lIdx < arr.length - 1 && <br />}
              </React.Fragment>
            ))}
          </div>
        </div>
      );
    }

    // 3. Blockquote
    if (block.type === "blockquote") {
      return (
        <blockquote
          key={idx}
          className="border-l-4 border-brand-500/60 pl-4 py-2 my-4 italic text-slate-600 dark:text-zinc-400 bg-slate-50/50 dark:bg-zinc-900/30 rounded-r-xl"
        >
          {block.content.split("\n").map((line, lIdx, arr) => (
            <React.Fragment key={lIdx}>
              {parseInline(line)}
              {lIdx < arr.length - 1 && <br />}
            </React.Fragment>
          ))}
        </blockquote>
      );
    }

    // 4. Code Block
    if (block.type === "code") {
      return (
        <div
          key={idx}
          className="rounded-xl overflow-hidden my-4 border border-slate-800 bg-slate-950 text-slate-100"
        >
          {block.lang && (
            <div className="bg-slate-900/90 px-4 py-1.5 text-[11px] font-mono text-slate-400 border-b border-slate-800 flex justify-between items-center">
              <span>{block.lang}</span>
              <span className="text-[10px] uppercase tracking-wider">code</span>
            </div>
          )}
          <pre className="p-4 overflow-x-auto text-xs font-mono leading-relaxed text-slate-200">
            <code>{block.content}</code>
          </pre>
        </div>
      );
    }

    // 5. Bullet List
    if (block.type === "ul") {
      return (
        <ul key={idx} className="space-y-2 my-3 pl-1">
          {block.items.map((item, itemIdx) => (
            <li
              key={itemIdx}
              className="flex items-start gap-2.5 text-sm text-slate-700 dark:text-zinc-300 leading-relaxed"
            >
              <span className="text-brand-500 dark:text-brand-400 mt-1 shrink-0 font-black">•</span>
              <div className="flex-1">{parseInline(item)}</div>
            </li>
          ))}
        </ul>
      );
    }

    // 6. Numbered List
    if (block.type === "ol") {
      return (
        <ol key={idx} className="space-y-2 my-3 pl-1">
          {block.items.map((item, itemIdx) => (
            <li
              key={itemIdx}
              className="flex items-start gap-2.5 text-sm text-slate-700 dark:text-zinc-300 leading-relaxed"
            >
              <span className="w-5 h-5 rounded-full bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 flex items-center justify-center text-[10px] font-mono font-bold shrink-0 mt-0.5 border border-slate-200 dark:border-zinc-700">
                {itemIdx + 1}
              </span>
              <div className="flex-1">{parseInline(item)}</div>
            </li>
          ))}
        </ol>
      );
    }

    // 7. Horizontal Rule
    if (block.type === "hr") {
      return <hr key={idx} className="my-6 border-slate-200/80 dark:border-zinc-800" />;
    }

    // 8. Standard Paragraph with line breaks
    return (
      <p key={idx} className="text-sm leading-relaxed text-slate-700 dark:text-zinc-300 mb-3.5">
        {block.content.split("\n").map((line, lIdx, arr) => (
          <React.Fragment key={lIdx}>
            {parseInline(line)}
            {lIdx < arr.length - 1 && <br />}
          </React.Fragment>
        ))}
      </p>
    );
  });
}

export default function ProductEditorPage() {
  const params = useParams();
  const router = useRouter();
  const qc = useQueryClient();
  const idOrSlug = (params?.id as string) || "";

  const [activeTab, setActiveTab] = useState<"details" | "meta" | "privacy">("details");
  const [viewMode, setViewMode] = useState<"split" | "editor" | "preview">("split");

  // Form State
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [shortName, setShortName] = useState("");
  const [tagline, setTagline] = useState("");
  const [badge, setBadge] = useState("");
  const [isNonProfit, setIsNonProfit] = useState(false);
  const [category, setCategory] = useState("");
  const [status, setStatus] = useState("live");
  const [icon, setIcon] = useState("💼");
  const [color, setColor] = useState("from-blue-600 via-indigo-600 to-violet-700");
  const [coverGradient, setCoverGradient] = useState("from-slate-950 via-indigo-950 to-gray-950");
  const [image, setImage] = useState("");
  const [link, setLink] = useState("");
  const [githubUrl, setGithubUrl] = useState("");
  const [tags, setTags] = useState("");
  const [features, setFeatures] = useState("");
  const [techStack, setTechStack] = useState("");
  const [mission, setMission] = useState("");
  const [description, setDescription] = useState("");
  const [detailsContent, setDetailsContent] = useState("");
  const [privacyPolicy, setPrivacyPolicy] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [hasProjectManagement, setHasProjectManagement] = useState(true);
  const [hasDetails, setHasDetails] = useState(true);
  const [hasPrivacy, setHasPrivacy] = useState(true);

  // Key stats parsed array state
  const [statsList, setStatsList] = useState<{ label: string; value: string }[]>([]);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const { data: product, isLoading } = useQuery<QubartechProduct>({
    queryKey: ["qubartech", "product", idOrSlug],
    queryFn: () => qubartechProductsApi.getByIdOrSlug(idOrSlug),
    enabled: Boolean(idOrSlug && idOrSlug !== "new"),
  });

  useEffect(() => {
    if (product) {
      setName(product.name || "");
      setSlug(product.slug || "");
      setShortName(product.shortName || "");
      setTagline(product.tagline || "");
      setBadge(product.badge || "Product Showcase");
      setIsNonProfit(Boolean(product.isNonProfit));
      setCategory(product.category || "Productivity");
      setStatus(product.status || "live");
      setIcon(product.icon || "💼");
      setColor(product.color || "from-blue-600 via-indigo-600 to-violet-700");
      setCoverGradient(product.coverGradient || "from-slate-950 via-indigo-950 to-gray-950");
      setImage(product.image || "");
      setLink(product.link || "");
      setGithubUrl(product.githubUrl || "");
      setTags(product.tags || "");
      setFeatures(product.features || "");
      setTechStack(product.techStack || "");
      setMission(product.mission || "");
      setDescription(product.description || "");
      setDetailsContent(product.detailsContent || "");
      setPrivacyPolicy(product.privacyPolicy || "");
      setIsActive(product.isActive ?? true);
      setHasProjectManagement(product.hasProjectManagement ?? true);
      setHasDetails(product.hasDetails ?? true);
      setHasPrivacy(product.hasPrivacy ?? true);

      try {
        if (product.stats) {
          const parsed = JSON.parse(product.stats);
          if (Array.isArray(parsed)) setStatsList(parsed);
        }
      } catch {
        setStatsList([]);
      }
    }
  }, [product]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload: QubartechProductInput = {
        name,
        slug,
        shortName: shortName || null,
        tagline: tagline || null,
        badge: badge || null,
        isNonProfit,
        category: category || null,
        description: description || null,
        features: features || null,
        icon: icon || null,
        color: color || null,
        coverGradient: coverGradient || null,
        tags: tags || null,
        image: image || null,
        link: link || null,
        githubUrl: githubUrl || null,
        techStack: techStack || null,
        mission: mission || null,
        stats: JSON.stringify(statsList.filter((s) => s.label.trim() && s.value.trim())),
        detailsContent: detailsContent || null,
        status,
        privacyPolicy: privacyPolicy || null,
        isActive,
        hasProjectManagement,
        hasDetails,
        hasPrivacy,
      };

      if (product?.id) {
        return qubartechProductsApi.update(product.id, payload);
      } else {
        return qubartechProductsApi.create(payload);
      }
    },
    onSuccess: (savedProduct) => {
      toast.success("Product details and description saved successfully!");
      qc.invalidateQueries({ queryKey: ["qubartech", "products"] });
      qc.invalidateQueries({ queryKey: ["qubartech", "product", idOrSlug] });
      if (idOrSlug === "new" && savedProduct?.slug) {
        router.replace(`/qubartech/products/${savedProduct.slug}`);
      }
    },
    onError: (e: Error) => {
      toast.error(e.message || "Failed to save product details");
    },
  });

  const insertMarkdownText = (prefix: string, suffix: string = "", placeholder: string = "") => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const currentText = textarea.value;
    const selected = currentText.substring(start, end) || placeholder;
    const replacement = `${prefix}${selected}${suffix}`;

    const newText = currentText.substring(0, start) + replacement + currentText.substring(end);
    setDetailsContent(newText);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefix.length, start + prefix.length + selected.length);
    }, 10);
  };

  const insertTemplate = (type: string) => {
    let template = "";
    if (type === "architecture") {
      template = `\n\n## Technical Architecture & Core Modules
- **Modular Micro-Services**: Built with high modularity and clean separation of concerns.
- **Data Persistence**: Backed by PostgreSQL and Prisma ORM for type-safe transactional queries.
- **Security & Authorization**: Role-Based Access Control (RBAC) with secure session handling.
- **Frontend Stack**: Powered by React 19 and Next.js for high-speed server rendering.`;
    } else if (type === "capabilities") {
      template = `\n\n## Key Capabilities & Workflows
1. **Real-Time Data Sync**: Instant updates across all active client instances.
2. **Automated Document Generation**: Export PDF & DOC files in seconds.
3. **Productivity Timers**: Built-in stopwatch and milestone tracking meters.`;
    } else if (type === "faq") {
      template = `\n\n## Frequently Asked Questions
### Is this product accessible on mobile devices?
Yes, the application is 100% responsive and tested across iOS and Android browsers.

### How is our organizational data protected?
All data is stored in isolated PostgreSQL tables with end-to-end HTTPS encryption.`;
    }

    setDetailsContent((prev) => prev + template);
    toast.info("Template section inserted at the bottom of the editor");
  };

  const addStatRow = () => {
    setStatsList([...statsList, { label: "", value: "" }]);
  };

  const removeStatRow = (index: number) => {
    setStatsList(statsList.filter((_, i) => i !== index));
  };

  const updateStatRow = (index: number, field: "label" | "value", val: string) => {
    const updated = [...statsList];
    updated[index][field] = val;
    setStatsList(updated);
  };

  const getWebsiteBaseUrl = () => {
    if (typeof window !== "undefined" && (window.location.hostname.includes("localhost") || window.location.hostname.includes("127.0.0.1"))) {
      return "http://localhost:3000";
    }
    return "https://qubartech.com";
  };

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-brand-600" />
      </div>
    );
  }

  const baseUrl = getWebsiteBaseUrl();

  return (
    <div className="space-y-6 pb-20">
      {/* Top Breadcrumb & Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-zinc-900 p-4 sm:p-6 rounded-2xl border border-slate-200/80 dark:border-zinc-800 shadow-sm">
        <div className="flex items-center gap-3">
          <Link
            href="/qubartech/privacy"
            className="p-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-800/60 hover:bg-slate-100 dark:hover:bg-zinc-700 text-slate-600 dark:text-zinc-300 transition"
            title="Back to Products List"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-2xl">{icon || "📦"}</span>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                {name || "New Product Description & Details"}
              </h1>
              {isNonProfit && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-[11px] font-bold text-emerald-600 border border-emerald-500/20">
                  <Heart className="h-3 w-3 fill-emerald-500 text-emerald-500" /> Non-Profit
                </span>
              )}
            </div>
            <div className="text-xs text-slate-500 flex items-center gap-2 mt-1">
              <span>Slug: <code className="font-mono bg-slate-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded font-semibold">{slug || "new-product"}</code></span>
              <span>•</span>
              <span className="capitalize font-semibold text-slate-700 dark:text-slate-300">{status}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 self-end sm:self-auto">
          {slug && (
            <>
              <a
                href={`${baseUrl}/products/${slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-secondary text-xs flex items-center gap-1.5"
                title="Open live product detail page on website"
              >
                <Sparkles className="h-3.5 w-3.5 text-indigo-500" />
                <span className="hidden sm:inline">Preview Product Page</span>
              </a>
              <a
                href={`${baseUrl}/products/${slug}/privacy`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-secondary text-xs flex items-center gap-1.5"
                title="Open live privacy policy page"
              >
                <FileText className="h-3.5 w-3.5 text-teal-500" />
                <span className="hidden sm:inline">Preview Policy</span>
              </a>
            </>
          )}

          <button
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending}
            className="btn-primary flex items-center gap-2 px-5 py-2.5 shadow-lg"
          >
            {saveMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            <span className="font-bold">Save All Changes</span>
          </button>
        </div>
      </div>

      {/* Main Tab Navigation */}
      <div className="flex bg-slate-100 dark:bg-zinc-900 p-1.5 rounded-2xl gap-1.5 border border-slate-200/60 dark:border-zinc-800">
        <button
          onClick={() => setActiveTab("details")}
          className={`flex-1 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 ${
            activeTab === "details"
              ? "bg-white dark:bg-zinc-800 text-indigo-600 dark:text-indigo-400 shadow-sm"
              : "text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white"
          }`}
        >
          <Sparkles className="h-4 w-4" />
          <span>1. Full Product Description (Markdown)</span>
        </button>
        <button
          onClick={() => setActiveTab("meta")}
          className={`flex-1 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 ${
            activeTab === "meta"
              ? "bg-white dark:bg-zinc-800 text-slate-900 dark:text-white shadow-sm"
              : "text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white"
          }`}
        >
          <Sliders className="h-4 w-4" />
          <span>2. Metadata, Specs & Key Metrics</span>
        </button>
        <button
          onClick={() => setActiveTab("privacy")}
          className={`flex-1 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 ${
            activeTab === "privacy"
              ? "bg-white dark:bg-zinc-800 text-teal-600 dark:text-teal-400 shadow-sm"
              : "text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white"
          }`}
        >
          <FileText className="h-4 w-4" />
          <span>3. Privacy Policy (Markdown)</span>
        </button>
      </div>

      {/* TAB 1: Full Markdown Description Writer */}
      {activeTab === "details" && (
        <div className="space-y-4">
          {/* Sub-toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-zinc-900 p-3 rounded-2xl border border-slate-200/80 dark:border-zinc-800">
            {/* Formatting Actions */}
            <div className="flex flex-wrap items-center gap-1">
              <button
                type="button"
                onClick={() => insertMarkdownText("## ", "", "Heading 2")}
                className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-300"
                title="Heading 2"
              >
                <Heading2 className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => insertMarkdownText("### ", "", "Heading 3")}
                className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-300"
                title="Heading 3"
              >
                <Heading3 className="h-4 w-4" />
              </button>
              <span className="h-4 w-px bg-slate-200 dark:bg-zinc-800 mx-1" />
              <button
                type="button"
                onClick={() => insertMarkdownText("**", "**", "bold text")}
                className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-300"
                title="Bold"
              >
                <Bold className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => insertMarkdownText("*", "*", "italic text")}
                className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-300"
                title="Italic"
              >
                <Italic className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => insertMarkdownText("`", "`", "code")}
                className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-300"
                title="Inline Code"
              >
                <Code className="h-4 w-4" />
              </button>
              <span className="h-4 w-px bg-slate-200 dark:bg-zinc-800 mx-1" />
              <button
                type="button"
                onClick={() => insertMarkdownText("- ", "", "List item")}
                className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-300"
                title="Bullet List"
              >
                <List className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => insertMarkdownText("1. ", "", "Numbered item")}
                className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-300"
                title="Numbered List"
              >
                <ListOrdered className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => insertMarkdownText("> ", "", "Quote text")}
                className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-300"
                title="Quote"
              >
                <Quote className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => insertMarkdownText("[", "](https://example.com)", "link title")}
                className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-300"
                title="Link"
              >
                <LinkIcon className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => insertMarkdownText("\n```typescript\n", "\n```\n", "// Code example")}
                className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-300"
                title="Code Block"
              >
                <span className="text-xs font-mono font-bold">{`</>`}</span>
              </button>
              <button
                type="button"
                onClick={() => insertMarkdownText("> [!TIP]\n> ", "", "Helpful tip or best practice...")}
                className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-300 text-xs font-semibold"
                title="Insert Tip Banner"
              >
                💡 Tip
              </button>
            </div>

            {/* Quick Templates & Split View Controls */}
            <div className="flex items-center gap-2">
              <select
                onChange={(e) => {
                  if (e.target.value) {
                    insertTemplate(e.target.value);
                    e.target.value = "";
                  }
                }}
                className="input py-1 px-2.5 text-xs bg-slate-50 dark:bg-zinc-800 rounded-lg cursor-pointer"
                defaultValue=""
              >
                <option value="" disabled>
                  + Insert Section Template...
                </option>
                <option value="architecture">Architecture Deep-Dive</option>
                <option value="capabilities">Core Capabilities & Workflows</option>
                <option value="faq">FAQ Section</option>
              </select>

              <div className="flex bg-slate-100 dark:bg-zinc-800 p-0.5 rounded-lg">
                <button
                  type="button"
                  onClick={() => setViewMode("split")}
                  className={`p-1.5 rounded-md text-xs font-semibold ${viewMode === "split" ? "bg-white dark:bg-zinc-700 shadow-sm" : "text-slate-500"}`}
                  title="Split Editor & Preview"
                >
                  <Columns2 className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("editor")}
                  className={`p-1.5 rounded-md text-xs font-semibold ${viewMode === "editor" ? "bg-white dark:bg-zinc-700 shadow-sm" : "text-slate-500"}`}
                  title="Editor Only"
                >
                  <Edit3 className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("preview")}
                  className={`p-1.5 rounded-md text-xs font-semibold ${viewMode === "preview" ? "bg-white dark:bg-zinc-700 shadow-sm" : "text-slate-500"}`}
                  title="Preview Only"
                >
                  <Eye className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Editor Workspace */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
            {/* Editor Area */}
            {(viewMode === "split" || viewMode === "editor") && (
              <div className={`${viewMode === "split" ? "lg:col-span-6" : "lg:col-span-12"} flex flex-col`}>
                <div className="bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm flex flex-col">
                  <div className="bg-slate-50 dark:bg-zinc-800/60 px-4 py-2 border-b border-slate-200/60 dark:border-zinc-800 text-xs font-bold text-slate-600 dark:text-zinc-400 flex justify-between items-center">
                    <span>Markdown Source Code (`detailsContent`)</span>
                    <span className="font-mono text-[11px] text-slate-400">
                      {detailsContent.length} chars • {detailsContent.split(/\s+/).filter(Boolean).length} words
                    </span>
                  </div>
                  <textarea
                    ref={textareaRef}
                    value={detailsContent}
                    onChange={(e) => setDetailsContent(e.target.value)}
                    className="w-full min-h-[580px] p-5 font-mono text-xs sm:text-sm leading-relaxed bg-transparent border-0 focus:ring-0 focus:outline-none resize-y text-slate-900 dark:text-slate-100"
                    placeholder={`# Product Deep-Dive
Write comprehensive product documentation, module overviews, workflows, and guides...`}
                  />
                </div>
              </div>
            )}

            {/* Live Preview Area */}
            {(viewMode === "split" || viewMode === "preview") && (
              <div className={`${viewMode === "split" ? "lg:col-span-6" : "lg:col-span-12"} flex flex-col`}>
                <div className="bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm flex flex-col min-h-[620px]">
                  <div className="bg-slate-50 dark:bg-zinc-800/60 px-4 py-2 border-b border-slate-200/60 dark:border-zinc-800 text-xs font-bold text-indigo-600 dark:text-indigo-400 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Sparkles className="h-3.5 w-3.5" />
                      Live Styled Website Render
                    </span>
                    <span className="text-[11px] text-slate-400 font-normal">Real-Time Sync</span>
                  </div>
                  <div className="p-6 sm:p-8 overflow-y-auto max-h-[640px] prose dark:prose-invert max-w-none">
                    {renderMarkdown(detailsContent)}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: Metadata, Specs & Key Metrics */}
      {activeTab === "meta" && (
        <div className="bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-2xl p-6 sm:p-8 shadow-sm space-y-8">
          {/* Identity & Core Info */}
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4 pb-2 border-b border-slate-100 dark:border-zinc-800 flex items-center gap-2">
              <Globe className="h-4 w-4 text-brand-600" />
              <span>Product Identity & Routing</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="label font-bold text-slate-800 dark:text-slate-200">Product Full Name</label>
                <input className="input" type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. QubarTech Business ERP" />
              </div>
              <div>
                <label className="label font-bold text-slate-800 dark:text-slate-200">URL Slug</label>
                <input className="input font-mono" type="text" value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="e.g. business-erp" />
              </div>
              <div>
                <label className="label">Short Display Name</label>
                <input className="input" type="text" value={shortName} onChange={(e) => setShortName(e.target.value)} placeholder="e.g. Business ERP" />
              </div>
              <div>
                <label className="label">Category</label>
                <input className="input" type="text" value={category} onChange={(e) => setCategory(e.target.value)} placeholder="e.g. Enterprise & Productivity" />
              </div>
              <div>
                <label className="label">Header Badge</label>
                <input className="input" type="text" value={badge} onChange={(e) => setBadge(e.target.value)} placeholder="e.g. 🏢 Enterprise Suite" />
              </div>
              <div>
                <label className="label">Production Status</label>
                <select className="input" value={status} onChange={(e) => setStatus(e.target.value)}>
                  <option value="live">Live / Production</option>
                  <option value="beta">Beta Testing</option>
                  <option value="development">In Development</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
            </div>
          </div>

          {/* Hero & Media */}
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4 pb-2 border-b border-slate-100 dark:border-zinc-800 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-indigo-500" />
              <span>Hero Pitch & Visual Styling</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="label font-bold text-slate-800 dark:text-slate-200">Hero Tagline</label>
                <input className="input" type="text" value={tagline} onChange={(e) => setTagline(e.target.value)} placeholder="e.g. Modern Unified ERP for Engineering Teams: Projects, Sprints, Real-Time Time Tracking" />
              </div>
              <div>
                <label className="label">Card Tailwind Gradient</label>
                <input className="input font-mono text-xs" type="text" value={color} onChange={(e) => setColor(e.target.value)} placeholder="from-blue-600 via-indigo-600 to-violet-700" />
              </div>
              <div>
                <label className="label">Hero Ambient Gradient</label>
                <input className="input font-mono text-xs" type="text" value={coverGradient} onChange={(e) => setCoverGradient(e.target.value)} placeholder="from-slate-950 via-indigo-950 to-gray-950" />
              </div>
              <div>
                <label className="label">Emoji Icon</label>
                <input className="input" type="text" value={icon} onChange={(e) => setIcon(e.target.value)} placeholder="e.g. 💼" />
              </div>
              <div>
                <label className="label">Feature Image URL</label>
                <input className="input" type="text" value={image} onChange={(e) => setImage(e.target.value)} placeholder="https://images.unsplash.com/..." />
              </div>
              <div>
                <label className="label">Live Web App Link</label>
                <input className="input" type="text" value={link} onChange={(e) => setLink(e.target.value)} placeholder="https://erp.qubartech.com" />
              </div>
              <div>
                <label className="label">GitHub Repository URL</label>
                <input className="input" type="text" value={githubUrl} onChange={(e) => setGithubUrl(e.target.value)} placeholder="https://github.com/qubartech/..." />
              </div>
            </div>
          </div>

          {/* Key Statistics Grid Builder */}
          <div>
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100 dark:border-zinc-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Layers className="h-4 w-4 text-emerald-600" />
                <span>Key Statistics & Metrics Grid</span>
              </h3>
              <button type="button" onClick={addStatRow} className="btn-secondary text-xs flex items-center gap-1.5">
                <Plus className="h-3.5 w-3.5" /> Add Metric Card
              </button>
            </div>

            <div className="space-y-2.5">
              {statsList.map((stat, idx) => (
                <div key={idx} className="flex items-center gap-3 bg-slate-50 dark:bg-zinc-800/60 p-3 rounded-xl border border-slate-200/60 dark:border-zinc-700/60">
                  <div className="flex-1">
                    <label className="text-[11px] font-bold text-slate-500">Metric Label</label>
                    <input
                      className="input py-1.5 text-xs font-semibold"
                      value={stat.label}
                      onChange={(e) => updateStatRow(idx, "label", e.target.value)}
                      placeholder="e.g. Core Modules"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="text-[11px] font-bold text-slate-500">Metric Value</label>
                    <input
                      className="input py-1.5 text-xs font-bold text-brand-600 dark:text-brand-400"
                      value={stat.value}
                      onChange={(e) => updateStatRow(idx, "value", e.target.value)}
                      placeholder="e.g. 7+ Systems"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => removeStatRow(idx)}
                    className="btn-danger p-2 self-end"
                    title="Delete Metric"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}

              {statsList.length === 0 && (
                <div className="text-center py-6 border border-dashed border-slate-200 dark:border-zinc-800 rounded-xl text-xs text-slate-400">
                  No metrics configured. Click &quot;Add Metric Card&quot; to showcase numbers on the product hero.
                </div>
              )}
            </div>
          </div>

          {/* Tech Stack & Philosophy */}
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4 pb-2 border-b border-slate-100 dark:border-zinc-800 flex items-center gap-2">
              <Tag className="h-4 w-4 text-purple-600" />
              <span>Tech Stack & Mission Statement</span>
            </h3>
            <div className="space-y-4">
              <div>
                <label className="label font-bold text-slate-800 dark:text-slate-200">Tech Stack (comma-separated)</label>
                <input
                  className="input font-mono text-xs"
                  type="text"
                  value={techStack}
                  onChange={(e) => setTechStack(e.target.value)}
                  placeholder="Next.js 16, React 19, TypeScript, Prisma ORM, PostgreSQL, TailwindCSS v4, TanStack Query, Supabase"
                />
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {["Next.js 16", "React 19", "TypeScript", "Prisma ORM", "PostgreSQL", "TailwindCSS v4", "Supabase", "TanStack Query"].map((badgeItem, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        if (!techStack.includes(badgeItem)) {
                          setTechStack((prev) => (prev ? `${prev}, ${badgeItem}` : badgeItem));
                        }
                      }}
                      className="px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-zinc-800 text-[10px] font-semibold text-slate-600 dark:text-zinc-400 hover:bg-slate-200"
                    >
                      + {badgeItem}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="label">Mission Statement & Engineering Story</label>
                <textarea
                  className="input min-h-[90px] leading-relaxed p-3.5 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl"
                  value={mission}
                  onChange={(e) => setMission(e.target.value)}
                  placeholder="Why we built this product and our core engineering philosophy..."
                />
              </div>

              <div>
                <label className="label">Short Description (for directories & search cards)</label>
                <textarea
                  className="input min-h-[80px] leading-relaxed p-3.5 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Summary displayed in product cards and meta tags..."
                />
              </div>

              <div>
                <label className="label">Key Feature Bullets (comma-separated)</label>
                <input
                  className="input"
                  type="text"
                  value={features}
                  onChange={(e) => setFeatures(e.target.value)}
                  placeholder="Integrated Project Kanban, Live Time Tracker, Ledger & Invoicing"
                />
              </div>

              <div>
                <label className="label">Tags (comma-separated)</label>
                <input
                  className="input"
                  type="text"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  placeholder="Enterprise, ERP, Project Management, Time Tracking"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: Privacy Policy */}
      {activeTab === "privacy" && (
        <div className="bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-zinc-800">
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <FileText className="h-4 w-4 text-teal-600" />
                <span>Product Legal Privacy Policy</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Markdown legal policy automatically rendered on <code>/products/[slug]/privacy</code>.
              </p>
            </div>
            <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
              <input
                type="checkbox"
                checked={hasPrivacy}
                onChange={(e) => setHasPrivacy(e.target.checked)}
                className="rounded border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-teal-600 focus:ring-teal-500 h-4.5 w-4.5"
              />
              <span>Enable Privacy Page</span>
            </label>
          </div>

          {hasPrivacy ? (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              <div className="lg:col-span-6">
                <label className="label font-bold text-slate-800 dark:text-slate-200">Markdown Source</label>
                <textarea
                  value={privacyPolicy}
                  onChange={(e) => setPrivacyPolicy(e.target.value)}
                  className="input font-mono text-xs sm:text-sm min-h-[500px] leading-relaxed p-4 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl"
                  placeholder={`# Privacy Policy for ${name || "Your Product"}
Last updated: June 2026.

## 1. Information Collection
We respect your privacy...`}
                />
              </div>
              <div className="lg:col-span-6 border border-slate-200/80 dark:border-zinc-800 rounded-xl p-6 min-h-[500px] overflow-y-auto max-h-[540px] bg-slate-50/50 dark:bg-zinc-950/40">
                <div className="text-xs font-bold text-teal-600 mb-4 pb-2 border-b border-slate-200/60 dark:border-zinc-800 flex items-center gap-1.5">
                  <Eye className="h-3.5 w-3.5" />
                  <span>Live Policy Preview</span>
                </div>
                <div className="prose dark:prose-invert max-w-none text-xs sm:text-sm">
                  {renderMarkdown(privacyPolicy)}
                </div>
              </div>
            </div>
          ) : (
            <div className="py-12 text-center text-slate-400 text-sm">
              Privacy Policy page is disabled for this product.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
