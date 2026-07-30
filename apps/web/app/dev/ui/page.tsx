'use client';

import {
  Alert,
  Avatar,
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Checkbox,
  Heading,
  Input,
  Label,
  Radio,
  Skeleton,
  Spinner,
  Text,
  Textarea,
  Tooltip,
  useTheme,
} from '@kuteka/ui';
import Link from 'next/link';

function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  return (
    <Button variant="secondary" onClick={toggleTheme}>
      Tema: {theme}
    </Button>
  );
}

export default function DevUiCatalogPage() {
  return (
    <main className="mx-auto max-w-4xl space-y-10 px-6 py-12">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="font-mono text-sm text-brand-600">@kuteka/ui</p>
          <Heading level={1}>Catálogo do Design System</Heading>
          <Text>Primitivos oficiais FASE 1 — sem regras de negócio.</Text>
        </div>
        <div className="flex gap-2">
          <ThemeToggle />
          <Link
            href="/"
            className="inline-flex h-10 items-center rounded-kuteka px-4 text-sm text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            Voltar
          </Link>
        </div>
      </div>

      <section className="space-y-4">
        <Heading level={2}>Buttons</Heading>
        <div className="flex flex-wrap gap-3">
          <Button>Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="danger">Danger</Button>
          <Button loading>Loading</Button>
          <Button disabled>Disabled</Button>
        </div>
      </section>

      <section className="space-y-4">
        <Heading level={2}>Forms</Heading>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="name">Nome</Label>
            <Input id="name" placeholder="Parceiro Patrimonial" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">Notas</Label>
            <Textarea id="notes" placeholder="Observações" />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <Checkbox defaultChecked /> Aceito os termos
          </label>
          <div className="flex gap-4 text-sm">
            <label className="flex items-center gap-2">
              <Radio name="role" defaultChecked /> Cliente
            </label>
            <label className="flex items-center gap-2">
              <Radio name="role" /> Agente
            </label>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <Heading level={2}>Feedback</Heading>
        <div className="flex flex-wrap items-center gap-3">
          <Badge variant="brand">Brand</Badge>
          <Badge variant="success">Success</Badge>
          <Badge variant="warning">Warning</Badge>
          <Badge variant="danger">Danger</Badge>
          <Avatar fallback="KT" />
          <Spinner />
          <Skeleton className="h-8 w-32" />
          <Tooltip content="Ajuda Kuteka">
            <Button variant="ghost" size="sm">
              Tooltip
            </Button>
          </Tooltip>
        </div>
        <Alert variant="info">Exemplo de alerta informativo — sem lógica de domínio.</Alert>
      </section>

      <section className="space-y-4">
        <Heading level={2}>Card</Heading>
        <Card>
          <CardHeader>
            <CardTitle>Exemplo de cartão</CardTitle>
          </CardHeader>
          <CardContent>
            <Text>Componente de contentor — sem lógica de domínio.</Text>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
