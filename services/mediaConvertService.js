import { MediaConvertClient, CreateJobCommand } from "@aws-sdk/client-mediaconvert";
import { awsConfig } from "../config/configuration.js";

const mediaConvertClient = new MediaConvertClient({
  region: awsConfig.region,
  endpoint: awsConfig.mediaConvertEndpoint || undefined,
  credentials: awsConfig.accessKeyId
    ? {
        accessKeyId: awsConfig.accessKeyId,
        secretAccessKey: awsConfig.secretAccessKey,
      }
    : undefined,
});

export const isMediaConvertConfigured = () => {
  return Boolean(
    awsConfig.mediaConvertEndpoint &&
      awsConfig.mediaConvertRoleArn &&
      awsConfig.s3Bucket
  );
};

export const buildHlsManifestPath = (sourceKey) => {
  const cleanName = sourceKey.split("/").pop()?.split(".")[0] || "video";
  return `hls/${cleanName}/master.m3u8`;
};

export const createTranscodeJob = async ({ sourceKey }) => {
  if (!isMediaConvertConfigured()) {
    return { queued: false, reason: "MediaConvert config missing" };
  }

  const outputPrefix = sourceKey.split(".")[0];
  const inputUri = `s3://${awsConfig.s3Bucket}/${sourceKey}`;
  const destinationUri = `s3://${awsConfig.s3Bucket}/hls/${outputPrefix}/`;

  const command = new CreateJobCommand({
    Role: awsConfig.mediaConvertRoleArn,
    Queue: awsConfig.mediaConvertQueueArn || undefined,
    Settings: {
      Inputs: [{ FileInput: inputUri }],
      OutputGroups: [
        {
          Name: "HLS Group",
          OutputGroupSettings: {
            Type: "HLS_GROUP_SETTINGS",
            HlsGroupSettings: {
              SegmentLength: 6,
              Destination: destinationUri,
              MinSegmentLength: 0,
            },
          },
          Outputs: [
            {
              ContainerSettings: { Container: "M3U8" },
              VideoDescription: {
                CodecSettings: {
                  Codec: "H_264",
                  H264Settings: {
                    Bitrate: 3000000,
                    RateControlMode: "CBR",
                    CodecProfile: "MAIN",
                    CodecLevel: "AUTO",
                  },
                },
                Width: 720,
                Height: 1280,
              },
              AudioDescriptions: [
                {
                  AudioTypeControl: "FOLLOW_INPUT",
                  CodecSettings: {
                    Codec: "AAC",
                    AacSettings: {
                      Bitrate: 96000,
                      CodingMode: "CODING_MODE_2_0",
                      SampleRate: 48000,
                    },
                  },
                },
              ],
              NameModifier: "_720p",
            },
          ],
        },
      ],
    },
  });

  const response = await mediaConvertClient.send(command);
  return {
    queued: true,
    jobId: response?.Job?.Id || null,
    outputPrefix: `hls/${outputPrefix}/`,
  };
};
