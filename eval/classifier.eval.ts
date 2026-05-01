import { classificarTicket } from "../src/agents/classifier/agent";
import { classifierEvalSet } from "../src/agents/classifier/eval";

export async function runClassifierEval() {
  if (!process.env.OPENAI_API_KEY) {
    process.stdout.write(
      "OPENAI_API_KEY não encontrado; pulando eval (não chamaremos a API).\n",
    );
    return { accuracy: 0, correct: 0, total: classifierEvalSet.length };
  }

  let correct = 0;

  for (const c of classifierEvalSet) {
    const out = await classificarTicket(c.ticket);
    const ok = out.categoria === c.expectedCategoria;
    if (ok) correct += 1;

    process.stdout.write(
      `${ok ? "OK" : "FAIL"} - ${c.name} | expected=${c.expectedCategoria} got=${out.categoria} conf=${out.confianca}\n`,
    );
  }

  const accuracy = classifierEvalSet.length
    ? correct / classifierEvalSet.length
    : 0;

  process.stdout.write(
    `\nClassifier accuracy: ${(accuracy * 100).toFixed(1)}% (${correct}/${classifierEvalSet.length})\n`,
  );

  return { accuracy, correct, total: classifierEvalSet.length };
}
