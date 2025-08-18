import {
  type Core,
  meta
} from "@pumped-fn/core-next"
import { z } from "zod"
import { parse, stringify } from "devalue"

const transportableSchema = z.object({
  name: z.string()
})

export const transportable = meta('transportable', transportableSchema)

export interface Transport {
  onBroadcast: (cb: (msg: string) => void) => void
  update: (content: unknown) => void
}

type WsTransportOpt = {
}

const registerMessage = z.object({
  event: z.literal('register'),
  name: z.string()
})

const unregisterMessage = z.object({
  event: z.literal('unregister'),
  name: z.string()
})

const updateMessage = z.object({
  event: z.literal('update'),
  name: z.string(),
  data: z.any()
})

const msgSchema = z.union([
  registerMessage,
  unregisterMessage,
  updateMessage
])

export const wsTransport = (opt: WsTransportOpt) => {
  let remoteObject = new Set<string>()
  let localObject = new Map<string, Core.Executor<unknown>>()

  let currentScope: Core.Scope | undefined
  let broadcaster: ((msg: z.infer<typeof msgSchema>) => void) | null = null

  console.log('starting wsTransport')

  const connector: Transport = {
    onBroadcast(cb) {
      broadcaster = (rawMessage => {
        const validatedMsg = msgSchema.safeParse(rawMessage)

        if (validatedMsg.success) {
          cb(stringify(validatedMsg.data))
        }
      })
    },
    update(content) {
      if (typeof content === 'string') {
        const validatedMsg = msgSchema.safeParse(parse(content))

        if (validatedMsg.success) {
          switch (validatedMsg.data.event) {
            case 'register':
              // broadcast register
              break
            case 'unregister':
              // broadcast unregister
              break
            case 'update':
              if (localObject.has(validatedMsg.data.name)) {
                const executor = localObject.get(validatedMsg.data.name)!
                currentScope?.update(executor, validatedMsg.data.data)
              } 
              break
          }
        }
      }
    },
  }

  const middleware = {
    init: (scope) => {
      currentScope = scope
      // open connection

      scope.onChange((event, executor, resolved) => {
        const isTransportable = transportable.find(executor)
        
        if (event === 'resolve' && isTransportable) {
          console.debug('registering', isTransportable.name)
          if (localObject.has(isTransportable.name) && localObject.get(isTransportable.name) !== executor) {
            console.warn('duplicated transportable name', isTransportable.name, '. Only the first one be kept')
          }

          localObject.set(isTransportable.name, executor)

          broadcaster?.({
            event: 'register',
            name: isTransportable.name
          })
        }

        if (event === 'update' && isTransportable && localObject.has(isTransportable.name)) {
          // broadcast change
          broadcaster?.({
            event: 'update',
            name: isTransportable.name,
            data: resolved
          })
        }
      })

      scope.onRelease((e, executor) => {
        const isTransportable = transportable.find(executor)

        if (isTransportable) {
          localObject.delete(isTransportable.name)
          // broadcast unregister
          
          broadcaster?.({
            event: 'unregister',
            name: isTransportable.name,
          })
        }

      })

    },
    dispose(scope) {
      localObject.clear()
      remoteObject.clear()
    }
  } satisfies Core.Middleware

  return {
    connector, middleware
  }
}
