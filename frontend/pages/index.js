import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

import { AppShell } from '../components/layout/app-shell';
import { Alert } from '../components/ui/alert';
import { Button } from '../components/ui/button';
import {
    clearToken,
    createInvitationRequest,
    createProjectRequest,
    deleteProjectRequest,
    deleteMemberRequest,
    deleteInvitationRequest,
    getToken,
    invitationsRequest,
    membersRequest,
    meRequest,
    projectsRequest,
    updateProjectRequest,
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

const pillBadgeStyles = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '5px 12px',
    borderRadius: '999px',
    fontSize: '12px',
    fontWeight: 700,
    lineHeight: 1,
    textTransform: 'uppercase',
    whiteSpace: 'nowrap',
};

const memberRoleBadgeStyles = {
    ...pillBadgeStyles,
    height: 'fit-content',
    alignSelf: 'flex-start',
    padding: '3px 12px',
};

function formatRole(role) {
    if (!role) {
        return '';
    }

    return `${role.charAt(0).toUpperCase()}${role.slice(1)}`;
}

function formatShortDate(value) {
    if (!value) {
        return '';
    }

    return new Date(value).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    });
}

export default function HomePage() {
    const router = useRouter();
    const [session, setSession] = useState(null);
    const [invitations, setInvitations] = useState([]);
    const [members, setMembers] = useState([]);
    const [projects, setProjects] = useState([]);
    const [projectsError, setProjectsError] = useState('');
    const [membersError, setMembersError] = useState('');
    const [createError, setCreateError] = useState('');
    const [projectActionError, setProjectActionError] = useState('');
    const [invitationError, setInvitationError] = useState('');
    const [projectFieldErrors, setProjectFieldErrors] = useState({});
    const [projectEditFieldErrors, setProjectEditFieldErrors] = useState({});
    const [invitationFieldErrors, setInvitationFieldErrors] = useState({});
    const [invitationsError, setInvitationsError] = useState('');
    const [isCreating, setIsCreating] = useState(false);
    const [projectActionLoadingId, setProjectActionLoadingId] = useState('');
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
    const [projectEditForm, setProjectEditForm] = useState({
        name: '',
        description: '',
    });
    const [editingProjectId, setEditingProjectId] = useState('');
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
    const roleLabel = formatRole(session?.role);
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

    function handleProjectEditFieldChange(event) {
        const { name, value } = event.target;
        setProjectActionError('');
        setProjectEditFieldErrors((current) => {
            if (!current[name]) {
                return current;
            }

            const nextErrors = { ...current };
            delete nextErrors[name];
            return nextErrors;
        });
        setProjectEditForm((current) => ({
            ...current,
            [name]: value,
        }));
    }

    function handleStartProjectEdit(project) {
        setProjectActionError('');
        setProjectEditFieldErrors({});
        setEditingProjectId(project.id);
        setProjectEditForm({
            name: project.name,
            description: project.description || '',
        });
    }

    function handleCancelProjectEdit() {
        setEditingProjectId('');
        setProjectEditFieldErrors({});
        setProjectActionError('');
        setProjectEditForm({
            name: '',
            description: '',
        });
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

    async function handleUpdateProject(projectId) {
        const nextFieldErrors = validateProjectForm(projectEditForm);

        setProjectActionError('');
        setProjectEditFieldErrors(nextFieldErrors);

        if (hasFieldErrors(nextFieldErrors)) {
            return;
        }

        setProjectActionLoadingId(projectId);

        try {
            const updatedProject = await updateProjectRequest(projectId, {
                name: projectEditForm.name,
                description: projectEditForm.description,
            });

            setProjects((current) =>
                current.map((project) => (project.id === projectId ? updatedProject : project))
            );
            handleCancelProjectEdit();
        } catch (requestError) {
            if (hasFieldErrors(requestError.fieldErrors || {})) {
                setProjectEditFieldErrors(requestError.fieldErrors);
            } else {
                setProjectActionError(requestError.message || 'Unable to update project');
            }
        } finally {
            setProjectActionLoadingId('');
        }
    }

    async function handleDeleteProject(projectId) {
        const confirmed = window.confirm('Delete this project? This action cannot be undone.');

        if (!confirmed) {
            return;
        }

        setProjectActionError('');
        setProjectActionLoadingId(projectId);

        try {
            await deleteProjectRequest(projectId);
            setProjects((current) => current.filter((project) => project.id !== projectId));

            if (editingProjectId === projectId) {
                handleCancelProjectEdit();
            }
        } catch (requestError) {
            setProjectActionError(requestError.message || 'Unable to delete project');
        } finally {
            setProjectActionLoadingId('');
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
            <AppShell
                currentNav="dashboard"
                description="Loading workspace"
                title="Restoring session"
            >
                <div className="surface-card p-5">
                    <div className="space-y-3">
                        <div className="h-4 w-36 animate-pulse rounded bg-subtle" />
                        <div className="h-10 w-full animate-pulse rounded-md bg-subtle" />
                        <div className="h-10 w-full animate-pulse rounded-md bg-subtle" />
                    </div>
                </div>
            </AppShell>
        );
    }

    if (!session) {
        return (
            <AppShell
                currentNav="dashboard"
                description="Your session could not be restored."
                title="Session unavailable"
            >
                <div className="surface-card max-w-[720px] p-6">
                    <div className="space-y-4">
                        <Alert variant="error">{error || 'Please sign in again to continue.'}</Alert>
                        <Button as={Link} href="/login" variant="secondary">
                            Go to login
                        </Button>
                    </div>
                </div>
            </AppShell>
        );
    }

    return (
        <AppShell
            currentNav="dashboard"
            description={`${session.tenant.name} · ${roleLabel}`}
            onSignOut={handleSignOut}
            session={session}
            title={`Welcome back, ${session.user.fullName}`}
        >
                <section id="members" style={{ ...panelStyles, marginTop: '24px' }}>
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
                            <h2 style={{ margin: 0, fontSize: '22px' }}>Members ({members.length})</h2>
                            <p style={{ margin: '8px 0 0', color: '#52606d' }}>Manage team members and permissions</p>
                        </div>
                    </div>

                    {canManageMembers ? (
                        <div
                            id="invitations"
                            style={{
                                marginBottom: '24px',
                                padding: '20px',
                                borderRadius: '18px',
                                backgroundColor: '#f8fafc',
                                border: '1px solid #e2e8f0',
                            }}
                        >
                            <div style={{ marginBottom: '16px' }}>
                                <h3 style={{ margin: '0 0 6px', fontSize: '20px' }}>Invite member</h3>
                                <p style={{ margin: 0, color: '#52606d' }}>Send an invitation to join this workspace.</p>
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
                                        ) : null}
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
                                        {isCreatingInvitation ? 'Sending...' : 'Send invitation'}
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
                            Only Owners and Admins can invite or manage members.
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
                        id={canManageMembers ? 'invitations' : undefined}
                        style={{
                            marginBottom: '18px',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            gap: '12px',
                            flexWrap: 'wrap',
                        }}
                    >
                        <h3 style={{ margin: 0, fontSize: '20px' }}>Invitations ({visibleInvitations.length})</h3>
                        <button
                            type="button"
                            onClick={() => setShowClosedInvites((current) => !current)}
                            style={{
                                ...buttonStyles,
                                backgroundColor: '#475569',
                            }}
                        >
                            {showClosedInvites ? 'Hide accepted and expired' : 'Show accepted and expired'}
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
                                                        {invitation.full_name || 'No name provided'} - {formatRole(invitation.role)}
                                                    </p>
                                                </div>

                                                <div
                                                    style={{
                                                        ...pillBadgeStyles,
                                                        backgroundColor: isAccepted ? '#dcfce7' : isExpired ? '#e2e8f0' : '#fff7ed',
                                                        color: isAccepted ? '#166534' : isExpired ? '#475569' : '#9a3412',
                                                    }}
                                                >
                                                    {statusLabel}
                                                </div>
                                            </div>

                                            <div style={{ marginTop: '12px', fontSize: '13px', color: '#52606d', lineHeight: 1.7 }}>
                                                <div>Expires {formatShortDate(invitation.expires_at)}</div>
                                                {!isAccepted ? (
                                                    <div style={{ marginTop: '8px', wordBreak: 'break-all' }}>
                                                        Invite link: <a href={invitation.invitation_link}>{invitation.invitation_link}</a>
                                                    </div>
                                                ) : null}
                                            </div>

                                            {canRevoke ? (
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
                                                    >
                                                        Copy Link
                                                    </button>

                                                    <button
                                                        type="button"
                                                        onClick={() => handleRevokeInvitation(invitation.id)}
                                                        disabled={invitationActionLoadingId === invitation.id}
                                                        style={{
                                                            ...buttonStyles,
                                                            backgroundColor: '#b91c1c',
                                                        }}
                                                    >
                                                        {invitationActionLoadingId === invitation.id ? 'Revoking...' : 'Revoke'}
                                                    </button>
                                                </div>
                                            ) : null}
                                        </article>
                                    );
                                })()
                            ))}
                        </div>
                    ) : (
                        <div
                            id={canManageMembers ? undefined : 'invitations'}
                            style={{
                                marginBottom: '24px',
                                padding: '20px',
                                borderRadius: '16px',
                                backgroundColor: '#f8fafc',
                                border: '1px dashed #cbd5e1',
                            }}
                        >
                            <p style={{ margin: 0, fontSize: '15px', color: '#52606d', lineHeight: 1.7 }}>
                                No pending invitations.
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
                                No members yet.
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
                                            <p style={{ margin: '10px 0 0', fontSize: '13px', color: '#52606d' }}>
                                                {formatRole(member.role)} - {member.is_active ? 'Active' : 'Inactive'}
                                            </p>
                                            <p style={{ margin: '6px 0 0', fontSize: '13px', color: '#64748b' }}>
                                                Added {formatShortDate(member.created_at)}
                                            </p>
                                        </div>

                                        <div
                                            style={{
                                                ...memberRoleBadgeStyles,
                                                backgroundColor: '#ede9fe',
                                                color: '#6d28d9',
                                            }}
                                        >
                                            {formatRole(member.role)}
                                        </div>
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
                                                {memberActionLoadingId === member.id ? 'Working...' : 'Remove'}
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

                <section id="projects" style={{ ...panelStyles, marginTop: '24px' }}>
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
                                            Brief description
                                        </label>
                                        <textarea
                                            id="description"
                                            name="description"
                                            placeholder="Add a short summary for the team"
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
                                        {projectFieldErrors.description ? (
                                            <p style={fieldErrorTextStyles}>{projectFieldErrors.description}</p>
                                        ) : null}
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
                                Only Owners and Admins can create projects.
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
                            <h2 style={{ margin: 0, fontSize: '22px' }}>Projects ({projects.length})</h2>
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

                    {projectActionError ? (
                        <div
                            style={{
                                marginBottom: '18px',
                                padding: '14px 16px',
                                borderRadius: '14px',
                                backgroundColor: '#fef2f2',
                                color: '#b91c1c',
                                border: '1px solid #fecaca',
                            }}
                        >
                            {projectActionError}
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
                                No projects yet.
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
                                            {editingProjectId === project.id ? (
                                                <div style={{ minWidth: '280px' }}>
                                                    <div style={{ marginBottom: '14px' }}>
                                                        <label htmlFor={`project-name-${project.id}`} style={labelStyles}>
                                                            Project Name
                                                        </label>
                                                        <input
                                                            id={`project-name-${project.id}`}
                                                            name="name"
                                                            type="text"
                                                            value={projectEditForm.name}
                                                            onChange={handleProjectEditFieldChange}
                                                            style={{
                                                                ...inputStyles,
                                                                borderColor: projectEditFieldErrors.name ? '#dc2626' : inputStyles.border,
                                                            }}
                                                            disabled={projectActionLoadingId === project.id}
                                                        />
                                                        {projectEditFieldErrors.name ? (
                                                            <p style={fieldErrorTextStyles}>{projectEditFieldErrors.name}</p>
                                                        ) : null}
                                                    </div>

                                                    <div>
                                                        <label htmlFor={`project-description-${project.id}`} style={labelStyles}>
                                                            Brief description
                                                        </label>
                                                        <textarea
                                                            id={`project-description-${project.id}`}
                                                            name="description"
                                                            value={projectEditForm.description}
                                                            onChange={handleProjectEditFieldChange}
                                                            style={{
                                                                ...inputStyles,
                                                                borderColor: projectEditFieldErrors.description ? '#dc2626' : inputStyles.border,
                                                                minHeight: '110px',
                                                                resize: 'vertical',
                                                                fontFamily: 'inherit',
                                                            }}
                                                            disabled={projectActionLoadingId === project.id}
                                                        />
                                                        {projectEditFieldErrors.description ? (
                                                            <p style={fieldErrorTextStyles}>{projectEditFieldErrors.description}</p>
                                                        ) : null}
                                                    </div>
                                                </div>
                                            ) : (
                                                <>
                                                    <h3 style={{ margin: '0 0 8px', fontSize: '20px' }}>{project.name}</h3>
                                                    <p style={{ margin: 0, color: '#52606d', lineHeight: 1.7 }}>
                                                        {project.description || 'No description provided.'}
                                                    </p>
                                                </>
                                            )}
                                        </div>

                                        <div
                                            style={{
                                                ...pillBadgeStyles,
                                                backgroundColor: '#dcfce7',
                                                color: '#166534',
                                            }}
                                        >
                                            {formatRole(project.status)}
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
                                        <span>Active - Updated {formatShortDate(project.updated_at)}</span>
                                    </div>

                                    {canCreateProjects ? (
                                        <div
                                            style={{
                                                marginTop: '16px',
                                                display: 'flex',
                                                gap: '12px',
                                                flexWrap: 'wrap',
                                                alignItems: 'center',
                                            }}
                                        >
                                            {editingProjectId === project.id ? (
                                                <>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleUpdateProject(project.id)}
                                                        disabled={projectActionLoadingId === project.id}
                                                        style={buttonStyles}
                                                    >
                                                        {projectActionLoadingId === project.id ? 'Saving...' : 'Save'}
                                                    </button>

                                                    <button
                                                        type="button"
                                                        onClick={handleCancelProjectEdit}
                                                        disabled={projectActionLoadingId === project.id}
                                                        style={{
                                                            ...buttonStyles,
                                                            backgroundColor: '#475569',
                                                        }}
                                                    >
                                                        Cancel
                                                    </button>
                                                </>
                                            ) : (
                                                <>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleStartProjectEdit(project)}
                                                        disabled={Boolean(editingProjectId) || projectActionLoadingId === project.id}
                                                        style={buttonStyles}
                                                    >
                                                        Edit
                                                    </button>

                                                    <button
                                                        type="button"
                                                        onClick={() => handleDeleteProject(project.id)}
                                                        disabled={Boolean(editingProjectId) || projectActionLoadingId === project.id}
                                                        style={{
                                                            ...buttonStyles,
                                                            backgroundColor: '#b91c1c',
                                                        }}
                                                    >
                                                        {projectActionLoadingId === project.id ? 'Working...' : 'Delete'}
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    ) : null}
                                </article>
                            ))}
                        </div>
                    )}
                </section>
        </AppShell>
    );
}
