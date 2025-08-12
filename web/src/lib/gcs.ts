import { Storage, StorageOptions } from '@google-cloud/storage'

let storage: Storage | null = null

export function getGCSClient(): Storage {
  if (storage) return storage

  const projectId = process.env.GOOGLE_CLOUD_PROJECT_ID
  const keyFilename = process.env.GOOGLE_APPLICATION_CREDENTIALS
  const clientEmail = process.env.GCS_CLIENT_EMAIL
  const privateKey = process.env.GCS_PRIVATE_KEY
  
  if (!projectId) {
    throw new Error(
      'GOOGLE_CLOUD_PROJECT_ID environment variable is required. ' +
      'Set this to your Google Cloud project ID.'
    )
  }

  const config: StorageOptions = {
    projectId,
    // Production-grade retry and timeout settings
    retryOptions: {
      autoRetry: true,
      maxRetries: 3,
      retryDelayMultiplier: 2,
      totalTimeout: 60000, // 60 seconds
      maxRetryDelay: 10000, // 10 seconds
    },
    timeout: 30000, // 30 seconds per request
  }

  try {
    if (keyFilename) {
      config.keyFilename = keyFilename
    } else if (clientEmail && privateKey) {
      config.credentials = {
        client_email: clientEmail,
        private_key: privateKey.replace(/\\n/g, '\n'), // Handle escaped newlines
      }
    }

    storage = new Storage(config)
    return storage
  } catch (error) {
    throw new Error(
      `Failed to initialize Google Cloud Storage client: ${
        error instanceof Error ? error.message : 'Unknown error'
      }. Check your credentials and project configuration.`
    )
  }
}

export interface UploadOptions {
  bucketName: string
  fileName: string
  buffer: Buffer
  contentType: string
  metadata?: Record<string, string>
}

export async function uploadToGCS(options: UploadOptions): Promise<void> {
  const { bucketName, fileName, buffer, contentType, metadata = {} } = options
  if (!buffer || buffer.length === 0) {
    throw new Error('Upload buffer is empty or invalid')
  }

  if (!bucketName || !fileName) {
    throw new Error('Bucket name and file name are required')
  }

  try {
    const storage = getGCSClient()
    const bucket = storage.bucket(bucketName)
    const file = bucket.file(fileName)

    // Check if file already exists and handle accordingly
    const [exists] = await file.exists()
    if (exists) {
      console.warn(`File ${fileName} already exists, overwriting...`)
    }

    const streamOptions = {
      metadata: {
        contentType,
        metadata: {
          ...metadata,
          uploadedAt: new Date().toISOString(),
          originalSize: buffer.length.toString(),
        },
      },
      resumable: buffer.length > 5 * 1024 * 1024, // Use resumable for files > 5MB
      validation: 'crc32c', // Enable integrity validation
    }

    const stream = file.createWriteStream(streamOptions)

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        stream.destroy()
        reject(new Error(`Upload timeout: ${fileName} took too long to upload`))
      }, 120000) // 2 minute timeout

      stream.on('error', (err) => {
        clearTimeout(timeout)
        console.error('GCS Upload Error:', err)
        reject(new Error(
          `Upload failed for ${fileName}: ${err.message}. ` +
          'Check your bucket permissions and network connection.'
        ))
      })

      stream.on('finish', async () => {
        clearTimeout(timeout)
        console.log(`Successfully uploaded: ${fileName} (${buffer.length} bytes)`)
        resolve()
      })

      stream.end(buffer)
    })
  } catch (error) {
    console.error('GCS Upload Setup Error:', error)
    throw new Error(
      `Failed to setup upload for ${fileName}: ${
        error instanceof Error ? error.message : 'Unknown error'
      }`
    )
  }
}

export async function deleteFromGCS(bucketName: string, fileName: string): Promise<void> {
  if (!bucketName || !fileName) {
    throw new Error('Bucket name and file name are required for deletion')
  }

  try {
    const storage = getGCSClient()
    const bucket = storage.bucket(bucketName)
    const file = bucket.file(fileName)

    // Check if file exists before attempting deletion
    const [exists] = await file.exists()
    if (!exists) {
      console.warn(`File ${fileName} does not exist, skipping deletion`)
      return
    }

    await file.delete()
    console.log(`Successfully deleted: ${fileName}`)
  } catch (error) {
    console.error('GCS Delete Error:', error)
    throw new Error(
      `Failed to delete ${fileName}: ${
        error instanceof Error ? error.message : 'Unknown error'
      }. Check your bucket permissions.`
    )
  }
}

export async function getSignedUrl(
  bucketName: string, 
  fileName: string, 
  expiresInMinutes: number = 60
): Promise<string> {
  const storage = getGCSClient()
  const bucket = storage.bucket(bucketName)
  const file = bucket.file(fileName)

  const options = {
    version: 'v4' as const,
    action: 'read' as const,
    expires: Date.now() + expiresInMinutes * 60 * 1000,
  }

  const [url] = await file.getSignedUrl(options)
  return url
}

export async function getSignedUploadUrl(
  bucketName: string, 
  fileName: string, 
  contentType: string,
  expiresInMinutes: number = 15
): Promise<string> {
  const storage = getGCSClient()
  const bucket = storage.bucket(bucketName)
  const file = bucket.file(fileName)

  const options = {
    version: 'v4' as const,
    action: 'write' as const,
    expires: Date.now() + expiresInMinutes * 60 * 1000,
    contentType,
  }

  const [url] = await file.getSignedUrl(options)
  return url
}

// Utility function to extract file path from GCS URL
export function extractFilePathFromGCSUrl(url: string): string | null {
  const match = url.match(/https:\/\/storage\.googleapis\.com\/([^\/]+)\/(.+)/)
  if (!match) return null
  return match[2] // Return the file path part
}

// Utility function to get bucket name from environment
export function getGCSBucketName(): string {
  const bucketName = process.env.GCS_BUCKET_NAME
  if (!bucketName) {
    throw new Error('GCS_BUCKET_NAME environment variable is required')
  }
  return bucketName
}
