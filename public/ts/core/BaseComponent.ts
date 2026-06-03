export abstract class BaseComponent {
  protected props: Record<string, unknown>;
  protected el: Element | null = null;

  constructor(props: Record<string, unknown> = {}) {
    this.props = props;
  }

  abstract template(): string;

  afterMount(): void {}

  mount(container: HTMLElement): this {
    const wrapper = document.createElement('div');
    wrapper.innerHTML = this.template();
    const child = wrapper.firstElementChild;
    if (child) {
      container.appendChild(child);
      this.el = child;
      this.afterMount();
    }
    return this;
  }

  unmount() {
    this.el?.remove();
    this.el = null;
  }

  protected $(selector: string): Element | null {
    return this.el?.querySelector(selector) ?? null;
  }
}
