'use client';

/** O que muda quando o imóvel entra antes de estar livre. Sem reserva nem pagamento. */
export function FutureAvailabilityNote() {
  return (
    <section className="rounded-kuteka border border-slate-200 bg-white p-4">
      <h2 className="text-sm font-semibold text-slate-900">Registar antes de estar disponível</h2>
      <p className="mt-1 text-sm text-slate-700">
        O imóvel pode entrar agora, mesmo ocupado ou ainda sem data certa. Não fica anunciado como disponível hoje. Não reserva, não cobra e não cria contrato.
      </p>
      <ul className="mt-3 grid gap-2 sm:grid-cols-3">
        <li className="rounded-kuteka bg-slate-50 px-3 py-2">
          <p className="text-sm font-medium text-slate-900">Parceiro patrimonial</p>
          <p className="mt-1 text-xs text-slate-600">
            A ficha, as fotos e os documentos começam antes das chaves. Quando a data chega, o processo não parte do zero.
          </p>
        </li>
        <li className="rounded-kuteka bg-slate-50 px-3 py-2">
          <p className="text-sm font-medium text-slate-900">Cliente</p>
          <p className="mt-1 text-xs text-slate-600">
            Vê a data prevista, se existir, e pode pedir aviso. Não perde o imóvel por ele ainda não estar livre.
          </p>
        </li>
        <li className="rounded-kuteka bg-slate-50 px-3 py-2">
          <p className="text-sm font-medium text-slate-900">Prestador</p>
          <p className="mt-1 text-xs text-slate-600">
            Limpeza, mudança ou obra podem ser preparados com antecedência. O trabalho só começa quando houver pedido.
          </p>
        </li>
      </ul>
    </section>
  );
}
