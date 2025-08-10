'use client'

import { FFmpeg } from '@ffmpeg/ffmpeg'
import { fetchFile } from '@ffmpeg/util'

export type GifQuality = 'low' | 'medium' | 'high'

let ffmpegSingleton: FFmpeg | null = null

export async function getFFmpeg(): Promise<FFmpeg> {
  if (ffmpegSingleton) return ffmpegSingleton
  const ffmpeg = new FFmpeg()
  // CDN urls auto-resolved by @ffmpeg/ffmpeg when left default in modern versions
  await ffmpeg.load()
  ffmpegSingleton = ffmpeg
  return ffmpeg
}

export type GenerateGifOptions = {
  file: File
  startTime: number
  endTime: number
  quality: GifQuality
  fps: 8 | 10 | 12 | 15
  scale: 'original' | '720' | '480' | '360' | '240'
  onProgress?: (ratio: number) => void
}

// Maximum GIF duration to prevent extremely large files
const MAX_GIF_DURATION = 10 // seconds
// Maximum file size target (500KB for web optimization)
const MAX_FILE_SIZE_TARGET = 500 * 1024 // 500KB

export async function generateGif(options: GenerateGifOptions): Promise<Blob> {
  const { file, startTime, endTime, quality, fps, scale, onProgress } = options
  
  // Enforce maximum duration
  let duration = Math.max(0, endTime - startTime)
  if (duration > MAX_GIF_DURATION) {
    duration = MAX_GIF_DURATION
  }
  
  if (duration <= 0) throw new Error('Invalid time range')

  const ffmpeg = await getFFmpeg()
  ffmpeg.on('progress', ({ progress }) => {
    if (onProgress) onProgress(progress)
  })

  const inputName = 'input.mp4'
  const outputName = 'out.gif'

  await ffmpeg.writeFile(inputName, await fetchFile(file))

  // Optimized color counts for web GIFs - even more aggressive
  const colorCount = quality === 'low' ? 32 : quality === 'medium' ? 16 : 8
  
  // More aggressive scaling for smaller file sizes
  const scaleFilter = (() => {
    switch (scale) {
      case 'original':
        return 'scale=iw:ih'
      case '720':
        return "scale='min(1280,iw)':-2"
      case '480':
        return "scale='min(854,iw)':-2"
      case '360':
        return "scale='min(640,iw)':-2"
      case '240':
        return "scale='min(426,iw)':-2"
      default:
        return "scale='min(640,iw)':-2"
    }
  })()

  // Optimized frame rate - even lower for smaller files
  const optimizedFps = Math.min(fps, 10) // Cap at 10fps for web optimization

  // Advanced GIF optimization filters with lossy compression
  const optimizationFilters = [
    `fps=${optimizedFps}`,
    // Scale video
    scaleFilter,
    // Optimize for GIF format with lossy compression
    'split[s0][s1]',
    // Generate optimized palette with aggressive color reduction
    '[s0]palettegen=max_colors=' + colorCount + ':reserve_transparent=0:stats_mode=single:new=1[p]',
    // Apply palette with aggressive dithering and lossy compression
    '[s1][p]paletteuse=dither=bayer:bayer_scale=7:diff_mode=rectangle:new=1'
  ].join(',')

  // Generate optimized GIF
  await ffmpeg.exec([
    '-ss', String(startTime),
    '-t', String(duration),
    '-i', inputName,
    '-vf', optimizationFilters,
    // GIF-specific optimizations for maximum compression
    '-gifflags', '+transdiff',
    '-y', outputName,
  ])

  const data = (await ffmpeg.readFile(outputName)) as Uint8Array
  
  // Check file size and apply additional compression if needed
  let finalData = data
  if (data.length > MAX_FILE_SIZE_TARGET) {
    // If still too large, apply more aggressive compression
    finalData = await applyAdditionalCompression(ffmpeg, inputName, startTime, duration, scaleFilter)
  }

  // Convert to a concrete ArrayBuffer to satisfy strict DOM typings
  const arrayBuffer = new ArrayBuffer(finalData.length)
  const view = new Uint8Array(arrayBuffer)
  view.set(finalData)
  const blob = new Blob([arrayBuffer], { type: 'image/gif' })
  
  return blob
}

// Additional compression for files that are still too large
async function applyAdditionalCompression(
  ffmpeg: FFmpeg,
  inputName: string,
  startTime: number,
  duration: number,
  scaleFilter: string
): Promise<Uint8Array> {
  // Ultra-compressed version with minimal colors and very low frame rate
  const ultraOptimizedFilters = [
    `fps=6`, // Very low frame rate for maximum compression
    scaleFilter,
    // Apply additional scaling for ultra-compression
    'scale=iw/2:ih/2', // Halve the resolution
    'split[s0][s1]',
    '[s0]palettegen=max_colors=8:reserve_transparent=0:stats_mode=single:new=1[p]',
    '[s1][p]paletteuse=dither=bayer:bayer_scale=9:diff_mode=rectangle:new=1'
  ].join(',')

  await ffmpeg.exec([
    '-ss', String(startTime),
    '-t', String(duration),
    '-i', inputName,
    '-vf', ultraOptimizedFilters,
    '-gifflags', '+transdiff',
    '-y', 'ultra_compressed.gif',
  ])

  return await ffmpeg.readFile('ultra_compressed.gif') as Uint8Array
}

// Utility function to estimate GIF file size before generation
export function estimateGifSize(
  videoWidth: number,
  videoHeight: number,
  duration: number,
  fps: number,
  quality: GifQuality,
  scale: string
): number {
  // Apply scaling
  let finalWidth = videoWidth
  let finalHeight = videoHeight
  
  switch (scale) {
    case '720':
      finalWidth = Math.min(1280, videoWidth)
      finalHeight = Math.round((finalWidth * videoHeight) / videoWidth)
      break
    case '480':
      finalWidth = Math.min(854, videoWidth)
      finalHeight = Math.round((finalWidth * videoHeight) / videoWidth)
      break
    case '360':
      finalWidth = Math.min(640, videoWidth)
      finalHeight = Math.round((finalWidth * videoHeight) / videoWidth)
      break
    case '240':
      finalWidth = Math.min(426, videoWidth)
      finalHeight = Math.round((finalWidth * videoHeight) / videoWidth)
      break
  }

  // Calculate pixels per frame
  const pixelsPerFrame = finalWidth * finalHeight
  
  // Color depth based on quality (bits per pixel) - updated for new aggressive settings
  const bitsPerPixel = quality === 'high' ? 3 : quality === 'medium' ? 4 : 5
  
  // Calculate total bits
  const totalBits = pixelsPerFrame * bitsPerPixel * fps * duration
  
  // Convert to bytes and add overhead (GIF format overhead ~20%)
  const estimatedBytes = Math.ceil(totalBits / 8 * 1.2)
  
  return estimatedBytes
}

// Validate if the generated GIF meets size requirements
export function validateGifSize(blob: Blob): { isValid: boolean; size: number; maxSize: number } {
  const size = blob.size
  const maxSize = MAX_FILE_SIZE_TARGET
  return {
    isValid: size <= maxSize,
    size,
    maxSize
  }
}


