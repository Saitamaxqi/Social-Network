// auth.js

import {navigate} from "../router.js";
import {previousPage, removeCurrentUser, setCurrentUser} from "../state.js";
import {fetchAPI} from "../api.js";
import Toastr from "../toastr.js";
import Modal from "../modal.js";
import { sanitizeInput } from "../utils.js";

export class Auth {

    constructor() {
        this.content = document.getElementById('content');
        this.chatbar = document.getElementById('chat-bar');
        window.handleLogin = this.handleLogin;
        window.handleRegister = this.handleRegister;
        window.handleLogout = this.handleLogout;
        this.handleLogout = this.handleLogout.bind(this);
    }

    // Login
    renderLoginForm() {
        this.content.innerHTML = `
        <h2>Login</h2>
        <form id="loginForm">
          <input name="identifier" type="text" id="identifier" required placeholder="Username or Email">
          <input name="password" type="password" id="password" required placeholder="Password">
          <div id="loginButtons">
          <button type="submit">Login</button>
          </div>
        </form>
      `;

        const loginButtons = document.getElementById('loginButtons');

        const googleButton = document.createElement('button');
        googleButton.textContent = 'Login with Google';
        googleButton.onclick = (event) => {
            event.preventDefault();
            window.location.href = '/api/login/google';
        }
        googleButton.id = 'googleButton';
        loginButtons.appendChild(googleButton);

        const githubButton = document.createElement('button');
        githubButton.textContent = 'Login with Github';
        githubButton.onclick = (event) => {
            event.preventDefault();
            window.location.href = '/api/login/github';
        }
        githubButton.id = 'githubButton';
        loginButtons.appendChild(githubButton);

        document.getElementById('loginForm').addEventListener('submit', handleLogin);
    }

    async handleLogin(event) {
        event.preventDefault();
        const identifier = document.getElementById('identifier').value;
        const password = document.getElementById('password').value;
        try {
            const user = await fetchAPI('/login', 'POST', { identifier, password });
            setCurrentUser(user);
            Toastr.success('Login successful');
            navigate('home');
        } catch (error) {
            Toastr.error(error.message);
        }
    }
    

    // Register
    renderRegisterForm() {
        this.content.innerHTML = `
        <h2>Register</h2>
        <form id="registerForm">
            <input name="username" type="text" id="username" required placeholder="Username">
            <input name="age" type="text" id="age" required placeholder="Age">
            <select name="gender" id="gender" required>
                <option value="">Select Gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
            </select>
            <input name="firstName" type="text" id="firstName" required placeholder="First Name">
            <input name="lastName" type="text" id="lastName" required placeholder="Last Name">
            <input name="email" type="email" id="email" required placeholder="Email">
            <input name="password" type="password" id="password" required placeholder="Password">
            <button type="submit">Register</button>
        </form>
    `;
        document.getElementById('registerForm').addEventListener('submit', handleRegister);
    }

    async handleRegister(event) {
        event.preventDefault();
        const username = sanitizeInput(document.getElementById('username').value);
        const age = sanitizeInput(document.getElementById('age').value);
        const gender = sanitizeInput(document.getElementById('gender').value);
        const firstName = sanitizeInput(document.getElementById('firstName').value);
        const lastName = sanitizeInput(document.getElementById('lastName').value);
        const email = sanitizeInput(document.getElementById('email').value);
        const password = sanitizeInput(document.getElementById('password').value);
    
        try {
            const user = await fetchAPI('/register', 'POST', { 
                username, 
                age, 
                gender, 
                firstName, 
                lastName, 
                email, 
                password 
            });
            setCurrentUser(user);
            Toastr.success('Registration successful');
            navigate('home');
            
        } catch (error) {
            Toastr.error(error.message);
        }
    }
    

    // Logout
    handleLogout = () => {
        let logout = () => {
            fetchAPI('/logout')
                .then(r => {
                    console.log('Logout response:', r);
                    removeCurrentUser()
                    navigate('home');
                    this.chatbar.innerHTML = '';
                    Toastr.success('Logout successful');
                }).catch(e => {
                console.error('Logout failed:', e);
                Toastr.error('Error logging out');
            });
        }

        Modal.show('Are you sure you want to logout?', logout);
    }

    handleCallback(provider) {
        fetchAPI('/login-session')
            .then(user => {
                setCurrentUser(user);
                Toastr.success('Login successful via ' + provider);
                navigate('Home');
            }).catch(e => {
            console.error('Login failed:', e);
            Toastr.error('Error logging in');
        });
    }
}