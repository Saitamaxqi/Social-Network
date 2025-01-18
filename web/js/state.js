// state.js
import {SessionChecker} from "./session.js";
import {NotificationComponent} from "./components.js";

export let currentUser = JSON.parse(localStorage.getItem('currentUser')) || null;
export let MessageNumber = localStorage.getItem('MessageNumber') || null;
export let currentPage = window.location.pathname.slice(1) || 'home';
export let previousPage = null;

export function setCurrentUser(user) {
    SessionChecker.init();
    currentUser = user;
    NotificationComponent.startGettingNotifications();
    localStorage.setItem('currentUser', JSON.stringify(user));
    localStorage.setItem('MessageNumber', 0);
}

export function removeCurrentUser() {
    SessionChecker.stop();
    currentUser = null;
    localStorage.removeItem('currentUser');
    document.cookie = 'session=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;';
}

export function setCurrentPage(page) {
    previousPage = currentPage;
    currentPage = page;
}
