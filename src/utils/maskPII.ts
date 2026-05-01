/**
 * Mascara padrões comuns de CPF, e-mail e telefone (apenas para logs).
 * Não é validador; o objetivo é evitar vazamento de PII em saída.
 */
export function maskPII(input: string): string {
  return input
    .replace(
      /\b\d{3}\.?\d{3}\.?\d{3}-?\d{2}\b/gu,
      "[CPF]",
    )
    .replace(
      /\b[\w.+%-]+@[\d.A-Za-z-]+\.[A-Za-z]{2,}\b/gu,
      "[EMAIL]",
    )
    .replace(
      /\b(?:\+?55\s?)?(?:\(?\d{2}\)?\s?)?\d{4,5}-?\d{4}\b/gu,
      "[TEL]",
    );
}
