import { wsTransport } from "./index"
import { createScope, resolves } from "@pumped-fn/core-next"
import { coreValue, derivedValue } from "./shared"

const scope = createScope()
const { middleware, connector } = wsTransport({})
scope.use(middleware)

resolves(scope, [derivedValue])

setInterval(() => {
  console.log('updating value')
  scope.update(coreValue, (prev) => prev + 1)
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
      connector.onBroadcast(
        (msg) => {
          console.log('broadcasting message', msg);
          ws.send(msg);
        }
      )
    },
    message(ws, message) {
      connector.update(message)
    }
  }
})

console.log('bun is listening at port', server.port)