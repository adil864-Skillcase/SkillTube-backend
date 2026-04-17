import crypto from "crypto";
import path from "path";
import { S3Client, HeadObjectCommand } from "@aws-sdk/client-s3";
import { S3RequestPresigner } from "@aws-sdk/s3-request-presigner";
import { formatUrl } from "@aws-sdk/util-format-url";
import { HttpRequest } from "@smithy/protocol-http";
import { Hash } from "@smithy/hash-node";
import { awsConfig, isAwsCoreConfigured } from "../config/configuration.js";

const s3Client = new S3Client({
  region: awsConfig.region,
  credentials: awsConfig.accessKeyId
    ? {
        accessKeyId: awsConfig.accessKeyId,
        secretAccessKey: awsConfig.secretAccessKey,
      }
    : undefined,
});

const getSafeExtension = (name = "", fallback = ".bin") => {
  const ext = path.extname(name).toLowerCase();
  return ext || fallback;
};

const getDatePath = () => {
  const date = new Date();
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${year}/${month}/${day}`;
};

export const assertAwsReady = () => {
  if (!isAwsCoreConfigured()) {
    const err = new Error("AWS core configuration is missing");
    err.statusCode = 503;
    throw err;
  }
};

export const buildVideoObjectKey = (fileName) => {
  const ext = getSafeExtension(fileName, ".mp4");
  return `raw/videos/${getDatePath()}/${crypto.randomUUID()}${ext}`;
};

export const buildThumbnailObjectKey = (fileName) => {
  const ext = getSafeExtension(fileName, ".jpg");
  return `thumbnails/${getDatePath()}/${crypto.randomUUID()}${ext}`;
};

export const createPutObjectContract = async ({ key, contentType }) => {
  assertAwsReady();

  const keyPath = key
    .split("/")
    .map((part) => encodeURIComponent(part))
    .join("/");

  const presigner = new S3RequestPresigner({
    region: awsConfig.region,
    credentials: {
      accessKeyId: awsConfig.accessKeyId,
      secretAccessKey: awsConfig.secretAccessKey,
    },
    sha256: Hash.bind(null, "sha256"),
  });

  const signedRequest = await presigner.presign(
    new HttpRequest({
      protocol: "https:",
      method: "PUT",
      hostname: `${awsConfig.s3Bucket}.s3.${awsConfig.region}.amazonaws.com`,
      path: `/${keyPath}`,
      headers: {
        host: `${awsConfig.s3Bucket}.s3.${awsConfig.region}.amazonaws.com`,
        ...(contentType ? { "content-type": contentType } : {}),
      },
    }),
    { expiresIn: 900 }
  );

  const uploadUrl = formatUrl(signedRequest);
  return { key, uploadUrl, expiresInSeconds: 900 };
};

export const checkObjectExists = async (key) => {
  assertAwsReady();
  try {
    await s3Client.send(
      new HeadObjectCommand({
        Bucket: awsConfig.s3Bucket,
        Key: key,
      })
    );
    return true;
  } catch (err) {
    return false;
  }
};
