import type { SiteData } from '../types/site'
import { isGoodsTemplate } from '../templates/voice'
import {
  setAnnouncement,
  setBrandDescription,
  setBrandName,
  setBrandTagline,
  setHero,
  shortenText,
} from './update'

export function seedCopy(site: SiteData, name: string, concept: string): SiteData {
  const trimmedName = name.trim() || site.brand.name
  const trimmedConcept = concept.trim() || site.brand.concept
  let next = setBrandName(site, trimmedName)
  next = setBrandTagline(next, `${trimmedName} — ${shortenText(trimmedConcept, 24)}`)
  next = setBrandDescription(
    next,
    isGoodsTemplate(site.templateId)
      ? `${trimmedName} は、${trimmedConcept}。手にとるたびに、部屋の空気がすこし整うような体験をお届けします。`
      : `${trimmedName} は、${trimmedConcept}。手にとるたびに、少しだけ光が差し込むような体験をお届けします。`,
  )
  next = setHero(
    next,
    isGoodsTemplate(site.templateId)
      ? {
          title: 'HOME SCENT',
          subtitle: `${trimmedConcept}を、いちばんやさしいかたちで。`,
          kicker: 'FOR YOUR SPACE',
        }
      : {
          title: '肌に、光を。',
          subtitle: `${trimmedConcept}を、いちばんやさしいかたちで。`,
          kicker: 'NEW COLLECTION',
        },
  )
  next = setAnnouncement(next, `${trimmedName} オンラインストア ／ 送料無料キャンペーン実施中`)
  return next
}
