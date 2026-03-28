import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

import {
    clearToken,
    createInvitationRequest,
    createProjectRequest,
    deleteMemberRequest,
    deleteInvitationRequest,
    getToken,
    invitationsRequest,
    membersRequest,
    meRequest,
    projectsRequest,
    updateMemberRoleRequest,
} from '../utils/api';
import { hasFieldErrors, validateInvitationForm, validateProjectForm } from '../utils/validation';

const pageStyles = {
    minHeight: '100vh',
    padding: '40px 20px',
    background:
        'linear-gradient(135deg, rgba(246,249,252,1) 0%, rgba(252,247,239,1) 48%, rgba(237,244,239,1) 100%)',
    color: '#14213d',
    fontFamily: '"Segoe UI", sans-serif',
};

const shellStyles = {
    maxWidth: '980px',
    margin: '0 auto',
};

const heroStyles = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '24px',
    flexWrap: 'wrap',
    marginBottom: '28px',
};

const panelStyles = {
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
    borderRadius: '20px',
    padding: '28px',
    border: '1px solid rgba(20, 33, 61, 0.08)',
    boxShadow: '0 20px 50px rgba(20, 33, 61, 0.08)',
};

const statGridStyles = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: '16px',
    marginTop: '20px',
};

const statCardStyles = {
    padding: '18px',
    borderRadius: '16px',
    backgroundColor: '#f8fafc',
    border: '1px solid #e2e8f0',
};

const buttonStyles = {
    padding: '12px 16px',
    border: 'none',
    borderRadius: '12px',
    backgroundColor: '#124e66',
    color: '#fff',
    fontSize: '14px',
    fontWeight: 700,
    cursor: 'pointer',
};

const inputStyles = {
    width: '100%',
    padding: '13px 14px',
    borderRadius: '12px',
    border: '1px solid #cbd5e1',
    fontSize: '15px',
    outline: 'none',
    backgroundColor: '#fff',
};

const labelStyles = {
    display: 'block',
    marginBottom: '8px',
    fontSize: '13px',
    fontWeight: 700,
    color: '#243b53',
};

const helperTextStyles = {
    marginTop: '6px',
    fontSize: '12px',
    color: '#52606d',
};

const fieldErrorTextStyles = {
    marginTop: '6px',
    fontSize: '12px',
    color: '#b91c1c',
};

const secondaryLinkStyles = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '12px 16px',
    borderRadius: '12px',
    textDecoration: 'none',
    backgroundColor: '#ecfeff',
    color: '#155e75',
    fontWeight: 700,
};

