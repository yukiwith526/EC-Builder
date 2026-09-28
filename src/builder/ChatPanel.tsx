import { useEffect, useMemo, useState, type FormEvent, type KeyboardEvent } from 'react'
import { createAIService } from '../ai/service'
import { createId } from '../site/ids'
import { loadChat, saveChat, type ChatMessage } from '../site/storage'
import { isProductSelection, selectionLabel, type Selection, type SiteData } from '../types/site'
import { setBrandName, setLegal } from '../site/update'
import { useSite } from '../site/SiteContext'
import { CategoryEditor } from './CategoryEditor'
import { Inspector } from './Inspector'
import { ProductComposer } from './ProductComposer'
import { brandInputPlaceholder, introMessage, isStaleIntro } from '../templates/voice'

const ai = createAIService()

export function ChatPanel() {
  const { site, selection, setSelection, saveSite } = useSite()
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>(() => (site ? messagesForSite(site) : []))

  useEffect(() => {
    if (!site) return
    setMessages(messagesForSite(site))
  }, [site?.id])

  useEffect(() => {
    if (!site || messages.length === 0) return
    saveChat(site.id, messages)
  }, [site?.id, messages])

  const canSend = useMemo(() => input.trim().length > 0 && !busy && site, [input, busy, site])
  if (!site) return null

  const step = site.setupStep ?? 'done'
  const canSelect = step === 'done'
  const showComposer = step === 'brand' || step === 'seller' || step === 'products' || step === 'done'
  const chatSelection = step === 'products' ? { type: 'products' as const } : selection

  const send = async (text: string) => {
    const message = text.trim()
    if (!message || busy) return
    setInput('')
    setMessages((current) => [...current, { id: createId('msg'), role: 'user', text: message }])
    setBusy(true)
    try {
      if (step === 'brand') {
        const name = extractBrandName(message)
        saveSite({ ...setBrandName(site, name), setupStep: 'seller' })
        setMessages((current) => [
          ...current,
          {
            id: createId('msg'),
            role: 'assistant',
            text: `ブランド名を「${name}」にしました。次に、特定商取引法とプライバシーポリシーに載せる事業者名を教えてください。例：株式会社フルール`,
          },
        ])
        return
      }

      if (step === 'seller') {
        const seller = extractSellerName(message)
        saveSite({ ...setLegal(site, { seller }), setupStep: 'categories' })
        setMessages((current) => [
          ...current,
          {
            id: createId('msg'),
            role: 'assistant',
            text: `事業者名を「${seller}」にしました。次に、販売するカテゴリを整えてください。左のリストで編集・追加・削除できます。`,
          },
        ])
        return
      }

      const result = await ai.sendMessage(message, site, chatSelection)
      saveSite(result.site)
      const updated = productIdFromOperations(result.operations)
      if (updated) setSelection({ type: updated.field, id: updated.id })
      setMessages((current) => [...current, { id: createId('msg'), role: 'assistant', text: result.reply }])
    } catch (error) {
      setMessages((current) => [
        ...current,
        {
          id: createId('msg'),
          role: 'assistant',
          text: error instanceof Error ? error.message : 'AIの更新に失敗しました。',
        },
      ])
    } finally {
      setBusy(false)
    }
  }

  const finishSetup = () => {
    saveSite({ ...site, setupStep: 'done' })
    setMessages((current) => [
      ...current,
      {
        id: createId('msg'),
        role: 'assistant',
        text: 'プレビュー編集を開始します。右側をクリックすると、文章や画像を選べます。',
      },
    ])
  }

  const compactChat = step === 'products' || isProductSelection(selection)
  const composer = (
        <form className={`composer${compactChat ? ' composer--compact' : ''}`} onSubmit={(event: FormEvent) => { event.preventDefault(); void send(input) }}>
          <textarea
            rows={compactChat ? 1 : 2}
            value={input}
            placeholder={composerHint(site.templateId, step, canSelect, chatSelection)}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={(event: KeyboardEvent<HTMLTextAreaElement>) => {
              if (event.key !== 'Enter' || event.shiftKey) return
              if (event.nativeEvent.isComposing || event.keyCode === 229) return
              event.preventDefault()
              void send(input)
            }}
          />
          <button type="submit" disabled={!canSend}>
            送信
          </button>
        </form>
  )

  return (
    <aside className="chat-panel">
      {canSelect && selection && <p className="editing-chip">{selectionLabel(selection)}を編集中</p>}

      <div className="messages">
        {messages.map((item) => (
          <div key={item.id} className={`bubble bubble--${item.role}`}>
            {item.text}
          </div>
        ))}
        {busy && <div className="bubble bubble--assistant">プレビューを更新しています...</div>}
      </div>

      {step === 'categories' && (
        <>
          <CategoryEditor site={site} onChange={saveSite} />
          <button
            type="button"
            onClick={() => {
              saveSite({ ...site, setupStep: 'products' })
              setMessages((current) => [
                ...current,
                {
                  id: createId('msg'),
                  role: 'assistant',
                  text: '商品を追加します。下のチャットで「リップオイルを追加して」と頼むか、フォームから手入力できます。',
                },
              ])
            }}
          >
            次へ：商品を追加
          </button>
        </>
      )}

      {step === 'products' && (
        <>
          <ProductComposer
            site={site}
            onFinish={finishSetup}
            onChange={(next) => {
              saveSite(next)
              setMessages((current) => [
                ...current,
                {
                  id: createId('msg'),
                  role: 'assistant',
                  text: 'プレビューに商品を追加しました。続けて追加するか、下のリンクからプレビュー編集へ進めます。',
                },
              ])
            }}
          />
        </>
      )}

      {canSelect && selection && (
        <Inspector
          site={site}
          selection={selection}
          onChange={saveSite}
          onClear={() => setSelection(null)}
          onSelect={setSelection}
        />
      )}

      {showComposer && composer}
    </aside>
  )
}

