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
  fps: 10 | 15 | 24
  scale: 'original' | '720' | '480' | '360'
  onProgress?: (ratio: number) => void
}

export async function generateGif(options: GenerateGifOptions): Promise<Blob> {
  const { file, startTime, endTime, quality, fps, scale, onProgress } = options
  const duration = Math.max(0, endTime - startTime)
  if (duration <= 0) throw new Error('Invalid time range')

  const ffmpeg = await getFFmpeg()
  ffmpeg.on('progress', ({ progress }) => {
    if (onProgress) onProgress(progress)
  })

  const inputName = 'input.mp4'
  const paletteName = 'palette.png'
  const outputName = 'out.gif'

  await ffmpeg.writeFile(inputName, await fetchFile(file))

  const colorCount = quality === 'low' ? 256 : quality === 'medium' ? 128 : 64
  const scaleFilter =
    scale === 'original'
      ? 'scale=iw:ih'
      : scale === '720'
      ? "scale='min(1280,iw)':-2"
      : scale === '480'
      ? "scale='min(854,iw)':-2"
      : "scale='min(640,iw)':-2" // 360p

  // 1) Generate palette for better quality
  await ffmpeg.exec([
    '-ss', String(startTime),
    '-t', String(duration),
    '-i', inputName,
    '-vf', `fps=${fps},${scaleFilter},palettegen=max_colors=${colorCount}`,
    '-y', paletteName,
  ])

  // 2) Use palette to produce final gif
  await ffmpeg.exec([
    '-ss', String(startTime),
    '-t', String(duration),
    '-i', inputName,
    '-i', paletteName,
    '-lavfi', `fps=${fps},${scaleFilter} [x]; [x][1:v] paletteuse=dither=bayer`,
    '-y', outputName,
  ])

  const data = (await ffmpeg.readFile(outputName)) as Uint8Array
  // Convert to a concrete ArrayBuffer to satisfy strict DOM typings
  const arrayBuffer = new ArrayBuffer(data.length)
  const view = new Uint8Array(arrayBuffer)
  view.set(data)
  const blob = new Blob([arrayBuffer], { type: 'image/gif' })
  return blob
}


