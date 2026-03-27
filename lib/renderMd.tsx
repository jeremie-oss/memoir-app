import React from 'react'

/**
 * Minimal inline markdown renderer.
 * Handles **bold**, *italic*, and \n line breaks.
 */
export function renderMd(text: string): React.ReactNode[] {
  const result: React.ReactNode[] = []
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/)
  parts.forEach((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      result.push(<strong key={i} className="font-semibold">{part.slice(2, -2)}</strong>)
    } else if (part.startsWith('*') && part.endsWith('*') && part.length > 2) {
      result.push(<em key={i}>{part.slice(1, -1)}</em>)
    } else {
      const lines = part.split('\n')
      lines.forEach((line, j) => {
        if (j > 0) result.push(<br key={`br-${i}-${j}`} />)
        if (line) result.push(line)
      })
    }
  })
  return result
}
