'use client'

import { useEffect, useRef, useState } from 'react'

type Props = {
  videoFile: File
  onTimeSelect: (start: number, end: number) => void
  maxGifDuration?: number
}

export function TimelineSelector({ videoFile, onTimeSelect, maxGifDuration = 10 }: Props) {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const [duration, setDuration] = useState(0)
  const [start, setStart] = useState(0)
  const [end, setEnd] = useState(3)

  useEffect(() => {
    const url = URL.createObjectURL(videoFile)
    const v = videoRef.current
    if (v) {
      v.src = url
    }
    return () => URL.revokeObjectURL(url)
  }, [videoFile])

  useEffect(() => {
    onTimeSelect(start, end)
  }, [start, end, onTimeSelect])

  return (
    <div className="space-y-4">
      <video ref={videoRef} controls className="w-full bg-black" onLoadedMetadata={(e) => setDuration((e.target as HTMLVideoElement).duration)} />
      <div className="flex items-center gap-4">
        <label className="text-lg">Start: {start.toFixed(2)}s</label>
        <input type="range" min={0} max={Math.max(0, duration - 0.1)} value={start} step={0.1} onChange={(e) => {
          const s = Math.min(parseFloat(e.target.value), end - 0.1)
          setStart(s)
        }} className="w-full" />
      </div>
      <div className="flex items-center gap-4">
        <label className="text-lg">End: {end.toFixed(2)}s</label>
        <input type="range" min={start + 0.1} max={duration} value={end} step={0.1} onChange={(e) => {
          const eVal = parseFloat(e.target.value)
          setEnd(Math.min(eVal, start + maxGifDuration))
        }} className="w-full" />
      </div>
      <p className="text-gray-700">Max GIF length: {maxGifDuration}s</p>
    </div>
  )
}


