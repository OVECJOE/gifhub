'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

type Props = {
  videoFile: File
  onTimeSelect: (start: number, end: number) => void
  onMetadata?: (duration: number, width: number, height: number) => void
  maxGifDuration?: number
}

export function TimelineSelector({ videoFile, onTimeSelect, onMetadata, maxGifDuration = 30 }: Props) {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const timelineRef = useRef<HTMLDivElement | null>(null)
  const [duration, setDuration] = useState(0)
  const [start, setStart] = useState(0)
  const [end, setEnd] = useState(Math.min(3, maxGifDuration))
  const [currentTime, setCurrentTime] = useState(0)
  const [isDragging, setIsDragging] = useState<'start' | 'end' | 'selection' | null>(null)
  const [dragOffset, setDragOffset] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)

  useEffect(() => {
    const url = URL.createObjectURL(videoFile)
    const v = videoRef.current
    if (v) {
      v.src = url
      v.addEventListener('timeupdate', () => setCurrentTime(v.currentTime))
      v.addEventListener('play', () => setIsPlaying(true))
      v.addEventListener('pause', () => setIsPlaying(false))
    }
    return () => {
      URL.revokeObjectURL(url)
      if (v) {
        v.removeEventListener('timeupdate', () => setCurrentTime(v.currentTime))
        v.removeEventListener('play', () => setIsPlaying(true))
        v.removeEventListener('pause', () => setIsPlaying(false))
      }
    }
  }, [videoFile])

  useEffect(() => {
    onTimeSelect(start, end)
  }, [start, end, onTimeSelect])

  const timeToPercent = useCallback(
    (time: number) => {
      if (!Number.isFinite(duration) || duration <= 0) return 0
      const clampedTime = Math.max(0, Math.min(time, duration))
      return (clampedTime / duration) * 100
    },
    [duration]
  )
  const percentToTime = useCallback(
    (percent: number) => {
      if (!Number.isFinite(duration) || duration <= 0) return 0
      if (!Number.isFinite(percent)) return 0
      const clampedPercent = Math.max(0, Math.min(percent, 100))
      return (clampedPercent / 100) * duration
    },
    [duration]
  )

  const clampTime = useCallback(
    (time: number) => {
      if (!Number.isFinite(time)) return 0
      if (!Number.isFinite(duration) || duration <= 0) return 0
      return Math.max(0, Math.min(time, duration))
    },
    [duration]
  )

  const handleTimelineClick = useCallback(
    (e: React.MouseEvent) => {
      if (!timelineRef.current || isDragging) return
      if (!Number.isFinite(duration) || duration <= 0) return

      const rect = timelineRef.current.getBoundingClientRect()
      const percent = ((e.clientX - rect.left) / rect.width) * 100
      const clickTime = clampTime(percentToTime(percent))

      if (videoRef.current) {
        videoRef.current.currentTime = clickTime
        setCurrentTime(clickTime)
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [isDragging, duration]
  )

  const handleMouseDown = useCallback(
    (e: React.MouseEvent, type: 'start' | 'end' | 'selection') => {
      e.preventDefault()
      e.stopPropagation()
      if (!Number.isFinite(duration) || duration <= 0) return
      setIsDragging(type)

      if (type === 'selection' && timelineRef.current) {
        const rect = timelineRef.current.getBoundingClientRect()
        const clickPercent = ((e.clientX - rect.left) / rect.width) * 100
        const selectionStartPercent = timeToPercent(start)
        const safeSelectionStartPercent = Number.isFinite(selectionStartPercent)
          ? selectionStartPercent
          : 0
        setDragOffset(clickPercent - safeSelectionStartPercent)
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [start, duration]
  )

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging || !timelineRef.current) return
      if (!Number.isFinite(duration) || duration <= 0) return

      const rect = timelineRef.current.getBoundingClientRect()
      const percent = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100))
      const time = percentToTime(percent)

      if (isDragging === 'start') {
        const proposedStart = Math.max(0, Math.min(time, end - 0.1))
        const newStart = clampTime(proposedStart)
        setStart(newStart)
        if (videoRef.current) {
          videoRef.current.currentTime = newStart
          setCurrentTime(newStart)
        }
      } else if (isDragging === 'end') {
        const proposedEnd = Math.max(start + 0.1, Math.min(time, start + maxGifDuration, duration))
        const newEnd = clampTime(proposedEnd)
        setEnd(newEnd)
        if (videoRef.current) {
          videoRef.current.currentTime = newEnd
          setCurrentTime(newEnd)
        }
      } else if (isDragging === 'selection') {
        const adjustedPercent = Number.isFinite(dragOffset) ? percent - dragOffset : percent
        const proposedStart = Math.max(
          0,
          Math.min(percentToTime(adjustedPercent), duration - Math.max(0, end - start))
        )
        const newStart = clampTime(proposedStart)
        const selectionDuration = Number.isFinite(end - start) ? Math.max(0, end - start) : 0
        const newEnd = clampTime(
          Math.min(newStart + selectionDuration, newStart + maxGifDuration, duration)
        )

        setStart(newStart)
        setEnd(newEnd)
        if (videoRef.current) {
          videoRef.current.currentTime = newStart
          setCurrentTime(newStart)
        }
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [isDragging, start, end, maxGifDuration, duration, dragOffset]
  )

  const handleMouseUp = useCallback(() => {
    setIsDragging(null)
    setDragOffset(0)
  }, [])

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDragging])

  const playSelection = useCallback(() => {
    if (!videoRef.current) return
    if (!Number.isFinite(duration) || duration <= 0) return

    const startSafe = clampTime(start)
    const endSafe = clampTime(end)

    videoRef.current.currentTime = startSafe
    videoRef.current.play()

    const checkTime = () => {
      if (videoRef.current && videoRef.current.currentTime >= endSafe) {
        videoRef.current.pause()
        videoRef.current.currentTime = startSafe
      } else if (videoRef.current && !videoRef.current.paused) {
        requestAnimationFrame(checkTime)
      }
    }
    requestAnimationFrame(checkTime)
  }, [start, end, clampTime, duration])

  const resetSelection = useCallback(() => {
    const defaultEnd = Math.min(3, maxGifDuration, duration)
    setStart(0)
    setEnd(defaultEnd)
    if (videoRef.current) {
      videoRef.current.currentTime = 0
      setCurrentTime(0)
    }
  }, [maxGifDuration, duration])

  return (
    <div className="space-y-6">
      {/* Video Player */}
      <div className="relative">
        <video
          ref={videoRef}
          controls
          className="w-full bg-black"
          onLoadedMetadata={(e) => {
            const v = e.target as HTMLVideoElement
            const d = Number.isFinite(v.duration) && v.duration > 0 ? v.duration : 0
            setDuration(d)
            // Initialize selection based on actual duration
            setStart(0)
            setEnd(Math.min(3, maxGifDuration, d))
            if (videoRef.current) {
              videoRef.current.currentTime = 0
            }
            setCurrentTime(0)
            if (onMetadata) onMetadata(d, v.videoWidth, v.videoHeight)
          }}
        />
      </div>

      {/* Enhanced Timeline */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium">Timeline Selection</h3>
          <div className="flex gap-2">
            <button
              onClick={playSelection}
              className={`px-3 py-1 text-white transition-colors text-sm ${
                isPlaying ? 'bg-gray-900 hover:bg-black' : 'bg-black hover:bg-gray-900'
              }`}
            >
              {isPlaying ? '⏸️ Playing Selection' : '▶️ Preview Selection'}
            </button>
            <button
              onClick={resetSelection}
              className="px-3 py-1 bg-white/80 text-black border border-gray-300 hover:bg-white transition-colors text-sm"
            >
              🔄 Reset
            </button>
          </div>
        </div>

        {/* Visual Timeline */}
        <div className="relative">
          <div
            ref={timelineRef}
            className="relative h-16 bg-gray-200 cursor-pointer border border-gray-300"
            onClick={handleTimelineClick}
          >
            {/* Timeline background */}
            <div className="absolute inset-0 bg-gradient-to-r from-gray-300 to-gray-400"></div>
            
            {/* Current time indicator */}
            <div
              className={`absolute top-0 w-0.5 h-full z-30 pointer-events-none transition-colors ${
                isPlaying ? 'bg-black' : 'bg-gray-500'
              }`}
              style={{ left: `${timeToPercent(currentTime)}%` }}
            >
              <div className={`absolute -top-1 -left-1 w-3 h-3 rotate-45 transition-colors ${
                isPlaying ? 'bg-black' : 'bg-gray-500'
              }`}>
                {isPlaying && (
                  <div className="absolute inset-0 bg-gray-400 animate-ping"></div>
                )}
              </div>
            </div>

            {/* Selection area */}
            <div
              className={`absolute top-0 h-full cursor-move z-10 border-2 transition-all ${
                isPlaying && currentTime >= start && currentTime <= end
                  ? 'bg-black/60 border-black shadow-lg'
                  : 'bg-gray-500/60 border-gray-700'
              }`}
              style={{
                left: `${timeToPercent(start)}%`,
                width: `${timeToPercent(end - start)}%`,
              }}
              onMouseDown={(e) => handleMouseDown(e, 'selection')}
            >
              {/* Selection label */}
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-white text-xs font-bold pointer-events-none">
                {isPlaying && currentTime >= start && currentTime <= end ? (
                  <span className="flex items-center gap-1">
                    <span className="animate-pulse">🎬</span>
                    {(end - start).toFixed(1)}s
                  </span>
                ) : (
                  `${(end - start).toFixed(1)}s`
                )}
              </div>
            </div>

            {/* Start handle */}
            <div
              className="absolute top-0 w-3 h-full bg-black cursor-w-resize z-20 hover:bg-gray-900 transition-colors"
              style={{ left: `${timeToPercent(start)}%` }}
              onMouseDown={(e) => handleMouseDown(e, 'start')}
            >
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-white text-xs">⟨</div>
            </div>

            {/* End handle */}
            <div
              className="absolute top-0 w-3 h-full bg-black cursor-e-resize z-20 hover:bg-gray-900 transition-colors"
              style={{ left: `${timeToPercent(end)}%` }}
              onMouseDown={(e) => handleMouseDown(e, 'end')}
            >
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-white text-xs">⟩</div>
            </div>

            {/* Time markers */}
            <div className="absolute bottom-0 left-0 right-0 h-4 pointer-events-none">
              {Array.from({ length: Math.min(11, Math.ceil(duration) + 1) }, (_, i) => {
                const time = (duration / 10) * i
                return (
                  <div
                    key={i}
                    className="absolute bottom-0 text-xs text-gray-600 transform -translate-x-1/2"
                    style={{ left: `${(i / 10) * 100}%` }}
                  >
                    {time.toFixed(0)}s
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Selection Info */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="bg-white/50 p-3 border border-gray-200/50">
            <div className="font-medium text-black">Start Time</div>
            <div className="text-lg">{start.toFixed(2)}s</div>
          </div>
          <div className="bg-white/50 p-3 border border-gray-200/50">
            <div className="font-medium text-black">End Time</div>
            <div className="text-lg">{end.toFixed(2)}s</div>
          </div>
          <div className="bg-white/50 p-3 border border-gray-200/50">
            <div className="font-medium text-black">Duration</div>
            <div className="text-lg">{(end - start).toFixed(2)}s</div>
            <div className="text-xs text-gray-600">Max: {maxGifDuration}s</div>
          </div>
        </div>

        {/* Quick Selection Buttons */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => {
              setStart(0)
              setEnd(Math.min(1, maxGifDuration, duration))
            }}
            className="px-3 py-1 bg-gray-200 hover:bg-gray-300 transition-colors text-sm"
          >
            1s
          </button>
          <button
            onClick={() => {
              setStart(0)
              setEnd(Math.min(3, maxGifDuration, duration))
            }}
            className="px-3 py-1 bg-gray-200 hover:bg-gray-300 transition-colors text-sm"
          >
            3s
          </button>
          <button
            onClick={() => {
              setStart(0)
              setEnd(Math.min(5, maxGifDuration, duration))
            }}
            className="px-3 py-1 bg-gray-200 hover:bg-gray-300 transition-colors text-sm"
          >
            5s
          </button>
          <button
            onClick={() => {
              setStart(0)
              setEnd(Math.min(10, maxGifDuration, duration))
            }}
            className="px-3 py-1 bg-gray-200 hover:bg-gray-300 transition-colors text-sm"
          >
            10s
          </button>
          <button
            onClick={() => {
              setStart(0)
              setEnd(Math.min(maxGifDuration, duration))
            }}
            className="px-3 py-1 bg-gray-200 hover:bg-gray-300 transition-colors text-sm"
          >
            Max ({maxGifDuration}s)
          </button>
        </div>

        {/* Instructions */}
        <div className="text-sm text-gray-600 bg-gray-100 p-3 border border-gray-200">
          <div className="font-medium mb-1">💡 How to use:</div>
          <ul className="space-y-1">
            <li>• <strong>Click timeline</strong> to jump to any time</li>
            <li>• <strong>Drag handles</strong> (⟨ ⟩) to adjust start/end times</li>
            <li>• <strong>Drag selection area</strong> to move the entire selection</li>
            <li>• <strong>Preview Selection</strong> button plays only your selected portion</li>
            <li>• <strong>Visual feedback</strong>: Gray indicator = paused, Black = playing, Selection darkens when active</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
