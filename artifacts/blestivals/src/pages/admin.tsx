import { useEffect, useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useClerk } from '@clerk/react';
import { useLocation } from 'wouter';
import {
  useGetPublicContent,
  useListAdminInquiries,
  usePublishImageUpload,
  useRequestImageUploadUrl,
  useUpdateAdminContent,
  useUpdateAdminInquiry,
} from '@workspace/api-client-react';
import type { Inquiry, InquiryStatus, SiteContent } from '@workspace/api-client-react';
import {
  AlertCircle,
  ArrowDownLeft,
  ArrowUpRight,
  Check,
  CheckCircle2,
  ChevronDown,
  Clock3,
  FileImage,
  ImagePlus,
  Inbox,
  Instagram,
  LoaderCircle,
  LogOut,
  Mail,
  MapPin,
  MessageSquareText,
  Phone,
  Plus,
  Search,
  Send,
  Settings2,
  Sparkles,
  Upload,
  X,
} from 'lucide-react';

type WorkspaceTab = 'overview' | 'content' | 'inquiries';
type InquiryFilter = 'all' | InquiryStatus;
type UploadedImage = { imagePath: string; name: string; state: 'ready' | 'error'; message?: string };

const statusLabel: Record<InquiryStatus, string> = {
  new: 'New',
  in_progress: 'In progress',
  closed: 'Closed',
};

const inputClass =
  'w-full rounded-xl border border-[#dfd5c8] bg-[#fffdf8] px-3.5 py-3 text-sm text-[#3b2b2b] outline-none transition focus:border-[#a54e5b] focus:ring-2 focus:ring-[#a54e5b]/15 placeholder:text-[#a79a8c]';
const labelClass = 'mb-2 block text-[11px] font-semibold uppercase tracking-[.13em] text-[#796b61]';
const cardClass = 'rounded-2xl border border-[#e5dbce] bg-[#fffdf8] shadow-[0_8px_28px_rgba(61,42,37,.035)]';

function messageFromError(error: unknown, fallback: string) {
  if (error instanceof Error && error.message) return error.message;
  if (typeof error === 'object' && error !== null && 'message' in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === 'string') return message;
  }
  return fallback;
}

function httpStatus(error: unknown) {
  if (typeof error === 'object' && error !== null && 'status' in error) {
    const status = (error as { status?: unknown }).status;
    return typeof status === 'number' ? status : undefined;
  }
  return undefined;
}

function Field({
  label,
  value,
  onChange,
  multiline = false,
  placeholder,
  maxLength,
  rows = 3,
  type = 'text',
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  multiline?: boolean;
  placeholder?: string;
  maxLength?: number;
  rows?: number;
  type?: string;
}) {
  return (
    <label className="block">
      <span className={labelClass}>{label}</span>
      {multiline ? (
        <textarea
          className={`${inputClass} min-h-24 resize-y leading-6`}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          maxLength={maxLength}
          rows={rows}
        />
      ) : (
        <input
          className={inputClass}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          maxLength={maxLength}
          type={type}
        />
      )}
    </label>
  );
}

function PanelHeading({ eyebrow, title, note }: { eyebrow: string; title: string; note?: string }) {
  return (
    <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p className="text-[10px] font-bold uppercase tracking-[.2em] text-[#a54e5b]">{eyebrow}</p>
        <h2 className="mt-2 font-serif text-3xl tracking-[-.035em] text-[#3b2b2b]">{title}</h2>
      </div>
      {note && <p className="max-w-md text-xs leading-5 text-[#88796d]">{note}</p>}
    </div>
  );
}

function QueryError({
  title,
  error,
  onRetry,
}: {
  title: string;
  error: unknown;
  onRetry: () => void;
}) {
  return (
    <div className="rounded-2xl border border-[#d9a7a7] bg-[#fff8f4] p-5 text-[#673d3b]" role="alert">
      <div className="flex gap-3">
        <AlertCircle className="mt-0.5 shrink-0 text-[#a54e5b]" size={19} />
        <div className="min-w-0 flex-1">
          <p className="font-semibold">{title}</p>
          <p className="mt-1 text-sm leading-6">{messageFromError(error, 'The server could not be reached. Please try again.')}</p>
          <button type="button" onClick={onRetry} className="mt-3 inline-flex min-h-10 items-center gap-2 rounded-lg border border-[#b77a7d] px-3 text-xs font-semibold hover:bg-[#f7e9e5] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#a54e5b]">
            Retry
          </button>
        </div>
      </div>
    </div>
  );
}

function LoadingPanel({ label }: { label: string }) {
  return (
    <div className={`${cardClass} p-6`} role="status" aria-live="polite">
      <div className="h-3 w-28 animate-pulse rounded bg-[#eee5d9]" />
      <div className="mt-5 h-8 w-2/3 animate-pulse rounded bg-[#eee5d9]" />
      <div className="mt-3 h-4 w-full animate-pulse rounded bg-[#f1eae0]" />
      <div className="mt-2 h-4 w-4/5 animate-pulse rounded bg-[#f1eae0]" />
      <span className="sr-only">{label}</span>
    </div>
  );
}

function statusTone(status: InquiryStatus) {
  if (status === 'new') return 'border-[#d9b884] bg-[#fff5df] text-[#795c29]';
  if (status === 'in_progress') return 'border-[#cf9aa0] bg-[#f9eceb] text-[#8a4650]';
  return 'border-[#c7c8b8] bg-[#eff0e7] text-[#626751]';
}

