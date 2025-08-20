import { replicatePlugin, jsonStringifySerializer } from "../src"
import { createScope } from "@pumped-fn/core-next"
import { coreValue, derivedValue } from "./shared"

const replicator = replicatePlugin({
  caches: [coreValue]
})

const scope = createScope({
  plugins: [replicator.plugin]
})

const socket = new WebSocket('ws://localhost:3000')

socket.onopen = () => {
  replicator.setTransporter((message) => {
    console.log('client-send:', message)
    socket.send(jsonStringifySerializer.serialize(message))
  })
}

socket.onmessage = (message) => {
  if (typeof message.data === 'string') {
    const parsedMessage = jsonStringifySerializer.deserialize(message.data)
    console.log('client-receive:', parsedMessage)
    replicator.update(parsedMessage)
  }
}

socket.onerror = () => {
  console.error('Websocket ended with error')
}

setInterval(async () => {
  const value = await scope.resolve(derivedValue)
  console.warn('client:', value)
}, 1000)