function composerHint(templateId: SiteData['templateId'], step: SiteData['setupStep'], canSelect: boolean, selection: Selection | null) {
  if (step === 'brand') return brandInputPlaceholder(templateId)
  if (step === 'seller') return '事業者名を入力... 例：株式会社フルール'
  if (step === 'products') return '商品を追加して / 説明を書いて'
  if (canSelect && isProductSelection(selection) && selection.type !== 'product.image') {
    if (selection.type === 'product.usage') return '使い方を書いて'
    if (selection.type === 'product.ingredients') return '成分を書いて'
    return '説明を書いて / 使い方を書いて'
  }
  if (canSelect && selection) return `${selectionLabel(selection)}への指示（例：もっと高級感のあるコピーにして）`
  return 'メッセージを入力...'
}

function messagesForSite(site: SiteData): ChatMessage[] {
  const stored = loadChat(site.id)
  const intro = introMessage(site.templateId)
  if (stored) {
    const migrated = stored.map((item, index) =>
      index === 0 && item.role === 'assistant' && isStaleIntro(item.text, site.templateId)
        ? { ...item, text: intro }
        : item,
    )
    const introOnly = migrated.length === 1 && migrated[0]?.text === intro
    if (!(introOnly && site.setupStep !== 'brand')) return migrated
  }
  return seedMessages(site)
}

function seedMessages(site: SiteData): ChatMessage[] {
  const text =
    site.setupStep === 'brand'
      ? introMessage(site.templateId)
      : site.setupStep === 'seller'
        ? `ブランド名は「${site.brand.name}」です。特定商取引法とプライバシーポリシーに載せる事業者名を教えてください。例：株式会社フルール`
        : site.setupStep === 'categories'
        ? `「${site.brand.name}」のカテゴリを整えてください。リストで編集・追加・削除できます。`
        : site.setupStep === 'products'
          ? '商品を追加します。下のチャットに名前を送るか、フォームから手入力してください。写真はファイルからアップロードできます。'
          : `「${site.brand.name}」の編集を続けます。プレビューをクリックして選ぶか、指示を送ってください。`
  return [{ id: createId('msg'), role: 'assistant', text }]
}

function productIdFromOperations(operations: { path: string }[]) {
  const match = operations
    .map((item) => item.path.match(/^\/products\/([^/]+)\/(description|usage|ingredients)$/))
    .find((item): item is RegExpMatchArray => Boolean(item))
  if (!match?.[1] || !match[2]) return null
  const field = match[2]
  return {
    id: match[1],
    field: (field === 'usage' ? 'product.usage' : field === 'ingredients' ? 'product.ingredients' : 'product.description') as
      | 'product.description'
      | 'product.usage'
      | 'product.ingredients',
  }
}

function extractSellerName(message: string): string {
  const matched = message.match(/(?:事業者名|販売業者|会社名)[をは]\s*[「『"]?(.+?)[」』"]?\s*(?:にして|に変更|にする|です|。|$)/)
  if (matched?.[1]) return matched[1].replace(/(してください|して)$/, '').trim()
  return message.replace(/^(事業者名|販売業者|会社名)[をは]?/, '').replace(/(にして|です|。)$/, '').trim()
}

function extractBrandName(message: string): string {
  const matched = message.match(/ブランド名[をは][「『"]?(.+?)[」』"]?(?:に(?:して|変更|する)?|です)?/)
  if (matched?.[1]) return matched[1].replace(/(してください|して)$/, '').trim()
  return message.replace(/^ブランド名[をは]?/, '').replace(/(にして|です|。)$/, '').trim()
}
