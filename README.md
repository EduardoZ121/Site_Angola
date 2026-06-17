# Kuteka

Site marketplace inspirado em portais como Daft, adaptado para Angola, moeda Kz e dominio `kutekalink.com`.
Isto e um site React/Vite, nao e APK.

- casas e apartamentos;
- quartos;
- carros;
- terrenos;
- lojas e outros alugueres ou vendas.

Esta primeira versao e um frontend. Os anuncios criados no formulario ficam guardados no `localStorage` do navegador, permitindo visualizar o fluxo imediatamente sem backend.

## Funcionalidades

- Landing page para Angola com moeda Kz.
- Pesquisa por texto, categoria, provincia e preco maximo.
- Cards de anuncios com foto, localizacao, preco, telefone e WhatsApp.
- Formulario para proprietarios publicarem anuncios.
- Upload de ate 5 fotos com pre-visualizacao local.
- Modal de detalhes do anuncio.
- Categorias principais.
- Painel do proprietario em modo local.
- Painel admin demo por email.
- Ideias iniciais de monetizacao.
- Layout responsivo para desktop e telemovel.

## Admin demo

Enquanto o Google Login ainda nao esta ligado, o painel admin usa um email demo:

```txt
admin@kutekalink.com
```

Quando o backend e o Google Login forem adicionados, esse valor sera trocado pelo email real do dono do site.

## Deploy no Render

1. Enviar este codigo para `https://github.com/EduardoZ121/Site_Angola`.
2. No Render Dashboard, criar um **Static Site** ligado a esse repositorio.
3. Usar:
   - Build Command: `npm ci && npm run build`
   - Publish Directory: `dist`
4. Adicionar rewrite `/* -> /index.html` para SPA.
5. Ligar o dominio `kutekalink.com` no Render.

Este repositorio ja inclui `render.yaml` para Blueprint.


```bash
npm install
npm run dev
```

Para gerar build de producao:

```bash
npm run build
```

Para visualizar o build:

```bash
npm run preview
```

## Proximos passos para producao

1. Adicionar Google Login para clientes, proprietarios e admin.
2. Criar backend/API para anuncios.
3. Guardar dados em banco de dados.
4. Guardar imagens em S3 ou servico equivalente.
5. Configurar email real do admin.
6. Ligar o deploy da Vercel ao repositorio `EduardoZ121/meu12`.
