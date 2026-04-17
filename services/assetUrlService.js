import { getSignedUrl } from "@aws-sdk/cloudfront-signer";
import { awsConfig } from "../config/configuration.js";

const stripLeadingSlash = (value = "") => value.replace(/^\/+/, "");

export const getCloudFrontUrl = (objectPath) => {
  if (!awsConfig.cloudFrontDomain || !objectPath) {
    return null;
  }
  return `https://${awsConfig.cloudFrontDomain}/${stripLeadingSlash(objectPath)}`;
};

export const getSignedCloudFrontUrl = (objectPath, expiresInSeconds = 3600) => {
  const url = getCloudFrontUrl(objectPath);
  if (!url) return null;

  if (!awsConfig.cloudFrontPrivateKey || !awsConfig.cloudFrontKeyPairId) {
    return url;
  }

  const dateLessThan = new Date(Date.now() + expiresInSeconds * 1000).toISOString();
  return getSignedUrl({
    url,
    keyPairId: awsConfig.cloudFrontKeyPairId,
    privateKey: awsConfig.cloudFrontPrivateKey,
    dateLessThan,
  });
};
