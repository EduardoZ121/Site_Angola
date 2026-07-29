export function normalizePhoneDigits(phone) {
  return String(phone || '').replace(/\D/g, '')
}

/** Telefone móvel angolano: +244 9XX XXX XXX */
export function isValidAngolaPhone(phone) {
  const digits = normalizePhoneDigits(phone)
  if (!digits) return false
  if (digits.startsWith('244')) {
    return digits.length >= 12 && digits[3] === '9'
  }
  return digits.length === 9 && digits[0] === '9'
}

export function isProfileReadyToPublish(profile) {
  return Boolean(profile?.name?.trim()) && isValidAngolaPhone(profile?.phone)
}

export function getProfilePublishErrors(profile) {
  const errors = []
  if (!profile?.name?.trim()) {
    errors.push('Indique o seu nome em Minha conta.')
  }
  if (!profile?.phone?.trim()) {
    errors.push('Indique o telefone em Minha conta — compradores precisam de o contactar.')
  } else if (!isValidAngolaPhone(profile.phone)) {
    errors.push('Telefone inválido. Use um número angolano (+244 9XX XXX XXX).')
  }
  return errors
}
