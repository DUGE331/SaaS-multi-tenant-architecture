import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';

import { AppShell } from '../components/layout/app-shell';
import { Alert } from '../components/ui/alert';
import { Button } from '../components/ui/button';
import {
    assistantChatRequest,
    assistantConversationsRequest,
    assistantKnowledgeRequest,
    assistantMessagesRequest,
    clearToken,
    createAssistantKnowledgeRequest,
    deleteAssistantKnowledgeRequest,
    getToken,
    meRequest,
    updateAssistantKnowledgeRequest,
} from '../utils/api';

const panelStyles = {
    backgroundColor: '#ffffff',
    borderRadius: '18px',
    border: '1px solid #e2e8f0',
    boxShadow: '0 18px 40px rgba(15, 23, 42, 0.06)',
    overflow: 'hidden',
};

const panelHeaderStyles = {
    padding: '18px 20px',
    borderBottom: '1px solid #e2e8f0',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '12px',
};

const panelTitleStyles = {
    margin: 0,
    fontSize: '18px',
    fontWeight: 700,
    color: '#0f172a',
};

const helperTextStyles = {
    margin: '6px 0 0',
    color: '#64748b',
    fontSize: '13px',
    lineHeight: 1.6,
};

const listStyles = {
    display: 'grid',
    gap: '10px',
    padding: '14px',
};

const conversationButtonStyles = {
    width: '100%',
    textAlign: 'left',
    padding: '14px',
    borderRadius: '14px',
    border: '1px solid #e2e8f0',
    backgroundColor: '#f8fafc',
    cursor: 'pointer',
};

const messageFeedStyles = {
    display: 'grid',
    gap: '14px',
    padding: '18px 20px',
    minHeight: '420px',
    maxHeight: '560px',
    overflowY: 'auto',
    background:
        'linear-gradient(180deg, rgba(248,250,252,0.75) 0%, rgba(255,255,255,1) 45%, rgba(248,250,252,0.75) 100%)',
};

const bubbleStyles = {
    maxWidth: '80%',
    padding: '14px 16px',
    borderRadius: '18px',
    lineHeight: 1.7,
    fontSize: '14px',
    whiteSpace: 'pre-wrap',
};

const fieldLabelStyles = {
    display: 'block',
    marginBottom: '8px',
    fontSize: '13px',
    fontWeight: 700,
    color: '#334155',
};

const inputStyles = {
    width: '100%',
    borderRadius: '12px',
    border: '1px solid #cbd5e1',
    padding: '12px 14px',
    fontSize: '14px',
    outline: 'none',
    backgroundColor: '#ffffff',
};

const emptyStateStyles = {
    padding: '24px',
    borderRadius: '16px',
    border: '1px dashed #cbd5e1',
    backgroundColor: '#f8fafc',
    color: '#475569',
    lineHeight: 1.7,
};

const fieldErrorStyles = {
    marginTop: '6px',
    color: '#b91c1c',
    fontSize: '12px',
};

function formatDate(value) {
    if (!value) {
        return '';
    }

    return new Date(value).toLocaleString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
    });
}

function normalizeFieldErrors(error) {
    return error?.fieldErrors || {};
}

