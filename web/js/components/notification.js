// notification.js

import {fetchAPI, handleUnauthorized} from "../api.js";
import Toastr from "../toastr.js";
import {MainComponent} from "../components.js";
import {timeSince} from "../utils.js";
import { navigate } from "../router.js";

export class Notification {

    constructor() {
        this.content = document.getElementById('content');
        this.count = 0;
        this.interval = 60000; // 1 minute
        this.id = null;
this.navigate = navigate;
        window.toggleSeen = this.toggleSeen;
        window.seeAll = this.seeAll;
        window.startGettingNotifications = this.startGettingNotifications;
    }

    renderNotifications() {
        fetchAPI('/notifications')
            .then(notifications => {
                if (!notifications) {
                    this.content.innerHTML = `
                <h2>Notifications</h2>
                <p>No notifications found</p>
                `;
                    return;
                }
                notifications.sort((a, b) => {
                    if (a.seen === b.seen) {
                        return new Date(b.date) - new Date(a.date);
                    }
                    return a.seen - b.seen;
                });
                this.count = notifications.filter(notification => !notification.seen).length;
                this.content.innerHTML = `
            <h2>Notifications</h2>
            <p>Unread: ${this.count}</p>
          `;
                const seeAll = document.createElement('button');
                seeAll.textContent = 'Mark all as seen';
                seeAll.onclick = () => this.seeAll();
                seeAll.disabled = this.count === 0;
                this.content.appendChild(seeAll);
                const table = document.createElement('table');
                const thead = document.createElement('thead');
                thead.innerHTML = `
            <tr>
                <th>Message</th>
                <th>Seen</th>
                <th>Since</th>
                <th>Actions</th>
            </tr>
            `;
                table.appendChild(thead);
                const tbody = document.createElement('tbody');
                notifications.forEach(notification => {
                    const tr = document.createElement('tr');
                    if (notification.type === 'message') {
                        tr.addEventListener('click', () => {
                            this.navigate(`chat/${notification.link_id}`);
                        })
                    }
                    tr.innerHTML = `
                <td>${notification.text}</td>
                <td>${notification.seen ? 'Yes' : 'No'}</td>
                <td>${timeSince(new Date(notification.date))}</td>
              `;
                    const td = document.createElement('td');
                    const button = document.createElement('button');
                    button.textContent = 'Mark as' + (notification.seen ? ' Unseen' : ' Seen');
                    button.addEventListener('click', (event) => {
                        event.stopPropagation(); // Prevent triggering the row click event
                        this.toggleSeen(notification.id);
                    }); 
                    td.appendChild(button);
                    tr.appendChild(td);
                    tbody.appendChild(tr);
                });
                table.appendChild(tbody);
                this.content.appendChild(table);
            }).catch(error => {
                if (error.message !== 'Unauthorized') {
                    Toastr.error('Error fetching notifications');
                }
            });
    }

    toggleSeen(id) {
        fetchAPI(`/notifications/${id}`, 'PUT')
            .then(() => {
                this.startGettingNotifications();
                this.renderNotifications();
            }).catch(error => {
                if (error.message !== 'Unauthorized') {
                    Toastr.error('Error updating notification');
                }
            });
    }
    
    seeAll() {
        fetchAPI('/notifications', 'PUT')
            .then(() => {
                this.startGettingNotifications();
                this.renderNotifications();
            }).catch(error => {
                if (error.message !== 'Unauthorized') {
                    Toastr.error('Error updating notifications');
                }
            });
    }
    

    async startGettingNotifications() {
        try {
            const result = await fetchAPI('/notifications');
            let previousCount = this.count;
            this.count = result.filter(notification => !notification.seen).length;
            if (previousCount !== this.count) {
                MainComponent.renderNavigation();
            }
        } catch (error) {
            console.error('Notification check failed:', error);
        }
    }
    

    // stopGettingNotifications() {
    //     clearInterval(this.id);
    // }
}