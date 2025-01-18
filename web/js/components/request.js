// request.js

import {navigate} from "../router.js";
import {previousPage, removeCurrentUser, setCurrentUser} from "../state.js";
import {fetchAPI} from "../api.js";
import Toastr from "../toastr.js";
import Modal from "../modal.js";

export class Request {

    constructor() {
        this.content = document.getElementById('content');
        window.handleApproveRequest = this.handleApproveRequest
        window.handleRejectRequest = this.handleRejectRequest
    }

    renderRequests() {
        fetchAPI('/requests')
            .then(requests => {
                this.content.innerHTML = `
            <h2>Requests</h2>
            `;
                if (!requests) {
                    this.content.innerHTML += `<p>No requests found</p>`;
                    Toastr.info('No requests found');
                    return;
                }
                const table = document.createElement('table');
                const thead = document.createElement('thead');
                thead.innerHTML = `
            <tr>
                <th>Username</th>
                <th>Email</th>
                <th>Actions</th>
            </tr>
            `;
                table.appendChild(thead);
                const tbody = document.createElement('tbody');
                requests.forEach(request => {
                    const tr = document.createElement('tr');
                    tr.innerHTML = `
                <td>${request.username}</td>
                <td>${request.email}</td>
              `;
                    const actions = document.createElement('td');
                    actions.innerHTML = `
                <button onclick="handleApproveRequest(${request.id})">Accept</button>
                <button onclick="handleRejectRequest(${request.id})">Reject</button>
                `;
                    tr.appendChild(actions);
                    tbody.appendChild(tr);
                });
                table.appendChild(tbody);
                this.content.appendChild(table);
            }).catch(error => {
                if (error.message !== 'Unauthorized') {
                    Toastr.error('Error fetching requests');
                }
            });
    }

    handleApproveRequest(id) {
        let approve = () => {
            fetchAPI(`/requests/${id}`, 'PUT').then(() => {
                Toastr.success('Request accepted');
                navigate('requests');
            }).catch(error => {
                Toastr.error('Error accepting request');
            });
        }
    
        Modal.show('Are you sure you want to accept this request?', approve);
    }

    handleRejectRequest(id) {
        let reject = () => {
            fetchAPI(`/requests/${id}`, 'DELETE').then(() => {
                Toastr.success('Request rejected');
                navigate('requests');
            }).catch(error => {
                Toastr.error('Error rejecting request');
            });
        }

        Modal.show('Are you sure you want to reject this request?', reject);
    }
}