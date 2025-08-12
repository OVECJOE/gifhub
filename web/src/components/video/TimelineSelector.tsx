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
  const [activePointerId, setActivePointerId] = useState<number | null>(null)
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const initialPressPosRef = useRef<{ x: number; time: number } | null>(null)
  const lastTapRef = useRef<{ x: number; time: number } | null>(null)
  const longPressTriggeredRef = useRef<boolean>(false)
  
  const [zoomLevel, setZoomLevel] = useState(1) // 1x = full timeline, higher = zoomed in
  const [viewWindow, setViewWindow] = useState({ start: 0, end: 1 }) // 0-1 range of visible timeline
  const [wheelZoomCenter, setWheelZoomCenter] = useState(0.5) // Center point for zoom operations

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
      const normalizedTime = clampedTime / duration // 0-1 range
      
      // Map to visible window
      const windowRange = viewWindow.end - viewWindow.start
      if (normalizedTime < viewWindow.start || normalizedTime > viewWindow.end) {
        return normalizedTime < viewWindow.start ? -10 : 110 // Off-screen
      }
      
      const relativePosition = (normalizedTime - viewWindow.start) / windowRange
      return relativePosition * 100
    },
    [duration, viewWindow]
  )
  
  const percentToTime = useCallback(
    (percent: number) => {
      if (!Number.isFinite(duration) || duration <= 0) return 0
      if (!Number.isFinite(percent)) return 0
      const clampedPercent = Math.max(0, Math.min(percent, 100))
      
      // Map from visible window to actual time
      const windowRange = viewWindow.end - viewWindow.start
      const relativePosition = clampedPercent / 100
      const normalizedTime = viewWindow.start + (relativePosition * windowRange)
      return normalizedTime * duration
    },
    [duration, viewWindow]
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

  // Unified pointer handlers for mouse + touch
  const beginDrag = useCallback(
    (
      clientX: number,
      type: 'start' | 'end' | 'selection',
    ) => {
      if (!Number.isFinite(duration) || duration <= 0) return
      setIsDragging(type)
      if (type === 'selection' && timelineRef.current) {
        const rect = timelineRef.current.getBoundingClientRect()
        const clickPercent = ((clientX - rect.left) / rect.width) * 100
        const selectionStartPercent = timeToPercent(start)
        const safeSelectionStartPercent = Number.isFinite(selectionStartPercent)
          ? selectionStartPercent
          : 0
        setDragOffset(clickPercent - safeSelectionStartPercent)
      }
    },
    [duration, start, timeToPercent]
  )

  const handlePointerMoveWindow = useCallback(
    (e: PointerEvent) => {
      if (!isDragging || !timelineRef.current) return
      if (activePointerId !== null && e.pointerId !== activePointerId) return
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
    [isDragging, activePointerId, duration, percentToTime, clampTime, end, start, maxGifDuration, dragOffset]
  )

  const endDrag = useCallback(() => {
    setIsDragging(null)
    setDragOffset(0)
    setActivePointerId(null)
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current)
      longPressTimerRef.current = null
    }
    initialPressPosRef.current = null
    longPressTriggeredRef.current = false
  }, [])

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('pointermove', handlePointerMoveWindow)
      window.addEventListener('pointerup', endDrag)
      window.addEventListener('pointercancel', endDrag)
      return () => {
        window.removeEventListener('pointermove', handlePointerMoveWindow)
        window.removeEventListener('pointerup', endDrag)
        window.removeEventListener('pointercancel', endDrag)
      }
    }
  }, [isDragging, handlePointerMoveWindow, endDrag])

  const isDoubleTap = useCallback((clientX: number) => {
    const now = Date.now()
    const last = lastTapRef.current
    const DOUBLE_TAP_MS = 300
    const DOUBLE_TAP_PX = 30
    if (last && now - last.time < DOUBLE_TAP_MS && Math.abs(clientX - last.x) < DOUBLE_TAP_PX) {
      lastTapRef.current = null
      return true
    }
    lastTapRef.current = { x: clientX, time: now }
    return false
  }, [])

  const scheduleLongPress = useCallback((clientX: number) => {
    if (!timelineRef.current) return
    const rect = timelineRef.current.getBoundingClientRect()
    const PRESS_MS = 450
    initialPressPosRef.current = { x: clientX, time: Date.now() }
    if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current)
    longPressTimerRef.current = setTimeout(() => {
      // Begin selection by long-press: set start at press position, then drag to set end
      const percent = Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100))
      const startTime = clampTime(percentToTime(percent))
      setStart(startTime)
      const defaultEnd = clampTime(Math.min(startTime + 1, startTime + maxGifDuration, duration))
      setEnd(defaultEnd)
      setIsDragging('end')
      longPressTriggeredRef.current = true
    }, PRESS_MS)
  }, [clampTime, duration, maxGifDuration, percentToTime])

  const cancelLongPressIfMoved = useCallback((clientX: number) => {
    const MOVE_PX = 12
    const startPos = initialPressPosRef.current
    if (!startPos) return
    if (Math.abs(clientX - startPos.x) > MOVE_PX) {
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current)
        longPressTimerRef.current = null
      }
    }
  }, [])

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

  // Enhanced zoom and navigation functions
  const zoomIn = useCallback((centerPoint?: number) => {
    // Use wheelZoomCenter if no centerPoint provided (for button clicks)
    const effectiveCenterPoint = centerPoint ?? wheelZoomCenter
    
    const newZoomLevel = Math.min(zoomLevel * 2, 16) // Max 16x zoom
    const zoomFactor = newZoomLevel / zoomLevel
    
    // Calculate new view window centered on effectiveCenterPoint
    const windowRange = viewWindow.end - viewWindow.start
    const newWindowRange = windowRange / zoomFactor
    const centerTime = viewWindow.start + (windowRange * effectiveCenterPoint)
    
    const newStart = Math.max(0, centerTime - (newWindowRange * effectiveCenterPoint))
    const newEnd = Math.min(1, newStart + newWindowRange)
    
    setZoomLevel(newZoomLevel)
    setViewWindow({ start: newStart, end: newEnd })
  }, [zoomLevel, viewWindow, wheelZoomCenter])

  const zoomOut = useCallback(() => {
    const newZoomLevel = Math.max(zoomLevel / 2, 1) // Min 1x zoom
    if (newZoomLevel === 1) {
      setViewWindow({ start: 0, end: 1 })
    } else {
      const zoomFactor = zoomLevel / newZoomLevel
      const windowRange = viewWindow.end - viewWindow.start
      const newWindowRange = Math.min(1, windowRange * zoomFactor)
      
      // Use wheelZoomCenter for more intuitive zoom out behavior
      const centerTime = viewWindow.start + (windowRange * wheelZoomCenter)
      
      const newStart = Math.max(0, centerTime - (newWindowRange * wheelZoomCenter))
      const newEnd = Math.min(1, newStart + newWindowRange)
      
      setViewWindow({ start: newStart, end: newEnd })
    }
    setZoomLevel(newZoomLevel)
  }, [zoomLevel, viewWindow, wheelZoomCenter])

  const panTimeline = useCallback((direction: 'left' | 'right') => {
    if (zoomLevel <= 1) return // Can't pan when not zoomed
    
    const windowRange = viewWindow.end - viewWindow.start
    const panAmount = windowRange * 0.25 * (direction === 'left' ? -1 : 1)
    
    let newStart = viewWindow.start + panAmount
    let newEnd = viewWindow.end + panAmount
    
    // Keep within bounds
    if (newStart < 0) {
      newEnd = newEnd - newStart
      newStart = 0
    }
    if (newEnd > 1) {
      newStart = newStart - (newEnd - 1)
      newEnd = 1
    }
    
    setViewWindow({ start: Math.max(0, newStart), end: Math.min(1, newEnd) })
  }, [zoomLevel, viewWindow])

  const focusOnSelection = useCallback(() => {
    if (!Number.isFinite(duration) || duration <= 0) return
    
    const startNorm = start / duration
    const endNorm = end / duration
    const selectionRange = endNorm - startNorm
    
    // Add padding around selection (20% on each side)
    const padding = Math.min(0.2, selectionRange * 0.5)
    const newStart = Math.max(0, startNorm - padding)
    const newEnd = Math.min(1, endNorm + padding)
    const newRange = newEnd - newStart
    
    // Set appropriate zoom level
    const newZoomLevel = Math.min(16, Math.max(1, 1 / newRange))
    
    // Update wheelZoomCenter to center of selection for future zoom operations
    const selectionCenter = (startNorm + endNorm) / 2
    const windowCenter = (selectionCenter - newStart) / newRange
    setWheelZoomCenter(Math.max(0, Math.min(1, windowCenter)))
    
    setZoomLevel(newZoomLevel)
    setViewWindow({ start: newStart, end: newEnd })
  }, [start, end, duration])

  // Handle mouse wheel for zooming
  useEffect(() => {
    const timeline = timelineRef.current
    if (!timeline) return

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault()
      
      const rect = timeline.getBoundingClientRect()
      const centerPoint = (e.clientX - rect.left) / rect.width
      
      // Update wheelZoomCenter state for smooth zoom experience
      setWheelZoomCenter(centerPoint)
      
      if (e.deltaY < 0) {
        zoomIn(centerPoint)
      } else {
        zoomOut()
      }
    }

    // Add event listener with passive: false to allow preventDefault
    timeline.addEventListener('wheel', handleWheel, { passive: false })
    
    return () => {
      timeline.removeEventListener('wheel', handleWheel)
    }
  }, [zoomIn, zoomOut])

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
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h3 className="text-lg font-medium">Timeline Selection</h3>
          <div className="flex gap-2 flex-wrap">
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
            <button
              onClick={focusOnSelection}
              className="px-3 py-1 border border-gray-300 text-black hover:border-gray-500 transition-colors text-sm"
              disabled={end <= start}
            >
              🎯 Focus Selection
            </button>
          </div>
        </div>

        {/* Zoom and Navigation Controls */}
        {duration > 60 && (
          <div className="bg-gray-50 p-3 border border-gray-200">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Zoom:</span>
                <button
                  onClick={() => zoomOut()}
                  className="px-2 py-1 bg-gray-200 hover:bg-gray-300 text-sm"
                  disabled={zoomLevel <= 1}
                >
                  🔍−
                </button>
                <span className="text-sm min-w-12 text-center">{zoomLevel.toFixed(1)}x</span>
                <button
                  onClick={() => zoomIn()}
                  className="px-2 py-1 bg-gray-200 hover:bg-gray-300 text-sm"
                  disabled={zoomLevel >= 16}
                >
                  🔍+
                </button>
              </div>
              
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Navigate:</span>
                <button
                  onClick={() => panTimeline('left')}
                  className="px-2 py-1 bg-gray-200 hover:bg-gray-300 text-sm"
                  disabled={zoomLevel <= 1}
                >
                  ◀
                </button>
                <button
                  onClick={() => panTimeline('right')}
                  className="px-2 py-1 bg-gray-200 hover:bg-gray-300 text-sm"
                  disabled={zoomLevel <= 1}
                >
                  ▶
                </button>
              </div>

              <div className="text-xs text-gray-600">
                Viewing: {(viewWindow.start * duration).toFixed(1)}s - {(viewWindow.end * duration).toFixed(1)}s
                {zoomLevel > 1 && ' • Scroll to zoom • Drag to pan'}
              </div>
            </div>
          </div>
        )}

        {/* Visual Timeline */}
        <div className="relative">
            <div
              ref={timelineRef}
              className="relative h-16 bg-gray-200 cursor-pointer border border-gray-300 touch-none select-none"
              onClick={handleTimelineClick}
              onPointerDown={(e) => {
                // Prevent page scroll/zoom while interacting
                e.preventDefault()
                e.stopPropagation()
                if (activePointerId !== null) return
                setActivePointerId(e.pointerId)
                const clientX = e.clientX

                // Double-tap anywhere on timeline to grab and drag selection
                if (isDoubleTap(clientX)) {
                  beginDrag(clientX, 'selection')
                  return
                }

                // If pressed directly on handles or selection, start respective drag immediately via handlers below
                // Otherwise, schedule long-press to begin creating a selection
                scheduleLongPress(clientX)
              }}
              onPointerMove={(e) => {
                cancelLongPressIfMoved(e.clientX)
              }}
              onPointerUp={(e) => {
                // If long-press didn't trigger and no drag started, treat as simple seek handled by onClick
                if (longPressTimerRef.current) {
                  clearTimeout(longPressTimerRef.current)
                  longPressTimerRef.current = null
                }
                const wasDragging = isDragging !== null
                const wasLongPress = longPressTriggeredRef.current
                if (!wasDragging && !wasLongPress && timelineRef.current && Number.isFinite(duration) && duration > 0) {
                  const rect = timelineRef.current.getBoundingClientRect()
                  const percent = ((e.clientX - rect.left) / rect.width) * 100
                  const clickTime = clampTime(percentToTime(percent))
                  if (videoRef.current) {
                    videoRef.current.currentTime = clickTime
                    setCurrentTime(clickTime)
                  }
                }
                longPressTriggeredRef.current = false
                setActivePointerId(null)
              }}
              onPointerCancel={() => {
                if (longPressTimerRef.current) {
                  clearTimeout(longPressTimerRef.current)
                  longPressTimerRef.current = null
                }
                setActivePointerId(null)
              }}
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
              className={`absolute top-0 h-full ${isDragging ? 'cursor-grabbing' : 'cursor-grab'} z-10 border-2 transition-all ${
                isPlaying && currentTime >= start && currentTime <= end
                  ? 'bg-black/60 border-black shadow-lg'
                  : 'bg-gray-500/60 border-gray-700'
              }`}
              style={{
                left: `${timeToPercent(start)}%`,
                width: `${Math.max(0, timeToPercent(end) - timeToPercent(start))}%`,
              }}
              onPointerDown={(e) => {
                e.preventDefault()
                e.stopPropagation()
                if (activePointerId !== null) return
                setActivePointerId(e.pointerId)
                beginDrag(e.clientX, 'selection')
              }}
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
              className="absolute top-0 w-4 md:w-3 h-full bg-black cursor-w-resize z-20 hover:bg-gray-900 transition-colors"
              style={{ left: `${timeToPercent(start)}%` }}
              onPointerDown={(e) => {
                e.preventDefault()
                e.stopPropagation()
                if (activePointerId !== null) return
                setActivePointerId(e.pointerId)
                beginDrag(e.clientX, 'start')
              }}
            >
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-white text-xs">⟨</div>
            </div>

            {/* End handle */}
            <div
              className="absolute top-0 w-4 md:w-3 h-full bg-black cursor-e-resize z-20 hover:bg-gray-900 transition-colors"
              style={{ left: `${timeToPercent(end)}%` }}
              onPointerDown={(e) => {
                e.preventDefault()
                e.stopPropagation()
                if (activePointerId !== null) return
                setActivePointerId(e.pointerId)
                beginDrag(e.clientX, 'end')
              }}
            >
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-white text-xs">⟩</div>
            </div>

            {/* Enhanced Time markers */}
            <div className="absolute bottom-0 left-0 right-0 h-4 pointer-events-none">
              {(() => {
                const visibleDuration = (viewWindow.end - viewWindow.start) * duration
                const visibleStart = viewWindow.start * duration
                const visibleEnd = viewWindow.end * duration
                
                // Determine appropriate time interval based on visible duration
                let interval: number
                if (visibleDuration <= 10) interval = 1
                else if (visibleDuration <= 30) interval = 5
                else if (visibleDuration <= 120) interval = 10
                else if (visibleDuration <= 600) interval = 30
                else if (visibleDuration <= 1800) interval = 60
                else if (visibleDuration <= 3600) interval = 300
                else interval = 600
                
                const markers = []
                const startMark = Math.ceil(visibleStart / interval) * interval
                const endMark = Math.floor(visibleEnd / interval) * interval
                
                for (let time = startMark; time <= endMark; time += interval) {
                  const normalizedTime = time / duration
                  if (normalizedTime >= viewWindow.start && normalizedTime <= viewWindow.end) {
                    const percent = ((normalizedTime - viewWindow.start) / (viewWindow.end - viewWindow.start)) * 100
                    
                    const formatTime = (seconds: number) => {
                      if (seconds < 60) return `${seconds}s`
                      const mins = Math.floor(seconds / 60)
                      const secs = seconds % 60
                      return secs === 0 ? `${mins}m` : `${mins}m${secs}s`
                    }
                    
                    markers.push(
                      <div
                        key={time}
                        className="absolute bottom-0 text-xs text-gray-600 transform -translate-x-1/2"
                        style={{ left: `${percent}%` }}
                      >
                        {formatTime(time)}
                      </div>
                    )
                  }
                }
                
                return markers
              })()}
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
            <li>• <strong>Tap/click</strong> anywhere on the timeline to seek</li>
            <li>• <strong>Long&nbsp;press</strong> on the timeline to start a new selection, then drag to set the end</li>
            <li>• <strong>Double&nbsp;tap</strong> the timeline to grab and <strong>drag</strong> the whole selection</li>
            <li>• <strong>Drag handles</strong> (⟨ ⟩) to adjust start/end times precisely</li>
            <li>• <strong>Preview Selection</strong> plays only your selected portion</li>
            {duration > 60 && (
              <>
                <li>• <strong>Mouse wheel</strong> over timeline to zoom in/out</li>
                <li>• <strong>Focus Selection</strong> button zooms to your selected area</li>
                <li>• <strong>Pan buttons</strong> (◀ ▶) navigate when zoomed in</li>
              </>
            )}
            <li>• <strong>Visual feedback</strong>: Gray = paused, Black = playing; selection darkens when active</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
