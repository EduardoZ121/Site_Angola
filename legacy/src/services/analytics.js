const listeners = []

export function trackEvent(name, payload = {}) {
  const event = {
    name,
    payload,
    at: new Date().toISOString(),
  }
  if (import.meta.env.DEV) {
    console.info('[analytics]', event)
  }
  listeners.forEach((listener) => listener(event))
}

export function onAnalyticsEvent(listener) {
  listeners.push(listener)
  return () => {
    const index = listeners.indexOf(listener)
    if (index >= 0) listeners.splice(index, 1)
  }
}

export const AnalyticsEvents = {
  VIEW_LISTING: 'view_listing',
  CONTACT_OWNER: 'contact_owner',
  CLICK_WHATSAPP: 'click_whatsapp',
  SAVE_FAVORITE: 'save_favorite',
  SHARE_LISTING: 'share_listing',
}
