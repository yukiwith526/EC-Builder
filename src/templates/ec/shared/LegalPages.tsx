import type { MouseEvent } from 'react'
import { useLayoutEffect } from 'react'
import { Selectable } from '../../../builder/Selectable'
import type { Selection, SiteData } from '../../../types/site'
import { CART_SHIPPING_FEE, yen } from './commerce'

export type LegalPageId = 'shipping' | 'tokushoho' | 'privacy'

const LEGAL_LINKS: { id: LegalPageId; label: string }[] = [
  { id: 'shipping', label: '配送・返品について' },
  { id: 'tokushoho', label: '特定商取引法に基づく表記' },
  { id: 'privacy', label: 'プライバシーポリシー' },
]

export function isLegalPage(page: string): page is LegalPageId {
  return page === 'shipping' || page === 'tokushoho' || page === 'privacy'
}

function shopContact(site: SiteData) {
  const cosmetics = site.templateId !== 'goods'
  const threshold = Math.max(0, Math.round(site.freeShippingThreshold ?? 0))
  const legal = site.legal
  return {
    name: site.brand.name.trim() || '当店',
    seller: legal?.seller.trim() ?? '',
    representative: legal?.representative.trim() ?? '',
    address: legal?.address.trim() ?? '',
    phone: legal?.phone.trim() ?? '',
    email: legal?.email.trim() ?? '',
    fee: CART_SHIPPING_FEE,
    threshold,
    cosmetics,
  }
}

function shippingSentence(fee: number, threshold: number) {
  if (threshold <= 0) return '送料は無料です。商品代金以外の料金はかかりません。'
  return `送料は全国一律 ${yen(fee)}（税込）です。${yen(threshold)} 以上のご購入で送料無料です。商品代金以外の料金は送料のみです。`
}

export function LegalPage({
  site,
  page,
  locked,
  selection,
  onSelect,
  onOpen,
}: {
  site: SiteData
  page: LegalPageId
  locked: boolean
  selection: Selection | null
  onSelect: (selection: Selection) => void
  onOpen: (event: MouseEvent, page: LegalPageId) => void
}) {
  useLayoutEffect(() => {
    document.getElementById('ec-builder-preview-stage')?.scrollTo({ top: 0 })
  }, [page])

  const shop = shopContact(site)
  const fieldProps = { locked, selection, onSelect }
  if (page === 'shipping') return <Shipping shop={shop} onOpen={onOpen} />
  if (page === 'tokushoho') return <Tokushoho shop={shop} onOpen={onOpen} {...fieldProps} />
  return <Privacy shop={shop} onOpen={onOpen} {...fieldProps} />
}

export function StorefrontFooter({
  site,
  page,
  locked,
  selected,
  onSelect,
  onOpen,
}: {
  site: SiteData
  page: string
  locked: boolean
  selected: boolean
  onSelect: () => void
  onOpen: (event: MouseEvent, page: LegalPageId) => void
}) {
  return (
    <Selectable disabled={locked} active={selected} onSelect={onSelect}>
      <footer className="sf-footer">
        <p className="sf-logo">{site.brand.name}</p>
        <p>{site.brand.tagline}</p>
        <nav className="sf-footer__nav" aria-label="ショップ情報">
          {LEGAL_LINKS.map((item) => (
            <button
              key={item.id}
              type="button"
              className={page === item.id ? 'is-on' : ''}
              onClick={(event) => onOpen(event, item.id)}
            >
              {item.label}
            </button>
          ))}
        </nav>
        <small>
          © {new Date().getFullYear()} {site.brand.name} All rights reserved.
        </small>
      </footer>
    </Selectable>
  )
}

function RelatedLinks({
  current,
  onOpen,
}: {
  current: LegalPageId
  onOpen: (event: MouseEvent, page: LegalPageId) => void
}) {
  const links = LEGAL_LINKS.filter((item) => item.id !== current)
  return (
    <p className="sf-legal__note">
      関連：
      {links.map((item, index) => (
        <span key={item.id}>
          {index > 0 ? ' ／ ' : ''}
          <button type="button" onClick={(event) => onOpen(event, item.id)}>
            {item.label}
          </button>
        </span>
      ))}
    </p>
  )
}

type LegalFields = {
  locked: boolean
  selection: Selection | null
  onSelect: (selection: Selection) => void
}

const LEGAL_PLACEHOLDERS = {
  seller: '（事業者名）',
  representative: '（代表者名）',
  address: '（所在地）',
  phone: '（電話番号）',
  email: '（メールアドレス）',
} as const

