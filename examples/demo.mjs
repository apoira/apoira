import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { MoteRuntime, evaluatePath, formatCommand } from "../src/index.js";

const projectRoot = await mkdtemp(join(tmpdir(), "mote-demo-"));
const runtime = new MoteRuntime({ projectRoot });

try {
  await runtime.init();
  await runtime.allow(formatCommand(process.execPath, ["-e", "*"]));
  await runtime.ask("git push");
  await runtime.setSecret("DEPLOY_TOKEN", "sk_live_demo_secret");

  const secretRun = await runtime.runWithSecret(
    "DEPLOY_TOKEN",
    process.execPath,
    ["-e", "console.log(process.env.MOTE_SECRET_DEPLOY_TOKEN)"]
  );

  const push = await runtime.run("git", ["push"]);
  const pathDecision = await evaluatePath(await runtime.loadPolicy(), projectRoot, ".env");

  console.log("Project:", projectRoot);
  console.log("Secret output:", secretRun.stdout.trim());
  console.log("Git push decision:", push.status);
  console.log(".env decision:", pathDecision.effect);
  console.log("Replay events:", (await runtime.replay()).length);
} finally {
  await rm(projectRoot, { force: true, recursive: true });
}
