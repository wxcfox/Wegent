// SPDX-FileCopyrightText: 2025 Weibo, Inc.
//
// SPDX-License-Identifier: Apache-2.0

import { useState, useEffect, useRef, useCallback } from 'react'

/** localStorage key for persisting the document name column width */
const STORAGE_KEY = 'knowledge-doc-column-width'

/** Read the persisted column width from localStorage, or return null if unavailable */
function loadPersistedWidth(): number | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (raw === null) return null
    const parsed = Number(raw)
    return Number.isFinite(parsed) && parsed > 0 ? parsed : null
  } catch {
    return null
  }
}

/** Persist the column width to localStorage */
function savePersistedWidth(width: number): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(STORAGE_KEY, String(width))
  } catch {
    // Storage quota exceeded or access denied — ignore silently
  }
}

/**
 * Hook for resizable table column width via mouse drag with localStorage persistence.
 *
 * The column keeps its original CSS layout (e.g. flex-1) by default.
 * When the user drags the resize handle, the hook captures the
 * element's rendered width and switches to a fixed pixel value that
 * follows the mouse. The width is persisted in localStorage under
 * the key "knowledge-doc-column-width" so it survives page reloads.
 */
export function useColumnResize() {
  // Initialise from localStorage so the user's last setting is restored immediately
  const [widthOverride, setWidthOverride] = useState<number | null>(loadPersistedWidth)
  const [isResizing, setIsResizing] = useState(false)
  const widthRef = useRef<number>(0)
  const startXRef = useRef(0)
  const startWidthRef = useRef(0)
  // Ref attached to the column header element so we can measure it
  const columnRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (widthOverride !== null) {
      widthRef.current = widthOverride
    }
  }, [widthOverride])

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    // Measure the current rendered width from the DOM
    const el = columnRef.current
    const currentWidth = el ? el.getBoundingClientRect().width : 200
    startXRef.current = e.clientX
    startWidthRef.current = currentWidth
    widthRef.current = currentWidth
    setWidthOverride(currentWidth)
    setIsResizing(true)
  }, [])

  useEffect(() => {
    if (!isResizing) return

    const MIN_WIDTH = 120
    const MAX_WIDTH = 1200

    const handleMouseMove = (e: MouseEvent) => {
      const delta = e.clientX - startXRef.current
      const newWidth = Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, startWidthRef.current + delta))
      widthRef.current = newWidth
      setWidthOverride(newWidth)
    }

    const handleMouseUp = () => {
      setIsResizing(false)
      // Persist the final width once the drag is complete
      if (widthRef.current > 0) {
        savePersistedWidth(widthRef.current)
      }
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
  }, [isResizing])

  return { widthOverride, isResizing, handleMouseDown, columnRef }
}
