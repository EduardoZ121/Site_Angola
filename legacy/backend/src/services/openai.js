import OpenAI from 'openai'
import { env } from '../config/env.js'

let client = null

function getClient() {
  if (!env.openaiApiKey) return null
  if (!client) client = new OpenAI({ apiKey: env.openaiApiKey })
  return client
}

export function isOpenAiConfigured() {
  return Boolean(env.openaiApiKey)
}

export async function generateListingDescription({ title, category, operation, province, municipality, bedrooms, price, notes }) {
  const openai = getClient()
  if (!openai) {
    return {
      ok: false,
      error: 'OPENAI_API_KEY não configurada. Adicione a chave no ficheiro .env',
    }
  }

  const prompt = [
    'És um copywriter imobiliário para o mercado angolano (Kuteka).',
    'Escreve uma descrição clara, honesta e apelativa em português de Angola.',
    'Máximo 120 palavras. Sem emojis. Destaca localização e tipo de negócio.',
    '',
    `Título: ${title || '—'}`,
    `Categoria: ${category || '—'}`,
    `Operação: ${operation || '—'}`,
    `Província: ${province || '—'}`,
    `Município: ${municipality || '—'}`,
    `Quartos: ${bedrooms ?? '—'}`,
    `Preço (Kz): ${price ?? '—'}`,
    `Notas do proprietário: ${notes || '—'}`,
  ].join('\n')

  const completion = await openai.chat.completions.create({
    model: env.openaiModel,
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.7,
    max_tokens: 300,
  })

  return {
    ok: true,
    description: completion.choices[0]?.message?.content?.trim() || '',
    model: env.openaiModel,
  }
}

export async function naturalLanguageSearch({ query, filters }) {
  const openai = getClient()
  if (!openai) {
    return { ok: false, error: 'OPENAI_API_KEY não configurada' }
  }

  const system = [
    'Converte pedidos em português para filtros JSON de um marketplace imobiliário em Angola.',
    'Campos possíveis: category, operation, province, municipality, neighborhood, propertyType,',
    'minPrice, maxPrice, bedrooms, minArea, maxArea, fuel, gearbox.',
    'Responde só JSON válido, sem markdown.',
  ].join(' ')

  const completion = await openai.chat.completions.create({
    model: env.openaiModel,
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: system },
      {
        role: 'user',
        content: JSON.stringify({ query, currentFilters: filters || {} }),
      },
    ],
    temperature: 0.2,
    max_tokens: 400,
  })

  try {
    const parsed = JSON.parse(completion.choices[0]?.message?.content || '{}')
    return { ok: true, filters: parsed.filters || parsed, model: env.openaiModel }
  } catch {
    return { ok: false, error: 'Resposta IA inválida' }
  }
}
