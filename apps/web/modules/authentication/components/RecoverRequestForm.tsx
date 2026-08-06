'use client';

import Link from 'next/link';
import { useState, type FormEvent } from 'react';
import { recoverSchema } from '@kuteka/validation';
import { Button } from '@kuteka/ui';
import { useLocale } from '@/modules/i18n/LocaleProvider';
import { getAuthCopy } from '../content';
import { resetPasswordForEmail } from '../services/auth-client';
import { issueSecurityOtp, verifySecurityOtp } from '@/modules/seguranca/services/security-client';
import { SubmitButton, type SubmitState } from './SubmitButton';

type RecoverChannel = 'email' | 'phone' | 'both';

export function RecoverRequestForm() {
  const { locale } = useLocale();
  const copy = getAuthCopy(locale);
  const [channel, setChannel] = useState<RecoverChannel>('email');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [challengeId, setChallengeId] = useState<string | null>(null);
  const [sandboxHint, setSandboxHint] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [submitState, setSubmitState] = useState<SubmitState>('disabled');
  const [smsBusy, setSmsBusy] = useState(false);

  const needsEmail = channel === 'email' || channel === 'both';
  const needsPhone = channel === 'phone' || channel === 'both';
  const formValid = needsEmail
    ? recoverSchema.safeParse({ email }).success
    : phone.trim().length >= 8;

  const effectiveState: SubmitState =
    submitState === 'loading' || submitState === 'success'
      ? submitState
      : success
        ? 'success'
        : formValid && needsEmail
          ? 'idle'
          : 'disabled';

  async function onSubmitEmail(e: FormEvent) {
    e.preventDefault();
    if (!needsEmail) return;
    setError(null);

    const parsed = recoverSchema.safeParse({ email });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? copy.common.networkError);
      setSubmitState('error');
      return;
    }

    setSubmitState('loading');
    const redirectTo =
      typeof window !== 'undefined'
        ? `${window.location.origin}/auth/recuperar/confirmar`
        : undefined;

    const result = await resetPasswordForEmail({
      email: parsed.data.email,
      redirectTo,
    });

    if (!result.ok && (result.code === 'network' || result.code === 'rate_limited')) {
      setError(result.message);
      setSubmitState('error');
      return;
    }

    setSuccess(true);
    setSubmitState('success');
  }

  async function onSendSms() {
    setSmsBusy(true);
    setError(null);
    setSandboxHint(null);
    const result = await issueSecurityOtp({
      channel: 'sms',
      purpose: 'recovery',
      destination: phone,
    });
    setSmsBusy(false);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    setChallengeId(result.data.challengeId);
    if (result.data.sandboxCode) {
      setSandboxHint(`Sandbox: ${result.data.sandboxCode}`);
    }
  }

  async function onVerifySms(e: FormEvent) {
    e.preventDefault();
    if (!challengeId) return;
    setSmsBusy(true);
    setError(null);
    const result = await verifySecurityOtp({ challengeId, code: otp });
    setSmsBusy(false);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    setPhoneVerified(true);
    setChallengeId(null);
  }

  return (
    <div className="flex flex-col gap-5">
      {error ? (
        <div className="auth-alert" role="alert">
          {error}
        </div>
      ) : null}
      {success ? (
        <div
          className="rounded-kuteka border border-emerald-400/35 bg-emerald-500/15 px-3.5 py-3 text-sm text-emerald-50"
          role="status"
        >
          {copy.recover.request.success}
        </div>
      ) : null}
      {phoneVerified ? (
        <div
          className="rounded-kuteka border border-emerald-400/35 bg-emerald-500/15 px-3.5 py-3 text-sm text-emerald-50"
          role="status"
        >
          {copy.recover.request.phoneSuccess}
        </div>
      ) : null}

      <fieldset className="flex flex-col gap-2">
        <legend className="auth-label">{copy.recover.request.channelLabel}</legend>
        {(
          [
            ['email', copy.recover.request.channelEmail],
            ['phone', copy.recover.request.channelPhone],
            ['both', copy.recover.request.channelBoth],
          ] as const
        ).map(([value, label]) => (
          <label key={value} className="flex items-center gap-2 text-sm text-slate-200">
            <input
              type="radio"
              name="recover-channel"
              value={value}
              checked={channel === value}
              onChange={() => {
                setChannel(value);
                setError(null);
                setSuccess(false);
                setPhoneVerified(false);
                setChallengeId(null);
              }}
              disabled={success && needsEmail && !needsPhone}
            />
            {label}
          </label>
        ))}
      </fieldset>

      {needsPhone ? (
        <div className="flex flex-col gap-3 rounded-kuteka border border-white/10 p-3">
          <p className="text-xs text-slate-400">{copy.recover.request.phonePrepared}</p>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="recover-phone" className="auth-label">
              {copy.recover.request.phone.label}
            </label>
            <input
              id="recover-phone"
              className="auth-field"
              type="tel"
              autoComplete="tel"
              placeholder={copy.recover.request.phone.placeholder}
              value={phone}
              onChange={(ev) => setPhone(ev.target.value)}
              disabled={phoneVerified}
            />
          </div>
          {!phoneVerified ? (
            <>
              <Button
                type="button"
                variant="secondary"
                loading={smsBusy}
                disabled={smsBusy || phone.trim().length < 8}
                onClick={() => void onSendSms()}
              >
                {copy.recover.request.sendOtp}
              </Button>
              {sandboxHint ? <p className="text-sm text-amber-200">{sandboxHint}</p> : null}
              {challengeId ? (
                <form onSubmit={onVerifySms} className="flex flex-col gap-2">
                  <label htmlFor="recover-otp" className="auth-label">
                    {copy.recover.request.otpLabel}
                  </label>
                  <input
                    id="recover-otp"
                    className="auth-field tracking-[0.35em]"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={6}
                    value={otp}
                    onChange={(ev) => setOtp(ev.target.value.replace(/\D/g, '').slice(0, 6))}
                  />
                  <Button type="submit" loading={smsBusy} disabled={smsBusy || otp.length !== 6}>
                    {copy.recover.request.otpSubmit}
                  </Button>
                </form>
              ) : null}
            </>
          ) : (
            <Link href="/auth/recuperar/confirmar" className="auth-link text-sm">
              {copy.recover.confirm.title}
            </Link>
          )}
        </div>
      ) : null}

      {needsEmail ? (
        <form onSubmit={onSubmitEmail} className="flex flex-col gap-5" noValidate>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="recover-email" className="auth-label">
              {copy.recover.request.email.label}
            </label>
            <input
              id="recover-email"
              className="auth-field"
              type="email"
              autoComplete="email"
              placeholder="nome@email.com"
              value={email}
              onChange={(ev) => setEmail(ev.target.value)}
              required
              disabled={success}
            />
          </div>

          <SubmitButton
            state={effectiveState}
            idleLabel={copy.recover.request.submit}
            loadingLabel={copy.recover.request.submitLoading}
            successLabel={copy.recover.request.submit}
            className="min-h-12 w-full text-base"
            size="lg"
          />
        </form>
      ) : null}

      <div className="flex flex-col gap-2 text-sm text-slate-300">
        <Link href="/auth/entrar" className="auth-link">
          {copy.recover.request.back}
        </Link>
        <Link href="/contacto" className="text-slate-400 hover:text-slate-200 hover:underline">
          {copy.recover.request.noemail}
        </Link>
      </div>
    </div>
  );
}
