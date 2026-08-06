import { normalizeLocale, type AppLocale } from '../../i18n/types';
import { agenteCopyEn } from './en';
import { agenteCopyEs } from './es';
import { agenteCopyFr } from './fr';
import { agenteCopyPt, type AgenteCopy } from './pt';

const BY_LOCALE: Record<AppLocale, AgenteCopy> = {
  pt: agenteCopyPt,
  en: agenteCopyEn,
  fr: agenteCopyFr,
  es: agenteCopyEs,
};

export function getAgenteCopy(locale: AppLocale | string = 'pt'): AgenteCopy {
  return BY_LOCALE[normalizeLocale(locale)] ?? agenteCopyPt;
}

export type { AgenteCopy };
export { agenteCopyPt, agenteCopyEn, agenteCopyFr, agenteCopyEs };
