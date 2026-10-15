import { SignIn, SignUp } from "@clerk/react";
import { shadcn } from "@clerk/themes";
import type { ReactNode } from "react";
import { Link } from "wouter";

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

export const clerkAppearance = {
  theme: shadcn,
  variables: {
    colorPrimary: "#a54e5b",
    colorForeground: "#342a26",
    colorMutedForeground: "#71635b",
    colorBackground: "#fbf8f2",
    colorInput: "#fffaf3",
    colorInputForeground: "#342a26",
    colorNeutral: "#d8cfc3",
    fontFamily: "'DM Sans', sans-serif",
    borderRadius: "0.9rem",
  },
  elements: {
    cardBox: "rounded-[1.5rem] border border-[#d8cfc3] shadow-none",
    headerTitle: "font-serif text-[#342a26]",
    headerSubtitle: "text-[#71635b]",
    formButtonPrimary:
      "bg-[#a54e5b] hover:bg-[#8e3f4b] text-white shadow-none",
    formFieldInput:
      "rounded-xl border-[#d8cfc3] bg-[#fffaf3] focus:border-[#a54e5b]",
    footerActionLink: "text-[#a54e5b] hover:text-[#8e3f4b]",
    socialButtonsBlockButton:
      "rounded-xl border-[#d8cfc3] bg-[#fffaf3] text-[#342a26]",
  },
};

function AuthShell({ children }: { children: ReactNode }) {
  return (
    <main className="relative flex min-h-[100dvh] flex-col items-center justify-center overflow-hidden bg-[#f7f3eb] px-5 py-16">
      <div className="pointer-events-none absolute -right-16 -top-28 h-80 w-80 rounded-full bg-[#a54e5b]/[.07] blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -left-16 h-96 w-96 rounded-full bg-[#d5a66d]/[.09] blur-3xl" />
      <div className="relative z-10 mb-8 text-center">
        <Link href="/" className="inline-flex items-center gap-3">
          <img src="/logo.png" alt="" width={48} height={48} className="h-12 w-12 shrink-0 rounded-full shadow-[0_0_0_1px_rgba(165,78,91,.18)]" />
          <span className="serif text-[22px] tracking-[.08em]">BLESSTIVALS</span>
        </Link>
        <p className="eyebrow mt-5 text-[#a54e5b]">Client admin</p>
      </div>
      <div className="relative z-10 w-full max-w-[440px]">{children}</div>
      <Link
        href="/"
        className="relative z-10 mt-7 text-xs text-[#71635b] underline underline-offset-4 hover:text-[#a54e5b]"
      >
        Back to the website
      </Link>
    </main>
  );
}

export function SignInPage() {
  return (
    <AuthShell>
      <SignIn
        routing="path"
        path={`${basePath}/sign-in`}
        signUpUrl={`${basePath}/sign-up`}
        forceRedirectUrl={`${basePath}/admin`}
        appearance={clerkAppearance}
      />
    </AuthShell>
  );
}

export function SignUpPage() {
  return (
    <AuthShell>
      <SignUp
        routing="path"
        path={`${basePath}/sign-up`}
        signInUrl={`${basePath}/sign-in`}
        forceRedirectUrl={`${basePath}/admin`}
        appearance={clerkAppearance}
      />
    </AuthShell>
  );
}
