const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const crypto = require('crypto');

// Initialize S3 Client for Cloudflare R2
const getS3Client = () => {
  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;

  if (!accountId || !accessKeyId || !secretAccessKey) {
    throw new Error('Missing Cloudflare R2 credentials in environment variables.');
  }

  return new S3Client({
    region: 'auto',
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  });
};

let s3ClientInstance = null;

/**
 * Uploads a base64 encoded image to Cloudflare R2
 * @param {string} base64String - The base64 encoded image string
 * @param {string} customerId - The ID of the customer (used for file naming)
 * @returns {Promise<string>} - The public URL of the uploaded image
 */
const uploadBase64ImageToR2 = async (base64String, customerId) => {
  if (!s3ClientInstance) {
    s3ClientInstance = getS3Client();
  }

  const bucketName = process.env.R2_BUCKET_NAME;
  const publicUrlBase = process.env.R2_PUBLIC_URL;

  if (!bucketName || !publicUrlBase) {
    throw new Error('Missing R2_BUCKET_NAME or R2_PUBLIC_URL in environment variables.');
  }

  // Parse the base64 string
  // Format typically: data:image/jpeg;base64,/9j/4AAQSkZJRg...
  const matches = base64String.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
  
  if (!matches || matches.length !== 3) {
    throw new Error('Invalid base64 string format.');
  }

  const mimeType = matches[1];
  const base64Data = matches[2];
  
  // Determine file extension
  let extension = 'png';
  if (mimeType.includes('jpeg') || mimeType.includes('jpg')) {
    extension = 'jpg';
  } else if (mimeType.includes('gif')) {
    extension = 'gif';
  } else if (mimeType.includes('webp')) {
    extension = 'webp';
  }

  // Convert base64 to buffer
  const buffer = Buffer.from(base64Data, 'base64');

  // Generate unique file name
  const hash = crypto.randomBytes(8).toString('hex');
  const key = `customer_photos/${customerId}_${hash}.${extension}`;

  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: key,
    Body: buffer,
    ContentType: mimeType,
  });

  try {
    await s3ClientInstance.send(command);
    // Ensure public URL has no trailing slash to avoid double slashes
    const baseUrl = publicUrlBase.endsWith('/') ? publicUrlBase.slice(0, -1) : publicUrlBase;
    return `${baseUrl}/${key}`;
  } catch (error) {
    console.error('Error uploading image to R2:', error);
    throw new Error('Failed to upload image to R2.');
  }
};

module.exports = {
  uploadBase64ImageToR2,
};
