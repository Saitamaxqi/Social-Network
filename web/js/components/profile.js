// profile.js

import {navigate} from "../router.js";
import {previousPage, removeCurrentUser, setCurrentUser} from "../state.js";
import {fetchAPI} from "../api.js";
import Toastr from "../toastr.js";

export class Profile {

    constructor() {
        this.content = document.getElementById('content');
        window.renderEditProfile = this.renderEditProfile
        window.handleEditProfile = this.handleEditProfile
        window.handleRequestMod = this.handleRequestModerator
    }


    renderProfile() {
        fetchAPI('/profile')
            .then(profile => {
                this.content.innerHTML = `
                <h2>Profile</h2>
                <p>Username: ${profile.username}</p>
                <p>Email: ${profile.email}</p>
                <p>Role: ${profile.type}</p>
          `;
                const button = document.createElement('button');
                button.textContent = 'Edit Profile';
                button.onclick = () => this.renderEditProfile();
                this.content.appendChild(button);

                if (profile.type === 'user') {
                    const requestModButton = document.createElement('button');
                    requestModButton.textContent = profile.requested ? 'Requested' : 'Request Moderator';
                    requestModButton.disabled = profile.requested;

                    requestModButton.onclick = () => this.handleRequestModerator();
                    this.content.appendChild(requestModButton);
                }

            }).catch(error => {
                if (error.message !== 'Unauthorized') {
                    Toastr.error('Error fetching profile');
                }
            });
    }

    renderEditProfile() {
        console.log('renderEditProfile');
        fetchAPI('/profile')
            .then(profile => {
                this.content.innerHTML = `
            <h2>Edit Profile</h2>
            <form id="edit-profile-form">
              <label for="username">Username:</label>
              <input type="text" id="username" name="username" value="${profile.username}" required>
              <label for="email">Email:</label>
              <input type="email" id="email" name="email" value="${profile.email}" required>
              <label for="password">Password:</label>
              <input type="password" id="password" name="password">
              <label for="confirm-password">Confirm Password:</label>
              <input type="password" id="confirm-password" name="confirm-password">
              <button type="submit">Save</button>
            </form>
          `;
                document.getElementById('edit-profile-form').addEventListener('submit', this.handleEditProfile);
            }).catch(error => {
                if (error.message !== 'Unauthorized') {
                    Toastr.error('Error fetching profile');
                }
            });
    }

    handleEditProfile(event) {
        event.preventDefault();
        const username = document.getElementById('username').value;
        const email = document.getElementById('email').value;

        let body = { username, email };

        const password = document.getElementById('password').value;
        const confirm_password = document.getElementById('confirm-password').value;

        if (password && confirm_password) {
            body = { ...body, password, confirm_password };
        } else if (password || confirm_password) {
            Toastr.error('Password and Confirm Password must be both filled');
            return;
        }

        fetchAPI('/profile', 'PUT', body)
            .then(profile => {
                setCurrentUser(profile);
                Toastr.success('Profile updated');
                navigate('profile');
            }).catch(error => {
                Toastr.error(error.message);
            });
    }

    handleRequestModerator() {
        fetchAPI('/requests', 'POST')
            .then(() => {
                Toastr.success('Request sent');
                navigate('profile');
            }).catch(error => {
                Toastr.error(error.message);
            });
    }
}