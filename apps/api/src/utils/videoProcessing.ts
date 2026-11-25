// Video Processing Utilities
// File: apps/api/src/utils/videoProcessing.ts

import { exec } from 'child_process'
import util from 'util'
import path from 'path'
import fs from 'fs'
import AWS from 'aws-sdk'

const execAsync = util.promisify(exec)

// ────────────────────────────────────────────────
// Video Processing Pipeline
// ────────────────────────────────────────────────

export interface VideoProcessingResult {
  keyframes: string[]
  waveformUrl: string
  waveformData?: number[]
  duration: number
  metadata: {
    width: number
    height: number
    fps: number
    codec: string
  }
}

export interface ContentAnalysisResult {
  nudityScore: number
  audioScore: number
  confidence: number
}

class VideoProcessor {
  private s3: AWS.S3
  private tmpBaseDir: string

  constructor() {
    this.s3 = new AWS.S3({
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      region: process.env.AWS_REGION || 'us-east-1',
    })
    this.tmpBaseDir = process.env.TEMP_DIR || '/tmp'
  }

  // ────────────────────────────────────────────────
  // Metadata Extraction
  // ────────────────────────────────────────────────
  async getVideoMetadata(videoPath: string): Promise<{
    duration: number
    width: number
    height: number
    fps: number
    codec: string
  }> {
    try {
      // Get duration
      const { stdout: durationStr } = await execAsync(
        `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1:noinvert_list=1 "${videoPath}"`
      )
      const duration = parseFloat(durationStr.trim())

      // Get video stream info
      const { stdout: streamStr } = await execAsync(
        `ffprobe -v error -select_streams v:0 -show_entries stream=width,height,r_frame_rate,codec_name -of default=noprint_wrappers=1:nokey=1:noinvert_list=1 "${videoPath}"`
      )

      const lines = streamStr.trim().split('\n')
      const width = parseInt(lines[0]) || 1920
      const height = parseInt(lines[1]) || 1080
      const fpsStr = lines[2] || '30/1'
      const [num, den] = fpsStr.split('/').map(Number)
      const fps = num / den
      const codec = lines[3] || 'h264'

      return { duration, width, height, fps, codec }
    } catch (error) {
      console.error('Metadata extraction failed:', error)
      throw new Error('Failed to extract video metadata')
    }
  }

  // ────────────────────────────────────────────────
  // Keyframe Extraction
  // ────────────────────────────────────────────────
  async extractKeyframes(
    videoPath: string,
    videoId: string,
    count: number = 10,
    resolution: string = '320x180'
  ): Promise<string[]> {
    const tmpDir = path.join(this.tmpBaseDir, `quarantine_${videoId}_${Date.now()}`)
    const keyframes: string[] = []

    if (!fs.existsSync(tmpDir)) {
      fs.mkdirSync(tmpDir, { recursive: true })
    }

    try {
      const metadata = await this.getVideoMetadata(videoPath)
      const duration = metadata.duration

      // Extract frames at regular intervals
      for (let i = 0; i < count; i++) {
        const timestamp = (i / (count - 1)) * duration
        const outputPath = path.join(tmpDir, `keyframe_${i}.jpg`)

        await execAsync(
          `ffmpeg -i "${videoPath}" -ss ${timestamp} -vframes 1 -q:v 2 -s ${resolution} "${outputPath}" 2>/dev/null`
        )

        const s3Url = await this.uploadFileToS3(
          outputPath,
          `quarantine/${videoId}/keyframes/frame_${i}.jpg`,
          'image/jpeg'
        )
        keyframes.push(s3Url)
      }

      this.cleanupTempDir(tmpDir)
      return keyframes
    } catch (error) {
      this.cleanupTempDir(tmpDir)
      console.error('Keyframe extraction failed:', error)
      throw new Error('Failed to extract keyframes')
    }
  }

  // ────────────────────────────────────────────────
  // Waveform Generation
  // ────────────────────────────────────────────────
  async generateWaveform(
    videoPath: string,
    videoId: string
  ): Promise<{ waveformUrl: string; waveformData?: number[] }> {
    const tmpDir = path.join(this.tmpBaseDir, `quarantine_${videoId}_${Date.now()}`)

    if (!fs.existsSync(tmpDir)) {
      fs.mkdirSync(tmpDir, { recursive: true })
    }

    try {
      // Extract audio
      const audioPath = path.join(tmpDir, 'audio.mp3')
      await execAsync(`ffmpeg -i "${videoPath}" -vn -acodec libmp3lame -q:a 4 "${audioPath}" 2>/dev/null`)

      // Generate waveform image
      const waveformPngPath = path.join(tmpDir, 'waveform.png')
      try {
        // Try audiowaveform first (more efficient)
        await execAsync(
          `audiowaveform -i "${audioPath}" -o "${waveformPngPath}" --pixels-per-second 20 -w 800 -h 150 --background-color ffffffff --border-color 000000ff --waveform-color FF8C00ff 2>/dev/null`
        )
      } catch (e) {
        // Fallback to ffmpeg filter
        console.warn('Using ffmpeg waveform fallback')
        await execAsync(
          `ffmpeg -i "${audioPath}" -filter_complex "[0:a]showwaves=s=800x150:mode=line:colors=FF8C00|FFA500[v]" -map "[v]" -frames:v 1 "${waveformPngPath}" 2>/dev/null`
        )
      }

      // Upload waveform to S3
      const waveformUrl = await this.uploadFileToS3(
        waveformPngPath,
        `quarantine/${videoId}/waveform.png`,
        'image/png'
      )

      // Generate peaks JSON (optional)
      let waveformData: number[] | undefined
      const peaksPath = path.join(tmpDir, 'peaks.json')
      try {
        await execAsync(`audiowaveform -i "${audioPath}" -o "${peaksPath}" -z 512 2>/dev/null`)
        const peaksJson = JSON.parse(fs.readFileSync(peaksPath, 'utf-8'))
        waveformData = (peaksJson.data || []).slice(0, 512)
      } catch (e) {
        console.warn('Peak data generation skipped')
      }

      this.cleanupTempDir(tmpDir)

      return { waveformUrl, waveformData }
    } catch (error) {
      this.cleanupTempDir(tmpDir)
      console.error('Waveform generation failed:', error)
      throw new Error('Failed to generate waveform')
    }
  }

