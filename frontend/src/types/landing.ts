import type { LucideIcon } from "lucide-react";

export interface NavLink {
  label: string;
  href: string;
}

export interface FeatureItem {
  icon: LucideIcon;
  title: string;
  description: string;
  accent: "violet" | "azure";
}

export interface StatItem {
  label: string;
  value: number;
  suffix?: string;
  prefix?: string;
  icon: LucideIcon;
}

export interface StepItem {
  index: string;
  title: string;
  description: string;
  icon: LucideIcon;
}

export interface FooterLinkGroup {
  title: string;
  links: NavLink[];
}

export interface SocialLink {
  label: string;
  href: string;
  icon: LucideIcon;
}
