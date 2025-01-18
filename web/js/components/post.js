// post.js

import {fetchAPI} from "../api.js";
import Toastr from "../toastr.js";
import {navigate} from "../router.js";
import {timeSince} from "../utils.js";
import {currentUser} from "../state.js";
import Modal from "../modal.js";
import { WebSocketClient } from '../websocket.js';
import { sanitizeInput } from "../utils.js";

export class Post {
    constructor() {
        this.content = document.getElementById('content');
        window.filterPosts = this.filterPosts.bind(this);

        this.posts = [];
        this.categories = [];
        this.filterCategories = [];

        this.content = document.getElementById('content');
        this.webSocket = new WebSocketClient(this);
    }

    renderPosts(id = null) {
        if (id) {
            return this.renderPost(id);
        }

        this.content.innerHTML = '<h2>Posts</h2>';
        this.fetchData()
            .then(() => {
                if (this.posts.length === 0) {
                    Toastr.info('No posts found');
                    return;
                }
                const categoryButtons = document.createElement('div');
                categoryButtons.id = 'category-buttons';
                categoryButtons.style.textAlign = 'center';
                this.content.appendChild(categoryButtons);

                this.filterCategories.forEach(category => {
                    const button = document.createElement('button');
                    button.classList.add('category-button');
                    button.textContent = category.name;
                    button.dataset.categoryId = category.id;
                    button.onclick = () => this.filterPosts(category.id);
                    categoryButtons.appendChild(button);
                });

                const cardContainer = document.createElement('div');
                cardContainer.classList.add('card-container');
                cardContainer.id = 'card-container';
                this.content.appendChild(cardContainer);

                this.posts.forEach(post => {
                    const card = this.createPostElement(post);
                    cardContainer.prepend(card);
                });
            })
            .catch(error => {
                if (error.message !== 'Unauthorized') {
                    Toastr.error("Error fetching posts");
                }
            });
    }

    filterPosts(selectedCategoryId) {
        let all = false;
        const categoryButtons = document.getElementById('category-buttons');
        categoryButtons.childNodes.forEach(button => {
            if (button.dataset.categoryId == selectedCategoryId && !button.classList.contains('selected')) {
                button.classList.add('selected')
            } else {
                if (button.dataset.categoryId == selectedCategoryId && button.classList.contains('selected')) {
                    all = true;
                }
                button.classList.remove('selected');
            }
        });
        const cardContainer = document.getElementById('card-container');
        cardContainer.innerHTML = '';
        this.posts.forEach(post => {
            if (post.categories.some(category => category.id === selectedCategoryId) || all) {
                const card = this.createPostElement(post);
                cardContainer.appendChild(card);
            }
        });

    }

    async renderPost(id) {
        try {
            const post = await fetchAPI(`/posts/${id}`);
            if (post.post_id.Valid) {
                navigate(`posts/${post.post_id.Int64}`);
                return;
            }
            const interaction = post.interaction;

            this.content.innerHTML = '';
            const postContainer = document.createElement('div');
            postContainer.classList.add('post-container');
            postContainer.dataset.postId = post.id;
            // Username and time
            const userInfo = document.createElement('div');
            userInfo.classList.add('user-info');
            userInfo.innerHTML = `
                <span class="username">${post.user.username} Posted</span>
                <span class="time-since">${timeSince(new Date(post.created_at))}</span>
            `;

            if (this.canEdit(post)) {
                const editButton = document.createElement('button');
                editButton.innerText = 'Edit'
                editButton.onclick = () => this.renderPostEditForm(post);
                userInfo.appendChild(editButton);
            }

            if (this.canDelete(post)) {
                const deleteButton = document.createElement('button');
                deleteButton.innerText = 'Delete'
                let deletePost = () => {
                    fetchAPI(`/posts/${post.id}`, 'DELETE')
                        .then(() => {
                            Toastr.success('Post deleted successfully');
                            navigate('posts');
                        })
                        .catch(error => {
                            console.error('Error deleting post:', error);
                            Toastr.error('Error deleting post');
                        });
                }
                deleteButton.onclick = async () => {
                    Modal.show('Are you sure you want to delete this post?', deletePost);
                }
                deleteButton.classList.add('redButton');
                userInfo.appendChild(deleteButton);
            }

            if (this.canReport(post)) {
                const reportButton = document.createElement('button');
                reportButton.innerText = 'Report'
                reportButton.onclick = async (event) => {
                    event.preventDefault();
                    this.renderPostReportForm(post);
                }
                reportButton.classList.add('yellowButton');
                userInfo.appendChild(reportButton);
            }
            postContainer.appendChild(userInfo);

            // Title
            const title = document.createElement('h3');
            title.innerText = post.title;
            postContainer.appendChild(title);

            // Categories
            const categories = document.createElement('div');
            categories.classList.add('categories');
            categories.innerHTML = post.categories.map(category => `<span class="category-tag">${category.name}</span>`).join('');
            const categoriesLabel = document.createElement('span');
            categoriesLabel.innerText = 'Categories: ';
            categories.prepend(categoriesLabel);
            postContainer.appendChild(categories);
    
            // Media
            if (post.media.Valid) {
                const media = document.createElement('img');
                media.src = post.media.String;
                media.classList.add('post-media');
                postContainer.appendChild(media);
            }
    
            // Content
            const body = document.createElement('p');
            body.innerText = post.body;
            postContainer.appendChild(body);
    
            // Like/Dislike buttons
            const ratingsContainer = document.createElement('div');
            ratingsContainer.classList.add('post-ratings-container');
            ratingsContainer.innerHTML = `
                <div class="post-rating ${interaction === 1 ? 'post-rating-selected' : ''}">
                    <span class="post-rating-button material-icons">thumb_up</span>
                    <span class="post-rating-count">${post.likes}</span>
                </div>
                <div class="post-rating ${interaction === -1 ? 'post-rating-selected' : ''}">
                    <span class="post-rating-button material-icons">thumb_down</span>
                    <span class="post-rating-count">${post.dislikes}</span>
                </div>
            `;
            postContainer.appendChild(ratingsContainer);
    
            // Reply button
            const replyButton = document.createElement('button');
            replyButton.classList.add('reply-button');
            replyButton.innerText = 'Reply';

            if (!currentUser) {
                replyButton.addEventListener("click", () => {
                    Toastr.error("You must be logged in to interact with posts");
                });
            } else {
                replyButton.onclick = () => this.renderReplyForm(post.id);
            }

            postContainer.appendChild(replyButton);
    
            this.content.appendChild(postContainer);
    
            // Render comments
            await this.renderComments(post.comments, postContainer);
    
            // Add event listeners for like/dislike buttons
            this.addRatingListeners(postContainer, post.id);
        } catch (error) {
            console.error(error);
            if (error.message !== 'Unauthorized') {
                Toastr.error('Post does not exist');
                navigate('posts');
            }
        }
    }

