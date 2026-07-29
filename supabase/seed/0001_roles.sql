-- Official role → permission mappings (SOURCE OF TRUTH for product roles).
-- Do not duplicate this matrix in application TypeScript.
-- App code must resolve permissions via public.get_user_permission_codes / tables.

insert into public.roles (code, name, description, is_system)
values
  ('client', 'Cliente', 'Compra / arrendamento / jornada habitacional', true),
  ('patrimonial_partner', 'Parceiro Patrimonial', 'Activa e gere património', true),
  ('certified_agent', 'Agente Certificado', 'Representa a Kuteka no terreno', true),
  ('administrator', 'Administrador', 'Valida, governa e audita a plataforma', true)
on conflict (code) do update
set
  name = excluded.name,
  description = excluded.description,
  is_system = excluded.is_system,
  updated_at = timezone('utc', now());

insert into public.permissions (code, description)
values
  ('platform.access', 'Acesso autenticado à plataforma'),
  ('admin.panel', 'Acesso ao painel de administração')
on conflict (code) do update
set description = excluded.description,
    updated_at = timezone('utc', now());

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
cross join public.permissions p
where r.code in ('client', 'patrimonial_partner', 'certified_agent', 'administrator')
  and p.code = 'platform.access'
on conflict do nothing;

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
join public.permissions p on p.code = 'admin.panel'
where r.code = 'administrator'
on conflict do nothing;
