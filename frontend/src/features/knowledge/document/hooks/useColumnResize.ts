// SPDX-FileCopyrightText: 2025 Weibo, Inc.
//
// SPDX-License-Identifier: Apache-2.0

import { useState, useEffect, useRef, useCallback } from 'react'

interface UseColumnResizeOptions {
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
 * Provides temporary column width adjustment without persistence.
 * Width resets to default on page reload.
 */
export function useColumnResize({
  defaultWidth,
  minWidth,
  maxWidth,
}: UseColumnResizeOptions) {
  const [width, setWidth] = useState(defaultWidth)
  const [isResizing, setIsResizing] = useState(false)
  const widthRef = useRef(width)
  const startXRef = useRef(0)
  const startWidthRef = useRef(0)

  useEffect(() => {
    widthRef.current = width
  }, [width])

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
  }, [isResizing, minWidth, maxWidth])

  return { width, isResizing, handleMouseDown }
}