    createPostElement(post) {
        const card = document.createElement('div');
        card.classList.add('card');
        const cardContent = document.createElement('div');
        cardContent.classList.add('card-content');
        cardContent.innerHTML = `
                            <h1>${post.title}</h1>
                            <p>${post.body.substring(0, 100)}...</p>
                            <button onclick="navigate('posts/${post.id}')">View Post</button>
                        `;
        card.appendChild(cardContent);
        return card;
    }

    fetchData() {
        return Promise.all([
            fetchAPI('/posts'),
            fetchAPI('/categories'),
        ])
            .then(([posts, categories]) => {
                this.posts = posts || [];
                this.categories = categories || [];
                if (categories && posts) {
                    this.filterCategories =  categories.filter(category => posts.some(post => post.categories.some(c => c.id === category.id)));
                }
            })
            .catch(error => {
                console.error('Error fetching posts and categories:', error);
            });
    }

    canDelete(post) {
        return currentUser && (currentUser.id === post.user_id || currentUser.type === 'admin');
    }

    canReport(post) {
        return currentUser && (currentUser.type === 'moderator');
    }

    canEdit(post) {
        return currentUser && (currentUser.id === post.user_id);
    }

    async renderComments(comments, parentElement, depth = 0) {
        if (!comments || comments.length === 0) return;

        const commentsContainer = document.createElement('div');
        commentsContainer.classList.add('comments-container');
        commentsContainer.style.marginLeft = `${depth * 20}px`;

        for (const comment of comments) {
            const interaction = comment.interaction;
            const commentElement = document.createElement('div');
            commentElement.classList.add('comment');
            commentElement.dataset.postId = comment.id;
            commentElement.innerHTML = `
                <div class="user-info">
                    <span class="username">${comment.user.username} Commented</span>
                    <span class="time-since">${timeSince(new Date(comment.created_at))}</span>
                </div>
                <p>${comment.body}</p>
                <div class="post-ratings-container">
                    <div class="post-rating ${interaction === 1 ? 'post-rating-selected' : ''}">
                        <span class="post-rating-button material-icons">thumb_up</span>
                        <span class="post-rating-count">${comment.likes}</span>
                    </div>
                    <div class="post-rating ${interaction === -1 ? 'post-rating-selected' : ''}">
                        <span class="post-rating-button material-icons">thumb_down</span>
                        <span class="post-rating-count">${comment.dislikes}</span>
                    </div>
                </div>
                <button class="reply-button">Reply</button>
            `;

            if (this.canDelete(comment)) {
                const deleteButton = document.createElement('button');
                deleteButton.innerText = 'Delete'
                let deleteComment = () => {
                    fetchAPI(`/posts/${comment.id}`, 'DELETE')
                        .then(() => {
                            Toastr.success('Comment deleted successfully');
                            navigate(`posts/${comment.post_id.Int64}`);
                        })
                        .catch(error => {
                            console.error('Error deleting comment:', error);
                            Toastr.error('Error deleting comment');
                        });
                }
                deleteButton.onclick = async () => {
                    Modal.show('Are you sure you want to delete this comment?', deleteComment);
                }
                deleteButton.classList.add('redButton');
                commentElement.appendChild(deleteButton);
            }
    
            this.addRatingListeners(commentElement, comment.id);
    
            const replyButton = commentElement.querySelector('.reply-button');
            if (!currentUser) {
                replyButton.addEventListener("click", () => {
                    Toastr.error("You must be logged in to interact with posts");
                });
            } else {
                replyButton.onclick = () => this.renderReplyForm(comment.id);
            }

            commentsContainer.prepend(commentElement);
    
            await this.renderComments(comment.comments, commentElement, depth + 1);
        }

        parentElement.appendChild(commentsContainer);
    }
    

