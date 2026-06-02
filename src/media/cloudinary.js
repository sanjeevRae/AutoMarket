import { v2 as cloudinary } from "cloudinary";
import { env } from "../config/env.js";

let configured = false;

function configure() {
  if (configured) return;

  if (!env.CLOUDINARY_CLOUD_NAME || !env.CLOUDINARY_API_KEY || !env.CLOUDINARY_API_SECRET) {
    throw new Error("Cloudinary credentials are missing. Check .env or GitHub Secrets.");
  }

  cloudinary.config({
    cloud_name: env.CLOUDINARY_CLOUD_NAME,
    api_key: env.CLOUDINARY_API_KEY,
    api_secret: env.CLOUDINARY_API_SECRET,
    secure: true
  });

  configured = true;
}

export async function uploadListingImage(imageUrl, sourceId) {
  configure();

  if (!imageUrl) return { imageUrl: null, publicId: null };

  const result = await cloudinary.uploader.upload(imageUrl, {
    folder: "automarket/listings",
    public_id: sourceId,
    overwrite: true,
    resource_type: "image",
    transformation: [{ quality: "auto", fetch_format: "auto", width: 900, crop: "limit" }]
  });

  return {
    imageUrl: result.secure_url,
    publicId: result.public_id
  };
}

export async function deleteCloudinaryAsset(publicId) {
  configure();
  if (!publicId) return;
  await cloudinary.uploader.destroy(publicId, { resource_type: "image" });
}