function LegalField({
  field,
  value,
  locked,
  selection,
  onSelect,
}: LegalFields & { field: keyof typeof LEGAL_PLACEHOLDERS; value: string }) {
  const type = `legal.${field}` as const
  const empty = value.length === 0
  return (
    <Selectable disabled={locked} active={selection?.type === type} onSelect={() => onSelect({ type })}>
      {field === 'email' && !empty ? (
        <a
          href={`mailto:${value}`}
          onClick={(event) => {
            if (!locked) event.preventDefault()
          }}
        >
          {value}
        </a>
      ) : (
        <span className={empty ? 'sf-legal__placeholder' : undefined}>{empty ? LEGAL_PLACEHOLDERS[field] : value}</span>
      )}
    </Selectable>
  )
}

function Shipping({
  shop,
  onOpen,
}: {
  shop: ReturnType<typeof shopContact>
  onOpen: (event: MouseEvent, page: LegalPageId) => void
}) {
  return (
    <section className="sf-legal">
      <p className="sf-kicker">SHIPPING & RETURNS</p>
      <h1>配送・返品について</h1>
      <p>お届けと、万一のときのご案内です。</p>

      <h2>配送について</h2>
      <p>日本国内のみお届けします。海外への発送は行っておりません。</p>
      <p>
        配送業者は当店指定となります。決済確認後、原則2〜7営業日以内に発送し、発送完了後に追跡番号をメールでお知らせします。在庫切れや天候・交通事情により遅れる場合は、メールでご連絡します。
      </p>

      <h2>送料</h2>
      <p>{shippingSentence(shop.fee, shop.threshold)}</p>

      <h2>ご注文前のご確認</h2>
      <p>
        {shop.cosmetics
          ? 'コスメは香りや色の感じ方がお一人さまごとに異なります。ご注文前に、商品名、カラー、香り、数量をお確かめください。'
          : 'ご注文前に、商品名と数量をお確かめください。'}
      </p>
      <p>通信販売のため、クーリング・オフの適用はありません。</p>

      <h2>返品できる条件</h2>
      <p>
        {shop.cosmetics
          ? '未開封・未使用の商品に限ります。コスメは衛生上、開封済み・使用済み、お客様都合の汚れ・破損はお受けできません。'
          : '未開封・未使用の商品に限ります。衛生商品は、開封済み・使用済み、お客様都合の汚れ・破損はお受けできません。'}
      </p>
      <p>不良品、誤配送、配送中の破損は、開封後でも当店負担で良品と交換、または返金します。</p>

      <h2>連絡・返送の期限</h2>
      <p>
        商品の到着日を起算日として7日以内に {shop.email || '当店のお問い合わせ先'} へメールでご連絡ください。
      </p>
      <p>当店からの返品案内後、7日以内に指定の住所へ商品を返送してください。</p>
      <p>お客様都合の返品は、返送料をお客様負担とします。不良品・誤配送・配送中破損の返送料は当店負担です。</p>

      <h2>返金方法</h2>
      <p>
        返金は、お支払いいただいたクレジットカードへ行います。返送商品の到着と状態確認後、原則7営業日以内に手続きします。カード会社の反映まで数日かかることがあります。
      </p>
      <RelatedLinks current="shipping" onOpen={onOpen} />
    </section>
  )
}

function Tokushoho({
  shop,
  onOpen,
  locked,
  selection,
  onSelect,
}: {
  shop: ReturnType<typeof shopContact>
  onOpen: (event: MouseEvent, page: LegalPageId) => void
} & LegalFields) {
  const shipping =
    shop.threshold <= 0
      ? '送料無料。'
      : `全国一律 ${yen(shop.fee)}（税込）。${yen(shop.threshold)} 以上で送料無料。`
  return (
    <section className="sf-legal">
      <p className="sf-kicker">LEGAL</p>
      <h1>特定商取引法に基づく表記</h1>
      <p>通信販売についての広告に基づき、以下を明示します。</p>
      <dl className="sf-legal__dl">
        <dt>販売業者</dt>
        <dd>
          <LegalField field="seller" value={shop.seller} locked={locked} selection={selection} onSelect={onSelect} />
        </dd>
        <dt>運営統括責任者</dt>
        <dd>
          <LegalField field="representative" value={shop.representative} locked={locked} selection={selection} onSelect={onSelect} />
        </dd>
        <dt>所在地</dt>
        <dd>
          <LegalField field="address" value={shop.address} locked={locked} selection={selection} onSelect={onSelect} />
        </dd>
        <dt>電話番号</dt>
        <dd>
          <LegalField field="phone" value={shop.phone} locked={locked} selection={selection} onSelect={onSelect} />
        </dd>
        <dt>メールアドレス</dt>
        <dd>
          <LegalField field="email" value={shop.email} locked={locked} selection={selection} onSelect={onSelect} />
        </dd>
        <dt>販売価格</dt>
        <dd>各商品ページに税込で表示します。</dd>
        <dt>送料</dt>
        <dd>{shipping}</dd>
        <dt>商品代金以外の必要料金</dt>
        <dd>{shop.threshold <= 0 ? '商品代金以外の料金はかかりません。' : '送料のみです。代引きは取り扱っておりません。'}</dd>
        <dt>支払方法</dt>
        <dd>クレジットカード。ご注文の確定時に課金します。</dd>
        <dt>引渡時期</dt>
        <dd>決済確認後、原則2〜7営業日以内に発送します。</dd>
        <dt>返品・交換</dt>
        <dd>
          未開封・未使用品は到着後7日以内にご連絡ください。お客様都合の返送料はお客様負担です。不良品・誤配送・配送中の破損は当店負担で交換または返金します。返金はご利用のクレジットカードへ行います。通信販売のため、クーリング・オフの適用はありません。
        </dd>
        <dt>販売条件</dt>
        <dd>
          {shop.cosmetics
            ? '日本国内への配送に限ります。ご注文前に、商品名、カラー、香り、数量をご確認ください。'
            : '日本国内への配送に限ります。ご注文前に、商品名と数量をご確認ください。'}
        </dd>
      </dl>
      <RelatedLinks current="tokushoho" onOpen={onOpen} />
    </section>
  )
}

