import { EventEmitter } from 'events';

class TypedEmitter extends EventEmitter {}

export const emitter = new TypedEmitter();

// Bellek sızıntısını önle — çok sayıda SSE istemcisi olabilir
emitter.setMaxListeners(200);
