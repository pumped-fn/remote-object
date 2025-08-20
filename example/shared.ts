import { provide, derive } from "@pumped-fn/core-next"
import { replicatable } from "../src/replicate"

export const coreValue = provide(
  () => 0,
  replicatable({ name: 'core' })
)

export const derivedValue = derive(
  coreValue.reactive,
  (value) => value * 2
)