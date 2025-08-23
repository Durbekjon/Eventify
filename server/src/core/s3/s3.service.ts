import { Injectable, Logger } from '@nestjs/common'
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  DeleteObjectsCommand,
  ListObjectsV2Command,
  HeadObjectCommand,
  CopyObjectCommand,
} from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { v4 as uuidv4 } from 'uuid'
import * as path from 'path'

export interface S3UploadOptions {
  bucket?: string // Optional, will use default from env
  key?: string // Optional, will be auto-generated if not provided
  body: Buffer | Uint8Array | string
  contentType?: string
  metadata?: Record<string, string>
  acl?: string
  originalFileName?: string // Used for generating unique key with proper extension
  folder?: string // Optional folder path prefix
}

export interface S3SimpleUploadOptions {
  body: Buffer | Uint8Array | string
  originalFileName: string
  contentType?: string
  metadata?: Record<string, string>
  acl?: string
  folder?: string
}

export interface S3DownloadOptions {
  bucket?: string // Optional, will use default from env
  key: string
}

export interface S3DeleteOptions {
  bucket?: string // Optional, will use default from env
  key: string
}

export interface S3ListOptions {
  bucket?: string // Optional, will use default from env
  prefix?: string
  maxKeys?: number
  continuationToken?: string
}

export interface S3PresignedUrlOptions {
  bucket?: string // Optional, will use default from env
  key: string
  expiresIn?: number // seconds, default 3600 (1 hour)
  operation?: 'getObject' | 'putObject'
}

export interface S3Object {
  key: string
  size: number
  lastModified: Date
  etag: string
}

export interface S3ListResult {
  objects: S3Object[]
  isTruncated: boolean
  nextContinuationToken?: string
}

@Injectable()
export class S3Service {
  private readonly logger = new Logger(S3Service.name)
  private readonly s3Client: S3Client
  private readonly defaultBucket: string

