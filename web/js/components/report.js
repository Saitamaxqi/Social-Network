// report.js

import {navigate} from "../router.js";
import {previousPage, removeCurrentUser, setCurrentUser} from "../state.js";
import {fetchAPI} from "../api.js";
import Toastr from "../toastr.js";
import Modal from "../modal.js";

export class Report {

    constructor() {
        this.content = document.getElementById('content');
    }

    renderMyReports() {
        fetchAPI('/reports')
            .then(reports => {
                this.content.innerHTML = `
            <h1>My Reports</h1>
        `;
                if (!reports) {
                    this.content.innerHTML += `<p>No requests found</p>`;
                    Toastr.info('No reports found');
                    return;
                }
                const table = document.createElement('table');
                table.innerHTML = `
            <thead>
                <tr>
                    <th>Post</th>
                    <th>Content</th>
                    <th>Type</th>
                    <th>Status</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody id="reports"></tbody>
        `;
                this.content.appendChild(table);
                const reportsBody = document.getElementById('reports');
                reports.forEach(report => {
                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td><a href="/posts/${report.post.id}">${report.post.title}</a></td>
                        <td>${report.content}</td>
                        <td>${report.type}</td>
                        <td>${report.approved ? 'Approved' : 'Pending'}</td>
                    `;

                    if (report.approved) {
                        const td = document.createElement('td');
                        const button = document.createElement('button');
                        button.textContent = 'Delete Post';
                        let deletePost = () => {
                            fetchAPI(`/posts/${report.post.id}`, 'DELETE')
                                .then(() => {
                                    Toastr.success('Post deleted successfully');
                                    navigate('myReports');
                                })
                                .catch(error => {
                                    Toastr.error(error.message);
                                });
                        }
                        button.addEventListener('click', () => {
                            Modal.show('Are you sure you want to delete this post?', deletePost);
                        });
                        td.appendChild(button);
                        row.appendChild(td);
                    }
                    reportsBody.appendChild(row);
                });
            }).catch(error => {
                Toastr.error(error.message);
            });
    }

    renderReports() {
        fetchAPI('/reports')
            .then(reports => {
                this.content.innerHTML = `
            <h1>Reports</h1>
        `;
                if (!reports) {
                    this.content.innerHTML += `<p>No requests found</p>`;
                    Toastr.info('No reports found');
                    return;
                }
                const table = document.createElement('table');
                table.innerHTML = `
            <thead>
                <tr>
                    <th>Post</th>
                    <th>Moderator</th>
                    <th>Content</th>
                    <th>Type</th>
                    <th>Status</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody id="reports"></tbody>
        `;
                this.content.appendChild(table);
                const reportsBody = document.getElementById('reports');
                reports = reports.sort((a, b) => a.approved - b.approved);
                reports.forEach(report => {
                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td><a href="/posts/${report.post.id}">${report.post.title}</a></td>
                        <td>${report.user.username}</td>
                        <td>${report.content}</td>
                        <td>${report.type}</td>
                        <td>${report.approved ? 'Approved' : 'Pending'}</td>
                    `;
                    if (!report.approved) {
                        const td = document.createElement('td');
                        const button = document.createElement('button');
                        button.textContent = 'Approve';
                        let approve = () => {
                            fetchAPI(`/reports/${report.id}/approve`, 'PUT')
                                .then(() => {
                                    Toastr.success('Report approved successfully');
                                    this.renderReports();
                                })
                                .catch(error => {
                                    Toastr.error(error.message);
                                });
                        }
                        button.addEventListener('click', () => {
                            Modal.show('Are you sure you want to approve this report?', approve);
                        });
                        td.appendChild(button);
                        row.appendChild(td);
                    }
                    reportsBody.appendChild(row);
                });
            }).catch(error => {
                Toastr.error(error.message);
            });
    }
}