export default function HomePage() {
    const router = useRouter();
    const [session, setSession] = useState(null);
    const [invitations, setInvitations] = useState([]);
    const [members, setMembers] = useState([]);
    const [projects, setProjects] = useState([]);
    const [projectsError, setProjectsError] = useState('');
    const [membersError, setMembersError] = useState('');
    const [createError, setCreateError] = useState('');
    const [invitationError, setInvitationError] = useState('');
    const [projectFieldErrors, setProjectFieldErrors] = useState({});
    const [invitationFieldErrors, setInvitationFieldErrors] = useState({});
    const [invitationsError, setInvitationsError] = useState('');
    const [isCreating, setIsCreating] = useState(false);
    const [isCreatingInvitation, setIsCreatingInvitation] = useState(false);
    const [invitationActionError, setInvitationActionError] = useState('');
    const [invitationActionLoadingId, setInvitationActionLoadingId] = useState('');
    const [memberActionError, setMemberActionError] = useState('');
    const [memberActionLoadingId, setMemberActionLoadingId] = useState('');
    const [showClosedInvites, setShowClosedInvites] = useState(false);
    const [projectForm, setProjectForm] = useState({
        name: '',
        description: '',
    });
    const [invitationForm, setInvitationForm] = useState({
        fullName: '',
        email: '',
        role: 'member',
    });
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        let ignore = false;

        async function loadSession() {
            const token = getToken();

            if (!token) {
                router.replace('/login');
                return;
            }

            try {
                const sessionResponse = await meRequest();
                const projectsResponse = await projectsRequest();

                let membersResponse = [];
                let invitationsResponse = [];

                if (sessionResponse.role === 'owner' || sessionResponse.role === 'admin') {
                    try {
                        const [loadedMembers, loadedInvitations] = await Promise.all([
                            membersRequest(),
                            invitationsRequest(),
                        ]);
                        membersResponse = loadedMembers;
                        invitationsResponse = loadedInvitations;
                        if (!ignore) {
                            setMembersError('');
                            setInvitationsError('');
                        }
                    } catch (membersRequestError) {
                        if (!ignore) {
                            setMembersError(membersRequestError.message || 'Unable to load tenant members');
                            setInvitationsError(membersRequestError.message || 'Unable to load tenant invitations');
                        }
                    }
                }

                if (!ignore) {
                    setSession(sessionResponse);
                    setProjects(projectsResponse);
                    setMembers(membersResponse);
                    setInvitations(invitationsResponse);
                }
            } catch (requestError) {
                clearToken();

                if (!ignore) {
                    setError(requestError.message || 'Unable to restore session');
                    router.replace('/login');
                }
            } finally {
                if (!ignore) {
                    setIsLoading(false);
                }
            }
        }

        loadSession();

        return () => {
            ignore = true;
        };
    }, [router]);

    function handleSignOut() {
        clearToken();
        router.push('/login');
    }

    const canCreateProjects = session?.role === 'owner' || session?.role === 'admin';
    const canManageMembers = session?.role === 'owner' || session?.role === 'admin';
    const isOwner = session?.role === 'owner';
    const visibleInvitations = invitations.filter((invitation) => {
        const isAccepted = Boolean(invitation.accepted_at);
        const isExpired = !isAccepted && new Date(invitation.expires_at) < new Date();

        if (showClosedInvites) {
            return true;
        }

        return !isAccepted && !isExpired;
    });

    function handleProjectFieldChange(event) {
        const { name, value } = event.target;
        setCreateError('');
        setProjectFieldErrors((current) => {
            if (!current[name]) {
                return current;
            }

            const nextErrors = { ...current };
            delete nextErrors[name];
            return nextErrors;
        });
        setProjectForm((current) => ({
            ...current,
            [name]: value,
        }));
    }

    async function handleCreateProject(event) {
        event.preventDefault();
        const nextFieldErrors = validateProjectForm(projectForm);

        setCreateError('');
        setProjectFieldErrors(nextFieldErrors);

        if (hasFieldErrors(nextFieldErrors)) {
            return;
        }

        setIsCreating(true);

        try {
            const createdProject = await createProjectRequest({
                name: projectForm.name,
                description: projectForm.description,
            });

            setProjects((current) => [createdProject, ...current]);
            setProjectForm({
                name: '',
                description: '',
            });
            setProjectFieldErrors({});
        } catch (requestError) {
            if (hasFieldErrors(requestError.fieldErrors || {})) {
                setProjectFieldErrors(requestError.fieldErrors);
            } else {
                setCreateError(requestError.message || 'Unable to create project');
            }
        } finally {
            setIsCreating(false);
        }
    }

    function handleInvitationFieldChange(event) {
        const { name, value } = event.target;
        setInvitationError('');
        setInvitationFieldErrors((current) => {
            if (!current[name]) {
                return current;
            }

            const nextErrors = { ...current };
            delete nextErrors[name];
            return nextErrors;
        });
        setInvitationForm((current) => ({
            ...current,
            [name]: value,
        }));
    }

    async function handleCreateInvitation(event) {
        event.preventDefault();
        const nextFieldErrors = validateInvitationForm(invitationForm);

        setInvitationError('');
        setInvitationFieldErrors(nextFieldErrors);

        if (hasFieldErrors(nextFieldErrors)) {
            return;
        }

        setIsCreatingInvitation(true);

        try {
            const createdInvitation = await createInvitationRequest({
                fullName: invitationForm.fullName.trim(),
                email: invitationForm.email.trim().toLowerCase(),
                role: invitationForm.role,
            });

            setInvitations((current) => [createdInvitation, ...current]);
            setInvitationForm({
                fullName: '',
                email: '',
                role: 'member',
            });
            setInvitationFieldErrors({});
        } catch (requestError) {
            if (hasFieldErrors(requestError.fieldErrors || {})) {
                setInvitationFieldErrors(requestError.fieldErrors);
            } else {
                setInvitationError(requestError.message || 'Unable to send invitation');
            }
        } finally {
            setIsCreatingInvitation(false);
        }
    }

    async function handleRoleChange(membershipId, nextRole) {
        setMemberActionError('');
        setMemberActionLoadingId(membershipId);

        try {
            const updatedMember = await updateMemberRoleRequest(membershipId, { role: nextRole });
            setMembers((current) =>
                current.map((member) => (member.id === membershipId ? { ...member, ...updatedMember } : member))
            );
        } catch (requestError) {
            setMemberActionError(requestError.message || 'Unable to update member role');
        } finally {
            setMemberActionLoadingId('');
        }
    }

    async function handleRemoveMember(membershipId) {
        setMemberActionError('');
        setMemberActionLoadingId(membershipId);

        try {
            await deleteMemberRequest(membershipId);
            setMembers((current) => current.filter((member) => member.id !== membershipId));
        } catch (requestError) {
            setMemberActionError(requestError.message || 'Unable to remove member');
        } finally {
            setMemberActionLoadingId('');
        }
    }

    async function handleRevokeInvitation(invitationId) {
        setInvitationActionError('');
        setInvitationActionLoadingId(invitationId);

        try {
            await deleteInvitationRequest(invitationId);
            setInvitations((current) => current.filter((invitation) => invitation.id !== invitationId));
        } catch (requestError) {
            setInvitationActionError(requestError.message || 'Unable to revoke invitation');
        } finally {
            setInvitationActionLoadingId('');
        }
    }

    if (isLoading) {
        return (
            <main style={pageStyles}>
                <div style={shellStyles}>
                    <section style={panelStyles}>
                        <p style={{ margin: 0, fontSize: '16px', color: '#52606d' }}>Restoring your workspace session...</p>
                    </section>
                </div>
            </main>
        );
    }

    if (!session) {
        return (
            <main style={pageStyles}>
                <div style={shellStyles}>
                    <section style={panelStyles}>
                        <h1 style={{ marginTop: 0 }}>Session unavailable</h1>
                        <p style={{ color: '#52606d' }}>{error || 'Please sign in again to continue.'}</p>
                        <Link href="/login" style={secondaryLinkStyles}>
                            Go to Login
                        </Link>
                    </section>
                </div>
            </main>
        );
    }

    return (
        <main style={pageStyles}>
            <div style={shellStyles}>
                <section style={heroStyles}>
                    <div>
                        <p
                            style={{
                                margin: '0 0 10px',
                                fontSize: '12px',
                                fontWeight: 700,
                                letterSpacing: '0.08em',
                                textTransform: 'uppercase',
                                color: '#124e66',
                            }}
                        >
                            Workspace Overview
                        </p>
                        <h1 style={{ margin: 0, fontSize: '36px', lineHeight: 1.1 }}>
                            Welcome back, {session.user.fullName}
                        </h1>
                        <p style={{ margin: '12px 0 0', maxWidth: '620px', color: '#52606d', lineHeight: 1.7 }}>
                            Your session is active and scoped to the <strong>{session.tenant.name}</strong> tenant. This
                            page is loaded from <code>/auth/me</code>, which means the frontend is using the same tenant
                            context the backend enforces for protected resources.
                        </p>
                    </div>

                    <button type="button" onClick={handleSignOut} style={buttonStyles}>
                        Sign Out
                    </button>
                </section>

                <section style={panelStyles}>
                    <h2 style={{ marginTop: 0, marginBottom: '18px', fontSize: '22px' }}>Current Session</h2>

                    <div style={statGridStyles}>
                        <article style={statCardStyles}>
                            <p style={{ margin: '0 0 8px', fontSize: '12px', textTransform: 'uppercase', color: '#52606d' }}>
                                User
                            </p>
                            <h3 style={{ margin: '0 0 6px', fontSize: '20px' }}>{session.user.fullName}</h3>
                            <p style={{ margin: 0, color: '#52606d' }}>{session.user.email}</p>
                        </article>

                        <article style={statCardStyles}>
                            <p style={{ margin: '0 0 8px', fontSize: '12px', textTransform: 'uppercase', color: '#52606d' }}>
                                Tenant
                            </p>
                            <h3 style={{ margin: '0 0 6px', fontSize: '20px' }}>{session.tenant.name}</h3>
                            <p style={{ margin: 0, color: '#52606d' }}>Slug: {session.tenant.slug}</p>
                        </article>

                        <article style={statCardStyles}>
                            <p style={{ margin: '0 0 8px', fontSize: '12px', textTransform: 'uppercase', color: '#52606d' }}>
                                Role
                            </p>
                            <h3 style={{ margin: '0 0 6px', fontSize: '20px', textTransform: 'capitalize' }}>{session.role}</h3>
                            <p style={{ margin: 0, color: '#52606d' }}>Tenant status: {session.tenant.status}</p>
                        </article>
                    </div>

                    <div
                        style={{
                            marginTop: '24px',
                            padding: '18px',
                            borderRadius: '16px',
                            backgroundColor: '#fff7ed',
                            border: '1px solid #fed7aa',
                        }}
                    >
                        <p style={{ margin: 0, fontSize: '14px', lineHeight: 1.7, color: '#9a3412' }}>
                            This workspace is already using the stored JWT to bootstrap session state and fetch tenant-scoped
                            project data from the backend.
                        </p>
                    </div>
                </section>

                <section style={{ ...panelStyles, marginTop: '24px' }}>
                    <div
                        style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            gap: '16px',
                            flexWrap: 'wrap',
                            marginBottom: '18px',
                        }}
                    >
                        <div>
                            <h2 style={{ margin: 0, fontSize: '22px' }}>Tenant Members</h2>
                            <p style={{ margin: '8px 0 0', color: '#52606d' }}>
                                Manage users inside the current tenant and assign their role.
                            </p>
                        </div>
                        <div
                            style={{
                                padding: '10px 14px',
                                borderRadius: '999px',
                                backgroundColor: '#ecfeff',
                                color: '#155e75',
                                fontWeight: 700,
                                fontSize: '13px',
                            }}
                        >
                            {members.length} member{members.length === 1 ? '' : 's'}
                        </div>
                    </div>

                    {canManageMembers ? (
                        <div
                            style={{
                                marginBottom: '24px',
                                padding: '20px',
                                borderRadius: '18px',
                                backgroundColor: '#f8fafc',
                                border: '1px solid #e2e8f0',
                            }}
                        >
                            <div style={{ marginBottom: '16px' }}>
                            <h3 style={{ margin: '0 0 8px', fontSize: '20px' }}>Invite Member</h3>
                            <p style={{ margin: 0, color: '#52606d', lineHeight: 1.7 }}>
                                    Send an invitation link so the new user can set their own password and accept the role.
                                </p>
                            </div>

                            {invitationError ? (
                                <div
                                    style={{
                                        marginBottom: '16px',
                                        padding: '14px 16px',
                                        borderRadius: '14px',
                                        backgroundColor: '#fef2f2',
                                        color: '#b91c1c',
                                        border: '1px solid #fecaca',
                                    }}
                                >
                                    {invitationError}
                                </div>
                            ) : null}

                            <form onSubmit={handleCreateInvitation}>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
                                    <div>
                                        <label htmlFor="inviteFullName" style={labelStyles}>
                                            Full Name
                                        </label>
                                        <input
                                            id="inviteFullName"
                                            name="fullName"
                                            type="text"
                                            value={invitationForm.fullName}
                                            onChange={handleInvitationFieldChange}
                                            style={{
                                                ...inputStyles,
                                                borderColor: invitationFieldErrors.fullName ? '#dc2626' : inputStyles.border,
                                            }}
                                            placeholder="Jane Doe"
                                        />
                                        {invitationFieldErrors.fullName ? (
                                            <p style={fieldErrorTextStyles}>{invitationFieldErrors.fullName}</p>
                                        ) : (
                                            <p style={helperTextStyles}>Optional, but useful for a more personal invite.</p>
                                        )}
                                    </div>

                                    <div>
                                        <label htmlFor="inviteEmail" style={labelStyles}>
                                            Email
                                        </label>
                                        <input
                                            id="inviteEmail"
                                            name="email"
                                            type="email"
                                            value={invitationForm.email}
                                            onChange={handleInvitationFieldChange}
                                            style={{
                                                ...inputStyles,
                                                borderColor: invitationFieldErrors.email ? '#dc2626' : inputStyles.border,
                                            }}
                                            placeholder="jane@tenant.com"
                                            required
                                        />
                                        {invitationFieldErrors.email ? (
                                            <p style={fieldErrorTextStyles}>{invitationFieldErrors.email}</p>
                                        ) : null}
                                    </div>

                                    <div>
                                        <label htmlFor="inviteRole" style={labelStyles}>
                                            Role
                                        </label>
                                        <select
                                            id="inviteRole"
                                            name="role"
                                            value={invitationForm.role}
                                            onChange={handleInvitationFieldChange}
                                            style={{
                                                ...inputStyles,
                                                borderColor: invitationFieldErrors.role ? '#dc2626' : inputStyles.border,
                                            }}
                                        >
                                            <option value="member">Member</option>
                                            <option value="admin">Admin</option>
                                        </select>
                                        {invitationFieldErrors.role ? (
                                            <p style={fieldErrorTextStyles}>{invitationFieldErrors.role}</p>
                                        ) : null}
                                    </div>
                                </div>

                                <div style={{ marginTop: '18px' }}>
                                    <button type="submit" style={buttonStyles} disabled={isCreatingInvitation}>
                                        {isCreatingInvitation ? 'Creating Invitation...' : 'Send Invitation'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    ) : (
                        <div
                            style={{
                                marginBottom: '24px',
                                padding: '14px 16px',
                                borderRadius: '14px',
                                backgroundColor: '#eff6ff',
                                color: '#1d4ed8',
                                border: '1px solid #bfdbfe',
                                lineHeight: 1.7,
                            }}
                        >
                            Your current role is <strong>{session.role}</strong>. Only tenant owners and admins can
                            add or manage members.
                        </div>
                    )}

                    {invitationsError ? (
                        <div
                            style={{
                                marginBottom: '24px',
                                padding: '14px 16px',
                                borderRadius: '14px',
                                backgroundColor: '#fff7ed',
                                color: '#9a3412',
                                border: '1px solid #fed7aa',
                                lineHeight: 1.7,
                            }}
                        >
                            {invitationsError}
                        </div>
                    ) : null}

                    {invitationActionError ? (
                        <div
                            style={{
                                marginBottom: '24px',
                                padding: '14px 16px',
                                borderRadius: '14px',
                                backgroundColor: '#fef2f2',
                                color: '#b91c1c',
                                border: '1px solid #fecaca',
                                lineHeight: 1.7,
                            }}
                        >
                            {invitationActionError}
                        </div>
                    ) : null}

                    <div
                        style={{
                            marginBottom: '18px',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            gap: '12px',
                            flexWrap: 'wrap',
                        }}
                    >
                        <div style={{ color: '#52606d', fontSize: '14px' }}>
                            {visibleInvitations.length} visible invitation{visibleInvitations.length === 1 ? '' : 's'}
                        </div>
                        <button
                            type="button"
                            onClick={() => setShowClosedInvites((current) => !current)}
                            style={{
                                ...buttonStyles,
                                backgroundColor: '#475569',
                            }}
                        >
                            {showClosedInvites ? 'Hide Accepted And Expired' : 'Show Accepted And Expired'}
                        </button>
                    </div>

                    {visibleInvitations.length ? (
                        <div style={{ marginBottom: '24px', display: 'grid', gap: '14px' }}>
                            {visibleInvitations.map((invitation) => (
                                (() => {
                                    const isAccepted = Boolean(invitation.accepted_at);
                                    const isExpired = !isAccepted && new Date(invitation.expires_at) < new Date();
                                    const statusLabel = isAccepted ? 'Accepted' : isExpired ? 'Expired' : 'Pending';
                                    const canRevoke = !isAccepted && !isExpired;

                                    return (
                                        <article
                                            key={invitation.id}
                                            style={{
                                                padding: '18px',
                                                borderRadius: '16px',
                                                backgroundColor: '#f8fafc',
                                                border: '1px solid #e2e8f0',
                                            }}
                                        >
                                            <div
                                                style={{
                                                    display: 'flex',
                                                    justifyContent: 'space-between',
                                                    gap: '16px',
                                                    flexWrap: 'wrap',
                                                }}
                                            >
                                                <div>
                                                    <h3 style={{ margin: '0 0 8px', fontSize: '18px' }}>{invitation.email}</h3>
                                                    <p style={{ margin: 0, color: '#52606d' }}>
                                                        {invitation.full_name || 'No name provided'} • {invitation.role}
                                                    </p>
                                                </div>

                                                <div
                                                    style={{
                                                        padding: '8px 12px',
                                                        borderRadius: '999px',
                                                        backgroundColor: isAccepted ? '#dcfce7' : isExpired ? '#e2e8f0' : '#fff7ed',
                                                        color: isAccepted ? '#166534' : isExpired ? '#475569' : '#9a3412',
                                                        fontSize: '12px',
                                                        fontWeight: 700,
                                                        textTransform: 'uppercase',
                                                    }}
                                                >
                                                    {statusLabel}
                                                </div>
                                            </div>

                                            <div style={{ marginTop: '12px', fontSize: '13px', color: '#52606d', lineHeight: 1.7 }}>
                                                <div>Expires: {new Date(invitation.expires_at).toLocaleString()}</div>
                                                {!isAccepted ? (
                                                    <div style={{ marginTop: '8px', wordBreak: 'break-all' }}>
                                                        Invite link: <a href={invitation.invitation_link}>{invitation.invitation_link}</a>
                                                    </div>
                                                ) : null}
                                            </div>

                                            <div
                                                style={{
                                                    marginTop: '16px',
                                                    display: 'flex',
                                                    gap: '12px',
                                                    flexWrap: 'wrap',
                                                    alignItems: 'center',
                                                }}
                                            >
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        if (typeof window !== 'undefined') {
                                                            window.navigator.clipboard.writeText(invitation.invitation_link);
                                                        }
                                                    }}
                                                    style={{
                                                        ...buttonStyles,
                                                        backgroundColor: '#155e75',
                                                    }}
                                                    disabled={isAccepted}
                                                >
                                                    Copy Link
                                                </button>

                                                <button
                                                    type="button"
                                                    onClick={() => handleRevokeInvitation(invitation.id)}
                                                    disabled={!canRevoke || invitationActionLoadingId === invitation.id}
                                                    style={{
                                                        ...buttonStyles,
                                                        backgroundColor: canRevoke ? '#b91c1c' : '#94a3b8',
                                                    }}
                                                >
                                                    {invitationActionLoadingId === invitation.id ? 'Revoking...' : 'Revoke'}
                                                </button>
                                            </div>
                                        </article>
                                    );
                                })()
                            ))}
                        </div>
                    ) : (
                        <div
                            style={{
                                marginBottom: '24px',
                                padding: '20px',
                                borderRadius: '16px',
                                backgroundColor: '#f8fafc',
                                border: '1px dashed #cbd5e1',
                            }}
                        >
                            <p style={{ margin: 0, fontSize: '15px', color: '#52606d', lineHeight: 1.7 }}>
                                No active invitations are currently visible. You can still view accepted or expired
                                items by toggling the invitation history.
                            </p>
                        </div>
                    )}

                    {membersError ? (
                        <div
                            style={{
                                marginBottom: '24px',
                                padding: '14px 16px',
                                borderRadius: '14px',
                                backgroundColor: '#fff7ed',
                                color: '#9a3412',
                                border: '1px solid #fed7aa',
                                lineHeight: 1.7,
                            }}
                        >
                            {membersError}
                        </div>
                    ) : null}

                    {memberActionError ? (
                        <div
                            style={{
                                marginBottom: '24px',
                                padding: '14px 16px',
                                borderRadius: '14px',
                                backgroundColor: '#fef2f2',
                                color: '#b91c1c',
                                border: '1px solid #fecaca',
                                lineHeight: 1.7,
                            }}
                        >
                            {memberActionError}
                        </div>
                    ) : null}

                    {!members.length ? (
                        <div
                            style={{
                                padding: '20px',
                                borderRadius: '16px',
                                backgroundColor: '#f8fafc',
                                border: '1px dashed #cbd5e1',
                            }}
                        >
                            <p style={{ margin: 0, fontSize: '15px', color: '#52606d', lineHeight: 1.7 }}>
                                No tenant members were returned. Once you add users, they will appear here with their role.
                            </p>
                        </div>
                    ) : (
                        <div style={{ display: 'grid', gap: '14px' }}>
                            {members.map((member) => (
                                (() => {
                                    const canManageThisMember = isOwner || member.role !== 'owner';
                                    const canRemoveThisMember =
                                        canManageThisMember && member.user_id !== session.user.id;

                                    return (
                                <article
                                    key={member.id}
                                    style={{
                                        padding: '18px',
                                        borderRadius: '16px',
                                        backgroundColor: '#f8fafc',
                                        border: '1px solid #e2e8f0',
                                    }}
                                >
                                    <div
                                        style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            gap: '16px',
                                            flexWrap: 'wrap',
                                        }}
                                    >
                                        <div>
                                            <h3 style={{ margin: '0 0 8px', fontSize: '20px' }}>{member.full_name}</h3>
                                            <p style={{ margin: 0, color: '#52606d' }}>{member.email}</p>
                                        </div>

                                        <div
                                            style={{
                                                padding: '8px 12px',
                                                borderRadius: '999px',
                                                backgroundColor: '#ede9fe',
                                                color: '#6d28d9',
                                                fontSize: '12px',
                                                fontWeight: 700,
                                                textTransform: 'uppercase',
                                            }}
                                        >
                                            {member.role}
                                        </div>
                                    </div>

                                    <div
                                        style={{
                                            marginTop: '14px',
                                            display: 'flex',
                                            gap: '16px',
                                            flexWrap: 'wrap',
                                            fontSize: '13px',
                                            color: '#52606d',
                                        }}
                                    >
                                        <span>User ID: {member.user_id}</span>
                                        <span>Status: {member.is_active ? 'Active' : 'Inactive'}</span>
                                        <span>Added: {new Date(member.created_at).toLocaleString()}</span>
                                    </div>

                                    {canManageMembers ? (
                                        <div
                                            style={{
                                                marginTop: '16px',
                                                display: 'flex',
                                                gap: '12px',
                                                flexWrap: 'wrap',
                                                alignItems: 'center',
                                            }}
                                        >
                                            <select
                                                value={member.role}
                                                onChange={(event) => handleRoleChange(member.id, event.target.value)}
                                                disabled={memberActionLoadingId === member.id || !canManageThisMember}
                                                style={{
                                                    ...inputStyles,
                                                    width: 'auto',
                                                    minWidth: '160px',
                                                }}
                                            >
                                                <option value="member">Member</option>
                                                <option value="admin">Admin</option>
                                                {isOwner ? <option value="owner">Owner</option> : null}
                                            </select>

                                            <button
                                                type="button"
                                                onClick={() => handleRemoveMember(member.id)}
                                                disabled={
                                                    memberActionLoadingId === member.id ||
                                                    !canRemoveThisMember
                                                }
                                                style={{
                                                    ...buttonStyles,
                                                    backgroundColor:
                                                        canRemoveThisMember ? '#b91c1c' : '#94a3b8',
                                                }}
                                            >
                                                {memberActionLoadingId === member.id ? 'Working...' : 'Remove Member'}
                                            </button>
                                        </div>
                                    ) : null}
                                </article>
                                    );
                                })()
                            ))}
                        </div>
                    )}
                </section>

                <section style={{ ...panelStyles, marginTop: '24px' }}>
                    <div
                        style={{
                            marginBottom: '24px',
                            padding: '20px',
                            borderRadius: '18px',
                            backgroundColor: '#f8fafc',
                            border: '1px solid #e2e8f0',
                        }}
                    >
                        <div style={{ marginBottom: '16px' }}>
                            <h2 style={{ margin: '0 0 8px', fontSize: '22px' }}>Create Project</h2>
                            <p style={{ margin: 0, color: '#52606d', lineHeight: 1.7 }}>
                                This action is limited to tenant roles with project management permission.
                            </p>
                        </div>

                        {canCreateProjects ? (
                            <>
                                {createError ? (
                                    <div
                                        style={{
                                            marginBottom: '16px',
                                            padding: '14px 16px',
                                            borderRadius: '14px',
                                            backgroundColor: '#fef2f2',
                                            color: '#b91c1c',
                                            border: '1px solid #fecaca',
                                        }}
                                    >
                                        {createError}
                                    </div>
                                ) : null}

                                <form onSubmit={handleCreateProject}>
                                    <div style={{ marginBottom: '16px' }}>
                                        <label htmlFor="name" style={labelStyles}>
                                            Project Name
                                        </label>
                                        <input
                                            id="name"
                                            name="name"
                                            type="text"
                                            placeholder="Customer Portal"
                                            value={projectForm.name}
                                            onChange={handleProjectFieldChange}
                                            style={{
                                                ...inputStyles,
                                                borderColor: projectFieldErrors.name ? '#dc2626' : inputStyles.border,
                                            }}
                                            required
                                        />
                                        {projectFieldErrors.name ? (
                                            <p style={fieldErrorTextStyles}>{projectFieldErrors.name}</p>
                                        ) : null}
                                    </div>

                                    <div style={{ marginBottom: '18px' }}>
                                        <label htmlFor="description" style={labelStyles}>
                                            Description
                                        </label>
                                        <textarea
                                            id="description"
                                            name="description"
                                            placeholder="Describe the goal of this tenant-scoped project"
                                            value={projectForm.description}
                                            onChange={handleProjectFieldChange}
                                            style={{
                                                ...inputStyles,
                                                borderColor: projectFieldErrors.description ? '#dc2626' : inputStyles.border,
                                                minHeight: '110px',
                                                resize: 'vertical',
                                                fontFamily: 'inherit',
                                            }}
                                        />
                                        <p style={projectFieldErrors.description ? fieldErrorTextStyles : helperTextStyles}>
                                            {projectFieldErrors.description || 'Optional. Keep it concise so the list stays readable.'}
                                        </p>
                                    </div>

                                    <button type="submit" style={buttonStyles} disabled={isCreating}>
                                        {isCreating ? 'Creating Project...' : 'Create Project'}
                                    </button>
                                </form>
                            </>
                        ) : (
                            <div
                                style={{
                                    padding: '14px 16px',
                                    borderRadius: '14px',
                                    backgroundColor: '#eff6ff',
                                    color: '#1d4ed8',
                                    border: '1px solid #bfdbfe',
                                    lineHeight: 1.7,
                                }}
                            >
                                Your current role is <strong>{session.role}</strong>. Members can view projects, but only
                                <strong> owner</strong> and <strong>admin</strong> roles can create them.
                            </div>
                        )}
                    </div>

                    <div
                        style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            gap: '16px',
                            flexWrap: 'wrap',
                            marginBottom: '18px',
                        }}
                    >
                        <div>
                            <h2 style={{ margin: 0, fontSize: '22px' }}>Projects</h2>
                            <p style={{ margin: '8px 0 0', color: '#52606d' }}>
                                These records are loaded from <code>/projects</code> and scoped to the current tenant.
                            </p>
                        </div>
                        <div
                            style={{
                                padding: '10px 14px',
                                borderRadius: '999px',
                                backgroundColor: '#ecfeff',
                                color: '#155e75',
                                fontWeight: 700,
                                fontSize: '13px',
                            }}
                        >
                            {projects.length} project{projects.length === 1 ? '' : 's'}
                        </div>
                    </div>

                    {projectsError ? (
                        <div
                            style={{
                                padding: '14px 16px',
                                borderRadius: '14px',
                                backgroundColor: '#fef2f2',
                                color: '#b91c1c',
                                border: '1px solid #fecaca',
                            }}
                        >
                            {projectsError}
                        </div>
                    ) : null}

                    {!projects.length ? (
                        <div
                            style={{
                                padding: '20px',
                                borderRadius: '16px',
                                backgroundColor: '#f8fafc',
                                border: '1px dashed #cbd5e1',
                            }}
                        >
                            <p style={{ margin: 0, fontSize: '15px', color: '#52606d', lineHeight: 1.7 }}>
                                No projects exist for this tenant yet. The empty state is also tenant-aware, so another tenant
                                would see only its own project list.
                            </p>
                        </div>
                    ) : (
                        <div style={{ display: 'grid', gap: '14px' }}>
                            {projects.map((project) => (
                                <article
                                    key={project.id}
                                    style={{
                                        padding: '18px',
                                        borderRadius: '16px',
                                        backgroundColor: '#f8fafc',
                                        border: '1px solid #e2e8f0',
                                    }}
                                >
                                    <div
                                        style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'flex-start',
                                            gap: '16px',
                                            flexWrap: 'wrap',
                                        }}
                                    >
                                        <div>
                                            <h3 style={{ margin: '0 0 8px', fontSize: '20px' }}>{project.name}</h3>
                                            <p style={{ margin: 0, color: '#52606d', lineHeight: 1.7 }}>
                                                {project.description || 'No description provided.'}
                                            </p>
                                        </div>

                                        <div
                                            style={{
                                                padding: '8px 12px',
                                                borderRadius: '999px',
                                                backgroundColor: '#dcfce7',
                                                color: '#166534',
                                                fontSize: '12px',
                                                fontWeight: 700,
                                                textTransform: 'uppercase',
                                            }}
                                        >
                                            {project.status}
                                        </div>
                                    </div>

                                    <div
                                        style={{
                                            marginTop: '14px',
                                            display: 'flex',
                                            gap: '16px',
                                            flexWrap: 'wrap',
                                            fontSize: '13px',
                                            color: '#52606d',
                                        }}
                                    >
                                        <span>Project ID: {project.id}</span>
                                        <span>Created: {new Date(project.created_at).toLocaleString()}</span>
                                    </div>
                                </article>
                            ))}
                        </div>
                    )}
                </section>
            </div>
        </main>
    );
}
