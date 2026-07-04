import { Globe, Link2, Mail, ShieldCheck } from "lucide-react";
import type { FooterLinkGroup, SocialLink } from "../../types/landing";

const LINK_GROUPS: FooterLinkGroup[] = [
  {
    title: "Product",
    links: [
      { label: "Home", href: "#home" },
      { label: "Features", href: "#features" },
      { label: "How It Works", href: "#how-it-works" },
    ],
  },
  {
    title: "Account",
    links: [
      { label: "Log in", href: "#" },
      { label: "Get Started", href: "#" },
    ],
  },
];

const SOCIALS: SocialLink[] = [
  { label: "Website", href: "#", icon: Globe },
  { label: "Email", href: "#", icon: Mail },
  { label: "Source Code", href: "#", icon: Link2 },
];

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="relative border-t border-border">
      <div className="section-shell py-14">
        <div className="grid gap-12 lg:grid-cols-[1.4fr_1fr_1fr]">
          <div className="max-w-sm">
            <a href="#home" className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-grad-primary">
                <ShieldCheck className="h-4 w-4 text-white" strokeWidth={2.4} />
              </span>
              <span className="font-display text-sm font-semibold text-ink">
                AI Fake News Detector
              </span>
            </a>
            <p className="mt-4 text-sm leading-relaxed text-ink-muted">
              A student-built AI tool that scores the credibility of news
              articles in real time, using a machine learning model trained
              to spot the language patterns behind misinformation.
            </p>
          </div>

          {LINK_GROUPS.map((group) => (
            <div key={group.title}>
              <h4 className="text-xs font-semibold uppercase tracking-[0.16em] text-ink-faint">
                {group.title}
              </h4>
              <ul className="mt-4 space-y-3">
                {group.links.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className="text-sm text-ink-muted transition-colors hover:text-ink"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-6 border-t border-border pt-8 sm:flex-row">
          <p className="text-xs text-ink-faint">
            © {year} AI Fake News Detector. All rights reserved.
          </p>
          <div className="flex items-center gap-3">
            {SOCIALS.map((social) => {
              const Icon = social.icon;
              return (
                <a
                  key={social.label}
                  href={social.href}
                  aria-label={social.label}
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-border text-ink-muted transition-colors hover:border-border-strong hover:text-ink"
                >
                  <Icon className="h-4 w-4" strokeWidth={1.8} />
                </a>
              );
            })}
          </div>
        </div>
      </div>
    </footer>
  );
}