  // ────────────────────────────────────────────────
  // Content Analysis (Placeholder)
  // ────────────────────────────────────────────────
  async analyzeVideoContent(videoPath: string): Promise<ContentAnalysisResult> {
    try {
      // Integration point for AI services:
      // - AWS Rekognition
      // - Google Video Intelligence
      // - Clarifai
      // - Custom ML model

      // For now, return placeholder values
      // Replace with actual API calls to your analysis service

      console.log(`Analyzing video: ${videoPath}`)

      return {
        nudityScore: Math.round(Math.random() * 100),
        audioScore: Math.round(Math.random() * 100),
        confidence: 0.75,
      }

      // Example: AWS Rekognition integration
      // const rekognition = new AWS.Rekognition()
      // const response = await rekognition.startLabelDetection({
      //   Video: { S3Object: { Bucket, Name: s3Key } }
      // }).promise()
      // ... process results ...
    } catch (error) {
      console.error('Content analysis failed:', error)
      return { nudityScore: 0, audioScore: 0, confidence: 0 }
    }
  }

  // ────────────────────────────────────────────────
  // S3 Upload
  // ────────────────────────────────────────────────
  async uploadFileToS3(
    localPath: string,
    s3Key: string,
    contentType: string
  ): Promise<string> {
    try {
      const fileStream = fs.createReadStream(localPath)
      const params = {
        Bucket: process.env.AWS_S3_BUCKET || 'datepage-quarantine',
        Key: s3Key,
        Body: fileStream,
        ContentType: contentType,
        ServerSideEncryption: 'AES256' as const,
      }

      await this.s3.upload(params).promise()
      return `s3://${params.Bucket}/${params.Key}`
    } catch (error) {
      console.error('S3 upload failed:', error)
      throw new Error('Failed to upload to S3')
    }
  }

  // ────────────────────────────────────────────────
  // Cleanup
  // ────────────────────────────────────────────────
  private cleanupTempDir(tmpDir: string): void {
    try {
      if (fs.existsSync(tmpDir)) {
        fs.rmSync(tmpDir, { recursive: true, force: true })
      }
    } catch (error) {
      console.warn(`Failed to cleanup temp dir ${tmpDir}:`, error)
    }
  }

  // ────────────────────────────────────────────────
  // Full Processing Pipeline
  // ────────────────────────────────────────────────
  async processVideo(videoPath: string, videoId: string): Promise<VideoProcessingResult> {
    console.log(`Starting video processing for ${videoId}...`)

    try {
      const metadata = await this.getVideoMetadata(videoPath)
      const [keyframes, waveform, analysis] = await Promise.all([
        this.extractKeyframes(videoPath, videoId, 10),
        this.generateWaveform(videoPath, videoId),
        this.analyzeVideoContent(videoPath),
      ])

      console.log(`Completed processing for ${videoId}`)

      return {
        keyframes,
        waveformUrl: waveform.waveformUrl,
        waveformData: waveform.waveformData,
        duration: metadata.duration,
        metadata: {
          width: metadata.width,
          height: metadata.height,
          fps: metadata.fps,
          codec: metadata.codec,
        },
      }
    } catch (error) {
      console.error(`Video processing failed for ${videoId}:`, error)
      throw error
    }
  }
}

// Export singleton instance
export const videoProcessor = new VideoProcessor()

// ────────────────────────────────────────────────
// Helper: Calculate Priority Based on Scores
// ────────────────────────────────────────────────
export function calculatePriority(nudityScore: number, audioScore: number): string {
  const maxScore = Math.max(nudityScore, audioScore)
  
  if (maxScore > 85) return 'P0'
  if (maxScore > 70) return 'P1'
  if (maxScore > 55) return 'P2'
  if (maxScore > 40) return 'P3'
  if (maxScore > 25) return 'P4'
  return 'P5'
}

// ────────────────────────────────────────────────
// Helper: Calculate Severity
// ────────────────────────────────────────────────
export function calculateSeverity(nudityScore: number, audioScore: number, confidence: number): number {
  const baseScore = Math.max(nudityScore, audioScore)
  return Math.round(baseScore * confidence)
}
