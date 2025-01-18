// api.js

import {currentUser, removeCurrentUser} from "./state.js";
import Toastr from "./toastr.js";
import {navigate} from "./router.js";
import {MainComponent} from "./components.js";

const API_BASE_URL = 'https://localhost:8080/api';
let isInCooldown = false;
const cooldownDuration = 5000; // 5 seconds cooldown
const chatbar = document.getElementById('chat-bar');

export async function fetchAPI(endpoint, method = 'GET', body = null) {
    if (isInCooldown) {
        throw new Error('Too many requests. Please wait before trying again.');
    }

    const options = {
        method,
        credentials: 'same-origin',
        headers: {
            'Accept': 'application/json',
        },
        cache: 'no-cache',
    };

    if (body) {
        const formData = new FormData();
        for (const key in body) {
            if (body.hasOwnProperty(key)) {
                formData.append(key, body[key]);
            }
        }
        options.body = formData;
    }
    if (event) {
        event.preventDefault();
    }
    return fetch(`${API_BASE_URL}${endpoint}`, options)
        .then(async response => {
            if (response.status === 401) {
                handleUnauthorized();
                throw new Error('Unauthorized');
            }
            if (response.status === 429) {
                handleTooManyRequests();
                throw new Error('Too many requests');
            }
            if (!response.ok) {
                const errorBody = await response.text();
                throw new Error(`${errorBody}`);
            }

            return response;
        }).then(response => {
            const contentType = response.headers.get('Content-Type');
            if (contentType && contentType.includes('application/json')) {
                return response.json();
            }
            return response.text();
        }).catch(error => {
            console.error('API request failed:', error);
            throw error;
        });
}

export function handleUnauthorized() {
    if (!currentUser) return;
    removeCurrentUser();
    Toastr.warning('Your session has expired. Please log in again.');
    chatbar.innerHTML = '';
    MainComponent.renderNavigation();
    navigate('login');
}

function handleTooManyRequests() {
    Toastr.warning('Too many requests. Please slow down.');
    isInCooldown = true;
    setTimeout(() => {
        isInCooldown = false;
    }, cooldownDuration);
}