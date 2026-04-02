import React, { useEffect, useState, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { OverlayScrollbarsComponent } from 'overlayscrollbars-react';
import { appCacheDir } from '@tauri-apps/api/path';
import { wikiSync, wikiReadPage } from '../../services/backend';
import { IconRegistry } from '../IconRegistry';

const WIKI_URL = 'https://github.com/de-treelab/sprite-editor.wiki.git';

interface WikiPageProps {
  onClose: () => void;
}

export const WikiPage: React.FC<WikiPageProps> = ({ onClose }) => {
  const [pages, setPages] = useState<string[]>([]);
  const [activePage, setActivePage] = useState<string>('Home');
  const [content, setContent] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initial sync
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setSyncing(true);
        const cacheDir = await appCacheDir();
        const pageList = await wikiSync(cacheDir, WIKI_URL);
        if (cancelled) return;
        setPages(pageList);
        if (pageList.length > 0) {
          const first = pageList.includes('Home') ? 'Home' : pageList[0];
          setActivePage(first);
          const md = await wikiReadPage(cacheDir, first);
          if (!cancelled) setContent(md);
        }
      } catch (e) {
        if (!cancelled) setError(String(e));
      } finally {
        if (!cancelled) {
          setLoading(false);
          setSyncing(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const loadPage = useCallback(async (page: string) => {
    setActivePage(page);
    setError(null);
    try {
      const cacheDir = await appCacheDir();
      const md = await wikiReadPage(cacheDir, page);
      setContent(md);
    } catch (e) {
      setError(String(e));
    }
  }, []);

  const handleRefresh = useCallback(async () => {
    setSyncing(true);
    setError(null);
    try {
      const cacheDir = await appCacheDir();
      const pageList = await wikiSync(cacheDir, WIKI_URL);
      setPages(pageList);
      if (pageList.length > 0 && !pageList.includes(activePage)) {
        setActivePage(pageList[0]);
        const md = await wikiReadPage(cacheDir, pageList[0]);
        setContent(md);
      } else {
        const md = await wikiReadPage(cacheDir, activePage);
        setContent(md);
      }
    } catch (e) {
      setError(String(e));
    } finally {
      setSyncing(false);
    }
  }, [activePage]);

  // Handle wiki-internal links: [[Page Name]] are rendered as Page-Name in GH wiki
  const handleLinkClick = useCallback(
    (href: string | undefined) => {
      if (!href) return;
      // Check if it's an internal wiki link (no protocol)
      if (!href.startsWith('http://') && !href.startsWith('https://')) {
        const pageName = decodeURIComponent(href).replace(/\.md$/, '').replace(/-/g, '-');
        // Check if page exists (with or without dashes for spaces)
        const match = pages.find((p) => p === pageName || p.replace(/ /g, '-') === pageName);
        if (match) {
          loadPage(match);
          return;
        }
      }
    },
    [pages, loadPage],
  );

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-900">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-slate-700 bg-slate-800 shrink-0">
        <h1 className="text-lg font-semibold text-slate-200">Wiki</h1>
        <div className="flex items-center gap-3">
          <button
            className="text-xs text-slate-400 hover:text-sky-400 px-3 py-1 rounded hover:bg-slate-700 transition-colors disabled:opacity-50"
            onClick={handleRefresh}
            disabled={syncing}
          >
            {syncing ? 'Syncing…' : 'Refresh'}
          </button>
          <button
            className="p-1.5 rounded hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition-colors"
            onClick={onClose}
          >
            <IconRegistry.Close className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar — page list */}
        <OverlayScrollbarsComponent
          element="nav"
          className="w-56 shrink-0 border-r border-slate-700 bg-slate-850"
          options={{ scrollbars: { theme: 'os-theme-light', autoHide: 'move', autoHideDelay: 800 } }}
        >
          <div className="p-3">
            <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Pages</h2>
            {pages.map((page) => (
              <button
                key={page}
                className={`w-full text-left px-3 py-1.5 rounded text-sm transition-colors ${
                  page === activePage
                    ? 'bg-sky-600/20 text-sky-300'
                    : 'text-slate-300 hover:bg-slate-700/60 hover:text-slate-100'
                }`}
                onClick={() => loadPage(page)}
              >
                {page.replace(/-/g, ' ')}
              </button>
            ))}
            {pages.length === 0 && !loading && <p className="text-xs text-slate-500 italic">No pages found</p>}
          </div>
        </OverlayScrollbarsComponent>

        {/* Main content */}
        <OverlayScrollbarsComponent
          element="main"
          className="flex-1 p-8"
          options={{ scrollbars: { theme: 'os-theme-light', autoHide: 'move', autoHideDelay: 800 } }}
        >
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-slate-400 text-sm">Loading wiki…</p>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <p className="text-red-400 text-sm mb-2">Failed to load wiki</p>
                <p className="text-slate-500 text-xs max-w-md">{error}</p>
              </div>
            </div>
          ) : (
            <article className="prose prose-invert prose-sm max-w-3xl mx-auto">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  a: ({ href, children, ...props }) => (
                    <a
                      {...props}
                      href={href}
                      onClick={(e) => {
                        if (href && !href.startsWith('http://') && !href.startsWith('https://')) {
                          e.preventDefault();
                          handleLinkClick(href);
                        }
                      }}
                      target={href?.startsWith('http') ? '_blank' : undefined}
                      rel={href?.startsWith('http') ? 'noopener noreferrer' : undefined}
                    >
                      {children}
                    </a>
                  ),
                }}
              >
                {content}
              </ReactMarkdown>
            </article>
          )}
        </OverlayScrollbarsComponent>
      </div>
    </div>
  );
};
