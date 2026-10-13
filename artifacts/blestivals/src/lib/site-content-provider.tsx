import { createContext, useContext, type ReactNode } from "react";
import { useGetPublicContent, type SiteContent } from "@workspace/api-client-react";

const SiteContentContext = createContext<SiteContent | null>(null);

export function SiteContentProvider({ children }: { children: ReactNode }) {
  const query = useGetPublicContent();

  if (query.isLoading) {
    return (
      <main
        className="flex min-h-[70vh] items-center justify-center bg-[#f7f3eb] px-6"
        aria-busy="true"
      >
        <div className="flex items-center gap-3 text-sm text-[#71635b]">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#d9cfc0] border-t-[#a54e5b]" />
          Loading BlessTivals…
        </div>
      </main>
    );
  }

  if (query.isError || !query.data) {
    return (
      <main className="flex min-h-[70vh] items-center justify-center bg-[#f7f3eb] px-6">
        <section className="max-w-md text-center">
          <p className="eyebrow text-[#a54e5b]">A small pause</p>
          <h1 className="serif mt-4 text-4xl">The site is taking a moment.</h1>
          <p className="mt-4 text-sm leading-6 text-[#71635b]">
            Website content could not be loaded. Please try again in a moment.
          </p>
          <button
            type="button"
            onClick={() => void query.refetch()}
            className="mt-7 rounded-full bg-[#a54e5b] px-6 py-3 text-xs font-semibold tracking-[.1em] text-white hover:bg-[#8e3f4b]"
          >
            TRY AGAIN
          </button>
        </section>
      </main>
    );
  }

  return (
    <SiteContentContext.Provider value={query.data}>
      {children}
    </SiteContentContext.Provider>
  );
}

export function useSiteContent(): SiteContent {
  const content = useContext(SiteContentContext);
  if (!content) {
    throw new Error("useSiteContent must be used within SiteContentProvider.");
  }
  return content;
}
