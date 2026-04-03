import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

import { AuthShell } from '../components/layout/auth-shell';
import { Alert } from '../components/ui/alert';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { acceptInvitationRequest, invitationDetailsRequest, setToken } from '../utils/api';
import { hasFieldErrors, validateAcceptInvitationForm } from '../utils/validation';

export default function AcceptInvitePage() {
  const router = useRouter();
  const { token } = router.query;
  const [invitation, setInvitation] = useState(null);
  const [form, setForm] = useState({ fullName: '', password: '' });
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!router.isReady || !token) {
      return;
    }

    let ignore = false;

    async function loadInvitation() {
      try {
        const response = await invitationDetailsRequest(token);

        if (!ignore) {
          setInvitation(response);
          setForm((current) => ({
            ...current,
            fullName: response.invitation.fullName || '',
          }));
        }
      } catch (requestError) {
        if (!ignore) {
          setError(requestError.message || 'Unable to load invitation');
        }
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    }

    loadInvitation();

    return () => {
      ignore = true;
    };
  }, [router.isReady, token]);

  function handleChange(event) {
    const { name, value } = event.target;
    setError('');
    setFieldErrors((current) => {
      if (!current[name]) {
        return current;
      }

      const nextErrors = { ...current };
      delete nextErrors[name];
      return nextErrors;
    });
    setForm((current) => ({ ...current, [name]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const nextFieldErrors = validateAcceptInvitationForm(form);

    setError('');
    setFieldErrors(nextFieldErrors);

    if (hasFieldErrors(nextFieldErrors)) {
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await acceptInvitationRequest({
        token,
        fullName: form.fullName.trim(),
        password: form.password,
      });

      setToken(response.token);
      await router.push('/');
    } catch (requestError) {
      if (hasFieldErrors(requestError.fieldErrors || {})) {
        setFieldErrors(requestError.fieldErrors);
      } else {
        setError(requestError.message || 'Unable to accept invitation');
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthShell
      eyebrow="Invitation"
      title="Join your workspace"
      description="Complete your account setup and accept the invitation with the same tenant-aware rules used throughout the platform."
      asideTitle="Invitation-led onboarding"
      asideBody="Owners and admins can bring users into a tenant without breaking the shared schema or role model."
    >
      {isLoading ? (
        <div className="space-y-3">
          <div className="h-4 w-28 animate-pulse rounded bg-subtle" />
          <div className="h-10 w-full animate-pulse rounded-md bg-subtle" />
          <div className="h-10 w-full animate-pulse rounded-md bg-subtle" />
        </div>
      ) : error && !invitation ? (
        <div className="space-y-4">
          <Alert variant="error">{error}</Alert>
          <Button as={Link} href="/login" variant="secondary">
            Go to login
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          <Alert variant="info">
            You were invited to join <strong>{invitation.tenant.name}</strong> as a{' '}
            <strong>{invitation.invitation.role}</strong> using <strong>{invitation.invitation.email}</strong>.
          </Alert>

          {error ? <Alert variant="error">{error}</Alert> : null}

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <label className="field-label" htmlFor="fullName">
                Full name
              </label>
              <Input
                hasError={Boolean(fieldErrors.fullName)}
                id="fullName"
                name="fullName"
                onChange={handleChange}
                required
                value={form.fullName}
              />
              {fieldErrors.fullName ? <p className="field-error">{fieldErrors.fullName}</p> : null}
            </div>

            <div>
              <label className="field-label" htmlFor="password">
                Create password
              </label>
              <Input
                hasError={Boolean(fieldErrors.password)}
                id="password"
                name="password"
                onChange={handleChange}
                required
                type="password"
                value={form.password}
              />
              {fieldErrors.password ? <p className="field-error">{fieldErrors.password}</p> : null}
            </div>

            <Button className="w-full" disabled={isSubmitting} type="submit">
              {isSubmitting ? 'Joining workspace...' : 'Accept invitation'}
            </Button>
          </form>
        </div>
      )}
    </AuthShell>
  );
}
