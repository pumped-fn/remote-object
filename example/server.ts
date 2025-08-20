import { createScope } from "@pumped-fn/core-next"
import { coreValue } from "./shared"
import { replicatePlugin, type Message } from "../src"

const transmitter = replicatePlugin({
  sources: [coreValue]
})

const scope = createScope({
  plugins: [transmitter.plugin]
})

setInterval(() => {
  const coreValueAccessor = scope.accessor(coreValue)

  if (coreValueAccessor.lookup()) {
    coreValueAccessor.update(current => current + 1)
  }
}, 2000)

const server = Bun.serve({
  port: 3000,
  fetch(req, server) {
    const success = server.upgrade(req);
    return success
      ? undefined
      : new Response("WebSocket upgrade error", { status: 400 });
  },
  websocket: {
    open(ws) {
      transmitter.setTransporter((message) => {
        console.log('server-send:', message)
        ws.sendText(JSON.stringify(message))
      })
    },
    message(ws, message) {
      if (typeof message === 'string') {
        const parsed = JSON.parse(message) as Message
        transmitter.update(parsed)
      }
    }
  }
})

console.log('bun is listening at port', server.port)