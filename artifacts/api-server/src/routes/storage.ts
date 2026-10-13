import { Readable } from "stream";
import {
  PublishImageUploadBody,
  PublishImageUploadResponse,
  RequestImageUploadUrlBody,
  RequestImageUploadUrlResponse,
} from "@workspace/api-zod";
import { Router, type IRouter, type Request, type Response } from "express";
import { ObjectPermission } from "../lib/objectAcl";
import {
  ObjectNotFoundError,
  ObjectStorageService,
} from "../lib/objectStorage";
import { logger } from "../lib/logger";
import { requireBlessTivalsAdmin } from "../middlewares/requireBlessTivalsAdmin";

const router: IRouter = Router();
const objectStorageService = new ObjectStorageService();
const MAX_IMAGE_SIZE = 10 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

function isSupportedImage(bytes: Buffer, contentType: string): boolean {
  if (contentType === "image/jpeg") {
    return bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  }
  if (contentType === "image/png") {
    return (
      bytes.length >= 8 &&
      bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
    );
  }
  if (contentType === "image/webp") {
    return (
      bytes.length >= 12 &&
      bytes.toString("ascii", 0, 4) === "RIFF" &&
      bytes.toString("ascii", 8, 12) === "WEBP"
    );
  }
  return false;
}

function streamResponseToClient(response: globalThis.Response, res: Response) {
  res.status(response.status);
  response.headers.forEach((value, key) => res.setHeader(key, value));
  res.setHeader("X-Content-Type-Options", "nosniff");
  if (response.body) {
    Readable.fromWeb(response.body as ReadableStream<Uint8Array>).pipe(res);
  } else {
    res.end();
  }
}

router.post(
  "/storage/uploads/request-url",
  requireBlessTivalsAdmin,
  async (req: Request, res: Response) => {
    const parsed = RequestImageUploadUrlBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Choose a JPEG, PNG, or WebP image under 10 MB." });
      return;
    }

    try {
      const uploadURL = await objectStorageService.getObjectEntityUploadURL();
      const objectPath = objectStorageService.normalizeObjectEntityPath(uploadURL);
      res.json(RequestImageUploadUrlResponse.parse({ uploadURL, objectPath }));
    } catch (error) {
      logger.error({ err: error }, "Failed to create image upload URL");
      res.status(500).json({ error: "An image upload could not be started." });
    }
  },
);

router.post(
  "/storage/uploads/publish",
  requireBlessTivalsAdmin,
  async (req: Request, res: Response) => {
    const parsed = PublishImageUploadBody.safeParse(req.body);
    if (
      !parsed.success ||
      !/^\/objects\/uploads\/[0-9a-f-]{36}$/i.test(parsed.data?.objectPath ?? "")
    ) {
      res.status(400).json({ error: "This upload path is not valid." });
      return;
    }

    try {
      const file = await objectStorageService.getObjectEntityFile(parsed.data.objectPath);
      const [metadata] = await file.getMetadata();
      const contentType = String(metadata.contentType ?? "");
      const size = Number(metadata.size ?? 0);

      if (!ALLOWED_IMAGE_TYPES.has(contentType) || size < 1 || size > MAX_IMAGE_SIZE) {
        res.status(400).json({ error: "The uploaded file is not a supported image under 10 MB." });
        return;
      }

      const [signature] = await file.download({ start: 0, end: 11 });
      if (!isSupportedImage(signature, contentType)) {
        res.status(400).json({ error: "The uploaded file does not match its image type." });
        return;
      }

      const userId = String(res.locals.adminUserId ?? "");
      if (!userId) {
        res.status(403).json({ error: "This account is not an approved admin." });
        return;
      }

      await objectStorageService.trySetObjectEntityAclPolicy(parsed.data.objectPath, {
        owner: userId,
        visibility: "public",
      });

      const objectKey = parsed.data.objectPath.slice("/objects/".length);
      res.json(
        PublishImageUploadResponse.parse({
          imagePath: `/api/storage/objects/${objectKey}`,
        }),
      );
    } catch (error) {
      if (error instanceof ObjectNotFoundError) {
        res.status(404).json({ error: "The uploaded image was not found." });
        return;
      }
      logger.error({ err: error }, "Failed to publish image upload");
      res.status(500).json({ error: "The uploaded image could not be published." });
    }
  },
);

router.get("/storage/objects/*objectPath", async (req: Request, res: Response) => {
  try {
    const raw = req.params.objectPath;
    const wildcardPath = Array.isArray(raw) ? raw.join("/") : raw;
    if (!/^uploads\/[0-9a-f-]{36}$/i.test(wildcardPath)) {
      res.status(404).json({ error: "Image not found." });
      return;
    }

    const objectFile = await objectStorageService.getObjectEntityFile(
      `/objects/${wildcardPath}`,
    );
    const canRead = await objectStorageService.canAccessObjectEntity({
      objectFile,
      requestedPermission: ObjectPermission.READ,
    });
    if (!canRead) {
      res.status(404).json({ error: "Image not found." });
      return;
    }

    const response = await objectStorageService.downloadObject(objectFile, 86400);
    streamResponseToClient(response, res);
  } catch (error) {
    if (error instanceof ObjectNotFoundError) {
      res.status(404).json({ error: "Image not found." });
      return;
    }
    logger.error({ err: error }, "Failed to serve event image");
    res.status(500).json({ error: "Image could not be served." });
  }
});

export default router;
