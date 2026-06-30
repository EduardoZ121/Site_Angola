import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { randomUUID } from 'crypto'
import { env } from '../config/env.js'

let s3 = null

function getS3() {
  if (!env.aws.bucket || !env.aws.accessKeyId || !env.aws.secretAccessKey) return null
  if (!s3) {
    s3 = new S3Client({
      region: env.aws.region,
      credentials: {
        accessKeyId: env.aws.accessKeyId,
        secretAccessKey: env.aws.secretAccessKey,
      },
    })
  }
  return s3
}

export function isS3Configured() {
  return Boolean(getS3())
}

export async function createUploadUrl({ filename, contentType, folder = 'listings' }) {
  const client = getS3()
  if (!client) {
    return { ok: false, error: 'AWS S3 não configurado' }
  }

  const ext = filename?.includes('.') ? filename.split('.').pop() : 'jpg'
  const key = `${folder}/${randomUUID()}.${ext}`

  const command = new PutObjectCommand({
    Bucket: env.aws.bucket,
    Key: key,
    ContentType: contentType || 'image/jpeg',
  })

  const uploadUrl = await getSignedUrl(client, command, { expiresIn: 300 })
  const publicUrl = `https://${env.aws.bucket}.s3.${env.aws.region}.amazonaws.com/${key}`

  return { ok: true, uploadUrl, publicUrl, key }
}
