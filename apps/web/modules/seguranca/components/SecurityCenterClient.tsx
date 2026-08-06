'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { Badge, Button, Heading, Text, buttonVariants } from '@kuteka/ui';
import { cn } from '@kuteka/shared';
import { useAppSession } from '@/modules/authentication/components/app-session';
import { useLocale } from '@/modules/i18n/LocaleProvider';
import { LOCALE_INTL_TAG } from '@/modules/i18n/types';
import { SessionStatusGate } from '@/modules/shell/components/SessionStatusGate';
import { SoftListSlot } from '@/modules/shell/components/SoftListSlot';
import { getSegurancaCopy, type SegurancaCopy } from '../content';
import {
  formatSecurityEvent,
  securityScoreLabel,
  type SecurityCenterSnapshot,
} from '../lib/security-center';
import {
  issueSecurityOtp,
  loadSecurityCenterSnapshot,
  revokeSecuritySession,
  verifySecurityOtp,
} from '../services/security-client';

function verifiedBadge(ok: boolean, copy: SegurancaCopy) {
  return ok ? (
    <Badge variant="success">{copy.verifiedBadge}</Badge>
  ) : (
    <Badge variant="warning">{copy.pendingBadge}</Badge>
  );
}

function kycLabel(level: number, copy: SegurancaCopy): string {
  if (level >= 4) return copy.kyc.complete;
  if (level >= 2) return copy.kyc.level.replace('{n}', String(level));
  if (level >= 1) return copy.kyc.initial;
  return copy.kyc.notStarted;
}

/**
 * Centro de Segurança — Identity & Security dashboard (ADR-026).
 */
