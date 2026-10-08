import type { ReactNode } from 'react'

// The shop assistant's replies sometimes come back as lightweight
// Markdown (bold `**text**`, "- " bullet lists) — useful for things like
// side-by-side product comparisons, but previously rendered as raw text
// in the chat bubble, so a shopper saw literal "**" and "-" characters.
// This is a small hand-rolled renderer (bold + bullets only, the two
// patterns actually seen from the model) rather than a full Markdown
// library/dependency, and builds React elements directly instead of
// using dangerouslySetInnerHTML, so there's no HTML-injection risk from
// model output.

function renderInline(text: string, keyPrefix: string): ReactNode[] {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, i) => {
    const match = part.match(/^\*\*([^*]+)\*\*$/)
    return match ? <strong key={`${keyPrefix}-${i}`}>{match[1]}</strong> : part
  })
}

export function renderChatContent(content: string): ReactNode {
  const blocks: ReactNode[] = []
  let listItems: string[] = []
  let key = 0

  function flushList() {
    if (listItems.length === 0) return
    blocks.push(
      <ul className="chat-widget__message-list" key={`list-${key++}`}>
        {listItems.map((item, i) => (
          <li key={i}>{renderInline(item, `li-${key}-${i}`)}</li>
        ))}
      </ul>,
    )
    listItems = []
  }

  for (const line of content.split('\n')) {
    const bulletMatch = line.match(/^[-*]\s+(.*)$/)
    if (bulletMatch) {
      listItems.push(bulletMatch[1])
      continue
    }
    flushList()
    if (line.trim() === '') continue
    blocks.push(
      <p className="chat-widget__message-line" key={`line-${key++}`}>
        {renderInline(line, `p-${key}`)}
      </p>,
    )
  }
  flushList()

  return blocks
}
