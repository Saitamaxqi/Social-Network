// activity.js

import {fetchAPI} from "../api.js";
import {PostComponent} from "../components.js";
import Toastr from "../toastr.js";

export class Activity {
    constructor() {
        this.content = document.getElementById('content');
    }

    renderMyActivity() {
        fetchAPI('/activity')
            .then(activity => {
                this.content.innerHTML = `
            <h2>My Activity</h2>
            `;
                if (activity.posts) {
                    const posts = document.createElement('div');
                    posts.innerHTML = `
                <h3>Posts</h3>
                `;
                    const cardContainer = document.createElement('div');
                    activity.posts.forEach(post => {
                        const postElement = PostComponent.createPostElement(post)
                        cardContainer.appendChild(postElement);
                    });
                    cardContainer.classList.add('card-container');
                    posts.appendChild(cardContainer);
                    this.content.appendChild(posts);
                }

                if (activity.comments) {
                    const comments = document.createElement('div');
                    comments.innerHTML = `
                <h3>Comments</h3>
                `;
                    const cardContainer = document.createElement('div');
                    activity.comments.forEach(comment => {
                        const commentElement = PostComponent.createPostElement(comment)
                        cardContainer.appendChild(commentElement);
                    });
                    cardContainer.classList.add('card-container');
                    comments.appendChild(cardContainer);
                    this.content.appendChild(comments);
                }

                if (activity.liked_posts) {
                    const likedPosts = document.createElement('div');
                    likedPosts.innerHTML = `
                <h3>Liked Posts</h3>
                `;
                    const cardContainer = document.createElement('div');
                    activity.liked_posts.forEach(post => {
                        const postElement = PostComponent.createPostElement(post)
                        cardContainer.appendChild(postElement);
                    });
                    cardContainer.classList.add('card-container');
                    likedPosts.appendChild(cardContainer);
                    this.content.appendChild(likedPosts);
                }

                if (activity.disliked_posts) {
                    const dislikedPosts = document.createElement('div');
                    dislikedPosts.innerHTML = `
                <h3>Disliked Posts</h3>
                `;
                    const cardContainer = document.createElement('div');
                    activity.disliked_posts.forEach(post => {
                        const postElement = PostComponent.createPostElement(post)
                        cardContainer.appendChild(postElement);
                    });
                    cardContainer.classList.add('card-container');
                    dislikedPosts.appendChild(cardContainer);
                    this.content.appendChild(dislikedPosts);
                }
            }).catch(error => {
            if (error.message !== 'Unauthorized') {
                Toastr.error('Error fetching activity');
            }
        });
    }
}