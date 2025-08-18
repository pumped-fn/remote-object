import { provide, derive } from "@pumped-fn/core-next"
import { transportable } from "."

export const coreValue = provide(
  () => 0,
  transportable({
    name: 'coreValue'
  })
)

export const derivedValue = derive(
  coreValue.reactive,
  (value) => value * 2
)