-- 0051_company_phones_facebook.sql
-- Requires 0049 and 0050.
-- Founder numbers: first phone 957 871 557, second phone and WhatsApp Business 935 404 400.
-- Adds a Facebook field. Does not overwrite a value the Owner already replaced.
-- Bank and IBAN stay empty.

alter table public.kuteka_company_profile
  add column if not exists facebook text;

alter table public.kuteka_company_profile
  drop constraint if exists kuteka_company_profile_facebook_chk;
alter table public.kuteka_company_profile
  add constraint kuteka_company_profile_facebook_chk
  check (facebook is null or char_length(facebook) <= 200);

update public.kuteka_company_profile
set
  phone = coalesce(nullif(phone, ''), '+244 957 871 557'),
  phone_secondary = coalesce(nullif(phone_secondary, ''), '+244 935 404 400'),
  whatsapp = coalesce(nullif(whatsapp, ''), '+244 935 404 400')
where id = 1;

create or replace function public.founder_company_profile_read(p_code text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row public.kuteka_company_profile;
begin
  perform public.kuteka_company_vault_check(p_code);

  select * into v_row from public.kuteka_company_profile where id = 1;

  perform public.write_audit_log(
    'company_profile.read',
    'kuteka_company_profile',
    '1',
    '{}'::jsonb
  );

  return jsonb_build_object(
    'bankName', v_row.bank_name,
    'iban', v_row.iban,
    'accountNumber', v_row.account_number,
    'accountHolder', v_row.account_holder,
    'currency', v_row.currency,
    'paymentNotes', v_row.payment_notes,
    'phone', v_row.phone,
    'phoneSecondary', v_row.phone_secondary,
    'whatsapp', v_row.whatsapp,
    'facebook', v_row.facebook,
    'email', v_row.email,
    'privacyEmail', v_row.privacy_email,
    'legalEmail', v_row.legal_email,
    'website', v_row.website,
    'address', v_row.address,
    'otherContacts', v_row.other_contacts,
    'updatedAt', v_row.updated_at
  );
end;
$$;

create or replace function public.founder_company_profile_update(
  p_code text,
  p_patch jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor uuid := auth.uid();
  v_bank text;
  v_iban text;
  v_account text;
  v_holder text;
  v_currency text;
  v_notes text;
  v_phone text;
  v_phone_secondary text;
  v_whatsapp text;
  v_facebook text;
  v_email text;
  v_privacy text;
  v_legal text;
  v_website text;
  v_address text;
  v_other text;
  v_row public.kuteka_company_profile;
begin
  if p_patch is null or jsonb_typeof(p_patch) <> 'object' then
    raise exception 'KUTEKA_VAULT_FIELD';
  end if;

  perform public.kuteka_company_vault_check(p_code);

  v_bank := nullif(left(trim(coalesce(p_patch->>'bankName', '')), 80), '');
  v_iban := nullif(upper(regexp_replace(coalesce(p_patch->>'iban', ''), '\s', '', 'g')), '');
  v_account := nullif(left(trim(coalesce(p_patch->>'accountNumber', '')), 34), '');
  v_holder := nullif(left(trim(coalesce(p_patch->>'accountHolder', '')), 120), '');
  v_currency := coalesce(nullif(upper(left(trim(coalesce(p_patch->>'currency', '')), 3)), ''), 'AOA');
  v_notes := nullif(left(trim(coalesce(p_patch->>'paymentNotes', '')), 500), '');
  v_phone := nullif(left(trim(coalesce(p_patch->>'phone', '')), 32), '');
  v_phone_secondary := nullif(left(trim(coalesce(p_patch->>'phoneSecondary', '')), 32), '');
  v_whatsapp := nullif(left(trim(coalesce(p_patch->>'whatsapp', '')), 32), '');
  v_facebook := nullif(left(trim(coalesce(p_patch->>'facebook', '')), 200), '');
  v_email := nullif(lower(left(trim(coalesce(p_patch->>'email', '')), 120)), '');
  v_privacy := nullif(lower(left(trim(coalesce(p_patch->>'privacyEmail', '')), 120)), '');
  v_legal := nullif(lower(left(trim(coalesce(p_patch->>'legalEmail', '')), 120)), '');
  v_website := nullif(left(trim(coalesce(p_patch->>'website', '')), 200), '');
  v_address := nullif(left(trim(coalesce(p_patch->>'address', '')), 240), '');
  v_other := nullif(left(trim(coalesce(p_patch->>'otherContacts', '')), 500), '');

  if v_iban is not null and v_iban !~ '^[A-Z]{2}[0-9A-Z]{13,32}$' then
    raise exception 'KUTEKA_VAULT_IBAN';
  end if;
  if v_currency !~ '^[A-Z]{3}$' then
    raise exception 'KUTEKA_VAULT_FIELD';
  end if;
  if v_email is not null and v_email !~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$' then
    raise exception 'KUTEKA_VAULT_EMAIL';
  end if;
  if v_privacy is not null and v_privacy !~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$' then
    raise exception 'KUTEKA_VAULT_EMAIL';
  end if;
  if v_legal is not null and v_legal !~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$' then
    raise exception 'KUTEKA_VAULT_EMAIL';
  end if;
  if v_website is not null and v_website ~ '[[:space:]]' then
    raise exception 'KUTEKA_VAULT_FIELD';
  end if;
  if v_facebook is not null and char_length(v_facebook) > 200 then
    raise exception 'KUTEKA_VAULT_FIELD';
  end if;

  update public.kuteka_company_profile
  set
    bank_name = v_bank,
    iban = v_iban,
    account_number = v_account,
    account_holder = v_holder,
    currency = v_currency,
    payment_notes = v_notes,
    phone = v_phone,
    phone_secondary = v_phone_secondary,
    whatsapp = v_whatsapp,
    facebook = v_facebook,
    email = v_email,
    privacy_email = v_privacy,
    legal_email = v_legal,
    website = v_website,
    address = v_address,
    other_contacts = v_other,
    updated_at = timezone('utc', now()),
    updated_by = v_actor
  where id = 1
  returning * into v_row;

  perform public.write_audit_log(
    'company_profile.update',
    'kuteka_company_profile',
    '1',
    jsonb_build_object(
      'fields',
      (
        select coalesce(jsonb_agg(k), '[]'::jsonb)
        from jsonb_object_keys(p_patch) as k
      )
    )
  );

  return jsonb_build_object(
    'bankName', v_row.bank_name,
    'iban', v_row.iban,
    'accountNumber', v_row.account_number,
    'accountHolder', v_row.account_holder,
    'currency', v_row.currency,
    'paymentNotes', v_row.payment_notes,
    'phone', v_row.phone,
    'phoneSecondary', v_row.phone_secondary,
    'whatsapp', v_row.whatsapp,
    'facebook', v_row.facebook,
    'email', v_row.email,
    'privacyEmail', v_row.privacy_email,
    'legalEmail', v_row.legal_email,
    'website', v_row.website,
    'address', v_row.address,
    'otherContacts', v_row.other_contacts,
    'updatedAt', v_row.updated_at
  );
end;
$$;

-- Public read: contacts only. No bank, no IBAN, no vault code.
create or replace function public.kuteka_public_company_contacts()
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select jsonb_build_object(
    'phone', phone,
    'phoneSecondary', phone_secondary,
    'whatsapp', whatsapp,
    'facebook', facebook,
    'email', email,
    'privacyEmail', privacy_email,
    'legalEmail', legal_email,
    'website', website,
    'address', address
  )
  from public.kuteka_company_profile
  where id = 1;
$$;

revoke all on function public.founder_company_profile_read(text) from public;
revoke all on function public.founder_company_profile_update(text, jsonb) from public;
revoke all on function public.kuteka_public_company_contacts() from public;

grant execute on function public.founder_company_profile_read(text) to authenticated;
grant execute on function public.founder_company_profile_update(text, jsonb) to authenticated;
grant execute on function public.kuteka_public_company_contacts() to anon, authenticated;

comment on function public.kuteka_public_company_contacts() is
  'Public official contacts only. Bank and IBAN are not included. Writes stay owner-only.';
