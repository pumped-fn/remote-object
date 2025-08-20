import { type Core, meta, preset } from "@pumped-fn/core-next"
import { z } from "zod/v4"
import { EventEmitter } from "events"
import type { Message, Transporter } from "./types"

export const replicatable = meta(Symbol.for('source'), z.custom<{ name: string }>())

const pluginOptionSchema = z.object({
  sources: z.array(z.custom<Core.Executor<unknown>>()).optional(),
  caches: z.array(z.custom<Core.Executor<unknown>>()).optional(),
})

type Replicator = {
  plugin: Core.Plugin
  setTransporter: (transporter: Transporter) => void
  update: (incoming: Message) => void
}

export const replicatePlugin: (option: z.infer<typeof pluginOptionSchema>) => Replicator = (option) => {
  let currentScope: Core.Scope | undefined = undefined
  let cleanups: Core.Cleanup[] = []
  let transporter: Transporter | null = null
  const events = new EventEmitter<Record<string, [string, unknown]>>()
  const resolvedMap = new Map<string, Core.Executor<unknown>>()
  let queue: Message[] | null = []

  const replicator: Replicator = {
    plugin: {
      async init(scope) {
        currentScope = scope
        if (option.caches) {
          for (const cache of option.caches) {
            const meta = replicatable.find(cache)
            
            if (meta) {
              queue.push({
                type: 'init',
                name: meta.name
              })
            }
          }

          const caches = option.caches
          const cacheCleanup = scope.onChange(async (e, executor, resolved) => {
            if (caches.includes(executor)) {
              const meta = replicatable.find(executor)

              if (meta) {
                events.once(meta.name, ([name, value]) => {
                  resolvedMap.set(meta.name, executor)
                  return preset(executor, value)
                })
              } 
            }
          })
          cleanups.push(cacheCleanup)
        }

        if (option.sources) {
          const sources = option.sources
          const sourceCleanup = scope.onChange((e, executor, resolved) => {
            if (sources.includes(executor)) {
              const meta = replicatable.find(executor)

              if (meta) {
                transporter?.({
                  type: 'update',
                  name: meta.name,
                  content: resolved
                })
              }
            }
          })

          cleanups.push(sourceCleanup)
        }

      },
      dispose(scope) {
        cleanups.forEach(cleanup => cleanup())
        cleanups = []
      }
    },
    setTransporter(_connector) {
      transporter = _connector

      if (queue) {
        for (const message of queue) {
          transporter(message)
        }
      }
    },
    update(incoming) {
      if (incoming.type === 'update') {
        const { name, content } = incoming
        if (option.caches) {
          events.emit(name, name, content)

          if (resolvedMap.has(name)) {
            const executor = resolvedMap.get(name)!
            currentScope?.set(executor, content)
          }
        }
      }

      if (incoming.type === 'init') {
        if (option.sources) {
          const matched = option.sources.find(replicatable.find)
          if (matched) {
            currentScope?.resolve(matched)
              .then(resolved => {
                transporter?.({
                  type: 'update',
                  name: incoming.name,
                  content: resolved
                })
              })
          }
        }
      }

    }
  }

  return replicator
}