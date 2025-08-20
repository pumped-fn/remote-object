
export type Transporter = (message: Message) => void

export type InitMessage = { type: 'init', name: string }
export type UpdateMessage = { type: 'update', name: string, content: unknown }
export type UnsubscribeMessage = { type: 'unsubscribe', name: string }

export type Message = InitMessage | UpdateMessage | UnsubscribeMessage

export type Serializer<S = string> = {
  serialize: (message: Message) => S
  deserialize: (message: S) => Message
}