    addRatingListeners(element, postId) {

        const ratings = element.querySelectorAll(":scope > .post-ratings-container > .post-rating");
        ratings.forEach((rating, index) => {
            const button = rating.querySelector(".post-rating-button");
            const count = rating.querySelector(".post-rating-count");
            if (!currentUser) {
                button.addEventListener("click", () => {
                    Toastr.error("You must be logged in to interact with posts");
                });
                return;
            }
            button.addEventListener("click", async () => {
                if (rating.classList.contains("post-rating-selected")) {
                    rating.classList.remove("post-rating-selected");
                    count.textContent = Math.max(0, Number(count.textContent) - 1);
                    const likeOrDislike = index === 0 ? "like" : "dislike";
                    try {
                        console.log('Interacting with post:', likeOrDislike);
                        const response = await fetchAPI(`/posts/${postId}/interact`, 'PUT', { type: likeOrDislike });
                    } catch (error) {
                        console.error('Error interacting with post:', error);
                    }
                    return;
                }
                count.textContent = Number(count.textContent) + 1;
                ratings.forEach(r => {
                    if (r.classList.contains("post-rating-selected")) {
                        const c = r.querySelector(".post-rating-count");
                        c.textContent = Math.max(0, Number(c.textContent) - 1);
                        r.classList.remove("post-rating-selected");
                    }
                });
                rating.classList.add("post-rating-selected");
                const likeOrDislike = index === 0 ? "like" : "dislike";
                try {
                    console.log('Interacting with post:', likeOrDislike);
                    const response = await fetchAPI(`/posts/${postId}/interact`, 'PUT', { type: likeOrDislike });
                } catch (error) {
                    console.error('Error interacting with post:', error);
                }
            });
        });
    }
    

    renderReplyForm(parentId) {
        this.removeExistingReplyForms();

        const parentElement = document.querySelector(`[data-post-id="${parentId}"]`);
        if (!parentElement) {
            console.error(`Parent element with id ${parentId} not found`);
            return;
        }

        const form = document.createElement('form');
        form.classList.add('reply-form');
        form.innerHTML = `
            <textarea name="body" maxlength=1000 required></textarea>
            <button type="submit">Submit</button>
            <button type="button" class="cancel-reply">Cancel</button>
        `;

        form.onsubmit = (e) => {
            e.preventDefault();
            const body = sanitizeInput(form.body.value);
            fetchAPI(`/posts/${parentId}/comment`, 'POST', { body })
                .then(() => {
                    Toastr.success('Comment posted successfully');
                    navigate(`posts/${parentId}`);
                })
                .catch(error => {
                    Toastr.error('Error posting comment:', error);
                    console.error(error);
                });
        };

        form.querySelector('.cancel-reply').onclick = () => {
            form.remove();
        };

        parentElement.insertBefore(form, parentElement.querySelector('.comments-container'));
    }

    removeExistingReplyForms() {
        const existingForms = document.querySelectorAll('.reply-form');
        existingForms.forEach(form => form.remove());
    }

    async renderPostForm() {
        await this.fetchData()
        this.content.innerHTML = `
            <h2>Create Post</h2>
            <form id="post-form">
                <input type="text" name="title" placeholder="Title" maxlength=40 required>
                <textarea name="body" placeholder="Body" maxlength=2000 required></textarea>
                <input type="file" name="media">
                ${this.categories.map(category => `<label><input type="checkbox" name="categories" value="${category.id}">${category.name}</label>`).join('')}
                <button type="submit">Submit</button>
            </form>
        `;
        const form = document.getElementById('post-form');

        form.onsubmit = (event) => {
            event.preventDefault();
            this.handlePostForm();
        }
    }

