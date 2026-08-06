import { describe, expect, it } from 'vitest';
import { getAuthCopy } from '../authentication/content';
import { getHabitacaoCopy } from '../habitacao/content';
import { getIdentidadeCopy } from '../identidade/content';
import { getListingsCopy } from '../listings/content';
import { getConservationLabels } from '../listings/lib/manual-ops-labels';
import { getMonetizationCopy } from '../monetization/content';
import { getOpsCopy } from '../ops/content';
import { getExitReasons } from '../ops/format';
import { getPatrimoniosCopy } from '../patrimonios/content';
import { getSegurancaCopy } from '../seguranca/content';
import { experienceLabel, modeBadgeLabel } from './experience-labels';
import { isAppLocale, normalizeLocale } from './types';

describe('locale', () => {
  it('normalizes locale codes', () => {
    expect(normalizeLocale('en-US')).toBe('en');
    expect(normalizeLocale('fr')).toBe('fr');
    expect(normalizeLocale('xx')).toBe('pt');
    expect(isAppLocale('es')).toBe(true);
  });

  it('exposes mode badges per locale', () => {
    expect(modeBadgeLabel('client', 'pt')).toBe('Modo Cliente');
    expect(modeBadgeLabel('client_partner', 'pt')).toBe('Modo Integrado');
    expect(modeBadgeLabel('patrimonial_partner', 'en')).toContain('Partner');
    expect(experienceLabel('client', 'fr')).toBe('Client');
  });

  it('localizes home and ops cockpits', () => {
    expect(getAuthCopy('en').app.welcome).toBe('Welcome');
    expect(getAuthCopy('fr').app.quickExploreHousing).toContain('Explorer');
    expect(getAuthCopy('es').app.welcome).toBe('Bienvenido');
    expect(getOpsCopy('en').client.title).toContain('Housing');
    expect(getOpsCopy('en').client.paymentsPaid).toBe('Payments made');
    expect(getOpsCopy('fr').client.paymentsPaid).toContain('Paiements');
    expect(getOpsCopy('es').client.title).toContain('vivienda');
  });

  it('does not mix Portuguese into French auth chrome', () => {
    const fr = getAuthCopy('fr');
    expect(fr.login.submit).toBe('Se connecter');
    expect(fr.app.loadError).toContain('Réessayez');
    expect(fr.app.loadError).not.toContain('Estamos a ter');
    expect(fr.app.loginRequired).toContain('connecter');
    expect(fr.common.sessionExpired).not.toMatch(/A sua sessão/);
    expect(fr.verify.otpSubmit).toContain('Confirmer');
  });

  it('keeps English login distinct from Portuguese', () => {
    expect(getAuthCopy('en').login.submit).toBe('Sign in');
    expect(getAuthCopy('pt').login.submit).toBe('Entrar');
  });

  it('does not mix Portuguese into French Security Center copy', () => {
    const fr = getSegurancaCopy('fr');
    expect(fr.title).toBe('Centre de Sécurité');
    expect(fr.client.loadError).not.toContain('Estamos a ter');
    expect(fr.client.loadError).not.toMatch(/Tente novamente/);
    expect(fr.client.otpErrors.invalid_code).toContain('Réessayez');
    expect(fr.scoreLabels.high).not.toBe('Alto');
    expect(fr.events.login_new).toBe('Nouvelle connexion');
  });

  it('does not mix Portuguese into French monetization copy', () => {
    const fr = getMonetizationCopy('fr');
    expect(fr.common.loadError).not.toContain('Estamos a ter');
    expect(fr.common.loadError).not.toMatch(/Tente novamente/);
    expect(fr.common.actionError).not.toContain('Não foi possível');
    expect(fr.smartMove.loadError).not.toContain('Estamos a ter');
    expect(fr.findHome.loadError).not.toContain('Estamos a ter');
    expect(fr.concierge.loadError).not.toContain('Estamos a ter');
    expect(fr.assistencia.loadError).not.toContain('Estamos a ter');
    expect(fr.garantia.loadError).not.toContain('Estamos a ter');
    expect(fr.marketplace.loadError).not.toContain('Estamos a ter');
  });

  it('does not mix Portuguese into French habitação/patrimónios copy', () => {
    const habitacaoFr = getHabitacaoCopy('fr');
    expect(habitacaoFr.loadError).not.toContain('Estamos a ter');
    expect(habitacaoFr.loadError).not.toMatch(/Tente novamente/);

    const patrimoniosFr = getPatrimoniosCopy('fr');
    expect(patrimoniosFr.loadError).not.toContain('Estamos a ter');
    expect(patrimoniosFr.loadError).not.toMatch(/Tente novamente/);
  });

  it('localizes the habitação client hub', () => {
    const fr = getHabitacaoCopy('fr');
    expect(fr.hub.eyebrow).toBe('Expérience Client');
    expect(fr.hub.eyebrow).not.toContain('Experiência');
    expect(fr.hub.emptyInterests).not.toMatch(/Ainda não/);

    const en = getHabitacaoCopy('en');
    expect(en.hub.eyebrow).toBe('Client Experience');

    const es = getHabitacaoCopy('es');
    expect(es.hub.eyebrow).toBe('Experiencia Cliente');
  });

  it('does not mix Portuguese into French ops resident/notify copy', () => {
    const fr = getOpsCopy('fr');
    expect(fr.resident).toBeDefined();
    expect(fr.resident.title).not.toMatch(/Tente novamente/);
    expect(fr.resident.exitError).not.toMatch(/Tente novamente/);
    expect(fr.resident.maintenanceError).not.toMatch(/Tente novamente/);
    expect(fr.notify.error).not.toMatch(/Tente novamente/);
    expect(fr.notify.activateLabel).toContain('notifier');
  });

  it('does not mix Portuguese into listings copy', () => {
    const fr = getListingsCopy('fr');
    expect(fr.reviews.saveError).not.toMatch(/Não conseguimos|Tente novamente/);
    expect(fr.reviews.title).toBe('Réputation & avis');
    expect(fr.subjects.property).toBe('Bien');

    const en = getListingsCopy('en');
    expect(en.reviews.saveError).not.toMatch(/Não conseguimos|Tente novamente/);

    const es = getListingsCopy('es');
    expect(es.reviews.saveError).not.toMatch(/Não conseguimos|Tente novamente/);
  });

  it('localizes the Trust Center (Centro de Confiança) copy', () => {
    const fr = getIdentidadeCopy('fr');
    expect(fr.trustCenter.title).toBe('Centre de Confiance Kuteka');
    expect(fr.trustCenter.title).not.toContain('Centro de Confiança');
    expect(fr.trustCenter.statusLabels.verified).not.toBe('Verificado');
    expect(fr.trustCenter.kycLevelLabels[2]).toContain('Niveau');

    const en = getIdentidadeCopy('en');
    expect(en.trustCenter.title).toBe('Kuteka Trust Center');
    expect(en.trustCenter.pillarMissingLabel).not.toMatch(/adicionado/);

    const es = getIdentidadeCopy('es');
    expect(es.trustCenter.title).toBe('Centro de Confianza Kuteka');
  });

  it('does not mix Portuguese into French ops exit reasons', () => {
    const fr = getExitReasons('fr');
    const compraCasa = fr.find((r) => r.value === 'compra_casa');
    expect(compraCasa?.label).not.toMatch(/Compra de casa/);
    expect(compraCasa?.label).toContain('logement');

    const pt = getExitReasons('pt');
    expect(pt.find((r) => r.value === 'compra_casa')?.label).toBe('Compra de casa');
  });

  it('localizes conservation labels for listings ops', () => {
    const fr = getConservationLabels('fr');
    expect(fr.good).not.toBe('Bom');
    expect(fr.good).toBe('Bon');

    const pt = getConservationLabels('pt');
    expect(pt.good).toBe('Bom');
  });
});
