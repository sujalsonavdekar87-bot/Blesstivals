import { createInsertSchema } from "drizzle-zod";
import { index, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { z } from "zod/v4";

export const inquiriesTable = pgTable(
  "inquiries",
  {
    id: serial("id").primaryKey(),
    name: text("name").notNull(),
    phone: text("phone").notNull(),
    email: text("email").notNull().default(""),
    eventType: text("event_type").notNull(),
    eventDate: text("event_date").notNull().default(""),
    location: text("location").notNull().default(""),
    message: text("message").notNull(),
    status: text("status").notNull().default("new"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [index("inquiries_status_created_at_idx").on(table.status, table.createdAt)],
);

export const insertInquirySchema = createInsertSchema(inquiriesTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertInquiry = z.infer<typeof insertInquirySchema>;
export type InquiryRecord = typeof inquiriesTable.$inferSelect;
