import { desc, eq } from "drizzle-orm";
import { Router, type IRouter } from "express";
import {
  CreatePublicInquiryBody,
  CreatePublicInquiryResponse,
  GetPublicContentResponse,
  ListAdminInquiriesResponse,
  UpdateAdminContentBody,
  UpdateAdminContentResponse,
  UpdateAdminInquiryBody,
  UpdateAdminInquiryParams,
  UpdateAdminInquiryResponse,
} from "@workspace/api-zod";
import { db, inquiriesTable, siteContentTable } from "@workspace/db";
import { DEFAULT_SITE_CONTENT } from "../lib/defaultSiteContent";
import { logger } from "../lib/logger";
import { requireBlessTivalsAdmin } from "../middlewares/requireBlessTivalsAdmin";

const router: IRouter = Router();
const SITE_CONTENT_ID = "primary";

async function getOrCreateSiteContent() {
  await db
    .insert(siteContentTable)
    .values({ id: SITE_CONTENT_ID, content: DEFAULT_SITE_CONTENT })
    .onConflictDoNothing({ target: siteContentTable.id });

  const [record] = await db
    .select()
    .from(siteContentTable)
    .where(eq(siteContentTable.id, SITE_CONTENT_ID))
    .limit(1);

  if (!record) {
    throw new Error("Site content could not be initialized.");
  }

  return record;
}

router.get("/public/content", async (_req, res) => {
  try {
    const record = await getOrCreateSiteContent();
    res.json(GetPublicContentResponse.parse(record.content));
  } catch (error) {
    logger.error({ err: error }, "Failed to load public site content");
    res.status(500).json({ error: "Site content could not be loaded." });
  }
});

router.post("/public/inquiries", async (req, res) => {
  const rawBody =
    req.body && typeof req.body === "object"
      ? (req.body as Record<string, unknown>)
      : {};
  if (typeof rawBody.website === "string" && rawBody.website.trim()) {
    res.status(400).json({ error: "Invalid enquiry details." });
    return;
  }
  const cleanedBody = {
    ...rawBody,
    name: typeof rawBody.name === "string" ? rawBody.name.trim() : rawBody.name,
    phone: typeof rawBody.phone === "string" ? rawBody.phone.trim() : rawBody.phone,
    email:
      typeof rawBody.email === "string" && rawBody.email.trim()
        ? rawBody.email.trim()
        : undefined,
    eventType:
      typeof rawBody.eventType === "string"
        ? rawBody.eventType.trim()
        : rawBody.eventType,
    eventDate:
      typeof rawBody.eventDate === "string"
        ? rawBody.eventDate.trim()
        : rawBody.eventDate,
    location:
      typeof rawBody.location === "string"
        ? rawBody.location.trim()
        : rawBody.location,
    message:
      typeof rawBody.message === "string"
        ? rawBody.message.trim()
        : rawBody.message,
  };

  const parsed = CreatePublicInquiryBody.safeParse(cleanedBody);
  if (!parsed.success) {
    res.status(400).json({ error: "Please check the enquiry details." });
    return;
  }

  try {
    const [record] = await db
      .insert(inquiriesTable)
      .values({
        name: parsed.data.name,
        phone: parsed.data.phone,
        email: parsed.data.email ?? "",
        eventType: parsed.data.eventType,
        eventDate: parsed.data.eventDate ?? "",
        location: parsed.data.location ?? "",
        message: parsed.data.message,
        status: "new",
      })
      .returning();

    res.status(201).json(CreatePublicInquiryResponse.parse(record));
  } catch (error) {
    logger.error({ err: error }, "Failed to save event enquiry");
    res.status(500).json({ error: "Your enquiry could not be saved. Please call us instead." });
  }
});

router.put("/admin/content", requireBlessTivalsAdmin, async (req, res) => {
  const parsed = UpdateAdminContentBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Please check the content fields." });
    return;
  }

  try {
    const content = parsed.data;
    const [record] = await db
      .insert(siteContentTable)
      .values({ id: SITE_CONTENT_ID, content })
      .onConflictDoUpdate({
        target: siteContentTable.id,
        set: { content, updatedAt: new Date() },
      })
      .returning();

    res.json(UpdateAdminContentResponse.parse(record.content));
  } catch (error) {
    logger.error({ err: error }, "Failed to update site content");
    res.status(500).json({ error: "Changes could not be saved." });
  }
});

router.get("/admin/inquiries", requireBlessTivalsAdmin, async (_req, res) => {
  try {
    const records = await db
      .select()
      .from(inquiriesTable)
      .orderBy(desc(inquiriesTable.createdAt));

    res.json(ListAdminInquiriesResponse.parse(records));
  } catch (error) {
    logger.error({ err: error }, "Failed to load admin enquiries");
    res.status(500).json({ error: "Enquiries could not be loaded." });
  }
});

router.patch("/admin/inquiries/:id", requireBlessTivalsAdmin, async (req, res) => {
  const parsedParams = UpdateAdminInquiryParams.safeParse(req.params);
  const parsedBody = UpdateAdminInquiryBody.safeParse(req.body);
  if (!parsedParams.success || !parsedBody.success) {
    res.status(400).json({ error: "Please check the enquiry update." });
    return;
  }

  try {
    const [record] = await db
      .update(inquiriesTable)
      .set({ status: parsedBody.data.status, updatedAt: new Date() })
      .where(eq(inquiriesTable.id, parsedParams.data.id))
      .returning();

    if (!record) {
      res.status(404).json({ error: "Enquiry not found." });
      return;
    }

    res.json(UpdateAdminInquiryResponse.parse(record));
  } catch (error) {
    logger.error({ err: error }, "Failed to update enquiry status");
    res.status(500).json({ error: "Enquiry status could not be updated." });
  }
});

export default router;
