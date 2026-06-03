declare module 'alpinejs' {
  interface Alpine {
    data(name: string, callback: () => Record<string, unknown>): void;
    store(name: string, value: unknown): void;
    start(): void;
    magic(name: string, callback: (el: Element) => unknown): void;
    plugin(plugin: (alpine: Alpine) => void): void;
  }
  const Alpine: Alpine;
  export default Alpine;
}
