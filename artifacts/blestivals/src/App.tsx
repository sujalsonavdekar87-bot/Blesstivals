import { useEffect, type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import { Link, Route, Switch, useLocation, Router as WouterRouter } from 'wouter';
import { ArrowDown, ArrowRight, ArrowUpRight, Menu, X, Instagram, Phone, Sparkles } from 'lucide-react';
import { useState } from 'react';

const queryClient = new QueryClient();
const phone = '9324519563';
const phoneHref = 'tel:+919324519563';
const instagramHref = 'https://www.instagram.com/blesstivals';
const reelPoster = '/media/supplied-event-poster.jpg';

type PageMetaProps = { title: string; description: string; ogTitle?: string; ogDescription?: string };

function PageMeta({ title, description, ogTitle = title, ogDescription = description }: PageMetaProps) {
  useEffect(() => {
    document.title = title;
    const setMeta = (selector: string, attribute: string, value: string) => {
      let element = document.querySelector<HTMLMetaElement>(selector);
      if (!element) {
        element = document.createElement('meta');
        document.head.appendChild(element);
      }
      element.setAttribute(attribute, value);
    };
    setMeta('meta[name="description"]', 'content', description);
    setMeta('meta[property="og:title"]', 'content', ogTitle);
    setMeta('meta[property="og:description"]', 'content', ogDescription);
    setMeta('meta[property="og:type"]', 'content', 'website');
    setMeta('meta[name="twitter:card"]', 'content', 'summary_large_image');
    setMeta('meta[name="twitter:title"]', 'content', title);
    setMeta('meta[name="twitter:description"]', 'content', description);
  }, [title, description, ogTitle, ogDescription]);
  return null;
}

function Mark() {
  return (
    <Link href="/" className="inline-flex items-center gap-3" aria-label="BlessTivals home">
      <span className="relative flex h-10 w-10 items-center justify-center rounded-full border border-[#a54e5b]/35 text-[#a54e5b]">
        <span className="serif text-[25px] leading-none">B</span>
        <span className="absolute -right-1 -top-1 text-[#c88954]"><Sparkles size={12} strokeWidth={1.5} /></span>
      </span>
      <span className="leading-tight">
        <span className="serif block text-[21px] tracking-[-.04em]">BlessTivals</span>
        <span className="eyebrow block text-[7px] tracking-[.24em] text-[#806e61]">Event styling & planning</span>
      </span>
    </Link>
  );
}

function Header() {
  const [location] = useLocation();
  const [open, setOpen] = useState(false);
  const nav = [
    { label: 'Home', href: '/' },
    { label: 'Services', href: '/services' },
    { label: 'Work', href: '/work' },
    { label: 'Contact', href: '/contact' },
  ];
  return (
    <header className="relative z-40 border-b border-[#d9cfc0] bg-[#f7f3eb]">
      <div className="mx-auto flex h-[76px] max-w-[1440px] items-center justify-between px-5 md:px-10 lg:px-16">
        <Mark />
        <nav className="hidden items-center gap-9 md:flex" aria-label="Main navigation">
          {nav.map((item) => (
            <Link key={item.href} href={item.href} className={`text-[12px] tracking-[.08em] transition-colors hover:text-[#a54e5b] ${location === item.href ? 'text-[#a54e5b]' : 'text-[#443a34]'}`}>
              {item.label}
            </Link>
          ))}
        </nav>
        <a href={phoneHref} className="hidden items-center gap-2 rounded-full border border-[#a54e5b] px-5 py-3 text-[11px] font-semibold tracking-[.12em] text-[#a54e5b] transition-colors hover:bg-[#a54e5b] hover:text-[#fff9ef] md:inline-flex">
          <Phone size={13} />
          LET'S TALK
        </a>
        <button type="button" aria-label={open ? 'Close menu' : 'Open menu'} aria-expanded={open} onClick={() => setOpen(!open)} className="flex h-11 w-11 items-center justify-center rounded-full border border-[#d9cfc0] text-[#493c35] md:hidden">
          {open ? <X size={19} /> : <Menu size={19} />}
        </button>
      </div>
      {open && (
        <nav className="absolute left-0 right-0 top-full border-b border-[#d9cfc0] bg-[#f7f3eb] px-6 pb-7 pt-2 shadow-lg md:hidden" aria-label="Mobile navigation">
          {nav.map((item) => (
            <Link key={item.href} href={item.href} onClick={() => setOpen(false)} className="flex items-center justify-between border-b border-[#e4dbcf] py-4 text-[14px]">
              {item.label}<ArrowUpRight size={15} className="text-[#a54e5b]" />
            </Link>
          ))}
          <a href={phoneHref} className="mt-5 flex items-center gap-2 text-sm font-semibold text-[#a54e5b]"><Phone size={15} /> Call {phone}</a>
        </nav>
      )}
    </header>
  );
}

function Footer() {
  return (
    <footer className="bg-[#3b2b2b] text-[#f6ede0]">
      <div className="mx-auto grid max-w-[1440px] gap-12 px-6 py-16 md:grid-cols-[1.4fr_.8fr_.8fr] md:px-12 lg:px-16 lg:py-20">
        <div>
          <p className="serif text-[35px] leading-tight">A little wonder.<br /><i>A lot of heart.</i></p>
          <p className="mt-5 max-w-sm text-[13px] leading-6 text-[#cbbcb0]">Thoughtful event planning and styling for the moments you want to remember.</p>
        </div>
        <div>
          <p className="eyebrow text-[#d9aa77]">Explore</p>
          <div className="mt-5 flex flex-col gap-3 text-[13px] text-[#f1e5d7]">
            <Link href="/services" className="hover:text-[#e6b174]">Services</Link>
            <Link href="/work" className="hover:text-[#e6b174]">Work</Link>
            <Link href="/contact" className="hover:text-[#e6b174]">Contact</Link>
          </div>
        </div>
        <div>
          <p className="eyebrow text-[#d9aa77]">Start a conversation</p>
          <a href={phoneHref} className="mt-5 block text-[16px] hover:text-[#e6b174]">{phone}</a>
          <a href={instagramHref} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-2 text-[13px] text-[#d7c7ba] hover:text-[#e6b174]"><Instagram size={15} /> @blesstivals <ArrowUpRight size={12} /></a>
          <p className="mt-5 text-[11px] leading-5 text-[#b5a399]">Mumbai, Navi Mumbai & nearby areas</p>
        </div>
      </div>
      <div className="mx-auto flex max-w-[1440px] flex-col gap-2 border-t border-white/15 px-6 py-5 text-[10px] tracking-[.08em] text-[#b5a399] md:flex-row md:items-center md:justify-between md:px-12 lg:px-16">
        <span>BLESTIVALS · EVENTS THAT FEEL LIKE YOU</span>
        <span>© {new Date().getFullYear()} BlessTivals</span>
      </div>
    </footer>
  );
}

function Shell({ children }: { children: ReactNode }) {
  return <><Header /><main>{children}</main><Footer /></>;
}

function ContactStrip({ dark = false }: { dark?: boolean }) {
  return (
    <section className={`px-6 py-16 md:px-12 md:py-20 ${dark ? 'bg-[#3b2b2b] text-[#f7f0e7]' : 'bg-[#e9dfd0] text-[#342a26]'}`}>
      <div className="mx-auto flex max-w-[1220px] flex-col items-start justify-between gap-8 md:flex-row md:items-end">
        <div>
          <p className="eyebrow mb-4 text-[#a54e5b]">Your moment starts here</p>
          <h2 className="serif max-w-[650px] text-[clamp(2.4rem,5.5vw,4.7rem)] leading-[1.03]">Tell us what you’re<br className="hidden md:block" /> dreaming up.</h2>
        </div>
        <div className="flex flex-wrap gap-3">
          <a href={phoneHref} className="inline-flex items-center gap-3 rounded-full bg-[#a54e5b] px-6 py-4 text-[12px] font-semibold tracking-[.08em] text-white transition-transform hover:-translate-y-1"><Phone size={15} /> CALL {phone} <ArrowUpRight size={14} /></a>
          <a href={instagramHref} target="_blank" rel="noreferrer" className={`inline-flex items-center gap-3 rounded-full border px-6 py-4 text-[12px] font-semibold tracking-[.08em] transition-colors hover:bg-white/10 ${dark ? 'border-white/40' : 'border-[#86776b]'}`}><Instagram size={15} /> INSTAGRAM <ArrowUpRight size={14} /></a>
        </div>
      </div>
    </section>
  );
}

function Home() {
  return (
    <div className="page-in">
      <PageMeta title="BlessTivals | Events, with feeling" description="Event planning and styling in Mumbai, Navi Mumbai and nearby areas. Weddings, corporate gatherings, private celebrations and more." />
      <section className="relative overflow-hidden bg-[#f7f3eb]">
        <div className="mx-auto grid min-h-[680px] max-w-[1440px] md:min-h-[720px] md:grid-cols-[.92fr_1.08fr]">
          <div className="relative z-10 flex flex-col justify-center px-6 pb-12 pt-16 md:px-12 md:py-20 lg:pl-20 lg:pr-8">
            <div className="eyebrow mb-7 flex items-center gap-3 text-[#a54e5b]"><span className="h-px w-9 bg-[#a54e5b]" /> MOMENTS, MADE MEANINGFUL</div>
            <h1 className="serif max-w-[650px] text-[clamp(3.5rem,7.3vw,7rem)] leading-[.96] tracking-[-.055em] text-[#342a26]">Gather<br />beautifully.<br /><i className="text-[#a54e5b]">Feel it all.</i></h1>
            <p className="mt-7 max-w-[430px] text-[15px] leading-7 text-[#71635b]">From the first idea to the final little detail, we bring your people together around an occasion that feels unmistakably yours.</p>
            <div className="mt-9 flex flex-wrap items-center gap-5">
              <Link href="/services" className="inline-flex items-center gap-3 rounded-full bg-[#a54e5b] px-6 py-4 text-[11px] font-bold tracking-[.12em] text-white transition-all hover:-translate-y-1 hover:bg-[#8e3f4b]">EXPLORE WHAT WE DO <ArrowRight size={15} /></Link>
              <span className="text-[11px] tracking-[.04em] text-[#796d63]">Mumbai · Navi Mumbai · nearby</span>
            </div>
            <div className="mt-14 flex items-center gap-4">
              <span className="flex h-10 w-10 items-center justify-center rounded-full border border-[#d8c8b9] text-[#a54e5b]"><ArrowDown size={15} /></span>
              <span className="eyebrow text-[9px] text-[#796d63]">SCROLL TO FEEL THE DIFFERENCE</span>
            </div>
          </div>
          <div className="grain relative min-h-[400px] overflow-hidden md:min-h-full">
            <img src="/media/celebration-editorial.jpg" alt="Atmospheric event styling with candlelit tables, soft draping and flowers" className="absolute inset-0 h-full w-full object-cover object-center" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#241819]/45 via-transparent to-[#342a26]/5" />
            <div className="absolute bottom-7 left-6 right-6 flex items-end justify-between text-white md:bottom-10 md:left-10 md:right-10">
              <p className="serif max-w-[260px] text-[25px] leading-tight">The feeling is<br /><i>in the details.</i></p>
              <span className="eyebrow text-[8px] text-white/80">A WORLD OF YOUR OWN</span>
            </div>
            <div className="absolute right-5 top-7 rounded-full border border-white/60 px-4 py-2 text-[9px] tracking-[.16em] text-white md:right-9 md:top-9">EVENTS, WITH FEELING</div>
          </div>
        </div>
      </section>

      <section className="bg-[#e9dfd0] px-6 py-20 md:px-12 md:py-28">
        <div className="mx-auto grid max-w-[1220px] gap-12 md:grid-cols-[.8fr_1.2fr] md:gap-24">
          <div><p className="eyebrow text-[#a54e5b]">The BlessTivals point of view</p><p className="serif mt-5 text-[clamp(2.4rem,4.3vw,4.2rem)] leading-[1.05]">Less “just an event.”<br /><i>More your kind of magic.</i></p></div>
          <div className="self-end"><p className="text-[16px] leading-8 text-[#655950]">We believe the best celebrations don’t feel assembled. They feel considered, generous and full of life. We shape the moving parts around what matters to you—so you can be present for the good part.</p><Link href="/work" className="underline-link mt-8 inline-flex items-center gap-3 text-[12px] font-semibold tracking-[.1em] text-[#a54e5b]">GET TO KNOW OUR APPROACH <ArrowRight size={14} /></Link></div>
        </div>
      </section>

      <section className="bg-[#f7f3eb] px-6 py-20 md:px-12 md:py-28">
        <div className="mx-auto max-w-[1220px]">
          <div className="mb-12 flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <div><p className="eyebrow text-[#a54e5b]">Occasions, considered</p><h2 className="serif mt-4 text-[clamp(2.8rem,5vw,5rem)] leading-none">A reason to gather.</h2></div>
            <p className="max-w-[360px] text-[14px] leading-6 text-[#75675e]">Different occasions call for different energy. We start by listening, then bring the right details into focus.</p>
          </div>
          <div className="grid border-t border-[#d8cfc3] md:grid-cols-2">
            {[
              ['01', 'Weddings & celebrations', 'A thoughtful setting for the traditions, people and moments that make the day yours.'],
              ['02', 'Corporate gatherings', 'Brand moments, team occasions and functions shaped with purpose and polish.'],
              ['03', 'Private celebrations', 'Birthdays, anniversaries and intimate milestones, made warm and wonderfully personal.'],
              ['04', 'Shows & experiences', 'Concerts, exhibitions and public-facing occasions with a clear point of view.'],
            ].map(([no, title, body]) => (
              <Link key={no} href="/services" className="group flex min-h-[190px] items-start gap-6 border-b border-[#d8cfc3] py-8 md:min-h-[210px] md:pr-10">
                <span className="serif pt-1 text-[18px] italic text-[#b7836d]">{no}</span>
                <span className="flex-1"><span className="serif block text-[27px] transition-colors group-hover:text-[#a54e5b]">{title}</span><span className="mt-3 block max-w-[390px] text-[13px] leading-6 text-[#796d63]">{body}</span></span>
                <ArrowUpRight size={19} className="mt-2 shrink-0 text-[#a54e5b] transition-transform group-hover:-translate-y-1 group-hover:translate-x-1" />
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="overflow-hidden bg-[#a54e5b] text-[#fff7ed]">
        <div className="mx-auto grid max-w-[1440px] md:grid-cols-[.8fr_1.2fr]">
          <div className="flex flex-col justify-center px-6 py-16 md:px-12 lg:px-20">
            <p className="eyebrow text-[#f3c99f]">A glimpse, not a catalogue</p>
            <h2 className="serif mt-5 text-[clamp(2.5rem,5vw,4.5rem)] leading-[1.02]">A moment in<br /><i>the making.</i></h2>
            <p className="mt-5 max-w-[390px] text-[14px] leading-7 text-white/80">A supplied reel of event atmosphere—shared as a glimpse of the energy and detail that bring a gathering to life.</p>
            <Link href="/work" className="mt-8 inline-flex items-center gap-3 text-[11px] font-bold tracking-[.12em]">SEE HOW WE THINK <ArrowRight size={15} /></Link>
          </div>
          <div className="flex min-h-[430px] items-center justify-center bg-[#2d2021] px-6 py-10 md:min-h-[620px]">
            <div className="relative aspect-[9/16] w-full max-w-[315px] overflow-hidden bg-[#241b1c] shadow-2xl">
              <video className="absolute inset-0 h-full w-full object-contain" controls playsInline preload="none" poster={reelPoster} aria-label="Supplied event reel showing event styling details">
                <source src="/media/supplied-event-reel.mp4" type="video/mp4" />
              </video>
              <span className="pointer-events-none absolute bottom-4 left-4 rounded-full bg-[#2d2222]/75 px-3 py-2 text-[9px] tracking-[.12em] text-white">SUPPLIED EVENT FOOTAGE</span>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#f7f3eb] px-6 py-20 md:px-12 md:py-28">
        <div className="mx-auto grid max-w-[1220px] gap-10 md:grid-cols-[1fr_.8fr] md:items-center">
          <div className="relative min-h-[340px] overflow-hidden md:min-h-[470px]">
            <img src={reelPoster} alt="Details from supplied event footage: floral styling and celebratory table details" className="absolute inset-0 h-full w-full object-cover object-center" />
            <div className="absolute inset-0 bg-[#3b2b2b]/10" />
            <span className="absolute bottom-4 left-4 bg-[#f7f3eb]/90 px-3 py-2 text-[9px] tracking-[.13em] text-[#493c35]">A SUPPLIED EVENT DETAIL</span>
          </div>
          <div className="md:pl-10"><p className="eyebrow text-[#a54e5b]">A good plan feels effortless</p><h2 className="serif mt-5 text-[clamp(2.7rem,5vw,4.5rem)] leading-[1.02]">Care in the<br /><i>right places.</i></h2><p className="mt-6 text-[15px] leading-7 text-[#74665e]">A clear conversation. A thoughtful plan. An atmosphere that makes people feel welcome. We take care of the details with you, keeping the bigger feeling in sight all the way through.</p><Link href="/services" className="underline-link mt-8 inline-flex items-center gap-3 text-[12px] font-semibold tracking-[.1em] text-[#a54e5b]">DISCOVER OUR SERVICES <ArrowRight size={14} /></Link></div>
        </div>
      </section>
      <ContactStrip />
    </div>
  );
}

function PageIntro({ kicker, title, text }: { kicker: string; title: ReactNode; text: string }) {
  return <section className="bg-[#e9dfd0] px-6 pb-16 pt-16 md:px-12 md:pb-20 md:pt-24"><div className="mx-auto max-w-[1220px]"><p className="eyebrow text-[#a54e5b]">{kicker}</p><h1 className="serif mt-5 max-w-[900px] text-[clamp(3.2rem,7vw,6.7rem)] leading-[.98] tracking-[-.05em]">{title}</h1><p className="mt-7 max-w-[660px] text-[15px] leading-7 text-[#71635b]">{text}</p></div></section>;
}

function Services() {
  const offerings = [
    { num: '01', title: 'Weddings & milestone celebrations', tag: 'PERSONAL · MEANINGFUL · FULL OF FEELING', body: 'Weddings and milestone celebrations bring people together around family, tradition, and a day with its own rhythm. Let the feeling you want to create lead the conversation.' },
    { num: '02', title: 'Corporate functions', tag: 'CLEAR PURPOSE · THOUGHTFUL PRESENCE', body: 'A corporate function can gather a team, introduce an idea, or bring people across a business together. Start with the purpose and the tone the occasion should carry.' },
    { num: '03', title: 'Private celebrations', tag: 'INTIMATE · PERSONAL · JOYFUL', body: 'A birthday, anniversary, or private celebration is a chance to spend time with the people who matter. Every gathering has its own reasons to come together.' },
    { num: '04', title: 'Shows, concerts & exhibitions', tag: 'ENERGETIC · DISTINCT · WELL ORCHESTRATED', body: 'Shows, concerts and exhibitions welcome audiences around a shared experience. Each has its own scale and energy, from the room itself to the moments people take away.' },
  ];
  return (
    <div className="page-in">
      <PageMeta title="Event Services in Mumbai | BlessTivals" description="Weddings, corporate functions, private celebrations, shows, concerts and exhibitions—planned and styled by BlessTivals in Mumbai and nearby." />
      <PageIntro kicker="What we bring to the table" title={<>One occasion.<br /><i>All the right details.</i></>} text="Our work spans different kinds of gatherings, but the starting point stays the same: understand what matters to you, then plan with care." />
      <section className="bg-[#f7f3eb] px-6 py-10 md:px-12 md:py-16">
        <div className="mx-auto max-w-[1220px]">
          {offerings.map((item) => (
            <article key={item.num} className="grid gap-7 border-b border-[#d8cfc3] py-10 md:grid-cols-[.35fr_1fr_1fr] md:gap-12 md:py-16">
              <div className="flex items-start justify-between md:block"><span className="serif text-[25px] italic text-[#b7836d]">{item.num}</span><span className="eyebrow text-right text-[8px] text-[#a54e5b] md:mt-5 md:block md:text-left">{item.tag}</span></div>
              <h2 className="serif max-w-[390px] text-[clamp(2rem,3.4vw,3.1rem)] leading-[1.05]">{item.title}</h2>
              <p className="text-[14px] leading-7 text-[#71635b]">{item.body}</p>
            </article>
          ))}
        </div>
      </section>
      <section className="bg-[#dfc9af] px-6 py-16 md:px-12 md:py-24"><div className="mx-auto grid max-w-[1220px] gap-8 md:grid-cols-[.8fr_1.2fr] md:items-end"><p className="eyebrow text-[#a54e5b]">Made around your occasion</p><p className="serif text-[clamp(2rem,4.4vw,4rem)] leading-[1.07]">A service is a starting point.<br /><i>The plan is always personal.</i></p></div><p className="mx-auto mt-7 max-w-[750px] text-[14px] leading-7 text-[#65584f] md:ml-[40%]">Scope, scale and support can be discussed directly. We’ll listen to the shape of your event and talk through what would make sense for it.</p></section>
      <ContactStrip dark />
    </div>
  );
}

function Work() {
  return (
    <div className="page-in">
      <PageMeta title="Work | BlessTivals" description="A supplied event reel, presented without invented client, venue, date or occasion details." />
      <PageIntro kicker="A supplied event reel" title={<>A moment in<br /><i>the making.</i></>} text="This short event reel offers a glimpse of décor and celebration details. It’s shared without client, venue or occasion details that weren’t provided." />
      <section className="bg-[#3b2b2b] px-6 py-16 text-[#f6ede0] md:px-12 md:py-24">
        <div className="mx-auto max-w-[1220px]">
          <div className="mb-8 flex flex-col justify-between gap-5 md:flex-row md:items-end"><div><p className="eyebrow text-[#e1b183]">In motion</p><h2 className="serif mt-4 text-[clamp(2.5rem,5vw,4.6rem)] leading-none">A supplied event reel.</h2></div><p className="max-w-[390px] text-[12px] leading-6 text-[#cbbcb0]">Shared as supplied event footage to offer a sense of event atmosphere and detail. No client, venue or occasion is being identified.</p></div>
          <div className="mx-auto w-full max-w-[394px] overflow-hidden bg-[#241b1c] shadow-2xl">
            <div className="relative aspect-[9/16]">
              <video className="absolute inset-0 h-full w-full object-contain" controls playsInline preload="metadata" poster={reelPoster} aria-label="Supplied event reel">
                <source src="/media/supplied-event-reel.mp4" type="video/mp4" />
              </video>
            </div>
          </div>
          <p className="mt-3 text-[9px] tracking-[.14em] text-[#b7a69b]">SUPPLIED EVENT FOOTAGE · SHOWN WITHOUT CLIENT OR EVENT ATTRIBUTION</p>
        </div>
      </section>
      <ContactStrip />
    </div>
  );
}

function Contact() {
  return (
    <div className="page-in">
      <PageMeta title="Contact BlessTivals | Start a conversation" description="Talk with BlessTivals about your wedding, corporate event, private celebration, show or exhibition. Call 9324519563 or connect on Instagram." />
      <PageIntro kicker="A good beginning" title={<>Tell us what<br /><i>you have in mind.</i></>} text="Have an occasion taking shape? Call or reach out on Instagram. We’d love to hear what you’re gathering for." />
      <section className="bg-[#f7f3eb] px-6 py-16 md:px-12 md:py-24">
        <div className="mx-auto grid max-w-[1220px] gap-12 md:grid-cols-[1fr_.8fr]">
          <div><p className="eyebrow text-[#a54e5b]">Direct, simple, human</p><h2 className="serif mt-5 text-[clamp(2.8rem,5vw,5rem)] leading-[1.02]">Let’s talk about<br /><i>your occasion.</i></h2><p className="mt-6 max-w-[470px] text-[14px] leading-7 text-[#71635b]">No form to fill out. Choose whichever way feels right, and share a little about the event, where you’re planning it and what you’d like help with.</p><p className="mt-8 text-[12px] text-[#766a60]">Serving Mumbai, Navi Mumbai and nearby areas.</p></div>
          <div className="space-y-4">
            <a href={phoneHref} className="group flex items-center justify-between border-y border-[#d8cfc3] py-7 transition-colors hover:border-[#a54e5b]"><span><span className="eyebrow block text-[#a54e5b]">Call us</span><span className="serif mt-2 block text-[32px] md:text-[40px]">{phone}</span><span className="mt-2 block text-[12px] text-[#796d63]">Tap to call BlessTivals</span></span><span className="flex h-12 w-12 items-center justify-center rounded-full border border-[#c6b8a9] transition-all group-hover:border-[#a54e5b] group-hover:bg-[#a54e5b] group-hover:text-white"><Phone size={17} /></span></a>
            <a href={instagramHref} target="_blank" rel="noreferrer" className="group flex items-center justify-between border-b border-[#d8cfc3] py-7 transition-colors hover:border-[#a54e5b]"><span><span className="eyebrow block text-[#a54e5b]">Find us on Instagram</span><span className="serif mt-2 block text-[32px] md:text-[40px]">@blesstivals</span><span className="mt-2 block text-[12px] text-[#796d63]">Open the BlessTivals Instagram profile</span></span><span className="flex h-12 w-12 items-center justify-center rounded-full border border-[#c6b8a9] transition-all group-hover:border-[#a54e5b] group-hover:bg-[#a54e5b] group-hover:text-white"><Instagram size={17} /></span></a>
          </div>
        </div>
      </section>
      <section className="bg-[#dfc9af] px-6 py-16 md:px-12 md:py-20"><div className="mx-auto grid max-w-[1220px] gap-6 md:grid-cols-3"><div><p className="eyebrow text-[#a54e5b]">01 · Tell us</p><p className="serif mt-3 text-[24px]">What are you gathering for?</p></div><div><p className="eyebrow text-[#a54e5b]">02 · Share</p><p className="serif mt-3 text-[24px]">What would you love help with?</p></div><div><p className="eyebrow text-[#a54e5b]">03 · Let’s shape</p><p className="serif mt-3 text-[24px]">We’ll talk through a good next step.</p></div></div></section>
      <ContactStrip dark />
    </div>
  );
}

function Router() {
  return (
    <RoutedErrorBoundary>
      <Shell>
        <Switch>
          <Route path="/" component={Home} />
          <Route path="/services" component={Services} />
          <Route path="/work" component={Work} />
          <Route path="/contact" component={Contact} />
          <Route component={NotFound} />
        </Switch>
      </Shell>
    </RoutedErrorBoundary>
  );
}

function RoutedErrorBoundary({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}>{children}</ErrorBoundary>;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
