-- PRD: expand demo catalog for premium marketplace feel (Core+ expansion)
-- Idempotent seed of 30 additional Angola-oriented listings with galleries.

create or replace function public.seed_demo_catalog_expanded()
returns void
language plpgsql
security definer
set search_path = public, auth, extensions
as $$
declare
  v_owner uuid := 'a0000000-0000-4000-8000-0000000000d1';
begin
  -- Ensure demo partner exists (no-op if already seeded by 0009)
  perform public.seed_demo_catalog();

  insert into public.properties (
    id, owner_id, code, title, property_type, purpose,
    province, city, address_line, status, notes,
    price_aoa, bedrooms, cover_image_url, is_demo,
    created_by, updated_by
  )
  values
    (
      'a1111111-1111-4111-8111-111111111006',
      v_owner, 'KTK-DEMO-0006', 'Moradia contemporânea · Talatona',
      'house', 'sale', 'Luanda', 'Talatona', 'Condomínio Belas',
      'active', 'Moradia contemporânea · Talatona. Localização em Talatona, Luanda. Galeria completa e dados de demonstração Kuteka — inventário premium para investidores e clientes.',
      28000000, 4,
      'https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=1400&q=80',
      true, v_owner, v_owner
    ),
    (
      'a1111111-1111-4111-8111-111111111007',
      v_owner, 'KTK-DEMO-0007', 'Apartamento luminoso · Kilamba',
      'apartment', 'rent', 'Luanda', 'Kilamba', 'Centralidade do Kilamba',
      'active', 'Apartamento luminoso · Kilamba. Localização em Kilamba, Luanda. Galeria completa e dados de demonstração Kuteka — inventário premium para investidores e clientes.',
      225000, 3,
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1400&q=80',
      true, v_owner, v_owner
    ),
    (
      'a1111111-1111-4111-8111-111111111008',
      v_owner, 'KTK-DEMO-0008', 'Penthouse com vista · Luanda Sul',
      'apartment', 'sale', 'Luanda', 'Luanda Sul', 'Torre Miramar',
      'active', 'Penthouse com vista · Luanda Sul. Localização em Luanda Sul, Luanda. Galeria completa e dados de demonstração Kuteka — inventário premium para investidores e clientes.',
      52000000, 2,
      'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1400&q=80',
      true, v_owner, v_owner
    ),
    (
      'a1111111-1111-4111-8111-111111111009',
      v_owner, 'KTK-DEMO-0009', 'Vivenda familiar · Miramar',
      'house', 'rent', 'Luanda', 'Miramar', 'Avenida Marginal',
      'active', 'Vivenda familiar · Miramar. Localização em Miramar, Luanda. Galeria completa e dados de demonstração Kuteka — inventário premium para investidores e clientes.',
      315000, 5,
      'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1400&q=80',
      true, v_owner, v_owner
    ),
    (
      'a1111111-1111-4111-8111-11111111100a',
      v_owner, 'KTK-DEMO-0010', 'Loja comercial · Alvalade',
      'commercial', 'sale', 'Luanda', 'Alvalade', 'Zona residencial',
      'active', 'Loja comercial · Alvalade. Localização em Alvalade, Luanda. Galeria completa e dados de demonstração Kuteka — inventário premium para investidores e clientes.',
      76000000, null,
      'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=1400&q=80',
      true, v_owner, v_owner
    ),
    (
      'a1111111-1111-4111-8111-11111111100b',
      v_owner, 'KTK-DEMO-0011', 'Terreno urbano · Benguela',
      'land', 'sale', 'Benguela', 'Benguela', 'Zona costeira',
      'active', 'Terreno urbano · Benguela. Localização em Benguela, Benguela. Galeria completa e dados de demonstração Kuteka — inventário premium para investidores e clientes.',
      88000000, null,
      'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1400&q=80',
      true, v_owner, v_owner
    ),
    (
      'a1111111-1111-4111-8111-11111111100c',
      v_owner, 'KTK-DEMO-0012', 'Studio moderno · Huambo',
      'apartment', 'both', 'Huambo', 'Huambo', 'Estrada Caála',
      'active', 'Studio moderno · Huambo. Localização em Huambo, Huambo. Galeria completa e dados de demonstração Kuteka — inventário premium para investidores e clientes.',
      100000000, 3,
      'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1400&q=80',
      true, v_owner, v_owner
    ),
    (
      'a1111111-1111-4111-8111-11111111100d',
      v_owner, 'KTK-DEMO-0013', 'Condomínio fechado · Lubango',
      'house', 'sale', 'Huíla', 'Lubango', 'Cristo Rei',
      'active', 'Condomínio fechado · Lubango. Localização em Lubango, Huíla. Galeria completa e dados de demonstração Kuteka — inventário premium para investidores e clientes.',
      112000000, 6,
      'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1400&q=80',
      true, v_owner, v_owner
    ),
    (
      'a1111111-1111-4111-8111-11111111100e',
      v_owner, 'KTK-DEMO-0014', 'Duplex premium · Cabinda',
      'house', 'sale', 'Cabinda', 'Cabinda', 'Centro',
      'active', 'Duplex premium · Cabinda. Localização em Cabinda, Cabinda. Galeria completa e dados de demonstração Kuteka — inventário premium para investidores e clientes.',
      124000000, 4,
      'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1400&q=80',
      true, v_owner, v_owner
    ),
    (
      'a1111111-1111-4111-8111-11111111100f',
      v_owner, 'KTK-DEMO-0015', 'Casa de campo · Malanje',
      'apartment', 'rent', 'Malanje', 'Malanje', 'Bairro Norte',
      'active', 'Casa de campo · Malanje. Localização em Malanje, Malanje. Galeria completa e dados de demonstração Kuteka — inventário premium para investidores e clientes.',
      585000, 3,
      'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=1400&q=80',
      true, v_owner, v_owner
    ),
    (
      'a1111111-1111-4111-8111-111111111010',
      v_owner, 'KTK-DEMO-0016', 'Apartamento T2 · Talatona',
      'apartment', 'sale', 'Luanda', 'Talatona', 'Condomínio Belas',
      'active', 'Apartamento T2 · Talatona. Localização em Talatona, Luanda. Galeria completa e dados de demonstração Kuteka — inventário premium para investidores e clientes.',
      148000000, 2,
      'https://images.unsplash.com/photo-1600047509807-ba8f99d2cdbc?auto=format&fit=crop&w=1400&q=80',
      true, v_owner, v_owner
    ),
    (
      'a1111111-1111-4111-8111-111111111011',
      v_owner, 'KTK-DEMO-0017', 'Moradia T5 · Kilamba',
      'house', 'rent', 'Luanda', 'Kilamba', 'Centralidade do Kilamba',
      'active', 'Moradia T5 · Kilamba. Localização em Kilamba, Luanda. Galeria completa e dados de demonstração Kuteka — inventário premium para investidores e clientes.',
      675000, 5,
      'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1400&q=80',
      true, v_owner, v_owner
    ),
    (
      'a1111111-1111-4111-8111-111111111012',
      v_owner, 'KTK-DEMO-0018', 'Escritório open-space · Luanda Sul',
      'commercial', 'sale', 'Luanda', 'Luanda Sul', 'Torre Miramar',
      'active', 'Escritório open-space · Luanda Sul. Localização em Luanda Sul, Luanda. Galeria completa e dados de demonstração Kuteka — inventário premium para investidores e clientes.',
      172000000, null,
      'https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=1400&q=80',
      true, v_owner, v_owner
    ),
    (
      'a1111111-1111-4111-8111-111111111013',
      v_owner, 'KTK-DEMO-0019', 'Vivenda com piscina · Miramar',
      'land', 'sale', 'Luanda', 'Miramar', 'Avenida Marginal',
      'active', 'Vivenda com piscina · Miramar. Localização em Miramar, Luanda. Galeria completa e dados de demonstração Kuteka — inventário premium para investidores e clientes.',
      184000000, null,
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1400&q=80',
      true, v_owner, v_owner
    ),
    (
      'a1111111-1111-4111-8111-111111111014',
      v_owner, 'KTK-DEMO-0020', 'Apartamento frente mar · Alvalade',
      'apartment', 'both', 'Luanda', 'Alvalade', 'Zona residencial',
      'active', 'Apartamento frente mar · Alvalade. Localização em Alvalade, Luanda. Galeria completa e dados de demonstração Kuteka — inventário premium para investidores e clientes.',
      196000000, 3,
      'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1400&q=80',
      true, v_owner, v_owner
    ),
    (
      'a1111111-1111-4111-8111-111111111015',
      v_owner, 'KTK-DEMO-0021', 'Townhouse · Benguela',
      'house', 'sale', 'Benguela', 'Benguela', 'Zona costeira',
      'active', 'Townhouse · Benguela. Localização em Benguela, Benguela. Galeria completa e dados de demonstração Kuteka — inventário premium para investidores e clientes.',
      208000000, 6,
      'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1400&q=80',
      true, v_owner, v_owner
    ),
    (
      'a1111111-1111-4111-8111-111111111016',
      v_owner, 'KTK-DEMO-0022', 'Flat executivo · Huambo',
      'house', 'sale', 'Huambo', 'Huambo', 'Estrada Caála',
      'active', 'Flat executivo · Huambo. Localização em Huambo, Huambo. Galeria completa e dados de demonstração Kuteka — inventário premium para investidores e clientes.',
      220000000, 4,
      'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=1400&q=80',
      true, v_owner, v_owner
    ),
    (
      'a1111111-1111-4111-8111-111111111017',
      v_owner, 'KTK-DEMO-0023', 'Residência de luxo · Lubango',
      'apartment', 'rent', 'Huíla', 'Lubango', 'Cristo Rei',
      'active', 'Residência de luxo · Lubango. Localização em Lubango, Huíla. Galeria completa e dados de demonstração Kuteka — inventário premium para investidores e clientes.',
      405000, 3,
      'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1400&q=80',
      true, v_owner, v_owner
    ),
    (
      'a1111111-1111-4111-8111-111111111018',
      v_owner, 'KTK-DEMO-0024', 'Chalé · Cabinda',
      'apartment', 'sale', 'Cabinda', 'Cabinda', 'Centro',
      'active', 'Chalé · Cabinda. Localização em Cabinda, Cabinda. Galeria completa e dados de demonstração Kuteka — inventário premium para investidores e clientes.',
      28000000, 2,
      'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1400&q=80',
      true, v_owner, v_owner
    ),
    (
      'a1111111-1111-4111-8111-111111111019',
      v_owner, 'KTK-DEMO-0025', 'Suite garden · Malanje',
      'house', 'rent', 'Malanje', 'Malanje', 'Bairro Norte',
      'active', 'Suite garden · Malanje. Localização em Malanje, Malanje. Galeria completa e dados de demonstração Kuteka — inventário premium para investidores e clientes.',
      495000, 5,
      'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1400&q=80',
      true, v_owner, v_owner
    ),
    (
      'a1111111-1111-4111-8111-11111111101a',
      v_owner, 'KTK-DEMO-0026', 'Apartamento garden · Talatona',
      'commercial', 'sale', 'Luanda', 'Talatona', 'Condomínio Belas',
      'active', 'Apartamento garden · Talatona. Localização em Talatona, Luanda. Galeria completa e dados de demonstração Kuteka — inventário premium para investidores e clientes.',
      52000000, null,
      'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1400&q=80',
      true, v_owner, v_owner
    ),
    (
      'a1111111-1111-4111-8111-11111111101b',
      v_owner, 'KTK-DEMO-0027', 'Moradia geminada · Kilamba',
      'land', 'sale', 'Luanda', 'Kilamba', 'Centralidade do Kilamba',
      'active', 'Moradia geminada · Kilamba. Localização em Kilamba, Luanda. Galeria completa e dados de demonstração Kuteka — inventário premium para investidores e clientes.',
      64000000, null,
      'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=1400&q=80',
      true, v_owner, v_owner
    ),
    (
      'a1111111-1111-4111-8111-11111111101c',
      v_owner, 'KTK-DEMO-0028', 'Espaço comercial · Luanda Sul',
      'apartment', 'both', 'Luanda', 'Luanda Sul', 'Torre Miramar',
      'active', 'Espaço comercial · Luanda Sul. Localização em Luanda Sul, Luanda. Galeria completa e dados de demonstração Kuteka — inventário premium para investidores e clientes.',
      76000000, 3,
      'https://images.unsplash.com/photo-1600047509807-ba8f99d2cdbc?auto=format&fit=crop&w=1400&q=80',
      true, v_owner, v_owner
    ),
    (
      'a1111111-1111-4111-8111-11111111101d',
      v_owner, 'KTK-DEMO-0029', 'Lote infraestruturado · Miramar',
      'house', 'sale', 'Luanda', 'Miramar', 'Avenida Marginal',
      'active', 'Lote infraestruturado · Miramar. Localização em Miramar, Luanda. Galeria completa e dados de demonstração Kuteka — inventário premium para investidores e clientes.',
      88000000, 6,
      'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1400&q=80',
      true, v_owner, v_owner
    ),
    (
      'a1111111-1111-4111-8111-11111111101e',
      v_owner, 'KTK-DEMO-0030', 'Ático panorâmico · Alvalade',
      'house', 'sale', 'Luanda', 'Alvalade', 'Zona residencial',
      'active', 'Ático panorâmico · Alvalade. Localização em Alvalade, Luanda. Galeria completa e dados de demonstração Kuteka — inventário premium para investidores e clientes.',
      100000000, 4,
      'https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=1400&q=80',
      true, v_owner, v_owner
    ),
    (
      'a1111111-1111-4111-8111-11111111101f',
      v_owner, 'KTK-DEMO-0031', 'Casa colonial renovada · Benguela',
      'apartment', 'rent', 'Benguela', 'Benguela', 'Zona costeira',
      'active', 'Casa colonial renovada · Benguela. Localização em Benguela, Benguela. Galeria completa e dados de demonstração Kuteka — inventário premium para investidores e clientes.',
      225000, 3,
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1400&q=80',
      true, v_owner, v_owner
    ),
    (
      'a1111111-1111-4111-8111-111111111020',
      v_owner, 'KTK-DEMO-0032', 'Apartamento novo · Huambo',
      'apartment', 'sale', 'Huambo', 'Huambo', 'Estrada Caála',
      'active', 'Apartamento novo · Huambo. Localização em Huambo, Huambo. Galeria completa e dados de demonstração Kuteka — inventário premium para investidores e clientes.',
      124000000, 2,
      'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1400&q=80',
      true, v_owner, v_owner
    ),
    (
      'a1111111-1111-4111-8111-111111111021',
      v_owner, 'KTK-DEMO-0033', 'Vivenda sustentável · Lubango',
      'house', 'rent', 'Huíla', 'Lubango', 'Cristo Rei',
      'active', 'Vivenda sustentável · Lubango. Localização em Lubango, Huíla. Galeria completa e dados de demonstração Kuteka — inventário premium para investidores e clientes.',
      315000, 5,
      'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1400&q=80',
      true, v_owner, v_owner
    ),
    (
      'a1111111-1111-4111-8111-111111111022',
      v_owner, 'KTK-DEMO-0034', 'Loft industrial · Cabinda',
      'commercial', 'sale', 'Cabinda', 'Cabinda', 'Centro',
      'active', 'Loft industrial · Cabinda. Localização em Cabinda, Cabinda. Galeria completa e dados de demonstração Kuteka — inventário premium para investidores e clientes.',
      148000000, null,
      'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=1400&q=80',
      true, v_owner, v_owner
    ),
    (
      'a1111111-1111-4111-8111-111111111023',
      v_owner, 'KTK-DEMO-0035', 'Residência smart · Malanje',
      'land', 'sale', 'Malanje', 'Malanje', 'Bairro Norte',
      'active', 'Residência smart · Malanje. Localização em Malanje, Malanje. Galeria completa e dados de demonstração Kuteka — inventário premium para investidores e clientes.',
      160000000, null,
      'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1400&q=80',
      true, v_owner, v_owner
    )
  on conflict (id) do update
  set title = excluded.title,
      property_type = excluded.property_type,
      purpose = excluded.purpose,
      province = excluded.province,
      city = excluded.city,
      address_line = excluded.address_line,
      status = 'active',
      notes = excluded.notes,
      price_aoa = excluded.price_aoa,
      bedrooms = excluded.bedrooms,
      cover_image_url = excluded.cover_image_url,
      is_demo = true,
      deleted_at = null,
      updated_by = v_owner;

  delete from public.property_media
  where property_id in (
    'a1111111-1111-4111-8111-111111111006',
    'a1111111-1111-4111-8111-111111111007',
    'a1111111-1111-4111-8111-111111111008',
    'a1111111-1111-4111-8111-111111111009',
    'a1111111-1111-4111-8111-11111111100a',
    'a1111111-1111-4111-8111-11111111100b',
    'a1111111-1111-4111-8111-11111111100c',
    'a1111111-1111-4111-8111-11111111100d',
    'a1111111-1111-4111-8111-11111111100e',
    'a1111111-1111-4111-8111-11111111100f',
    'a1111111-1111-4111-8111-111111111010',
    'a1111111-1111-4111-8111-111111111011',
    'a1111111-1111-4111-8111-111111111012',
    'a1111111-1111-4111-8111-111111111013',
    'a1111111-1111-4111-8111-111111111014',
    'a1111111-1111-4111-8111-111111111015',
    'a1111111-1111-4111-8111-111111111016',
    'a1111111-1111-4111-8111-111111111017',
    'a1111111-1111-4111-8111-111111111018',
    'a1111111-1111-4111-8111-111111111019',
    'a1111111-1111-4111-8111-11111111101a',
    'a1111111-1111-4111-8111-11111111101b',
    'a1111111-1111-4111-8111-11111111101c',
    'a1111111-1111-4111-8111-11111111101d',
    'a1111111-1111-4111-8111-11111111101e',
    'a1111111-1111-4111-8111-11111111101f',
    'a1111111-1111-4111-8111-111111111020',
    'a1111111-1111-4111-8111-111111111021',
    'a1111111-1111-4111-8111-111111111022',
    'a1111111-1111-4111-8111-111111111023'
  );

  insert into public.property_media (
    property_id, public_url, sort_order, is_primary, created_by, updated_by
  )
  values
    ('a1111111-1111-4111-8111-111111111006', 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=1400&q=80', 0, true, v_owner, v_owner),
    ('a1111111-1111-4111-8111-111111111006', 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1400&q=80', 1, false, v_owner, v_owner),
    ('a1111111-1111-4111-8111-111111111006', 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1400&q=80', 2, false, v_owner, v_owner),
    ('a1111111-1111-4111-8111-111111111006', 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1400&q=80', 3, false, v_owner, v_owner),
    ('a1111111-1111-4111-8111-111111111007', 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1400&q=80', 0, true, v_owner, v_owner),
    ('a1111111-1111-4111-8111-111111111007', 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1400&q=80', 1, false, v_owner, v_owner),
    ('a1111111-1111-4111-8111-111111111007', 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1400&q=80', 2, false, v_owner, v_owner),
    ('a1111111-1111-4111-8111-111111111007', 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=1400&q=80', 3, false, v_owner, v_owner),
    ('a1111111-1111-4111-8111-111111111008', 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1400&q=80', 0, true, v_owner, v_owner),
    ('a1111111-1111-4111-8111-111111111008', 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1400&q=80', 1, false, v_owner, v_owner),
    ('a1111111-1111-4111-8111-111111111008', 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=1400&q=80', 2, false, v_owner, v_owner),
    ('a1111111-1111-4111-8111-111111111008', 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1400&q=80', 3, false, v_owner, v_owner),
    ('a1111111-1111-4111-8111-111111111009', 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1400&q=80', 0, true, v_owner, v_owner),
    ('a1111111-1111-4111-8111-111111111009', 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=1400&q=80', 1, false, v_owner, v_owner),
    ('a1111111-1111-4111-8111-111111111009', 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1400&q=80', 2, false, v_owner, v_owner),
    ('a1111111-1111-4111-8111-111111111009', 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1400&q=80', 3, false, v_owner, v_owner),
    ('a1111111-1111-4111-8111-11111111100a', 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=1400&q=80', 0, true, v_owner, v_owner),
    ('a1111111-1111-4111-8111-11111111100a', 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1400&q=80', 1, false, v_owner, v_owner),
    ('a1111111-1111-4111-8111-11111111100a', 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1400&q=80', 2, false, v_owner, v_owner),
    ('a1111111-1111-4111-8111-11111111100a', 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1400&q=80', 3, false, v_owner, v_owner),
    ('a1111111-1111-4111-8111-11111111100b', 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1400&q=80', 0, true, v_owner, v_owner),
    ('a1111111-1111-4111-8111-11111111100b', 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1400&q=80', 1, false, v_owner, v_owner),
    ('a1111111-1111-4111-8111-11111111100b', 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1400&q=80', 2, false, v_owner, v_owner),
    ('a1111111-1111-4111-8111-11111111100b', 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1400&q=80', 3, false, v_owner, v_owner),
    ('a1111111-1111-4111-8111-11111111100c', 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1400&q=80', 0, true, v_owner, v_owner),
    ('a1111111-1111-4111-8111-11111111100c', 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1400&q=80', 1, false, v_owner, v_owner),
    ('a1111111-1111-4111-8111-11111111100c', 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1400&q=80', 2, false, v_owner, v_owner),
    ('a1111111-1111-4111-8111-11111111100c', 'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=1400&q=80', 3, false, v_owner, v_owner),
    ('a1111111-1111-4111-8111-11111111100d', 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1400&q=80', 0, true, v_owner, v_owner),
    ('a1111111-1111-4111-8111-11111111100d', 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1400&q=80', 1, false, v_owner, v_owner),
    ('a1111111-1111-4111-8111-11111111100d', 'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=1400&q=80', 2, false, v_owner, v_owner),
    ('a1111111-1111-4111-8111-11111111100d', 'https://images.unsplash.com/photo-1600047509807-ba8f99d2cdbc?auto=format&fit=crop&w=1400&q=80', 3, false, v_owner, v_owner),
    ('a1111111-1111-4111-8111-11111111100e', 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1400&q=80', 0, true, v_owner, v_owner),
    ('a1111111-1111-4111-8111-11111111100e', 'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=1400&q=80', 1, false, v_owner, v_owner),
    ('a1111111-1111-4111-8111-11111111100e', 'https://images.unsplash.com/photo-1600047509807-ba8f99d2cdbc?auto=format&fit=crop&w=1400&q=80', 2, false, v_owner, v_owner),
    ('a1111111-1111-4111-8111-11111111100e', 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1400&q=80', 3, false, v_owner, v_owner),
    ('a1111111-1111-4111-8111-11111111100f', 'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=1400&q=80', 0, true, v_owner, v_owner),
    ('a1111111-1111-4111-8111-11111111100f', 'https://images.unsplash.com/photo-1600047509807-ba8f99d2cdbc?auto=format&fit=crop&w=1400&q=80', 1, false, v_owner, v_owner),
    ('a1111111-1111-4111-8111-11111111100f', 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1400&q=80', 2, false, v_owner, v_owner),
    ('a1111111-1111-4111-8111-11111111100f', 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=1400&q=80', 3, false, v_owner, v_owner),
    ('a1111111-1111-4111-8111-111111111010', 'https://images.unsplash.com/photo-1600047509807-ba8f99d2cdbc?auto=format&fit=crop&w=1400&q=80', 0, true, v_owner, v_owner),
    ('a1111111-1111-4111-8111-111111111010', 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1400&q=80', 1, false, v_owner, v_owner),
    ('a1111111-1111-4111-8111-111111111010', 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=1400&q=80', 2, false, v_owner, v_owner),
    ('a1111111-1111-4111-8111-111111111010', 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1400&q=80', 3, false, v_owner, v_owner),
    ('a1111111-1111-4111-8111-111111111011', 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1400&q=80', 0, true, v_owner, v_owner),
    ('a1111111-1111-4111-8111-111111111011', 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=1400&q=80', 1, false, v_owner, v_owner),
    ('a1111111-1111-4111-8111-111111111011', 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1400&q=80', 2, false, v_owner, v_owner),
    ('a1111111-1111-4111-8111-111111111011', 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1400&q=80', 3, false, v_owner, v_owner),
    ('a1111111-1111-4111-8111-111111111012', 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=1400&q=80', 0, true, v_owner, v_owner),
    ('a1111111-1111-4111-8111-111111111012', 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1400&q=80', 1, false, v_owner, v_owner),
    ('a1111111-1111-4111-8111-111111111012', 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1400&q=80', 2, false, v_owner, v_owner),
    ('a1111111-1111-4111-8111-111111111012', 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1400&q=80', 3, false, v_owner, v_owner),
    ('a1111111-1111-4111-8111-111111111013', 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1400&q=80', 0, true, v_owner, v_owner),
    ('a1111111-1111-4111-8111-111111111013', 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1400&q=80', 1, false, v_owner, v_owner),
    ('a1111111-1111-4111-8111-111111111013', 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1400&q=80', 2, false, v_owner, v_owner),
    ('a1111111-1111-4111-8111-111111111013', 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=1400&q=80', 3, false, v_owner, v_owner),
    ('a1111111-1111-4111-8111-111111111014', 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1400&q=80', 0, true, v_owner, v_owner),
    ('a1111111-1111-4111-8111-111111111014', 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1400&q=80', 1, false, v_owner, v_owner),
    ('a1111111-1111-4111-8111-111111111014', 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=1400&q=80', 2, false, v_owner, v_owner),
    ('a1111111-1111-4111-8111-111111111014', 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1400&q=80', 3, false, v_owner, v_owner),
    ('a1111111-1111-4111-8111-111111111015', 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1400&q=80', 0, true, v_owner, v_owner),
    ('a1111111-1111-4111-8111-111111111015', 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=1400&q=80', 1, false, v_owner, v_owner),
    ('a1111111-1111-4111-8111-111111111015', 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1400&q=80', 2, false, v_owner, v_owner),
    ('a1111111-1111-4111-8111-111111111015', 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1400&q=80', 3, false, v_owner, v_owner),
    ('a1111111-1111-4111-8111-111111111016', 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=1400&q=80', 0, true, v_owner, v_owner),
    ('a1111111-1111-4111-8111-111111111016', 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1400&q=80', 1, false, v_owner, v_owner),
    ('a1111111-1111-4111-8111-111111111016', 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1400&q=80', 2, false, v_owner, v_owner),
    ('a1111111-1111-4111-8111-111111111016', 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1400&q=80', 3, false, v_owner, v_owner),
    ('a1111111-1111-4111-8111-111111111017', 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1400&q=80', 0, true, v_owner, v_owner),
    ('a1111111-1111-4111-8111-111111111017', 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1400&q=80', 1, false, v_owner, v_owner),
    ('a1111111-1111-4111-8111-111111111017', 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1400&q=80', 2, false, v_owner, v_owner),
    ('a1111111-1111-4111-8111-111111111017', 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1400&q=80', 3, false, v_owner, v_owner),
    ('a1111111-1111-4111-8111-111111111018', 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1400&q=80', 0, true, v_owner, v_owner),
    ('a1111111-1111-4111-8111-111111111018', 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1400&q=80', 1, false, v_owner, v_owner),
    ('a1111111-1111-4111-8111-111111111018', 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1400&q=80', 2, false, v_owner, v_owner),
    ('a1111111-1111-4111-8111-111111111018', 'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=1400&q=80', 3, false, v_owner, v_owner),
    ('a1111111-1111-4111-8111-111111111019', 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1400&q=80', 0, true, v_owner, v_owner),
    ('a1111111-1111-4111-8111-111111111019', 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1400&q=80', 1, false, v_owner, v_owner),
    ('a1111111-1111-4111-8111-111111111019', 'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=1400&q=80', 2, false, v_owner, v_owner),
    ('a1111111-1111-4111-8111-111111111019', 'https://images.unsplash.com/photo-1600047509807-ba8f99d2cdbc?auto=format&fit=crop&w=1400&q=80', 3, false, v_owner, v_owner),
    ('a1111111-1111-4111-8111-11111111101a', 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1400&q=80', 0, true, v_owner, v_owner),
    ('a1111111-1111-4111-8111-11111111101a', 'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=1400&q=80', 1, false, v_owner, v_owner),
    ('a1111111-1111-4111-8111-11111111101a', 'https://images.unsplash.com/photo-1600047509807-ba8f99d2cdbc?auto=format&fit=crop&w=1400&q=80', 2, false, v_owner, v_owner),
    ('a1111111-1111-4111-8111-11111111101a', 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1400&q=80', 3, false, v_owner, v_owner),
    ('a1111111-1111-4111-8111-11111111101b', 'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=1400&q=80', 0, true, v_owner, v_owner),
    ('a1111111-1111-4111-8111-11111111101b', 'https://images.unsplash.com/photo-1600047509807-ba8f99d2cdbc?auto=format&fit=crop&w=1400&q=80', 1, false, v_owner, v_owner),
    ('a1111111-1111-4111-8111-11111111101b', 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1400&q=80', 2, false, v_owner, v_owner),
    ('a1111111-1111-4111-8111-11111111101b', 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=1400&q=80', 3, false, v_owner, v_owner),
    ('a1111111-1111-4111-8111-11111111101c', 'https://images.unsplash.com/photo-1600047509807-ba8f99d2cdbc?auto=format&fit=crop&w=1400&q=80', 0, true, v_owner, v_owner),
    ('a1111111-1111-4111-8111-11111111101c', 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1400&q=80', 1, false, v_owner, v_owner),
    ('a1111111-1111-4111-8111-11111111101c', 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=1400&q=80', 2, false, v_owner, v_owner),
    ('a1111111-1111-4111-8111-11111111101c', 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1400&q=80', 3, false, v_owner, v_owner),
    ('a1111111-1111-4111-8111-11111111101d', 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1400&q=80', 0, true, v_owner, v_owner),
    ('a1111111-1111-4111-8111-11111111101d', 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=1400&q=80', 1, false, v_owner, v_owner),
    ('a1111111-1111-4111-8111-11111111101d', 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1400&q=80', 2, false, v_owner, v_owner),
    ('a1111111-1111-4111-8111-11111111101d', 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1400&q=80', 3, false, v_owner, v_owner),
    ('a1111111-1111-4111-8111-11111111101e', 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=1400&q=80', 0, true, v_owner, v_owner),
    ('a1111111-1111-4111-8111-11111111101e', 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1400&q=80', 1, false, v_owner, v_owner),
    ('a1111111-1111-4111-8111-11111111101e', 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1400&q=80', 2, false, v_owner, v_owner),
    ('a1111111-1111-4111-8111-11111111101e', 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1400&q=80', 3, false, v_owner, v_owner),
    ('a1111111-1111-4111-8111-11111111101f', 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1400&q=80', 0, true, v_owner, v_owner),
    ('a1111111-1111-4111-8111-11111111101f', 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1400&q=80', 1, false, v_owner, v_owner),
    ('a1111111-1111-4111-8111-11111111101f', 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1400&q=80', 2, false, v_owner, v_owner),
    ('a1111111-1111-4111-8111-11111111101f', 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=1400&q=80', 3, false, v_owner, v_owner),
    ('a1111111-1111-4111-8111-111111111020', 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1400&q=80', 0, true, v_owner, v_owner),
    ('a1111111-1111-4111-8111-111111111020', 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1400&q=80', 1, false, v_owner, v_owner),
    ('a1111111-1111-4111-8111-111111111020', 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=1400&q=80', 2, false, v_owner, v_owner),
    ('a1111111-1111-4111-8111-111111111020', 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1400&q=80', 3, false, v_owner, v_owner),
    ('a1111111-1111-4111-8111-111111111021', 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1400&q=80', 0, true, v_owner, v_owner),
    ('a1111111-1111-4111-8111-111111111021', 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=1400&q=80', 1, false, v_owner, v_owner),
    ('a1111111-1111-4111-8111-111111111021', 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1400&q=80', 2, false, v_owner, v_owner),
    ('a1111111-1111-4111-8111-111111111021', 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1400&q=80', 3, false, v_owner, v_owner),
    ('a1111111-1111-4111-8111-111111111022', 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=1400&q=80', 0, true, v_owner, v_owner),
    ('a1111111-1111-4111-8111-111111111022', 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1400&q=80', 1, false, v_owner, v_owner),
    ('a1111111-1111-4111-8111-111111111022', 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1400&q=80', 2, false, v_owner, v_owner),
    ('a1111111-1111-4111-8111-111111111022', 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1400&q=80', 3, false, v_owner, v_owner),
    ('a1111111-1111-4111-8111-111111111023', 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1400&q=80', 0, true, v_owner, v_owner),
    ('a1111111-1111-4111-8111-111111111023', 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1400&q=80', 1, false, v_owner, v_owner),
    ('a1111111-1111-4111-8111-111111111023', 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1400&q=80', 2, false, v_owner, v_owner),
    ('a1111111-1111-4111-8111-111111111023', 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1400&q=80', 3, false, v_owner, v_owner);
end;
$$;

revoke all on function public.seed_demo_catalog_expanded() from public;
grant execute on function public.seed_demo_catalog_expanded() to service_role;

select public.seed_demo_catalog_expanded();
