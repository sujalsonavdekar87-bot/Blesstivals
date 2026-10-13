import { createInsertSchema } from "drizzle-zod";
import { jsonb, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { z } from "zod/v4";

export type SiteService = {
  id: string;
  title: string;
  tag: string;
  body: string;
};

export type GalleryItem = {
  id: string;
  imagePath: string;
  altText: string;
  caption: string;
};

export type SiteContent = {
  heroTitle: string;
  heroAccent: string;
  heroBody: string;
  heroImagePath: string;
  approachTitle: string;
  approachBody: string;
  servicesHeading: string;
  services: SiteService[];
  galleryHeading: string;
  gallery: GalleryItem[];
  contactPhone: string;
  instagramHandle: string;
  instagramUrl: string;
  serviceArea: string;
};

export const siteContentTable = pgTable("site_content", {
  id: text("id").primaryKey(),
  content: jsonb("content").$type<SiteContent>().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const insertSiteContentSchema = createInsertSchema(siteContentTable).omit({
  id: true,
  updatedAt: true,
});
export type InsertSiteContent = z.infer<typeof insertSiteContentSchema>;
export type SiteContentRecord = typeof siteContentTable.$inferSelect;