export default function AssistantPage() {
    const router = useRouter();
    const [session, setSession] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [conversations, setConversations] = useState([]);
    const [messages, setMessages] = useState([]);
    const [selectedConversationId, setSelectedConversationId] = useState('');
    const [messageDraft, setMessageDraft] = useState('');
    const [chatError, setChatError] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [knowledgeEntries, setKnowledgeEntries] = useState([]);
    const [knowledgeError, setKnowledgeError] = useState('');
    const [knowledgeFormError, setKnowledgeFormError] = useState('');
    const [knowledgeFieldErrors, setKnowledgeFieldErrors] = useState({});
    const [knowledgeForm, setKnowledgeForm] = useState({
        title: '',
        content: '',
    });
    const [isSavingKnowledge, setIsSavingKnowledge] = useState(false);
    const [editingKnowledgeId, setEditingKnowledgeId] = useState('');
    const [knowledgeActionLoadingId, setKnowledgeActionLoadingId] = useState('');

    const canManageKnowledge = session?.role === 'owner' || session?.role === 'admin';

    useEffect(() => {
        let ignore = false;

        async function loadAssistantWorkspace() {
            const token = getToken();

            if (!token) {
                router.replace('/login');
                return;
            }

            try {
                const currentSession = await meRequest();
                const loadedConversations = await assistantConversationsRequest();
                let loadedKnowledge = [];

                if (currentSession.role === 'owner' || currentSession.role === 'admin') {
                    try {
                        loadedKnowledge = await assistantKnowledgeRequest();
                    } catch (requestError) {
                        if (!ignore) {
                            setKnowledgeError(requestError.message || 'Unable to load workspace knowledge');
                        }
                    }
                }

                if (ignore) {
                    return;
                }

                setSession(currentSession);
                setConversations(loadedConversations);
                setKnowledgeEntries(loadedKnowledge);

                if (loadedConversations.length) {
                    const initialConversationId = loadedConversations[0].id;
                    setSelectedConversationId(initialConversationId);
                    const loadedMessages = await assistantMessagesRequest(initialConversationId);

                    if (!ignore) {
                        setMessages(loadedMessages);
                    }
                }
            } catch (requestError) {
                clearToken();

                if (!ignore) {
                    setError(requestError.message || 'Unable to load the assistant workspace');
                    router.replace('/login');
                }
            } finally {
                if (!ignore) {
                    setIsLoading(false);
                }
            }
        }

        loadAssistantWorkspace();

        return () => {
            ignore = true;
        };
    }, [router]);

    async function handleSelectConversation(conversationId) {
        setSelectedConversationId(conversationId);
        setChatError('');

        try {
            const loadedMessages = await assistantMessagesRequest(conversationId);
            setMessages(loadedMessages);
        } catch (requestError) {
            setChatError(requestError.message || 'Unable to load conversation messages');
        }
    }

    function handleSignOut() {
        clearToken();
        router.push('/login');
    }

    function resetKnowledgeForm() {
        setKnowledgeForm({
            title: '',
            content: '',
        });
        setEditingKnowledgeId('');
        setKnowledgeFormError('');
        setKnowledgeFieldErrors({});
    }

    async function handleSendMessage(event) {
        event.preventDefault();

        if (!messageDraft.trim()) {
            setChatError('Enter a message before sending.');
            return;
        }

        setIsSending(true);
        setChatError('');

        try {
            const response = await assistantChatRequest({
                conversationId: selectedConversationId || undefined,
                message: messageDraft.trim(),
            });

            setMessageDraft('');

            setConversations((current) => {
                const nextConversation = response.conversation;
                const remaining = current.filter((conversation) => conversation.id !== nextConversation.id);
                return [nextConversation, ...remaining];
            });

            setSelectedConversationId(response.conversation.id);
            setMessages((current) =>
                selectedConversationId && selectedConversationId === response.conversation.id
                    ? [...current, response.userMessage, response.assistantMessage]
                    : [response.userMessage, response.assistantMessage]
            );
        } catch (requestError) {
            setChatError(requestError.message || 'Unable to send your message');
        } finally {
            setIsSending(false);
        }
    }

    function handleStartEditKnowledge(entry) {
        setEditingKnowledgeId(entry.id);
        setKnowledgeForm({
            title: entry.title,
            content: entry.content,
        });
        setKnowledgeFieldErrors({});
        setKnowledgeFormError('');
    }

    async function handleSubmitKnowledge(event) {
        event.preventDefault();

        setIsSavingKnowledge(true);
        setKnowledgeFormError('');
        setKnowledgeFieldErrors({});

        try {
            let entry;

            if (editingKnowledgeId) {
                entry = await updateAssistantKnowledgeRequest(editingKnowledgeId, {
                    title: knowledgeForm.title,
                    content: knowledgeForm.content,
                    status: 'active',
                });

                setKnowledgeEntries((current) =>
                    current.map((currentEntry) =>
                        currentEntry.id === editingKnowledgeId ? { ...currentEntry, ...entry } : currentEntry
                    )
                );
            } else {
                entry = await createAssistantKnowledgeRequest(knowledgeForm);
                setKnowledgeEntries((current) => [entry, ...current]);
            }

            resetKnowledgeForm();
        } catch (requestError) {
            const nextFieldErrors = normalizeFieldErrors(requestError);

            if (Object.keys(nextFieldErrors).length) {
                setKnowledgeFieldErrors(nextFieldErrors);
            } else {
                setKnowledgeFormError(requestError.message || 'Unable to save knowledge entry');
            }
        } finally {
            setIsSavingKnowledge(false);
        }
    }

    async function handleArchiveKnowledge(entry) {
        setKnowledgeActionLoadingId(entry.id);
        setKnowledgeFormError('');

        try {
            const updated = await updateAssistantKnowledgeRequest(entry.id, {
                title: entry.title,
                content: entry.content,
                status: entry.status === 'archived' ? 'active' : 'archived',
            });

            setKnowledgeEntries((current) =>
                current.map((currentEntry) => (currentEntry.id === entry.id ? { ...currentEntry, ...updated } : currentEntry))
            );
        } catch (requestError) {
            setKnowledgeFormError(requestError.message || 'Unable to update knowledge entry');
        } finally {
            setKnowledgeActionLoadingId('');
        }
    }

    async function handleDeleteKnowledge(entryId) {
        const confirmed = window.confirm('Delete this knowledge entry? This action cannot be undone.');

        if (!confirmed) {
            return;
        }

        setKnowledgeActionLoadingId(entryId);
        setKnowledgeFormError('');

        try {
            await deleteAssistantKnowledgeRequest(entryId);
            setKnowledgeEntries((current) => current.filter((entry) => entry.id !== entryId));

            if (editingKnowledgeId === entryId) {
                resetKnowledgeForm();
            }
        } catch (requestError) {
            setKnowledgeFormError(requestError.message || 'Unable to delete knowledge entry');
        } finally {
            setKnowledgeActionLoadingId('');
        }
    }

    if (isLoading) {
        return (
            <AppShell
                currentNav="assistant"
                description="Loading your private tenant-scoped assistant workspace."
                title="Preparing SekuroChat-lite"
            >
                <div style={emptyStateStyles}>Loading assistant workspace...</div>
            </AppShell>
        );
    }

    if (!session) {
        return (
            <AppShell
                currentNav="assistant"
                description="Your session could not be restored."
                title="Assistant unavailable"
            >
                <Alert variant="error">{error || 'Please sign in again to continue.'}</Alert>
            </AppShell>
        );
    }

    return (
        <AppShell
            currentNav="assistant"
            description={`${session.tenant.name} · Secure internal assistant`}
            onSignOut={handleSignOut}
            session={session}
            title="SekuroChat-lite"
        >
            <div className="grid items-start gap-5 xl:grid-cols-[minmax(240px,280px)_minmax(0,1fr)_minmax(280px,340px)]">
                <section style={panelStyles}>
                    <div style={panelHeaderStyles}>
                        <div>
                            <h2 style={panelTitleStyles}>Conversations</h2>
                            <p style={helperTextStyles}>Private to your account within this tenant.</p>
                        </div>
                        <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => {
                                setSelectedConversationId('');
                                setMessages([]);
                                setChatError('');
                            }}
                        >
                            New
                        </Button>
                    </div>

                    <div style={listStyles}>
                        {!conversations.length ? (
                            <div style={emptyStateStyles}>
                                No conversations yet. Start by asking a workspace question in the composer.
                            </div>
                        ) : (
                            conversations.map((conversation) => {
                                const isSelected = selectedConversationId === conversation.id;

                                return (
                                    <button
                                        key={conversation.id}
                                        onClick={() => handleSelectConversation(conversation.id)}
                                        style={{
                                            ...conversationButtonStyles,
                                            backgroundColor: isSelected ? '#e0f2fe' : conversationButtonStyles.backgroundColor,
                                            borderColor: isSelected ? '#38bdf8' : '#e2e8f0',
                                        }}
                                        type="button"
                                    >
                                        <div style={{ fontWeight: 700, color: '#0f172a', marginBottom: '6px' }}>{conversation.title}</div>
                                        <div style={{ fontSize: '12px', color: '#64748b' }}>Updated {formatDate(conversation.last_message_at)}</div>
                                    </button>
                                );
                            })
                        )}
                    </div>
                </section>

                <section style={panelStyles}>
                    <div style={panelHeaderStyles}>
                        <div>
                            <h2 style={panelTitleStyles}>Assistant Workspace</h2>
                            <p style={helperTextStyles}>
                                Answers are generated from tenant-authorized knowledge and project context only.
                            </p>
                        </div>
                    </div>

                    <div style={messageFeedStyles}>
                        {!messages.length ? (
                            <div style={emptyStateStyles}>
                                Ask a question about this workspace. The assistant will use curated tenant knowledge and lightweight
                                project context.
                            </div>
                        ) : (
                            messages.map((message) => (
                                <div
                                    key={message.id}
                                    style={{
                                        display: 'flex',
                                        justifyContent: message.role === 'assistant' ? 'flex-start' : 'flex-end',
                                    }}
                                >
                                    <div
                                        style={{
                                            ...bubbleStyles,
                                            backgroundColor: message.role === 'assistant' ? '#eff6ff' : '#124e66',
                                            color: message.role === 'assistant' ? '#0f172a' : '#ffffff',
                                        }}
                                    >
                                        <div style={{ fontSize: '12px', fontWeight: 700, marginBottom: '8px', opacity: 0.75 }}>
                                            {message.role === 'assistant' ? 'SekuroChat-lite' : 'You'}
                                        </div>
                                        {message.content}
                                        <div style={{ marginTop: '10px', fontSize: '11px', opacity: 0.7 }}>
                                            {formatDate(message.created_at)}
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    <div style={{ padding: '18px 20px', borderTop: '1px solid #e2e8f0' }}>
                        {chatError ? (
                            <Alert variant="error" className="mb-4">
                                {chatError}
                            </Alert>
                        ) : null}

                        <form onSubmit={handleSendMessage}>
                            <label htmlFor="assistant-message" style={fieldLabelStyles}>
                                Ask a workspace question
                            </label>
                            <textarea
                                id="assistant-message"
                                name="assistant-message"
                                value={messageDraft}
                                onChange={(event) => setMessageDraft(event.target.value)}
                                placeholder="Example: Summarise our current active projects and the onboarding process for new clients."
                                style={{
                                    ...inputStyles,
                                    minHeight: '120px',
                                    resize: 'vertical',
                                    fontFamily: 'inherit',
                                }}
                            />
                            <div
                                style={{
                                    marginTop: '14px',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    gap: '12px',
                                    flexWrap: 'wrap',
                                }}
                            >
                                <p style={{ ...helperTextStyles, margin: 0 }}>
                                    Do not paste passwords, API keys, secrets, or sensitive personal data into the assistant. Prompt
                                    content stays tenant-scoped and is never intended to expose cross-tenant data.
                                </p>
                                <Button type="submit" disabled={isSending}>t
                                    {isSending ? 'Generating...' : 'Send'}
                                </Button>
                            </div>
                        </form>
                    </div>
                </section>

                <section style={panelStyles}>
                    <div style={panelHeaderStyles}>
                        <div>
                            <h2 style={panelTitleStyles}>Knowledge</h2>
                            <p style={helperTextStyles}>
                                {canManageKnowledge
                                    ? 'Curate workspace knowledge used by the assistant.'
                                    : 'Knowledge management is available to owners and admins.'}
                            </p>
                        </div>
                    </div>

                    <div style={{ padding: '18px 20px' }}>
                        {!canManageKnowledge ? (
                            <div style={emptyStateStyles}>
                                This view is reserved for tenant admins. You can still use the assistant from the main chat panel.
                            </div>
                        ) : (
                            <>
                                {knowledgeError ? (
                                    <Alert variant="error" className="mb-4">
                                        {knowledgeError}
                                    </Alert>
                                ) : null}

                                {knowledgeFormError ? (
                                    <Alert variant="error" className="mb-4">
                                        {knowledgeFormError}
                                    </Alert>
                                ) : null}

                                <form onSubmit={handleSubmitKnowledge} style={{ marginBottom: '22px' }}>
                                    <div style={{ marginBottom: '14px' }}>
                                        <label htmlFor="knowledge-title" style={fieldLabelStyles}>
                                            Knowledge title
                                        </label>
                                        <input
                                            id="knowledge-title"
                                            name="knowledge-title"
                                            value={knowledgeForm.title}
                                            onChange={(event) =>
                                                setKnowledgeForm((current) => ({ ...current, title: event.target.value }))
                                            }
                                            style={{
                                                ...inputStyles,
                                                borderColor: knowledgeFieldErrors.title ? '#dc2626' : '#cbd5e1',
                                            }}
                                        />
                                        {knowledgeFieldErrors.title ? (
                                            <p style={fieldErrorStyles}>{knowledgeFieldErrors.title}</p>
                                        ) : null}
                                    </div>

                                    <div style={{ marginBottom: '14px' }}>
                                        <label htmlFor="knowledge-content" style={fieldLabelStyles}>
                                            Knowledge content
                                        </label>
                                        <textarea
                                            id="knowledge-content"
                                            name="knowledge-content"
                                            value={knowledgeForm.content}
                                            onChange={(event) =>
                                                setKnowledgeForm((current) => ({ ...current, content: event.target.value }))
                                            }
                                            style={{
                                                ...inputStyles,
                                                minHeight: '130px',
                                                resize: 'vertical',
                                                fontFamily: 'inherit',
                                                borderColor: knowledgeFieldErrors.content ? '#dc2626' : '#cbd5e1',
                                            }}
                                        />
                                        {knowledgeFieldErrors.content ? (
                                            <p style={fieldErrorStyles}>{knowledgeFieldErrors.content}</p>
                                        ) : null}
                                    </div>

                                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                                        <Button type="submit" disabled={isSavingKnowledge}>
                                            {isSavingKnowledge
                                                ? editingKnowledgeId
                                                    ? 'Saving...'
                                                    : 'Creating...'
                                                : editingKnowledgeId
                                                  ? 'Save entry'
                                                  : 'Create entry'}
                                        </Button>
                                        {editingKnowledgeId ? (
                                            <Button type="button" variant="secondary" onClick={resetKnowledgeForm}>
                                                Cancel
                                            </Button>
                                        ) : null}
                                    </div>
                                </form>

                                <div style={{ display: 'grid', gap: '12px' }}>
                                    {!knowledgeEntries.length ? (
                                        <div style={emptyStateStyles}>
                                            No knowledge entries yet. Add curated internal guidance so the assistant has trusted tenant
                                            context.
                                        </div>
                                    ) : (
                                        knowledgeEntries.map((entry) => (
                                            <article
                                                key={entry.id}
                                                style={{
                                                    border: '1px solid #e2e8f0',
                                                    borderRadius: '16px',
                                                    padding: '16px',
                                                    backgroundColor: entry.status === 'archived' ? '#f8fafc' : '#ffffff',
                                                }}
                                            >
                                                <div
                                                    style={{
                                                        display: 'flex',
                                                        alignItems: 'flex-start',
                                                        justifyContent: 'space-between',
                                                        gap: '12px',
                                                        marginBottom: '10px',
                                                    }}
                                                >
                                                    <div>
                                                        <h3 style={{ margin: 0, fontSize: '16px', color: '#0f172a' }}>{entry.title}</h3>
                                                        <p style={{ ...helperTextStyles, marginBottom: 0 }}>
                                                            {entry.status === 'archived' ? 'Archived' : 'Active'} · Updated {formatDate(entry.updated_at)}
                                                        </p>
                                                    </div>
                                                </div>

                                                <p style={{ margin: 0, color: '#334155', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
                                                    {entry.content}
                                                </p>

                                                <div style={{ marginTop: '14px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                                                    <Button
                                                        variant="secondary"
                                                        size="sm"
                                                        onClick={() => handleStartEditKnowledge(entry)}
                                                        disabled={Boolean(knowledgeActionLoadingId)}
                                                    >
                                                        Edit
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleArchiveKnowledge(entry)}
                                                        disabled={knowledgeActionLoadingId === entry.id}
                                                    >
                                                        {knowledgeActionLoadingId === entry.id
                                                            ? 'Working...'
                                                            : entry.status === 'archived'
                                                              ? 'Restore'
                                                              : 'Archive'}
                                                    </Button>
                                                    <Button
                                                        variant="destructive"
                                                        size="sm"
                                                        onClick={() => handleDeleteKnowledge(entry.id)}
                                                        disabled={knowledgeActionLoadingId === entry.id}
                                                    >
                                                        {knowledgeActionLoadingId === entry.id ? 'Deleting...' : 'Delete'}
                                                    </Button>
                                                </div>
                                            </article>
                                        ))
                                    )}
                                </div>
                            </>
                        )}
                    </div>
                </section>
            </div>

            <div style={{ marginTop: '18px' }}>
                <Alert variant="info">
                    Bedrock-backed responses will require backend environment variables and AWS credentials before the assistant can answer
                    live prompts. The UI and tenant-safe route structure are ready for that integration path.
                </Alert>
            </div>
        </AppShell>
    );
}
