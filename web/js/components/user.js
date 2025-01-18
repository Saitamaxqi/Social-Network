// user.js

import {navigate} from "../router.js";
import {previousPage, removeCurrentUser, setCurrentUser} from "../state.js";
import {fetchAPI} from "../api.js";
import Toastr from "../toastr.js";
import Modal from "../modal.js";

export class User {

    constructor() {
        this.content = document.getElementById('content');
    }


    renderUsers() {
        fetchAPI('/users')
            .then(users => {
                this.content.innerHTML = `
            <h2>Users</h2>
            `;
                if (!users) {
                    this.content.innerHTML += `<p>No users found</p>`;
                    return;
                }
                const table = document.createElement('table');
                const thead = document.createElement('thead');
                thead.innerHTML = `
            <tr>
                <th>Username</th>
                <th>Email</th>
                <th>Role</th>
            </tr>
            `;
                table.appendChild(thead);
                const tbody = document.createElement('tbody');
                users.forEach(user => {
                    const tr = document.createElement('tr');
                    tr.innerHTML = `
                <td>${user.username}</td>
                <td>${user.email}</td>
              `;
                    const type = document.createElement('td');
                    const select = document.createElement('select');
                    select.innerHTML = `
                <option value="user" ${user.type === 'user' ? 'selected' : ''}>User</option>
                <option value="moderator" ${user.type === 'moderator' ? 'selected' : ''}>Moderator</option>
                `;
                    select.onchange = () => this.handleEditRole(user.id, select.value, select, user.type);
                    type.appendChild(select);
                    tr.appendChild(type);
                    tbody.appendChild(tr);
                });
                table.appendChild(tbody);
                this.content.appendChild(table);
            }).catch(error => {
                if (error.message !== 'Unauthorized') {
                    Toastr.error('Error fetching users');
                }
            });
    }

    handleEditRole(id, type, select, previousType) {
        let edit = () => fetchAPI(`/users/${id}`, 'PUT', { type }).then(() => {
            Toastr.success('Role updated');
            navigate('users');
        }).catch(error => {
            if (error.message !== 'Unauthorized') {
                Toastr.error('Error updating role');
            }
        });

        let cancel = () => {
            select.value = previousType;
        };

        Modal.show('Are you sure you want to update the role?', edit, cancel);
    }
}