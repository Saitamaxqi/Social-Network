// router.js
import {currentPage, currentUser, previousPage, setCurrentPage} from './state.js';
import {
    ActivityComponent,
    AuthComponent,
    CategoryComponent,
    MainComponent,
    NotificationComponent,
    PostComponent,
    ProfileComponent, ReportComponent,
    RequestComponent,
    UserComponent,
    DmsComponent
} from "./components.js";
// import { Dms } from './components/dms.js';

export const routes = {
    // General
    home: () => MainComponent.renderHome(),
    login: () => AuthComponent.renderLoginForm(),
    register: () => AuthComponent.renderRegisterForm(),
    posts: (id) => PostComponent.renderPosts(id),
    create: () => PostComponent.renderPostForm(),
    // Admin
    users: () => UserComponent.renderUsers(),
    requests: () => RequestComponent.renderRequests(),
    categories: () => CategoryComponent.renderCategories(),
    reports: () => ReportComponent.renderReports(),
    // Moderator
    myReports: () => ReportComponent.renderMyReports(),
    // Authenticated
    notifications: () => NotificationComponent.renderNotifications(),
    profile: () => ProfileComponent.renderProfile(),
    activity: () => ActivityComponent.renderMyActivity(),
    logout: () => AuthComponent.handleLogout(),
    chat: (id) => DmsComponent.renderDms(id),
}

const routePermissions = {
    home: ['guest', 'user', 'moderator', 'admin'],
    login: ['guest'],
    register: ['guest'],
    posts: ['guest', 'user', 'moderator', 'admin'],
    create: ['user', 'moderator', 'admin'],
    // Admin
    users: ['admin'],
    requests: ['admin'],
    categories: ['admin'],
    reports: ['admin'],
    // Moderator
    myReports: ['moderator'],
    // Authenticated
    notifications: ['user', 'moderator', 'admin'],
    profile: ['user', 'moderator', 'admin'],
    activity: ['user', 'moderator', 'admin'],
    logout : ['user', 'moderator', 'admin'],
    chat: ['user', 'moderator', 'admin'],
};


function hasPermission(page) {
    return routePermissions[page]?.includes(currentUser?.type || 'guest');
}

export function getAccessibleRoutes() {
    return Object.keys(routes).filter(route => hasPermission(route));
}

export function navigate(path) {
    let [page, ...params] = path.split('/').filter(Boolean);

    if (routes[page] === undefined) {
        switch (page) {
            case 'api':
                if (params[0] === 'callback') {
                    let provider = params[1] || '';
                    AuthComponent.handleCallback(provider);
                }
                return;
            case 'message':
                let message = new URLSearchParams(window.location.search).get('message');
                let type = new URLSearchParams(window.location.search).get('type');
                MainComponent.handleMessage(message, type);
                return;
        }
        console.log(`Route ${page} not found. Redirecting to home.`);
        navigate('home');
        return;
    }

    if (hasPermission(page)) {
        if (currentPage === 'logout') {
            routes[currentPage]();
            return;
        }
        setCurrentPage(page);
        MainComponent.renderNavigation();
        DmsComponent.renderDms();
        routes[page](...params);
        history.pushState({ page, params }, null, `/${path}`);
    } else {
        console.log(`Unauthorized access to ${page}. Redirecting to home.`);
        navigate('home');
    }
}