// category.js

import {navigate} from "../router.js";
import {previousPage, removeCurrentUser, setCurrentUser} from "../state.js";
import {fetchAPI} from "../api.js";
import Toastr from "../toastr.js";
import Modal from "../modal.js";

export class Category {

    constructor() {
        this.content = document.getElementById('content');
        window.renderAddCategory = this.renderAddCategory.bind(this);
        window.handleAddCategory = this.handleAddCategory.bind(this);
        window.renderEditCategory = this.renderEditCategory.bind(this);
        window.handleDeleteCategory = this.handleDeleteCategory.bind(this);
    }


    renderCategories(id = null) {
        if (id) {
            this.renderEditCategory(id);
        }
        fetchAPI('/categories')
            .then(categories => {
                this.content.innerHTML = `
            <h2>Categories</h2>
            <button onclick="renderAddCategory()">Add Category</button>
            `;
                if (!categories) {
                    this.content.innerHTML += `<p>No categories found</p>`;
                    return;
                }
                const table = document.createElement('table');
                const thead = document.createElement('thead');
                thead.innerHTML = `
            <tr>
                <th>Name</th>
                <th>Actions</th>
            </tr>
            `;
                table.appendChild(thead);
                const tbody = document.createElement('tbody');
                categories.forEach(category => {
                    const tr = document.createElement('tr');
                    tr.innerHTML = `
                <td>${category.name}</td>
              `;
                    const actions = document.createElement('td');
                    actions.innerHTML = `
                <button onclick="renderEditCategory(${category.id})">Edit</button>
                <button class="redButton" onclick="handleDeleteCategory(${category.id})">Delete</button>
                `;
                    tr.appendChild(actions);
                    tbody.appendChild(tr);
                });
                table.appendChild(tbody);
                this.content.appendChild(table);
            }).catch(error => {
                if (error.message !== 'Unauthorized') {
                    Toastr.error('Error fetching categories');
                }
            });
    }

    renderEditCategory(id) {
        fetchAPI(`/categories/${id}`)
            .then(category => {
                this.content.innerHTML = `
            <h2>Edit Category</h2>
            <form id="edit-category-form">
                <label for="name">Name</label>
                <input type="text" id="name" name="name" value="${category.name}">
                <button type="submit">Save</button>
            </form>
            `;
                document.getElementById('edit-category-form').onsubmit = (event) => this.handleEditCategory(event, id);
            }).catch(error => {
                if (error.message !== 'Unauthorized') {
                    console.log(error);
                    Toastr.error('Error fetching category');
                }
            });
    }

    handleEditCategory(event, id) {
        event.preventDefault();
        const name = document.getElementById('name').value;
        fetchAPI(`/categories/${id}`, 'PUT', { name })
            .then(() => {
                Toastr.success('Category updated');
                navigate('categories');
            }).catch(error => {
                if (error.message !== 'Unauthorized') {
                    Toastr.error('Error updating category');
                }
            });
    }

    renderAddCategory() {
        this.content.innerHTML = `
        <h2>Add Category</h2>
        <form id="add-category-form">
            <label for="name">Name</label>
            <input type="text" id="name" name="name">
            <button type="submit">Save</button>
        </form>
        `;
        document.getElementById('add-category-form').onsubmit = this.handleAddCategory;
    }

    handleAddCategory(event) {
        event.preventDefault();
        const name = document.getElementById('name').value;
        fetchAPI('/categories', 'POST', { name })
            .then(() => {
                Toastr.success('Category added');
                navigate('categories');
            }).catch(error => {
                if (error.message !== 'Unauthorized') {
                    Toastr.error('Error adding category');
                }
            });
    }

    handleDeleteCategory(id) {
        let deleteCategory = () => fetchAPI(`/categories/${id}`, 'DELETE').then(() => {
            Toastr.success('Category deleted');
            navigate('categories');
        }).catch(error => {
            if (error.message !== 'Unauthorized') {
                Toastr.error('Error deleting category');
            }
        });
        Modal.show('Are you sure you want to delete this category?', deleteCategory);
    }
}