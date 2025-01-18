// toastr.js

export class ToastrClass {
    constructor() {
        this.container = null;
        this.defaultDuration = 3000; // milliseconds
        this.init();
    }

    init() {
        this.container = document.createElement('div');
        this.container.id = 'toastr-container';
        document.body.appendChild(this.container);

        const style = document.createElement('style');

        document.head.appendChild(style);
    }

    show(message, type = 'default', duration = this.defaultDuration) {
        const toastr = document.createElement('div');
        toastr.className = `toastr toastr-${type}`;
        toastr.innerHTML = `
            <span>${message}</span>
            <button class="toastr-close">&times;</button>
        `;

        this.container.appendChild(toastr);

        // Trigger reflow to enable transition
        toastr.offsetHeight;

        toastr.classList.add('show');

        const closeBtn = toastr.querySelector('.toastr-close');
        closeBtn.addEventListener('click', () => this.close(toastr));

        if (duration > 0) {
            setTimeout(() => this.close(toastr), duration);
        }
    }

    close(toastr) {
        toastr.classList.remove('show');
        toastr.addEventListener('transitionend', () => {
            toastr.remove();
        });
    }

    success(message, duration) {
        this.show(message, 'success', duration);
    }

    error(message, duration) {
        this.show(message, 'error', duration);
    }

    warning(message, duration) {
        this.show(message, 'warning', duration);
    }

    info(message, duration) {
        this.show(message, 'info', duration);
    }
}

const Toastr = new ToastrClass();
export default Toastr;