export function SecurityCenterClient() {
  const { session, status: sessionStatus, error: sessionError } = useAppSession();
  const { locale } = useLocale();
  const copy = getSegurancaCopy(locale);
  const dateLocale = LOCALE_INTL_TAG[locale];
  const [snap, setSnap] = useState<SecurityCenterSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [challengeId, setChallengeId] = useState<string | null>(null);
  const [sandboxHint, setSandboxHint] = useState<string | null>(null);
  const [actionMsg, setActionMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const result = await loadSecurityCenterSnapshot();
    if (!result.ok) {
      setError(result.message);
      setSnap(null);
    } else {
      setError(null);
      setSnap(result.data);
      if (result.data.phone) setPhone(result.data.phone);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (sessionStatus === 'ready') void load();
    if (sessionStatus === 'error') setLoading(false);
  }, [load, sessionStatus]);

  async function onSendPhoneOtp() {
    setBusy(true);
    setActionMsg(null);
    setSandboxHint(null);
    const result = await issueSecurityOtp({
      channel: 'sms',
      purpose: 'phone_verify',
      destination: phone,
    });
    setBusy(false);
    if (!result.ok) {
      setActionMsg(result.message);
      return;
    }
    setChallengeId(result.data.challengeId);
    if (result.data.sandboxCode) {
      setSandboxHint(copy.actions.sandboxHint.replace('{code}', result.data.sandboxCode));
    }
    setActionMsg(copy.actions.codeSent);
  }

  async function onVerifyPhoneOtp() {
    if (!challengeId) return;
    setBusy(true);
    setActionMsg(null);
    const result = await verifySecurityOtp({ challengeId, code: otp });
    setBusy(false);
    if (!result.ok) {
      setActionMsg(result.message);
      return;
    }
    setActionMsg(copy.actions.phoneVerified);
    setChallengeId(null);
    setOtp('');
    setSandboxHint(null);
    void load();
  }

  async function onRevoke(sessionId: string) {
    setBusy(true);
    const result = await revokeSecuritySession(sessionId);
    setBusy(false);
    setActionMsg(result.ok ? copy.actions.sessionRevoked : result.message);
    if (result.ok) void load();
  }

  const activeDevices = snap?.devices.filter((d) => !d.revoked_at) ?? [];
  const openSessions = snap?.sessions.filter((s) => !s.revoked_at) ?? [];

  return (
    <SessionStatusGate status={sessionStatus} error={sessionError}>
      <div className="flex flex-col gap-5">
        <header className="kuteka-detail-panel p-5">
          <p className="kuteka-detail-eyebrow">{copy.eyebrow}</p>
          <Heading level={1}>{copy.title}</Heading>
          <Text className="mt-1 text-slate-700">{copy.subtitle}</Text>
          {session?.email ? <p className="kuteka-detail-meta mt-2">{session.email}</p> : null}
        </header>

        {error ? (
          <p className="rounded-kuteka border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900">
            {error}
          </p>
        ) : null}
        {actionMsg ? (
          <p
            className="rounded-kuteka border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800"
            role="status"
          >
            {actionMsg}
          </p>
        ) : null}

        <SoftListSlot pending={loading && !snap}>
          {snap ? (
            <>
              <section className="kuteka-detail-panel grid gap-4 p-5 sm:grid-cols-3">
                <div>
                  <p className="kuteka-detail-micro">{copy.securityLevel}</p>
                  <p className="mt-1 text-3xl font-semibold tabular-nums text-slate-900">
                    {snap.securityScore}
                    <span className="text-base font-normal text-slate-500">/100</span>
                  </p>
                  <p className="mt-1 text-sm font-medium text-slate-700">
                    {securityScoreLabel(snap.securityScore, locale)}
                  </p>
                </div>
                <div>
                  <p className="kuteka-detail-micro">{copy.emailLabel}</p>
                  <p className="mt-1 break-all text-sm font-medium text-slate-900">
                    {snap.email ?? '—'}
                  </p>
                  <div className="mt-2">{verifiedBadge(snap.emailVerified, copy)}</div>
                </div>
                <div>
                  <p className="kuteka-detail-micro">{copy.phoneLabel}</p>
                  <p className="mt-1 text-sm font-medium text-slate-900">{snap.phone ?? '—'}</p>
                  <div className="mt-2">{verifiedBadge(snap.phoneVerified, copy)}</div>
                </div>
              </section>

              <section className="kuteka-detail-panel grid gap-4 p-5 sm:grid-cols-3">
                <div>
                  <p className="kuteka-detail-micro">{copy.kycStatus}</p>
                  <p className="mt-1 font-semibold text-slate-900">
                    {kycLabel(snap.kycLevel, copy)}
                  </p>
                  <Link
                    href="/app/centro-confianca"
                    className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }), 'mt-2 px-0')}
                  >
                    {copy.openTrustCenter}
                  </Link>
                </div>
                <div>
                  <p className="kuteka-detail-micro">{copy.lastLogin}</p>
                  <p className="mt-1 text-sm text-slate-800">
                    {snap.lastLoginAt
                      ? new Date(snap.lastLoginAt).toLocaleString(dateLocale)
                      : copy.noRecordYet}
                  </p>
                </div>
                <div>
                  <p className="kuteka-detail-micro">{copy.mfaLabel}</p>
                  <p className="mt-1 text-sm text-slate-800">
                    {snap.mfaEnabled ? copy.mfaActive : copy.mfaPreparing}
                  </p>
                  <Badge className="mt-2" variant="default">
                    {snap.flags.mfaPrepared ? copy.infraReady : '—'}
                  </Badge>
                </div>
              </section>

              {!snap.phoneVerified ? (
                <section className="kuteka-detail-panel p-5" aria-labelledby="phone-verify">
                  <h2 id="phone-verify" className="kuteka-detail-title">
                    {copy.phoneVerifySection.title}
                  </h2>
                  <p className="mt-1 text-sm text-slate-600">{copy.phoneVerifySection.hint}</p>
                  <div className="mt-4 flex flex-col gap-3 sm:max-w-md">
                    <label className="text-sm font-medium text-slate-800" htmlFor="sec-phone">
                      {copy.phoneVerifySection.numberLabel}
                    </label>
                    <input
                      id="sec-phone"
                      className="rounded-kuteka border border-slate-300 bg-white px-3 py-2 text-slate-900"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+2449XXXXXXXX"
                      inputMode="tel"
                    />
                    <Button
                      type="button"
                      variant="secondary"
                      loading={busy}
                      disabled={busy || phone.trim().length < 8}
                      onClick={() => void onSendPhoneOtp()}
                    >
                      {copy.phoneVerifySection.sendCode}
                    </Button>
                    {sandboxHint ? <p className="text-sm text-amber-800">{sandboxHint}</p> : null}
                    {challengeId ? (
                      <>
                        <label className="text-sm font-medium text-slate-800" htmlFor="sec-otp">
                          {copy.phoneVerifySection.otpLabel}
                        </label>
                        <input
                          id="sec-otp"
                          className="rounded-kuteka border border-slate-300 bg-white px-3 py-2 tracking-[0.35em] text-slate-900"
                          value={otp}
                          onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                          inputMode="numeric"
                          autoComplete="one-time-code"
                          maxLength={6}
                          placeholder="••••••"
                        />
                        <Button
                          type="button"
                          loading={busy}
                          disabled={busy || otp.length !== 6}
                          onClick={() => void onVerifyPhoneOtp()}
                        >
                          {copy.phoneVerifySection.confirmPhone}
                        </Button>
                      </>
                    ) : null}
                  </div>
                </section>
              ) : null}

              <section className="kuteka-detail-panel p-5" aria-labelledby="devices">
                <h2 id="devices" className="kuteka-detail-title">
                  {copy.devices.title}
                </h2>
                {activeDevices.length === 0 ? (
                  <p className="mt-2 text-sm text-slate-600">{copy.devices.empty}</p>
                ) : (
                  <ul className="mt-3 divide-y divide-slate-200 rounded-kuteka border border-slate-200 bg-white">
                    {activeDevices.map((d) => (
                      <li key={d.id} className="px-4 py-3 text-sm text-slate-800">
                        <span className="font-medium">
                          {d.label ?? d.platform ?? copy.devices.fallbackName}
                        </span>
                        <span className="mt-0.5 block text-slate-500">
                          {copy.devices.seenAt.replace(
                            '{date}',
                            new Date(d.last_seen_at).toLocaleString(dateLocale),
                          )}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              <section className="kuteka-detail-panel p-5" aria-labelledby="sessions">
                <h2 id="sessions" className="kuteka-detail-title">
                  {copy.sessions.title}
                </h2>
                {openSessions.length === 0 ? (
                  <p className="mt-2 text-sm text-slate-600">
                    {copy.sessions.emptyPrefix}{' '}
                    <code className="text-xs">security.remote_session_revoke</code>
                    {copy.sessions.emptySuffix}
                  </p>
                ) : (
                  <ul className="mt-3 divide-y divide-slate-200 rounded-kuteka border border-slate-200 bg-white">
                    {openSessions.map((s) => (
                      <li
                        key={s.id}
                        className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm"
                      >
                        <div>
                          <p className="font-medium text-slate-800">
                            {s.ip ?? copy.sessions.unknownIp}
                          </p>
                          <p className="text-slate-500">
                            {new Date(s.last_seen_at).toLocaleString(dateLocale)}
                          </p>
                        </div>
                        <Button
                          type="button"
                          size="sm"
                          variant="secondary"
                          disabled={busy}
                          onClick={() => void onRevoke(s.id)}
                        >
                          {copy.sessions.terminate}
                        </Button>
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              <section className="kuteka-detail-panel p-5" aria-labelledby="history">
                <h2 id="history" className="kuteka-detail-title">
                  {copy.history.title}
                </h2>
                {snap.recentEvents.length === 0 ? (
                  <p className="mt-2 text-sm text-slate-600">{copy.history.empty}</p>
                ) : (
                  <ul className="mt-3 divide-y divide-slate-200 rounded-kuteka border border-slate-200 bg-white">
                    {snap.recentEvents.map((e) => (
                      <li key={e.id} className="px-4 py-3 text-sm">
                        <p className="font-medium text-slate-900">
                          {formatSecurityEvent(e.event_type, locale)}
                        </p>
                        <p className="text-slate-500">
                          {new Date(e.created_at).toLocaleString(dateLocale)}
                          {e.channel ? ` · ${e.channel}` : ''}
                          {e.notify ? copy.history.notifySuffix : ''}
                        </p>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </>
          ) : null}
        </SoftListSlot>
      </div>
    </SessionStatusGate>
  );
}
