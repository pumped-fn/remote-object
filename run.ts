import { $ } from "bun"

await Promise.all([
  $`bun run --bun example/server`,
  $`bun run --bun example/client`,
])