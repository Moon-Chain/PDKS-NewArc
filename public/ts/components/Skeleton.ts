import { BaseComponent } from '../core/BaseComponent.js';

interface SkeletonProps {
  lines?: number;
}

export class Skeleton extends BaseComponent {
  constructor(props: SkeletonProps = {}) {
    super(props as Record<string, unknown>);
  }

  template(): string {
    const lines = (this.props.lines as number) || 3;
    const rows = Array.from({ length: lines }, () => '<div class="skeleton-line"></div>').join('');
    return `<div class="skeleton-wrapper">${rows}</div>`;
  }

  static show(container: HTMLElement, lines = 3): Skeleton {
    const s = new Skeleton({ lines });
    s.mount(container);
    return s;
  }
}
