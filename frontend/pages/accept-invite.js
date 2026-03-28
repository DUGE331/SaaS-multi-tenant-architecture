import Link from 'next/link'; //Link is used to navigate between pages in your app (client-side)
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

import { acceptInvitationRequest, invitationDetailsRequest, setToken } from '../utils/api';
import { hasFieldErrors, validateAcceptInvitationForm } from '../utils/validation'; 
//“Go to ../utils/api.js and bring in these functions so I can use them here”

const pageStyles = {
  minHeight: '100vh',
  display: 'grid',
  placeItems: 'center',
  padding: '32px 16px',
  background:
    'linear-gradient(135deg, rgba(246,249,252,1) 0%, rgba(252,247,239,1) 48%, rgba(237,244,239,1) 100%)',
  color: '#14213d',
  fontFamily: '"Segoe UI", sans-serif',
};

const cardStyles = {
  width: '100%',
  maxWidth: '520px',
  padding: '32px',
  borderRadius: '20px',
  backgroundColor: 'rgba(255, 255, 255, 0.95)',
  boxShadow: '0 24px 60px rgba(20, 33, 61, 0.12)',
  border: '1px solid rgba(20, 33, 61, 0.08)',
};

const inputStyles = {
  width: '100%',
  padding: '14px 16px',
  borderRadius: '12px',
  border: '1px solid #cbd5e1',
  fontSize: '15px',
  outline: 'none',
  backgroundColor: '#fff',
};

const labelStyles = {
  display: 'block',
  marginBottom: '8px',
  fontSize: '14px',
  fontWeight: 600,
  color: '#243b53',
};

const buttonStyles = {
  width: '100%',
  padding: '14px 16px',
  border: 'none',
  borderRadius: '12px',
  backgroundColor: '#124e66',
  color: '#fff',
  fontSize: '15px',
  fontWeight: 700,
  cursor: 'pointer',
};

const fieldErrorTextStyles = {
  marginTop: '6px',
  fontSize: '12px',
  color: '#b91c1c',
};

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
    <main style={pageStyles}>
      <section style={cardStyles}>
        <p style={{ margin: '0 0 12px', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', color: '#124e66' }}>
          Invitation
        </p>
        <h1 style={{ marginTop: 0, fontSize: '32px' }}>Join your workspace</h1>

        {isLoading ? (
          <p style={{ color: '#52606d' }}>Loading invitation...</p>
        ) : error && !invitation ? (
          <>
            <p style={{ color: '#b91c1c' }}>{error}</p>
            <Link href="/login" style={{ color: '#124e66', fontWeight: 700, textDecoration: 'none' }}>
              Go to login
            </Link>
          </>
        ) : (
          <>
            <p style={{ color: '#52606d', lineHeight: 1.7 }}>
              You were invited to join <strong>{invitation.tenant.name}</strong> as a{' '}
              <strong>{invitation.invitation.role}</strong> using <strong>{invitation.invitation.email}</strong>.
            </p>

            {error ? (
              <div
                style={{
                  marginBottom: '16px',
                  padding: '12px 14px',
                  borderRadius: '12px',
                  backgroundColor: '#fef2f2',
                  color: '#b91c1c',
                  border: '1px solid #fecaca',
                }}
              >
                {error}
              </div>
            ) : null}

            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '18px' }}>
                <label htmlFor="fullName" style={labelStyles}>
                  Full Name
                </label>
                <input
                  id="fullName"
                  name="fullName"
                  type="text"
                  value={form.fullName}
                  onChange={handleChange}
                  style={{
                    ...inputStyles,
                    borderColor: fieldErrors.fullName ? '#dc2626' : inputStyles.border,
                  }}
                  required
                />
                {fieldErrors.fullName ? <p style={fieldErrorTextStyles}>{fieldErrors.fullName}</p> : null}
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label htmlFor="password" style={labelStyles}>
                  Create Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  value={form.password}
                  onChange={handleChange}
                  style={{
                    ...inputStyles,
                    borderColor: fieldErrors.password ? '#dc2626' : inputStyles.border,
                  }}
                  required
                />
                {fieldErrors.password ? <p style={fieldErrorTextStyles}>{fieldErrors.password}</p> : null}
              </div>

              <button type="submit" style={buttonStyles} disabled={isSubmitting}>
                {isSubmitting ? 'Joining Workspace...' : 'Accept Invitation'}
              </button>
            </form>
          </>
        )}
      </section>
    </main>
  );
}
