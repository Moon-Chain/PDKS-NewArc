import { BaseComponent } from '../core/BaseComponent.js';

interface ModalProps {
  title: string;
  content: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
  danger?: boolean;
}

export class Modal extends BaseComponent {
  declare protected props: Record<string, unknown> & ModalProps;

  constructor(props: ModalProps) {
    super(props as unknown as Record<string, unknown>);
  }

  template(): string {
    const p = this.props as ModalProps;
    const confirmClass = p.danger ? 'btn btn-danger' : 'btn btn-primary';
    return `
      <div class="modal-overlay">
        <div class="modal">
          <h3>${p.title}</h3>
          <div class="modal-body">${p.content}</div>
          <div class="modal-actions">
            <button class="btn btn-ghost btn-cancel">${p.cancelText || 'İptal'}</button>
            <button class="${confirmClass} btn-confirm">${p.confirmText || 'Onayla'}</button>
          </div>
        </div>
      </div>`;
  }

  afterMount() {
    const p = this.props as ModalProps;

    (this.$('.btn-confirm') as HTMLElement).onclick = () => {
      p.onConfirm?.();
      this.unmount();
    };

    (this.$('.btn-cancel') as HTMLElement).onclick = () => {
      p.onCancel?.();
      this.unmount();
    };

    // Overlay'e tıklayınca kapat
    if (this.el) {
      (this.el as HTMLElement).onclick = (e: Event) => {
        if (e.target === this.el) {
          p.onCancel?.();
          this.unmount();
        }
      };
    }
  }

  static confirm(options: Omit<ModalProps, 'onConfirm' | 'onCancel'>): Promise<boolean> {
    return new Promise((resolve) => {
      const modal = new Modal({
        ...options,
        onConfirm: () => resolve(true),
        onCancel:  () => resolve(false),
      });
      modal.mount(document.body);
    });
  }
}
