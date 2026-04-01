export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

const TOKEN_KEY = 'saas_token';

export class ApiError extends Error {
    constructor(message, options = {}) {
        super(message);
        this.name = 'ApiError';
        this.status = options.status || 0;
        this.details = options.details || [];
        this.fieldErrors = this.details.reduce((errors, detail) => {
            if (detail?.path && !errors[detail.path]) {
                errors[detail.path] = detail.message;
            }

            return errors;
        }, {});
    }
}

export function getToken() {
    if (typeof window === 'undefined') {
        return null;
    }

    return window.localStorage.getItem(TOKEN_KEY);
}

export function setToken(token) {
    if (typeof window === 'undefined') {
        return;
    }

    window.localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
    if (typeof window === 'undefined') {
        return;
    }

    window.localStorage.removeItem(TOKEN_KEY);
}

export async function apiRequest(path, options = {}) {
    const token = getToken();
    const headers = {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
    };

    if (token) {
        headers.Authorization = `Bearer ${token}`;
    }

    let response;

    try {
        response = await fetch(`${API_BASE_URL}${path}`, {
            ...options,
            headers,
        });
    } catch (error) {
        throw new ApiError('Unable to reach the API. Check that the backend is running.');
    }

    const data = await response.json().catch(() => null);

    if (!response.ok) {
        throw new ApiError(data?.error || 'Request failed', {
            status: response.status,
            details: data?.details,
        });
    }

    return data;
}

export function loginRequest(payload) {
    return apiRequest('/auth/login', {
        method: 'POST',
        body: JSON.stringify(payload),
    });
}

export function meRequest() {
    return apiRequest('/auth/me');
}

export function projectsRequest() {
    return apiRequest('/projects');
}

export function createProjectRequest(payload) {
    return apiRequest('/projects', {
        method: 'POST',
        body: JSON.stringify(payload),
    });
}

export function updateProjectRequest(projectId, payload) {
    return apiRequest(`/projects/${projectId}`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
    });
}

export function deleteProjectRequest(projectId) {
    return apiRequest(`/projects/${projectId}`, {
        method: 'DELETE',
    });
}

export function membersRequest() {
    return apiRequest('/memberships');
}

export function createMemberRequest(payload) {
    return apiRequest('/memberships', {
        method: 'POST',
        body: JSON.stringify(payload),
    });
}

export function invitationsRequest() {
    return apiRequest('/invitations');
}

export function createInvitationRequest(payload) {
    return apiRequest('/invitations', {
        method: 'POST',
        body: JSON.stringify(payload),
    });
}

export function deleteInvitationRequest(invitationId) {
    return apiRequest(`/invitations/${invitationId}`, {
        method: 'DELETE',
    });
}

export function invitationDetailsRequest(token) {
    return apiRequest(`/invitations/token/${token}`);
}

export function acceptInvitationRequest(payload) {
    return apiRequest('/invitations/accept', {
        method: 'POST',
        body: JSON.stringify(payload),
    });
}

export function updateMemberRoleRequest(membershipId, payload) {
    return apiRequest(`/memberships/${membershipId}`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
    });
}

export function deleteMemberRequest(membershipId) {
    return apiRequest(`/memberships/${membershipId}`, {
        method: 'DELETE',
    });
}

