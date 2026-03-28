import Link from 'next/link';
import { useRouter } from 'next/router';
import { useState } from 'react';

import { loginRequest, setToken } from '../utils/api';
import { hasFieldErrors, validateLoginForm } from '../utils/validation';

const initialForm = {
  tenantSlug: '',
  email: '',
  password: '',
};

const pageStyles = {
  minHeight: '100vh',
  display: 'grid',
  placeItems: 'center',
  padding: '32px 16px',
  background:
    'linear-gradient(135deg, rgba(250,248,242,1) 0%, rgba(230,238,243,1) 50%, rgba(242,245,235,1) 100%)',
  color: '#14213d',
  fontFamily: '"Segoe UI", sans-serif',
};

const cardStyles = {
  width: '100%',
  maxWidth: '460px',
  padding: '32px',
  borderRadius: '20px',
  backgroundColor: 'rgba(255, 255, 255, 0.94)',
  boxShadow: '0 24px 60px rgba(20, 33, 61, 0.12)',
  border: '1px solid rgba(20, 33, 61, 0.08)',
};

const labelStyles = {
  display: 'block',
  marginBottom: '8px',
  fontSize: '14px',
  fontWeight: 600,
  color: '#243b53',
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

const buttonStyles = {
  width: '100%',
  padding: '14px 16px',
  border: 'none',
  borderRadius: '12px',
  backgroundColor: '#0f766e',
  color: '#fff',
  fontSize: '15px',
  fontWeight: 700,
  cursor: 'pointer',
};

const errorStyles = {
  marginBottom: '16px',
  padding: '12px 14px',
  borderRadius: '12px',
  backgroundColor: '#fef2f2',
  color: '#b91c1c',
  fontSize: '14px',
  border: '1px solid #fecaca',
};

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

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
    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const nextFieldErrors = validateLoginForm(form);

    setError('');
    setFieldErrors(nextFieldErrors);

    if (hasFieldErrors(nextFieldErrors)) {
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await loginRequest({
        tenantSlug: form.tenantSlug.trim().toLowerCase(),
        email: form.email.trim().toLowerCase(),
        password: form.password,
      });

      setToken(response.token);
      await router.push('/');
    } catch (requestError) {
      if (hasFieldErrors(requestError.fieldErrors || {})) {
        setFieldErrors(requestError.fieldErrors);
      } else {
        setError(requestError.message || 'Unable to sign in');
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main style={pageStyles}>
      <section style={cardStyles}>
        <div style={{ marginBottom: '28px' }}>
          <p
            style={{
              margin: '0 0 12px',
              fontSize: '12px',
              fontWeight: 700,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: '#0f766e',
            }}
          >
            Multi-Tenant SaaS
          </p>
          <h1 style={{ margin: 0, fontSize: '32px', lineHeight: 1.1 }}>Sign in to your workspace</h1>
          <p style={{ margin: '12px 0 0', fontSize: '15px', lineHeight: 1.6, color: '#52606d' }}>
            Enter your tenant slug, email address, and password to access the correct organization.
          </p>
        </div>

        {error ? <div style={errorStyles}>{error}</div> : null}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '18px' }}>
            <label htmlFor="tenantSlug" style={labelStyles}>
              Tenant Slug
            </label>
            <input
              id="tenantSlug"
              name="tenantSlug"
              type="text"
              autoComplete="organization"
              placeholder="acme"
              value={form.tenantSlug}
              onChange={handleChange}
              style={{
                ...inputStyles,
                borderColor: fieldErrors.tenantSlug ? '#dc2626' : inputStyles.border,
              }}
              required
            />
            <p style={fieldErrors.tenantSlug ? fieldErrorTextStyles : helperTextStyles}>
              {fieldErrors.tenantSlug || 'Use the unique workspace slug created during registration.'}
            </p>
          </div>

          <div style={{ marginBottom: '18px' }}>
            <label htmlFor="email" style={labelStyles}>
              Work Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="john@acme.com"
              value={form.email}
              onChange={handleChange}
              style={{
                ...inputStyles,
                borderColor: fieldErrors.email ? '#dc2626' : inputStyles.border,
              }}
              required
            />
            {fieldErrors.email ? <p style={fieldErrorTextStyles}>{fieldErrors.email}</p> : null}
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label htmlFor="password" style={labelStyles}>
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              placeholder="Enter your password"
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
            {isSubmitting ? 'Signing In...' : 'Sign In'}
          </button>
        </form>

        <div
          style={{
            marginTop: '20px',
            fontSize: '14px',
            color: '#52606d',
            display: 'flex',
            justifyContent: 'space-between',
            gap: '12px',
            flexWrap: 'wrap',
          }}
        >
          <span>Need an account for a new tenant?</span>
          <Link href="/register" style={{ color: '#0f766e', fontWeight: 700, textDecoration: 'none' }}>
            Register workspace
          </Link>
        </div>
      </section>
    </main>
  );
}
