# Remote object

A very simple sync engine utilizing some powerful concepts of pumped-fn

- Reactivity
- Power of plugin, while very basic, can easily make an object to be remote
- Reuse the whole dependency map of pumped-fn

# Example

The example uses websocket as communication, but it is very composable
- Serializers are provided but not embeded. For example, with devalue, function can be transfered
- Protocol is all up to carrier, as such, doesn't matter hono, express