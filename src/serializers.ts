import type { Serializer, Message } from "./types"

export const jsonStringifySerializer: Serializer = {
  serialize: (message: Message) => {
    return JSON.stringify(message)
  },
  deserialize: (message: string) => {
    return JSON.parse(message)
  }
}