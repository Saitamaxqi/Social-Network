// modal.js

export class ModalClass {
    constructor() {
        this.modal = null;
        this.overlay = null;
        this.init();
    }

    init() {
        // Create modal container
        this.modal = document.createElement('div');
        this.modal.className = 'modal';

        // Create overlay
        this.overlay = document.createElement('div');
        this.overlay.className = 'modal-overlay';

        // Append modal and overlay to body
        this.overlay.appendChild(this.modal);
        document.body.appendChild(this.overlay);
    }

    show(message, onYes = null, onNo = null) {
        this.modal.innerHTML = `
            <div class="modal-content">${message}</div>
            <div class="modal-buttons">
                <button class="modal-button modal-button-no">No</button>
                <button class="modal-button modal-button-yes">Yes</button>
            </div>
        `;

        const yesButton = this.modal.querySelector('.modal-button-yes');
        const noButton = this.modal.querySelector('.modal-button-no');

        yesButton.addEventListener('click', () => {
            this.hide();
            if (onYes) onYes();
        });

        noButton.addEventListener('click', () => {
            this.hide();
            if (onNo) onNo();
        });

        this.overlay.classList.add('active');
        this.modal.classList.add('active');
    }

    hide() {
        this.overlay.classList.remove('active');
        this.modal.classList.remove('active');
    }
}

const Modal = new ModalClass();
export default Modal;