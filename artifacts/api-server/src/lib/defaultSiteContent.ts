import type { SiteContent } from "@workspace/db";

export const DEFAULT_SITE_CONTENT: SiteContent = {
  heroTitle: "Gather\nbeautifully.",
  heroAccent: "Feel it all.",
  heroBody:
    "From the first idea to the final little detail, we bring your people together around an occasion that feels unmistakably yours.",
  heroImagePath: "/media/celebration-editorial.jpg",
  approachTitle: "Less “just an event.” More your kind of magic.",
  approachBody:
    "We believe the best celebrations don’t feel assembled. They feel considered, generous and full of life. We shape the moving parts around what matters to you—so you can be present for the good part.",
  servicesHeading: "A reason to gather.",
  services: [
    {
      id: "weddings",
      title: "Weddings & milestone celebrations",
      tag: "PERSONAL · MEANINGFUL · FULL OF FEELING",
      body: "Weddings and milestone celebrations bring people together around family, tradition, and a day with its own rhythm. Let the feeling you want to create lead the conversation.",
    },
    {
      id: "corporate",
      title: "Corporate functions",
      tag: "CLEAR PURPOSE · THOUGHTFUL PRESENCE",
      body: "A corporate function can gather a team, introduce an idea, or bring people across a business together. Start with the purpose and the tone the occasion should carry.",
    },
    {
      id: "private",
      title: "Private celebrations",
      tag: "INTIMATE · PERSONAL · JOYFUL",
      body: "A birthday, anniversary, or private celebration is a chance to spend time with the people who matter. Every gathering has its own reasons to come together.",
    },
    {
      id: "shows",
      title: "Shows, concerts & exhibitions",
      tag: "ENERGETIC · DISTINCT · WELL ORCHESTRATED",
      body: "Shows, concerts and exhibitions welcome audiences around a shared experience. Each has its own scale and energy, from the room itself to the moments people take away.",
    },
  ],
  galleryHeading: "Shared event details",
  gallery: [],
  contactPhone: "9324519563",
  instagramHandle: "@blesstivals",
  instagramUrl: "https://www.instagram.com/blesstivals",
  serviceArea: "Mumbai, Navi Mumbai and nearby areas",
};
