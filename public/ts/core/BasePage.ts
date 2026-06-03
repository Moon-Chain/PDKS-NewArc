type ListenerEntry = { el: Element; event: string; handler: EventListener };

export abstract class BasePage {
  protected container: HTMLElement;
  private _listeners: ListenerEntry[] = [];

  constructor(container: HTMLElement) {
    this.container = container;
  }

  abstract render(): Promise<void>;

  protected on(selector: string | Element, event: string, handler: EventListener): this {
    const el = typeof selector === 'string'
      ? this.container.querySelector(selector)
      : selector;
    if (!el) return this;
    el.addEventListener(event, handler);
    this._listeners.push({ el, event, handler });
    return this;
  }

  protected $(selector: string): Element | null {
    return this.container.querySelector(selector);
  }

  protected $$(selector: string): NodeListOf<Element> {
    return this.container.querySelectorAll(selector);
  }

  destroy() {
    this._listeners.forEach(({ el, event, handler }) =>
      el.removeEventListener(event, handler)
    );
    this._listeners = [];
    this.container.innerHTML = '';
  }
}
