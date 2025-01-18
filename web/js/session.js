// session.js

import {fetchAPI, handleUnauthorized} from "./api.js";

export class Session {

    constructor() {
        this.interval = 60000; // 1 minute
        this.id = null;
    }

    init() {
        this.stop();
        this.id = setInterval(async () => {
            await this.check();
        }, this.interval);
    }

    async check() {
        try {
            const result = await fetchAPI('/check-session');
            if (result && result.error) {
                handleUnauthorized();
            }
        } catch (error) {
            console.error('Session check failed:', error);
        }
    }

    stop() {
        clearInterval(this.id);
    }
}

export const SessionChecker = new Session();