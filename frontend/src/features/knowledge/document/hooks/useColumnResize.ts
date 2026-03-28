// SPDX-FileCopyrightText: 2025 Weibo, Inc.
//
// SPDX-License-Identifier: Apache-2.0

import { useState, useEffect, useRef, useCallback } from 'react'

/**
 * Read initial width from localStorage, falling back to defaultWidth
 * if the stored value is missing or out of range.
 */
function getInitialWidth(
  storageKey: string,
  defaultWidth: number,
  minWidth: number,
  maxWidth: number
): number {
  if (typeof window === 'undefined') return defaultWidth
  try {
    const saved = localStorage.getItem(storageKey)
    if (saved) {
      const width = parseInt(saved, 10)
      if (!isNaN(width) && width >= minWidth && width <= maxWidth) {
        return width
      }
    }
  } catch {
    // localStorage may be unavailable in private browsing mode
  }
  return defaultWidth
}

interface UseColumnResizeOptions {
  /** localStorage key for persisting the width */
  storageKey: string
  /** Default column width in pixels */
  defaultWidth: number
  /** Minimum allowed width in pixels */
  minWidth: number
  /** Maximum allowed width in pixels */
  maxWidth: number
}

/**
 * Hook for resizable table column width via mouse drag.
 *
 * Follows the same mouse-event pattern used by DocumentPanel and
 * ResizableSidebar in this codebase.
 */
export function useColumnResize({
  storageKey,
  defaultWidth,
  minWidth,
  maxWidth,
}: UseColumnResizeOptions) {
  const [width, setWidth] = useState(() =>
    getInitialWidth(storageKey, defaultWidth, minWidth, maxWidth)
  )
  const [isResizing, setIsResizing] = useState(false)
  const widthRef = useRef(width)
  const startXRef = useRef(0)
  const startWidthRef = useRef(0)

  useEffect(() => {
    widthRef.current = width
  }, [width])

  const saveWidth = useCallback(
    (w: number) => {
      try {
        localStorage.setItem(storageKey, w.toString())
      } catch {
        // localStorage may be unavailable
      }
    },
    [storageKey]
  )

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    startXRef.current = e.clientX
    startWidthRef.current = widthRef.current
    setIsResizing(true)
  }, [])

  useEffect(() => {
    if (!isResizing) return

    const handleMouseMove = (e: MouseEvent) => {
      const delta = e.clientX - startXRef.current
      const newWidth = Math.max(minWidth, Math.min(maxWidth, startWidthRef.current + delta))
      setWidth(newWidth)
    }

    const handleMouseUp = () => {
      setIsResizing(false)
      saveWidth(widthRef.current)
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
    document.body.style.userSelect = 'none'
    document.body.style.cursor = 'col-resize'

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
      document.body.style.userSelect = ''
      document.body.style.cursor = ''
    }
  }, [isResizing, minWidth, maxWidth, saveWidth])

  return { width, isResizing, handleMouseDown }
}
