import { runClassifierEval } from "./classifier.eval";

async function main() {
  await runClassifierEval();
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exitCode = 1;
});
