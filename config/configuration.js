export const dbConfig = {
  connectionString: process.env.DATABASE_URL,
};

export const jwtConfig = {
  secret: process.env.JWT_SECRET,
  expiresIn: process.env.JWT_EXPIRES_IN || "60d",
};

export const awsConfig = {
  region: process.env.AWS_REGION || "ap-south-1",
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  s3Bucket: process.env.AWS_S3_BUCKET,
  cloudFrontDomain: process.env.AWS_CLOUDFRONT_DOMAIN,
  cloudFrontKeyPairId: process.env.AWS_CLOUDFRONT_KEY_PAIR_ID,
  cloudFrontPrivateKey: process.env.AWS_CLOUDFRONT_PRIVATE_KEY,
  mediaConvertEndpoint: process.env.AWS_MEDIACONVERT_ENDPOINT,
  mediaConvertRoleArn: process.env.AWS_MEDIACONVERT_ROLE_ARN,
  mediaConvertQueueArn: process.env.AWS_MEDIACONVERT_QUEUE_ARN,
};

export const isAwsCoreConfigured = () => {
  return Boolean(
    awsConfig.accessKeyId &&
      awsConfig.secretAccessKey &&
      awsConfig.s3Bucket &&
      awsConfig.cloudFrontDomain
  );
};
