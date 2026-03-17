export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

const TOKEN_KEY = 'saas_token';

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

    const response = await fetch(`${API_BASE_URL}${path}`, {
        ...options,
        headers,
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
        throw new Error(data?.error || 'Request failed');
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