  constructor() {
    this.defaultBucket = process.env.S3_BUCKET_NAME || ''

    if (!this.defaultBucket) {
      this.logger.warn('S3_BUCKET_NAME not set in environment variables')
    }

    this.s3Client = new S3Client({
      region: process.env.S3_BUCKET_REGION || 'us-east-1',
      credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || '',
      },
    })
  }

  /**
   * Generate a unique key with UUID and file extension
   */
  private generateUniqueKey(originalFileName: string, folder?: string): string {
    const ext = path.extname(originalFileName)
    const uuid = uuidv4()
    const fileName = `${uuid}${ext}`

    if (folder) {
      return `${folder.replace(/\/$/, '')}/${fileName}`
    }

    return fileName
  }

  /**
   * Get bucket name (from options or default)
   */
  private getBucket(bucket?: string): string {
    const bucketName = bucket || this.defaultBucket
    if (!bucketName) {
      throw new Error(
        'No bucket specified and S3_BUCKET_NAME not set in environment',
      )
    }
    return bucketName
  }

  /**
   * Upload a file to S3 with auto-generated key (recommended)
   */
  async uploadFile(
    options: S3SimpleUploadOptions,
  ): Promise<{ url: string; key: string }> {
    const bucket = this.getBucket()
    const key = this.generateUniqueKey(options.originalFileName, options.folder)

    const uploadOptions: S3UploadOptions = {
      bucket,
      key,
      body: options.body,
      contentType: options.contentType,
      metadata: options.metadata,
      acl: options.acl,
    }

    const url = await this.upload(uploadOptions)
    return { url, key }
  }

  /**
   * Upload a file to S3 (lower-level method)
   */
  async upload(options: S3UploadOptions): Promise<string> {
    try {
      const bucket = this.getBucket(options.bucket)
      const key =
        options.key ||
        (options.originalFileName
          ? this.generateUniqueKey(options.originalFileName, options.folder)
          : `${uuidv4()}.bin`)

      const command = new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: options.body,
        ContentType: options.contentType,
        Metadata: options.metadata,
        ACL: options.acl as any,
      })

      const result = await this.s3Client.send(command)
      this.logger.log(`Successfully uploaded file to S3: ${bucket}/${key}`)

      return `https://${bucket}.s3.amazonaws.com/${key}`
    } catch (error) {
      this.logger.error(
        `Failed to upload file to S3: ${error.message}`,
        error.stack,
      )
      throw new Error(`S3 upload failed: ${error.message}`)
    }
  }

  /**
   * Download a file from S3
   */
  async download(options: S3DownloadOptions): Promise<Buffer> {
    try {
      const bucket = this.getBucket(options.bucket)

      const command = new GetObjectCommand({
        Bucket: bucket,
        Key: options.key,
      })

      const result = await this.s3Client.send(command)

      if (!result.Body) {
        throw new Error('No body returned from S3')
      }

      const chunks: Uint8Array[] = []
      const stream = result.Body as any

      for await (const chunk of stream) {
        chunks.push(chunk)
      }

      this.logger.log(
        `Successfully downloaded file from S3: ${bucket}/${options.key}`,
      )
      return Buffer.concat(chunks)
    } catch (error) {
      this.logger.error(
        `Failed to download file from S3: ${error.message}`,
        error.stack,
      )
      throw new Error(`S3 download failed: ${error.message}`)
    }
  }

  /**
   * Delete a single file from S3
   */
  async delete(options: S3DeleteOptions): Promise<void> {
    try {
      const bucket = this.getBucket(options.bucket)

      const command = new DeleteObjectCommand({
        Bucket: bucket,
        Key: options.key,
      })

      await this.s3Client.send(command)
      this.logger.log(
        `Successfully deleted file from S3: ${bucket}/${options.key}`,
      )
    } catch (error) {
      this.logger.error(
        `Failed to delete file from S3: ${error.message}`,
        error.stack,
      )
      throw new Error(`S3 delete failed: ${error.message}`)
    }
  }

  /**
   * Delete multiple files from S3
   */
  async deleteMultiple(keys: string[], bucket?: string): Promise<void> {
    try {
      const bucketName = this.getBucket(bucket)

      const command = new DeleteObjectsCommand({
        Bucket: bucketName,
        Delete: {
          Objects: keys.map((key) => ({ Key: key })),
        },
      })

      await this.s3Client.send(command)
      this.logger.log(
        `Successfully deleted ${keys.length} files from S3: ${bucketName}`,
      )
    } catch (error) {
      this.logger.error(
        `Failed to delete multiple files from S3: ${error.message}`,
        error.stack,
      )
      throw new Error(`S3 bulk delete failed: ${error.message}`)
    }
  }

  /**
   * List objects in S3 bucket
   */
  async list(options: S3ListOptions = {}): Promise<S3ListResult> {
    try {
      const bucket = this.getBucket(options.bucket)

      const command = new ListObjectsV2Command({
        Bucket: bucket,
        Prefix: options.prefix,
        MaxKeys: options.maxKeys || 1000,
        ContinuationToken: options.continuationToken,
      })

      const result = await this.s3Client.send(command)

      const objects: S3Object[] = (result.Contents || []).map((obj) => ({
        key: obj.Key!,
        size: obj.Size || 0,
        lastModified: obj.LastModified || new Date(),
        etag: obj.ETag || '',
      }))

      this.logger.log(
        `Successfully listed ${objects.length} objects from S3: ${bucket}`,
      )

      return {
        objects,
        isTruncated: result.IsTruncated || false,
        nextContinuationToken: result.NextContinuationToken,
      }
    } catch (error) {
      this.logger.error(
        `Failed to list objects from S3: ${error.message}`,
        error.stack,
      )
      throw new Error(`S3 list failed: ${error.message}`)
    }
  }

  /**
   * Check if an object exists in S3
   */
  async exists(options: S3DownloadOptions): Promise<boolean> {
    try {
      const bucket = this.getBucket(options.bucket)

      const command = new HeadObjectCommand({
        Bucket: bucket,
        Key: options.key,
      })

      await this.s3Client.send(command)
      return true
    } catch (error) {
      if (error.name === 'NotFound') {
        return false
      }
      this.logger.error(
        `Failed to check if object exists in S3: ${error.message}`,
        error.stack,
      )
      throw new Error(`S3 exists check failed: ${error.message}`)
    }
  }

  /**
   * Get object metadata
   */
  async getMetadata(options: S3DownloadOptions): Promise<any> {
    try {
      const bucket = this.getBucket(options.bucket)

      const command = new HeadObjectCommand({
        Bucket: bucket,
        Key: options.key,
      })

      const result = await this.s3Client.send(command)

      return {
        contentType: result.ContentType,
        contentLength: result.ContentLength,
        lastModified: result.LastModified,
        etag: result.ETag,
        metadata: result.Metadata,
      }
    } catch (error) {
      this.logger.error(
        `Failed to get object metadata from S3: ${error.message}`,
        error.stack,
      )
      throw new Error(`S3 metadata fetch failed: ${error.message}`)
    }
  }

  /**
   * Generate a presigned URL for temporary access
   */
  async getPresignedUrl(options: S3PresignedUrlOptions): Promise<string> {
    try {
      const bucket = this.getBucket(options.bucket)
      const operation = options.operation || 'getObject'
      const expiresIn = options.expiresIn || 3600 // 1 hour default

      let command
      if (operation === 'getObject') {
        command = new GetObjectCommand({
          Bucket: bucket,
          Key: options.key,
        })
      } else if (operation === 'putObject') {
        command = new PutObjectCommand({
          Bucket: bucket,
          Key: options.key,
        })
      } else {
        throw new Error(`Unsupported operation: ${operation}`)
      }

      const url = await getSignedUrl(this.s3Client, command, { expiresIn })

      this.logger.log(
        `Generated presigned URL for ${operation}: ${bucket}/${options.key}`,
      )
      return url
    } catch (error) {
      this.logger.error(
        `Failed to generate presigned URL: ${error.message}`,
        error.stack,
      )
      throw new Error(`S3 presigned URL generation failed: ${error.message}`)
    }
  }

  /**
   * Copy an object within S3
   */
  async copy(
    sourceKey: string,
    destKey: string,
    sourceBucket?: string,
    destBucket?: string,
  ): Promise<void> {
    try {
      const srcBucket = this.getBucket(sourceBucket)
      const dstBucket = this.getBucket(destBucket)

      const command = new CopyObjectCommand({
        Bucket: dstBucket,
        Key: destKey,
        CopySource: `${srcBucket}/${sourceKey}`,
      })

      await this.s3Client.send(command)
      this.logger.log(
        `Successfully copied S3 object: ${srcBucket}/${sourceKey} -> ${dstBucket}/${destKey}`,
      )
    } catch (error) {
      this.logger.error(
        `Failed to copy S3 object: ${error.message}`,
        error.stack,
      )
      throw new Error(`S3 copy failed: ${error.message}`)
    }
  }

  /**
   * Upload a file with multipart upload for large files
   * This is a simplified version - for production, consider using @aws-sdk/lib-storage
   */
  async uploadLargeFile(
    options: S3SimpleUploadOptions & { chunkSize?: number },
  ): Promise<{ url: string; key: string }> {
    // For files larger than 100MB, consider using multipart upload
    const fileSize = options.body instanceof Buffer ? options.body.length : 0

    if (fileSize > 100 * 1024 * 1024) {
      // 100MB
      this.logger.warn(
        'Large file detected. Consider implementing multipart upload for better performance.',
      )
    }

    // For now, fall back to regular upload
    return this.uploadFile(options)
  }
}