    handlePostForm() {
        const form = document.getElementById('post-form');
    
        let post = () => {
            const formData = new FormData(form);
            const categories = formData.getAll('categories').map(Number);
            formData.delete('categories');
            formData.append('categories', categories.join(','));
    
            // Sanitize the title and body inputs
            const sanitizedTitle = sanitizeInput(formData.get('title'));
            const sanitizedBody = sanitizeInput(formData.get('body'));
    
            // Replace the original values with sanitized ones
            formData.set('title', sanitizedTitle);
            formData.set('body', sanitizedBody);
    
            fetchAPI('/posts', 'POST', { ...Object.fromEntries(formData) })
                .then(() => {
                    Toastr.success('Post created successfully');
                    navigate('posts');
                })
                .catch(error => {
                    Toastr.error('Error creating post:' + error.message);
                });
        }
    
        Modal.show('Are you sure you want to create this post?', post);
    }
    

    async renderPostEditForm(post) {
        await this.fetchData();
        this.content.innerHTML = `
            <h2>Edit Post</h2>
            <form id="post-form">
                <input type="text" name="title" placeholder="Title" value="${post.title}" maxlength=40 required>
                <textarea name="body" placeholder="Body" maxlength=2000 required>${post.body}</textarea>
                <input type="file" name="media">
                ${this.categories.map(category => `<label><input type="checkbox" name="categories" value="${category.id}" ${post.categories.some(c => c.id === category.id) ? 'checked' : ''}>${category.name}</label>`).join('')}
                <button type="submit">Submit</button>
            </form>
        `;
        const form = document.getElementById('post-form');

        if (post.media.Valid) {
            const media = document.createElement('img');
            media.src = post.media.String;
            media.classList.add('post-media');
            form.appendChild(media);

            const deleteButton = document.createElement('button');
            deleteButton.innerText = 'Delete Media'
            let deleteMedia = () => {
                fetchAPI(`/posts/${post.id}/media`, 'DELETE')
                    .then(() => {
                        Toastr.success('Media deleted successfully');
                        navigate('posts');
                    })
                    .catch(error => {
                        console.error('Error deleting media:', error);
                        Toastr.error('Error deleting media');
                    });
            }
            deleteButton.onclick = async () => {
                Modal.show('Are you sure you want to delete this media?', deleteMedia);
            }
            deleteButton.classList.add('redButton');
            form.appendChild(deleteButton);
        }

        form.onsubmit = (event) => {
            event.preventDefault();
            this.handlePostEditForm(post);
        }
    }

    handlePostEditForm(post) {
        const form = document.getElementById('post-form');
    
        let editPost = () => {
            const formData = new FormData(form);
            const categories = formData.getAll('categories').map(Number);
            formData.delete('categories');
            formData.append('categories', categories.join(','));
    
            // Sanitize the title and body inputs
            const sanitizedTitle = sanitizeInput(formData.get('title'));
            const sanitizedBody = sanitizeInput(formData.get('body'));
    
            // Replace the original values with sanitized ones
            formData.set('title', sanitizedTitle);
            formData.set('body', sanitizedBody);
    
            fetchAPI(`/posts/${post.id}`, 'PUT', { ...Object.fromEntries(formData) })
                .then(() => {
                    Toastr.success('Post updated successfully');
                    navigate('posts/' + post.id);
                })
                .catch(error => {
                    Toastr.error('Error updating post:' + error.message);
                });
        }
    
        Modal.show('Are you sure you want to update this post?', editPost);
    }    

    renderPostReportForm(post) {
        this.content.innerHTML = `
            <h2>Report Post</h2>
            <form id="post-form">
                <input type="text" name="content" placeholder="Content" required>
                <select name="type" required>
                    <option value="irrelevant">Irrelevant</option>
                    <option value="obscene">Obscene</option>
                    <option value="illegal">Illegal</option>
                    <option value="insulting">Insulting</option>
                                    </select>
                <button type="submit">Submit</button>
            </form>
        `;
        const form = document.getElementById('post-form');

        form.onsubmit = (event) => {
            event.preventDefault();
            this.handlePostReportForm(post);
        }
    }

    handlePostReportForm(post) {
        const form = document.getElementById('post-form');

        let reportPost = () => {
            const formData = new FormData(form);
            fetchAPI(`/posts/${post.id}/report`, 'POST', { ...Object.fromEntries(formData) })
                .then(() => {
                    Toastr.success('Post reported successfully');
                    navigate('posts');
                })
                .catch(error => {
                    Toastr.error('Error reporting post:' + error.message);
                });
        }

        Modal.show('Are you sure you want to report this post?', reportPost);
    }

    // addNewPost(post) {
    //     // add Logic to add a new post to the UI

    // }

    // addNewComment(comment) {
    //     // Logic to add a new comment to the UI
    // }

    // updateInteraction(postId, interaction) {
    //     // Logic to update post interaction in the UI
    // }
}