export function AdminPage() {
  const queryClient = useQueryClient();
  const { signOut } = useClerk();
  const contentQuery = useGetPublicContent();
  const inquiriesQuery = useListAdminInquiries();
  const saveContent = useUpdateAdminContent();
  const updateInquiry = useUpdateAdminInquiry();
  const requestUpload = useRequestImageUploadUrl();
  const publishUpload = usePublishImageUpload();

  const [tab, setTab] = useState<WorkspaceTab>('overview');
  const [draft, setDraft] = useState<SiteContent | null>(null);
  const [draftDirty, setDraftDirty] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const [uploadImages, setUploadImages] = useState<UploadedImage[]>([]);
  const [uploadBusy, setUploadBusy] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [uploadSuccess, setUploadSuccess] = useState('');
  const [filter, setFilter] = useState<InquiryFilter>('all');
  const [search, setSearch] = useState('');
  const [selectedInquiryId, setSelectedInquiryId] = useState<number | null>(null);
  const [inquiryMutationError, setInquiryMutationError] = useState('');
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (contentQuery.data && (draft === null || !draftDirty)) {
      setDraft(contentQuery.data);
      setDraftDirty(false);
    }
  }, [contentQuery.data, draft, draftDirty]);

  const inquiries = inquiriesQuery.data ?? [];
  const selectedInquiry = inquiries.find((inquiry) => inquiry.id === selectedInquiryId) ?? null;
  const counts = useMemo(
    () => ({
      all: inquiries.length,
      new: inquiries.filter((inquiry) => inquiry.status === 'new').length,
      in_progress: inquiries.filter((inquiry) => inquiry.status === 'in_progress').length,
      closed: inquiries.filter((inquiry) => inquiry.status === 'closed').length,
    }),
    [inquiries],
  );
  const filteredInquiries = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return inquiries.filter((inquiry) => {
      const matchesStatus = filter === 'all' || inquiry.status === filter;
      const matchesSearch =
        !needle ||
        [inquiry.name, inquiry.phone, inquiry.email, inquiry.eventType, inquiry.location]
          .filter(Boolean)
          .some((value) => value.toLowerCase().includes(needle));
      return matchesStatus && matchesSearch;
    });
  }, [filter, inquiries, search]);

  const updateDraft = (change: (current: SiteContent) => SiteContent) => {
    setDraft((current) => (current ? change(current) : current));
    setDraftDirty(true);
    setSaveMessage('');
  };

  const changeField = <K extends keyof SiteContent>(field: K, value: SiteContent[K]) => {
    updateDraft((current) => ({ ...current, [field]: value }));
  };

  const saveDraft = async () => {
    if (!draft || saveContent.isPending) return;
    setSaveMessage('');
    try {
      const saved = await saveContent.mutateAsync({ data: draft });
      setDraft(saved);
      setDraftDirty(false);
      setSaveMessage('Your changes are saved.');
      await queryClient.invalidateQueries({ queryKey: contentQuery.queryKey });
    } catch {
      // Mutation error is rendered from the hook below.
    }
  };

  const uploadFile = async (file: File) => {
    setUploadError('');
    setUploadSuccess('');
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setUploadError('Choose a JPEG, PNG, or WebP image.');
      return;
    }
    if (file.size < 1 || file.size > 10 * 1024 * 1024) {
      setUploadError('The image must be under 10 MB.');
      return;
    }

    setUploadBusy(true);
    try {
      const upload = await requestUpload.mutateAsync({
        data: {
          name: file.name,
          size: file.size,
          contentType: file.type as 'image/jpeg' | 'image/png' | 'image/webp',
        },
      });
      const putResponse = await fetch(upload.uploadURL, {
        method: 'PUT',
        headers: { 'Content-Type': file.type },
        body: file,
      });
      if (!putResponse.ok) throw new Error(`Image transfer failed (${putResponse.status}).`);
      const published = await publishUpload.mutateAsync({ data: { objectPath: upload.objectPath } });
      setUploadImages((current) => [
        { imagePath: published.imagePath, name: file.name, state: 'ready' },
        ...current,
      ]);
      setUploadSuccess(`${file.name} is ready to add to your draft.`);
    } catch (error) {
      const message = messageFromError(error, 'The image could not be uploaded. Please try again.');
      setUploadImages((current) => [{ imagePath: '', name: file.name, state: 'error', message }, ...current]);
      setUploadError(message);
    } finally {
      setUploadBusy(false);
    }
  };

  const updateStatus = async (inquiry: Inquiry, status: InquiryStatus) => {
    if (status === inquiry.status || updateInquiry.isPending) return;
    setInquiryMutationError('');
    try {
      await updateInquiry.mutateAsync({ id: inquiry.id, data: { status } });
      await queryClient.invalidateQueries({ queryKey: inquiriesQuery.queryKey });
    } catch (error) {
      setInquiryMutationError(messageFromError(error, 'The enquiry status could not be updated.'));
    }
  };

  const addService = () => {
    if (!draft || draft.services.length >= 12) return;
    updateDraft((current) => ({
      ...current,
      services: [...current.services, { id: crypto.randomUUID(), title: '', tag: '', body: '' }],
    }));
  };

  const addGalleryItem = (imagePath = '') => {
    if (!draft || draft.gallery.length >= 24) return;
    updateDraft((current) => ({
      ...current,
      gallery: [...current.gallery, { id: crypto.randomUUID(), imagePath, altText: '', caption: '' }],
    }));
  };

  const tabs: { id: WorkspaceTab; label: string; icon: typeof Settings2 }[] = [
    { id: 'overview', label: 'Overview', icon: Sparkles },
    { id: 'content', label: 'Site content', icon: Settings2 },
    { id: 'inquiries', label: 'Inquiries', icon: Inbox },
  ];

  const accessStatus = inquiriesQuery.isError
    ? httpStatus(inquiriesQuery.error)
    : undefined;
  if (accessStatus === 403 || accessStatus === 503) {
    return (
      <main className="flex min-h-[100dvh] items-center justify-center bg-[#f4efe6] px-5 py-12 text-[#3b2b2b]">
        <section className={`${cardClass} w-full max-w-lg p-7 sm:p-9`}>
          <p className="text-[10px] font-bold uppercase tracking-[.2em] text-[#a54e5b]">BlessTivals / Admin</p>
          <h1 className="mt-4 font-serif text-3xl">This account isn’t approved yet.</h1>
          <p className="mt-3 text-sm leading-6 text-[#796b61]">
            A verified email must be added to the site’s admin access list before this account can manage content or enquiries.
          </p>
          <button
            type="button"
            onClick={() => void signOut().then(() => setLocation('/sign-in'))}
            className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-full bg-[#a54e5b] px-5 text-xs font-semibold text-white hover:bg-[#8e3f4b] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#a54e5b]"
          >
            <LogOut size={15} /> Sign out
          </button>
        </section>
      </main>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-[#f4efe6] text-[#3b2b2b]">
      <header className="border-b border-[#e3d8c9] bg-[#faf7f0]">
        <div className="mx-auto flex min-h-[76px] max-w-[1600px] items-center justify-between gap-4 px-4 sm:px-7 lg:px-10">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full border border-[#c99772]/55 text-[#a54e5b]">
              <span className="font-serif text-[25px] leading-none">B</span>
            </div>
            <div>
              <p className="font-serif text-[20px] leading-tight tracking-[-.04em]">BlessTivals</p>
              <p className="mt-0.5 text-[9px] font-semibold uppercase tracking-[.19em] text-[#88776b]">Client workspace</p>
            </div>
          </div>
          <div className="hidden items-center gap-2 rounded-full border border-[#e5d8c7] bg-[#f7f0e5] px-3.5 py-2 text-[11px] text-[#776b60] sm:flex">
            <span className="h-1.5 w-1.5 rounded-full bg-[#8c9a74]" />
            Website editor
          </div>
          <button
            type="button"
            onClick={() => void signOut().then(() => setLocation('/sign-in'))}
            aria-label="Sign out of the BlessTivals admin"
            title="Sign out"
            className="inline-flex min-h-10 items-center gap-2 rounded-full border border-[#e5d8c7] bg-[#fffdf8] px-3 text-[11px] font-semibold text-[#74675d] transition hover:border-[#a54e5b] hover:text-[#a54e5b] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#a54e5b]"
          >
            <LogOut size={15} />
            <span>Sign out</span>
          </button>
        </div>
      </header>

      <div className="mx-auto grid max-w-[1600px] lg:grid-cols-[238px_minmax(0,1fr)]">
        <aside className="border-b border-[#e3d8c9] bg-[#f8f4ec] px-3 py-3 lg:min-h-[calc(100dvh-76px)] lg:border-b-0 lg:border-r lg:px-5 lg:py-8">
          <p className="hidden px-3 pb-3 text-[9px] font-bold uppercase tracking-[.19em] text-[#9a897a] lg:block">Manage your site</p>
          <nav className="flex gap-1 overflow-x-auto lg:flex-col" aria-label="Admin workspace">
            {tabs.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => setTab(id)}
                aria-current={tab === id ? 'page' : undefined}
                className={`flex min-h-11 shrink-0 items-center gap-3 rounded-xl px-3.5 text-left text-[12px] font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#a54e5b] lg:w-full ${
                  tab === id ? 'bg-[#a54e5b] text-[#fffaf2] shadow-[0_5px_15px_rgba(165,78,91,.15)]' : 'text-[#74675d] hover:bg-[#eee5d9] hover:text-[#3b2b2b]'
                }`}
              >
                <Icon size={16} strokeWidth={1.8} />
                {label}
                {id === 'inquiries' && counts.new > 0 && (
                  <span className={`ml-auto min-w-5 rounded-full px-1.5 py-0.5 text-center text-[10px] ${tab === id ? 'bg-white/20 text-white' : 'bg-[#f1dfd5] text-[#8a4650]'}`}>
                    {counts.new}
                  </span>
                )}
              </button>
            ))}
          </nav>
          <div className="mt-10 hidden rounded-2xl border border-[#e5d9ca] bg-[#f3eadc] p-4 lg:block">
            <p className="font-serif text-[18px] leading-snug">A little care, in all the right places.</p>
            <p className="mt-2 text-[11px] leading-5 text-[#827368]">Updates here shape what visitors see on the BlessTivals website.</p>
            <div className="mt-4 flex items-center gap-2 text-[9px] font-bold uppercase tracking-[.14em] text-[#a54e5b]">
              <span className="h-px w-5 bg-[#b87874]" /> Thoughtfully yours
            </div>
          </div>
        </aside>

        <main className="min-w-0 px-4 py-7 sm:px-7 sm:py-9 lg:px-10 lg:py-10">
          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[.2em] text-[#a54e5b]">BLESTIVALS / ADMIN</p>
              <h1 className="mt-2 font-serif text-[clamp(2rem,4vw,3.2rem)] leading-tight tracking-[-.045em]">
                {tab === 'overview' ? 'Good to see you.' : tab === 'content' ? 'Shape the website.' : 'The enquiry inbox.'}
              </h1>
              <p className="mt-2 max-w-2xl text-[13px] leading-6 text-[#817369]">
                {tab === 'overview'
                  ? 'A clear view of your public content and conversations, all in one place.'
                  : tab === 'content'
                    ? 'Edit the words and images visitors meet on your public pages.'
                    : 'Keep every event conversation moving with a thoughtful follow-up.'}
              </p>
            </div>
            {tab === 'content' && (
              <div className="flex flex-wrap items-center gap-3">
                <span className={`inline-flex items-center gap-1.5 text-[11px] ${draftDirty ? 'text-[#9a6645]' : 'text-[#7d8571]'}`}>
                  {draftDirty ? <span className="h-1.5 w-1.5 rounded-full bg-[#c88954]" /> : <Check size={13} />}
                  {draftDirty ? 'Unsaved changes' : 'All changes saved'}
                </span>
                <button
                  type="button"
                  onClick={saveDraft}
                  disabled={!draft || !draftDirty || saveContent.isPending}
                  className="inline-flex min-h-11 items-center gap-2 rounded-full bg-[#a54e5b] px-5 text-[11px] font-bold tracking-[.08em] text-white transition hover:bg-[#8e3f4b] disabled:cursor-not-allowed disabled:opacity-45 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#a54e5b]"
                >
                  {saveContent.isPending ? <LoaderCircle size={15} className="animate-spin" /> : <Send size={14} />}
                  {saveContent.isPending ? 'SAVING…' : 'SAVE CHANGES'}
                </button>
              </div>
            )}
          </div>

          {tab === 'overview' && (
            <div className="space-y-6">
              <section className="grid gap-4 sm:grid-cols-3">
                <div className="relative overflow-hidden rounded-2xl bg-[#a54e5b] p-5 text-[#fff8ef] sm:col-span-2 sm:p-7">
                  <div className="absolute -right-6 -top-12 h-48 w-48 rounded-full border border-white/10" />
                  <div className="absolute -right-1 -top-8 h-36 w-36 rounded-full border border-white/10" />
                  <p className="text-[9px] font-bold uppercase tracking-[.2em] text-[#f0c9a4]">Your site, in good hands</p>
                  <h2 className="mt-4 max-w-lg font-serif text-[clamp(1.8rem,3.3vw,2.65rem)] leading-[1.12]">Every detail tells a story.<br /><i>Make yours feel like you.</i></h2>
                  <button type="button" onClick={() => setTab('content')} className="mt-6 inline-flex min-h-10 items-center gap-2 rounded-full border border-white/40 px-4 text-[10px] font-bold tracking-[.1em] hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white">
                    EDIT SITE CONTENT <ArrowUpRight size={14} />
                  </button>
                  <span className="absolute bottom-6 right-7 hidden text-[#f1cda9]/60 sm:block"><Sparkles size={34} strokeWidth={1} /></span>
                </div>
                <div className={`${cardClass} flex flex-col justify-between p-5 sm:p-6`}>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-[.15em] text-[#86776c]">New inquiries</span>
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#f5e9dc] text-[#a54e5b]"><Inbox size={16} /></span>
                  </div>
                  {inquiriesQuery.isLoading ? (
                    <div className="mt-4 h-10 w-16 animate-pulse rounded bg-[#eee5d9]" />
                  ) : inquiriesQuery.isError ? (
                    <p className="mt-4 text-xs leading-5 text-[#945b5c]">Inbox unavailable</p>
                  ) : (
                    <p className="mt-3 font-serif text-5xl tracking-[-.05em]">{counts.new}</p>
                  )}
                  <button type="button" onClick={() => setTab('inquiries')} className="mt-4 inline-flex min-h-9 items-center gap-2 text-[11px] font-semibold text-[#a54e5b] hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#a54e5b]">
                    Open inbox <ArrowUpRight size={13} />
                  </button>
                </div>
              </section>

              <div className="grid gap-6 xl:grid-cols-[1fr_.85fr]">
                <section className={`${cardClass} p-5 sm:p-6`}>
                  <PanelHeading eyebrow="Workspace" title="A few useful things" note="Changes are saved to the live public site only after you choose Save changes." />
                  <div className="divide-y divide-[#eee5d9]">
                    {[
                      { icon: Settings2, title: 'Keep your story current', copy: 'Refresh the home page copy, services, and contact details.', action: 'Edit content', target: 'content' as const },
                      { icon: FileImage, title: 'Add a new event moment', copy: 'Upload an image, then place it in your hero or gallery draft.', action: 'Manage images', target: 'content' as const },
                      { icon: MessageSquareText, title: 'Follow up with a guest', copy: 'Review event details and move the enquiry to its next status.', action: 'View inquiries', target: 'inquiries' as const },
                    ].map(({ icon: Icon, title, copy, action, target }) => (
                      <div key={title} className="flex flex-col gap-3 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-center">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#f6eee3] text-[#a54e5b]"><Icon size={16} /></span>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold">{title}</p>
                          <p className="mt-1 text-xs leading-5 text-[#87796f]">{copy}</p>
                        </div>
                        <button type="button" onClick={() => setTab(target)} className="inline-flex min-h-9 items-center gap-1.5 self-start text-[11px] font-semibold text-[#a54e5b] hover:underline sm:self-center">
                          {action}<ArrowUpRight size={13} />
                        </button>
                      </div>
                    ))}
                  </div>
                </section>
                <section className={`${cardClass} p-5 sm:p-6`}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-[.18em] text-[#a54e5b]">Latest conversations</p>
                      <h2 className="mt-2 font-serif text-2xl">Inbox, at a glance</h2>
                    </div>
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#f5e9dc] text-[#a54e5b]"><Clock3 size={16} /></span>
                  </div>
                  {inquiriesQuery.isLoading ? (
                    <div className="mt-6 space-y-3"><div className="h-12 animate-pulse rounded-lg bg-[#f1eae0]" /><div className="h-12 animate-pulse rounded-lg bg-[#f1eae0]" /></div>
                  ) : inquiriesQuery.isError ? (
                    <div className="mt-5"><QueryError title="Inquiries could not be loaded" error={inquiriesQuery.error} onRetry={() => void inquiriesQuery.refetch()} /></div>
                  ) : inquiries.length === 0 ? (
                    <div className="mt-6 rounded-xl border border-dashed border-[#ded2c2] bg-[#fcf9f3] px-4 py-7 text-center">
                      <Inbox className="mx-auto text-[#b29e8c]" size={22} />
                      <p className="mt-3 text-sm font-semibold">The inbox is quiet for now.</p>
                      <p className="mt-1 text-xs text-[#897b70]">New event inquiries will appear here.</p>
                    </div>
                  ) : (
                    <div className="mt-4 divide-y divide-[#eee5d9]">
                      {inquiries.slice(0, 3).map((inquiry) => (
                        <button type="button" key={inquiry.id} onClick={() => { setSelectedInquiryId(inquiry.id); setTab('inquiries'); }} className="flex min-h-16 w-full items-center gap-3 py-3 text-left hover:bg-[#fcf7ef] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#a54e5b]">
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#f0e5d8] font-serif text-sm text-[#8f5057]">{inquiry.name.slice(0, 1).toUpperCase()}</span>
                          <span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold">{inquiry.name}</span><span className="mt-0.5 block truncate text-xs text-[#887a70]">{inquiry.eventType}</span></span>
                          <span className={`rounded-full border px-2 py-1 text-[9px] font-semibold ${statusTone(inquiry.status)}`}>{statusLabel[inquiry.status]}</span>
                        </button>
                      ))}
                    </div>
                  )}
                  {inquiries.length > 0 && <button type="button" onClick={() => setTab('inquiries')} className="mt-4 inline-flex min-h-9 items-center gap-2 text-[11px] font-semibold text-[#a54e5b] hover:underline">Go to inbox <ArrowUpRight size={13} /></button>}
                </section>
              </div>
            </div>
          )}

          {tab === 'content' && (
            <div className="space-y-6">
              {contentQuery.isLoading && <LoadingPanel label="Loading website content" />}
              {contentQuery.isError && <QueryError title="Website content is unavailable" error={contentQuery.error} onRetry={() => void contentQuery.refetch()} />}
              {saveContent.isError && <QueryError title="Changes could not be saved" error={saveContent.error} onRetry={() => void saveDraft()} />}
              {saveMessage && <div className="flex items-center gap-2 rounded-xl border border-[#cad2b9] bg-[#f2f4eb] px-4 py-3 text-sm text-[#626f50]" role="status"><CheckCircle2 size={17} />{saveMessage}</div>}

              {draft && !contentQuery.isError && (
                <>
                  <section className={`${cardClass} p-5 sm:p-7`}>
                    <PanelHeading eyebrow="01 / The first impression" title="Hero & approach" note="The opening copy sets the feeling visitors carry through the site." />
                    <div className="grid gap-8 lg:grid-cols-2">
                      <div className="space-y-4">
                        <Field label="Hero heading" value={draft.heroTitle} onChange={(value) => changeField('heroTitle', value)} maxLength={90} />
                        <Field label="Accent line" value={draft.heroAccent} onChange={(value) => changeField('heroAccent', value)} maxLength={90} />
                        <Field label="Hero body" value={draft.heroBody} onChange={(value) => changeField('heroBody', value)} multiline maxLength={600} rows={4} />
                        <Field label="Approach heading" value={draft.approachTitle} onChange={(value) => changeField('approachTitle', value)} maxLength={160} />
                        <Field label="Approach body" value={draft.approachBody} onChange={(value) => changeField('approachBody', value)} multiline maxLength={1000} rows={4} />
                      </div>
                      <div>
                        <span className={labelClass}>Hero image</span>
                        <div className="relative min-h-52 overflow-hidden rounded-xl border border-[#e2d6c8] bg-[#f4ede2]">
                          {draft.heroImagePath ? <img src={draft.heroImagePath} alt="Current hero artwork preview" className="absolute inset-0 h-full w-full object-cover" /> : (
                            <div className="absolute inset-0 flex flex-col items-center justify-center text-center text-[#8a7b6f]">
                              <FileImage size={24} strokeWidth={1.5} />
                              <p className="mt-3 text-xs">No hero image selected</p>
                            </div>
                          )}
                          {draft.heroImagePath && <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#2e2020]/75 to-transparent px-4 pb-3 pt-10 text-[10px] text-white">Current site image</div>}
                        </div>
                        <label className="mt-3 flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-[#cdbbae] bg-[#fdfaf5] px-4 text-xs font-semibold text-[#85515a] transition hover:border-[#a54e5b] hover:bg-[#faf1eb] focus-within:outline focus-within:outline-2 focus-within:outline-[#a54e5b]">
                          {uploadBusy ? <LoaderCircle size={15} className="animate-spin" /> : <Upload size={15} />}
                          {uploadBusy ? 'Uploading image…' : 'Upload a hero image'}
                          <input
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            className="sr-only"
                            disabled={uploadBusy}
                            onChange={(event) => {
                              const file = event.target.files?.[0];
                              if (file) void uploadFile(file);
                              event.currentTarget.value = '';
                            }}
                          />
                        </label>
                        <p className="mt-2 text-[10px] text-[#918176]">JPEG, PNG, or WebP · maximum 10 MB</p>
                        {uploadError && <p className="mt-2 text-xs text-[#a54e5b]" role="alert">{uploadError}</p>}
                        {uploadSuccess && <p className="mt-2 text-xs text-[#65724f]" role="status">{uploadSuccess}</p>}
                        {uploadImages.length > 0 && (
                          <div className="mt-4 space-y-2">
                            <p className="text-[10px] font-bold uppercase tracking-[.12em] text-[#817267]">Recent uploads — add to draft</p>
                            {uploadImages.map((image, index) => (
                              <div key={`${image.name}-${index}`} className="flex items-center gap-3 rounded-xl border border-[#e8dfd4] bg-[#fdfaf5] p-2.5">
                                {image.state === 'ready' ? <img src={image.imagePath} alt="" className="h-12 w-16 rounded-lg object-cover" /> : <span className="flex h-12 w-16 items-center justify-center rounded-lg bg-[#f6e9e5] text-[#a54e5b]"><AlertCircle size={16} /></span>}
                                <span className="min-w-0 flex-1 truncate text-xs">{image.name}</span>
                                {image.state === 'ready' ? (
                                  <div className="flex flex-wrap justify-end gap-1.5">
                                    <button type="button" onClick={() => changeField('heroImagePath', image.imagePath)} className="min-h-8 rounded-lg border border-[#dfd1c2] px-2 text-[10px] font-semibold hover:border-[#a54e5b]">Use for hero</button>
                                    <button type="button" onClick={() => addGalleryItem(image.imagePath)} disabled={!draft || draft.gallery.length >= 24} className="min-h-8 rounded-lg border border-[#dfd1c2] px-2 text-[10px] font-semibold hover:border-[#a54e5b] disabled:opacity-40">Add to gallery</button>
                                  </div>
                                ) : <span className="text-[10px] text-[#a54e5b]">{image.message}</span>}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </section>

                  <section className={`${cardClass} p-5 sm:p-7`}>
                    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                      <PanelHeading eyebrow="02 / What you offer" title="Services" note="Keep each service clear and distinct." />
                      <button type="button" onClick={addService} disabled={draft.services.length >= 12} className="inline-flex min-h-10 items-center justify-center gap-2 self-start rounded-full border border-[#d8c4b3] px-4 text-[11px] font-semibold text-[#8e4a52] hover:bg-[#faf1e9] disabled:cursor-not-allowed disabled:opacity-40 sm:self-auto"><Plus size={14} /> Add service</button>
                    </div>
                    <Field label="Services heading" value={draft.servicesHeading} onChange={(value) => changeField('servicesHeading', value)} maxLength={120} />
                    <div className="mt-5 space-y-3">
                      {draft.services.map((service, index) => (
                        <article key={service.id} className="rounded-xl border border-[#e8ded2] bg-[#fcfaf5] p-4">
                          <div className="mb-4 flex items-center justify-between">
                            <p className="font-serif text-lg"><span className="mr-2 text-sm italic text-[#b7836d]">{String(index + 1).padStart(2, '0')}</span> Service detail</p>
                            <button type="button" aria-label={`Remove service ${index + 1}`} onClick={() => updateDraft((current) => ({ ...current, services: current.services.filter((item) => item.id !== service.id) }))} className="flex h-9 w-9 items-center justify-center rounded-full text-[#997c75] hover:bg-[#f4e6e2] hover:text-[#a54e5b] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#a54e5b]"><X size={16} /></button>
                          </div>
                          <div className="grid gap-4 md:grid-cols-2">
                            <Field label="Title" value={service.title} onChange={(value) => updateDraft((current) => ({ ...current, services: current.services.map((item) => item.id === service.id ? { ...item, title: value } : item) }))} maxLength={120} />
                            <Field label="Short tag" value={service.tag} onChange={(value) => updateDraft((current) => ({ ...current, services: current.services.map((item) => item.id === service.id ? { ...item, tag: value } : item) }))} maxLength={120} />
                            <div className="md:col-span-2"><Field label="Description" value={service.body} onChange={(value) => updateDraft((current) => ({ ...current, services: current.services.map((item) => item.id === service.id ? { ...item, body: value } : item) }))} multiline maxLength={1200} rows={3} /></div>
                          </div>
                        </article>
                      ))}
                      {draft.services.length === 0 && <p className="rounded-xl border border-dashed border-[#ded2c2] p-5 text-center text-xs text-[#887a70]">No services yet. Add one to get started.</p>}
                      <p className="text-right text-[10px] text-[#928478]">{draft.services.length} / 12 entries</p>
                    </div>
                  </section>

                  <section className={`${cardClass} p-5 sm:p-7`}>
                    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                      <PanelHeading eyebrow="03 / A glimpse of the work" title="Event gallery" note="Give every image a useful description and a short caption." />
                      <button type="button" onClick={() => addGalleryItem()} disabled={draft.gallery.length >= 24} className="inline-flex min-h-10 items-center justify-center gap-2 self-start rounded-full border border-[#d8c4b3] px-4 text-[11px] font-semibold text-[#8e4a52] hover:bg-[#faf1e9] disabled:cursor-not-allowed disabled:opacity-40 sm:self-auto"><Plus size={14} /> Add image card</button>
                    </div>
                    <Field label="Gallery heading" value={draft.galleryHeading} onChange={(value) => changeField('galleryHeading', value)} maxLength={120} />
                    <div className="mt-5 grid gap-4 md:grid-cols-2">
                      {draft.gallery.map((item, index) => (
                        <article key={item.id} className="overflow-hidden rounded-xl border border-[#e8ded2] bg-[#fcfaf5]">
                          <div className="relative aspect-[16/8] bg-[#f1e9dd]">
                            {item.imagePath ? <img src={item.imagePath} alt={item.altText || 'Gallery image preview'} className="absolute inset-0 h-full w-full object-cover" /> : <div className="absolute inset-0 flex flex-col items-center justify-center text-[#a08f81]"><ImagePlus size={22} /><span className="mt-2 text-[10px]">Choose an uploaded image below</span></div>}
                            <button type="button" aria-label={`Remove gallery image ${index + 1}`} onClick={() => updateDraft((current) => ({ ...current, gallery: current.gallery.filter((entry) => entry.id !== item.id) }))} className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-[#3b2b2b]/75 text-white hover:bg-[#a54e5b] focus-visible:outline focus-visible:outline-2 focus-visible:outline-white"><X size={15} /></button>
                          </div>
                          <div className="space-y-3 p-4">
                            {uploadImages.some((image) => image.state === 'ready') && (
                              <label className="block">
                                <span className={labelClass}>Image</span>
                                <select className={inputClass} value={item.imagePath} onChange={(event) => updateDraft((current) => ({ ...current, gallery: current.gallery.map((entry) => entry.id === item.id ? { ...entry, imagePath: event.target.value } : entry) }))}>
                                  <option value="">Select an uploaded image</option>
                                  {uploadImages.filter((image) => image.state === 'ready').map((image, imageIndex) => <option key={`${image.imagePath}-${imageIndex}`} value={image.imagePath}>{image.name}</option>)}
                                </select>
                              </label>
                            )}
                            <Field label="Alt text" value={item.altText} onChange={(value) => updateDraft((current) => ({ ...current, gallery: current.gallery.map((entry) => entry.id === item.id ? { ...entry, altText: value } : entry) }))} maxLength={240} />
                            <Field label="Caption" value={item.caption} onChange={(value) => updateDraft((current) => ({ ...current, gallery: current.gallery.map((entry) => entry.id === item.id ? { ...entry, caption: value } : entry) }))} maxLength={240} />
                          </div>
                        </article>
                      ))}
                    </div>
                    {draft.gallery.length === 0 && <p className="mt-5 rounded-xl border border-dashed border-[#ded2c2] p-6 text-center text-xs text-[#887a70]">No gallery images added yet.</p>}
                    <p className="mt-3 text-right text-[10px] text-[#928478]">{draft.gallery.length} / 24 image cards</p>
                  </section>

                  <section className={`${cardClass} p-5 sm:p-7`}>
                    <PanelHeading eyebrow="04 / Stay in touch" title="Contact & service area" note="These details appear wherever a visitor is ready to reach you." />
                    <div className="grid gap-4 sm:grid-cols-2">
                      <Field label="Phone number" value={draft.contactPhone} onChange={(value) => changeField('contactPhone', value)} maxLength={24} type="tel" />
                      <Field label="Instagram handle" value={draft.instagramHandle} onChange={(value) => changeField('instagramHandle', value)} maxLength={64} />
                      <Field label="Instagram URL" value={draft.instagramUrl} onChange={(value) => changeField('instagramUrl', value)} maxLength={2048} type="url" />
                      <Field label="Service area" value={draft.serviceArea} onChange={(value) => changeField('serviceArea', value)} maxLength={160} />
                    </div>
                  </section>

                  <div className="sticky bottom-3 z-10 flex flex-col gap-3 rounded-2xl border border-[#e4d8ca] bg-[#faf7f0]/95 p-3 shadow-[0_10px_30px_rgba(60,40,30,.1)] backdrop-blur sm:flex-row sm:items-center sm:justify-between sm:px-5">
                    <p className="text-xs text-[#817267]">{draftDirty ? 'Your edits are not live yet.' : 'Your public site is up to date.'}</p>
                    <button type="button" onClick={saveDraft} disabled={!draftDirty || saveContent.isPending} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-[#a54e5b] px-6 text-[11px] font-bold tracking-[.08em] text-white hover:bg-[#8e3f4b] disabled:cursor-not-allowed disabled:opacity-45 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#a54e5b]">
                      {saveContent.isPending ? <LoaderCircle size={15} className="animate-spin" /> : <Check size={15} />}
                      {saveContent.isPending ? 'SAVING…' : 'SAVE ALL CONTENT'}
                    </button>
                  </div>
                </>
              )}
              {!contentQuery.isLoading && !contentQuery.isError && !draft && <LoadingPanel label="Preparing content editor" />}
            </div>
          )}

          {tab === 'inquiries' && (
            <div className="space-y-5">
              {inquiriesQuery.isLoading && <LoadingPanel label="Loading inquiries" />}
              {inquiriesQuery.isError && <QueryError title="The inquiry inbox could not be loaded" error={inquiriesQuery.error} onRetry={() => void inquiriesQuery.refetch()} />}
              {inquiryMutationError && <div className="flex items-start gap-2 rounded-xl border border-[#d9a7a7] bg-[#fff8f4] px-4 py-3 text-sm text-[#8e4b4c]" role="alert"><AlertCircle size={17} className="mt-0.5 shrink-0" />{inquiryMutationError}</div>}
              {!inquiriesQuery.isLoading && !inquiriesQuery.isError && (
                <>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    {([
                      ['all', 'All inquiries'],
                      ['new', 'New'],
                      ['in_progress', 'In progress'],
                      ['closed', 'Closed'],
                    ] as [InquiryFilter, string][]).map(([key, label]) => (
                      <button type="button" key={key} onClick={() => setFilter(key)} className={`rounded-xl border p-4 text-left transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#a54e5b] ${filter === key ? 'border-[#a54e5b]/50 bg-[#fbf0e9]' : 'border-[#e5dbce] bg-[#fffdf8] hover:border-[#d4b8aa]'}`}>
                        <span className="block text-[10px] font-semibold uppercase tracking-[.12em] text-[#88796e]">{label}</span>
                        <span className="mt-2 block font-serif text-3xl">{counts[key]}</span>
                      </button>
                    ))}
                  </div>
                  {inquiries.length === 0 ? (
                    <div className={`${cardClass} px-6 py-14 text-center`}>
                      <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#f5e9dc] text-[#a54e5b]"><Inbox size={22} /></span>
                      <h2 className="mt-5 font-serif text-2xl">No inquiries just yet</h2>
                      <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-[#88796e]">When someone reaches out through your website, their event details will appear here.</p>
                    </div>
                  ) : (
                    <section className={`${cardClass} overflow-hidden`}>
                      <div className="flex flex-col gap-3 border-b border-[#eee5d9] p-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
                        <div>
                          <p className="font-serif text-xl">Event conversations</p>
                          <p className="mt-1 text-[11px] text-[#8a7b70]">{filteredInquiries.length} shown · {inquiries.length} total</p>
                        </div>
                        <label className="relative block w-full sm:max-w-[280px]">
                          <span className="sr-only">Search inquiries</span>
                          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#97887b]" />
                          <input className={`${inputClass} pl-9`} placeholder="Name, event, phone…" value={search} onChange={(event) => setSearch(event.target.value)} />
                        </label>
                      </div>
                      {filteredInquiries.length === 0 ? (
                        <div className="px-5 py-12 text-center">
                          <Search className="mx-auto text-[#b09d8c]" size={21} />
                          <p className="mt-3 text-sm font-semibold">No matching conversations</p>
                          <button type="button" onClick={() => { setSearch(''); setFilter('all'); }} className="mt-2 text-xs font-semibold text-[#a54e5b] hover:underline">Clear search and filters</button>
                        </div>
                      ) : (
                        <div className="grid min-h-[480px] lg:grid-cols-[minmax(260px,.78fr)_minmax(0,1.22fr)]">
                          <div className={`divide-y divide-[#eee5d9] lg:border-r lg:border-[#eee5d9] ${selectedInquiry ? 'hidden lg:block' : 'block'}`}>
                            {filteredInquiries.map((inquiry) => (
                              <button type="button" key={inquiry.id} onClick={() => setSelectedInquiryId(inquiry.id)} className={`flex min-h-[86px] w-full items-start gap-3 px-4 py-4 text-left transition hover:bg-[#fcf7ef] focus-visible:outline focus-visible:outline-2 focus-visible:outline-inset focus-visible:outline-[#a54e5b] ${selectedInquiryId === inquiry.id ? 'bg-[#fbf2e8]' : ''}`}>
                                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#f0e5d8] font-serif text-lg text-[#8f5057]">{inquiry.name.slice(0, 1).toUpperCase()}</span>
                                <span className="min-w-0 flex-1">
                                  <span className="flex items-center justify-between gap-2"><span className="truncate text-sm font-semibold">{inquiry.name}</span><span className={`shrink-0 rounded-full border px-2 py-0.5 text-[9px] font-semibold ${statusTone(inquiry.status)}`}>{statusLabel[inquiry.status]}</span></span>
                                  <span className="mt-1 block truncate text-xs text-[#88796e]">{inquiry.eventType}{inquiry.eventDate ? ` · ${inquiry.eventDate}` : ''}</span>
                                  <span className="mt-1 block text-[10px] text-[#a09185]">{new Date(inquiry.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                                </span>
                              </button>
                            ))}
                          </div>
                          <div className={`${selectedInquiry ? 'block' : 'hidden lg:block'} min-w-0 p-5 sm:p-7`}>
                            {selectedInquiry ? (
                              <>
                                <button type="button" onClick={() => setSelectedInquiryId(null)} className="mb-5 inline-flex min-h-9 items-center gap-2 text-xs font-semibold text-[#a54e5b] hover:underline lg:hidden"><ArrowDownLeft size={14} /> Back to conversations</button>
                                <div className="flex flex-wrap items-start justify-between gap-3">
                                  <div>
                                    <p className="text-[10px] font-bold uppercase tracking-[.17em] text-[#a54e5b]">Enquiry details</p>
                                    <h2 className="mt-2 font-serif text-3xl">{selectedInquiry.name}</h2>
                                    <p className="mt-1 text-xs text-[#897a70]">Received {new Date(selectedInquiry.createdAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}</p>
                                  </div>
                                  <span className={`rounded-full border px-3 py-1.5 text-[10px] font-semibold ${statusTone(selectedInquiry.status)}`}>{statusLabel[selectedInquiry.status]}</span>
                                </div>
                                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                                  <div className="rounded-xl bg-[#faf6ee] p-4">
                                    <p className="text-[9px] font-bold uppercase tracking-[.15em] text-[#978679]">Occasion</p>
                                    <p className="mt-2 text-sm font-semibold">{selectedInquiry.eventType || 'Not specified'}</p>
                                    {selectedInquiry.eventDate && <p className="mt-1 text-xs text-[#817268]">{selectedInquiry.eventDate}</p>}
                                  </div>
                                  <div className="rounded-xl bg-[#faf6ee] p-4">
                                    <p className="text-[9px] font-bold uppercase tracking-[.15em] text-[#978679]">Location</p>
                                    <p className="mt-2 flex items-start gap-2 text-sm font-semibold"><MapPin size={14} className="mt-0.5 shrink-0 text-[#a54e5b]" />{selectedInquiry.location || 'Not specified'}</p>
                                  </div>
                                </div>
                                <div className="mt-4 space-y-2">
                                  {selectedInquiry.phone && <a href={`tel:${selectedInquiry.phone.replace(/[^\d+]/g, '')}`} className="flex min-h-11 items-center gap-3 rounded-xl border border-[#e8dfd4] px-3.5 text-sm hover:border-[#a54e5b] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#a54e5b]"><Phone size={15} className="text-[#a54e5b]" />{selectedInquiry.phone}<ArrowUpRight size={13} className="ml-auto text-[#a54e5b]" /></a>}
                                  {selectedInquiry.email && <a href={`mailto:${selectedInquiry.email}`} className="flex min-h-11 items-center gap-3 rounded-xl border border-[#e8dfd4] px-3.5 text-sm hover:border-[#a54e5b] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#a54e5b]"><Mail size={15} className="text-[#a54e5b]" /><span className="min-w-0 truncate">{selectedInquiry.email}</span><ArrowUpRight size={13} className="ml-auto shrink-0 text-[#a54e5b]" /></a>}
                                </div>
                                <div className="mt-5">
                                  <p className="text-[10px] font-bold uppercase tracking-[.15em] text-[#897a70]">Their note</p>
                                  <p className="mt-2 whitespace-pre-wrap rounded-xl border border-[#ece3d8] bg-[#fdfbf7] p-4 text-sm leading-7 text-[#594b43]">{selectedInquiry.message || 'No message included.'}</p>
                                </div>
                                <div className="mt-6 border-t border-[#eee5d9] pt-5">
                                  <label className="block">
                                    <span className={labelClass}>Update status</span>
                                    <span className="relative block">
                                      <select value={selectedInquiry.status} disabled={updateInquiry.isPending} onChange={(event) => void updateStatus(selectedInquiry, event.target.value as InquiryStatus)} className={`${inputClass} appearance-none pr-10`}>
                                        <option value="new">New</option>
                                        <option value="in_progress">In progress</option>
                                        <option value="closed">Closed</option>
                                      </select>
                                      <ChevronDown size={15} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#88796e]" />
                                    </span>
                                  </label>
                                  {updateInquiry.isPending && <p className="mt-2 inline-flex items-center gap-2 text-[11px] text-[#8c6c59]"><LoaderCircle size={13} className="animate-spin" />Updating enquiry…</p>}
                                </div>
                              </>
                            ) : (
                              <div className="flex h-full min-h-72 flex-col items-center justify-center text-center">
                                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#f5e9dc] text-[#a54e5b]"><Inbox size={19} /></span>
                                <p className="mt-4 font-serif text-xl">Select a conversation</p>
                                <p className="mt-1 max-w-xs text-xs leading-5 text-[#88796e]">Event details and contact options will appear here.</p>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </section>
                  )}
                </>
              )}
            </div>
          )}

          <footer className="mt-10 flex flex-col gap-2 border-t border-[#e4d9cb] pt-5 text-[10px] text-[#95867a] sm:flex-row sm:items-center sm:justify-between">
            <span className="font-semibold uppercase tracking-[.13em]">BlessTivals · Events that feel like you</span>
            <span className="inline-flex items-center gap-1.5"><Instagram size={12} /> A thoughtful workspace for your public site</span>
          </footer>
        </main>
      </div>
    </div>
  );
}

export default AdminPage;