function Privacy({
  shop,
  onOpen,
  locked,
  selection,
  onSelect,
}: {
  shop: ReturnType<typeof shopContact>
  onOpen: (event: MouseEvent, page: LegalPageId) => void
} & LegalFields) {
  return (
    <section className="sf-legal">
      <p className="sf-kicker">PRIVACY</p>
      <h1>プライバシーポリシー</h1>
      <p>お客さまの個人情報を、大切に取り扱います。</p>
      <p>
        {shop.seller || shop.name}（以下「当店」）は、{shop.name} オンラインショップにおける個人情報を、以下のとおり取り扱います。
      </p>

      <h2>1. 事業者・お問い合わせ窓口</h2>
      <dl className="sf-legal__dl">
        <dt>事業者名</dt>
        <dd>
          <LegalField field="seller" value={shop.seller} locked={locked} selection={selection} onSelect={onSelect} />
        </dd>
        <dt>住所</dt>
        <dd>
          <LegalField field="address" value={shop.address} locked={locked} selection={selection} onSelect={onSelect} />
        </dd>
        <dt>代表者</dt>
        <dd>
          <LegalField field="representative" value={shop.representative} locked={locked} selection={selection} onSelect={onSelect} />
        </dd>
        <dt>お問い合わせ先</dt>
        <dd>
          <LegalField field="email" value={shop.email} locked={locked} selection={selection} onSelect={onSelect} />
        </dd>
      </dl>

      <h2>2. 取得する情報</h2>
      <p>
        当店は、商品のご注文、お問い合わせに際して、お名前、メールアドレス、郵便番号、住所、注文内容、お問い合わせ内容を取得します。決済に伴う情報も取得しますが、クレジットカード番号は決済代行会社が処理し、当店では保持しません。
      </p>
      <p>また、カート内容の保持に、ご利用端末の保存領域（localStorage）を使用します。</p>

      <h2>3. 利用目的</h2>
      <p>
        取得した情報は、注文の受付、決済、商品の配送、注文に関するメールの送信、お問い合わせへの対応、返品・返金への対応、法令に基づく対応のために利用します。
      </p>

      <h2>4. 業務の委託</h2>
      <p>
        当店は、利用目的の達成に必要な範囲で、決済処理を決済代行会社に、サイトの配信およびデータの保管を委託先に委託します。また、商品の配送に必要な氏名・住所等を配送業者に渡します。
      </p>

      <h2>5. 保管・安全管理</h2>
      <p>
        当店は、注文・顧客情報を、取引への対応および法令上必要な期間保管し、保管の必要がなくなった情報を適切に削除します。
      </p>
      <p>
        個人情報へのアクセスを業務上必要な範囲に限定し、サイトとの通信の暗号化など、情報の漏えい等を防ぐための措置を講じます。
      </p>

      <h2>6. 開示等の請求・苦情</h2>
      <p>
        当店が保有するご自身の個人データについて、利用目的の通知、開示、訂正、追加、削除、利用停止等を希望される場合や、取扱いに関する苦情は、上記お問い合わせ先へご連絡ください。ご本人であることを確認のうえ、法令に従って対応します。
      </p>

      <h2>7. 端末内の保存領域</h2>
      <p>カート内容の保持に localStorage を使用します。広告目的の追跡は行いません。</p>
      <RelatedLinks current="privacy" onOpen={onOpen} />
    </section>
  )
}
