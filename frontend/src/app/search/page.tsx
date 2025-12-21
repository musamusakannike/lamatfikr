"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Search } from "lucide-react";
import { searchApi, type SearchResponse } from "@/lib/api/search";
import { useDebounce } from "@/lib/hooks/useDebounce";
import { cn } from "@/lib/utils";
import { Navbar } from "@/components/layout/Navbar";
import { useLanguage } from "@/contexts/LanguageContext";

export default function SearchPage() {
  const params = useSearchParams();
  const router = useRouter();
  const qParam = (params.get("q") || "").trim();
  const [query, setQuery] = useState(qParam);
  const [data, setData] = useState<SearchResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { t } = useLanguage();
  const debouncedQuery = useDebounce(query, 350);

  useEffect(() => {
    setQuery(qParam);
  }, [qParam]);

  useEffect(() => {
    let active = true;
    const run = async () => {
      const q = (debouncedQuery || "").trim();
      if (q.length < 2) {
        setData({ users: [], posts: [] });
        return;
      }
      try {
        setLoading(true);
        const res = await searchApi.searchAll(q, 20);
        if (active) setData(res);
      } catch (e: any) {
        if (active) setError(e?.message || "Failed to search");
      } finally {
        if (active) setLoading(false);
      }
    };
    run();
    return () => {
      active = false;
    };
  }, [debouncedQuery]);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if ((query || "").trim().length >= 2) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
    }
  };

  return (
    <div className="min-h-screen">
      <Navbar onMenuToggle={() => {}} isSidebarOpen={false} />
      <main className={cn("pt-16")}> 
        <div className="max-w-3xl mx-auto p-4 space-y-6">
          <form onSubmit={onSubmit} className="relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-(--text-muted)" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("common", "search") + "..."}
              className="w-full pl-10 pr-4 py-2.5 rounded-full text-sm bg-primary-50/80 dark:bg-primary-950/40 border-2 border-transparent focus:border-primary-400 dark:focus:border-primary-500 focus:bg-(--bg-card) placeholder:text-(--text-muted) outline-none transition-all"
            />
          </form>

          {loading && <p className="text-(--text-muted)">{t("common", "loading")}...</p>}
          {error && <p className="text-red-500 text-sm">{error}</p>}

          {data && (
            <div className="space-y-8">
              <section>
                <h2 className="font-semibold mb-3">{t("common", "users")}</h2>
                {data.users.length === 0 ? (
                  <p className="text-(--text-muted) text-sm">{t("common", "noResults")}</p>
                ) : (
                  <ul className="divide-y divide-(--border) rounded-xl border border-(--border) overflow-hidden">
                    {data.users.map((u) => (
                      <li key={u._id} className="p-3 hover:bg-primary-50/50 dark:hover:bg-primary-900/20">
                        <Link href={`/user/${u.username}`} className="flex items-center gap-3">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={u.avatar || "/images/default-avatar.svg"} alt={u.username} className="w-8 h-8 rounded-full object-cover" />
                          <div>
                            <p className="text-sm font-medium">{u.firstName} {u.lastName}</p>
                            <p className="text-xs text-(--text-muted)">@{u.username}</p>
                          </div>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              <section>
                <h2 className="font-semibold mb-3">{t("common", "posts")}</h2>
                {data.posts.length === 0 ? (
                  <p className="text-(--text-muted) text-sm">{t("common", "noResults")}</p>
                ) : (
                  <ul className="space-y-3">
                    {data.posts.map((p) => (
                      <li key={p._id}>
                        <Link href={`/posts/${p._id}`} className="block p-4 rounded-xl border border-(--border) hover:bg-primary-50/50 dark:hover:bg-primary-900/20">
                          <p className="text-sm mb-2 line-clamp-3 whitespace-pre-wrap">{p.contentText || ""}</p>
                          {typeof p.userId === "object" && (
                            <div className="text-xs text-(--text-muted)">
                              {p.userId.firstName} {p.userId.lastName} · @{p.userId.username}
                            </div>
                          )}
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
