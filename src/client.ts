import { wsTransport } from "./index"
import { createScope, resolves } from "@pumped-fn/core-next"
import { coreValue, derivedValue } from "./shared"

const scope = createScope()
const { middleware, connector } = wsTransport({})
scope.use(middleware)

resolves(scope, [derivedValue])

const socket = new WebSocket('ws://localhost:3000')

socket.onopen = () => {
  console.info('WebSocket connection established')
}

socket.onmessage = (message) => {
  connector.update(message.data)
}

socket.onerror = () => {
  console.error('Websocket ended with error')
}

setInterval(async () => {
  const value = await scope.resolve(derivedValue)
  console.warn(value)
}, 1000)