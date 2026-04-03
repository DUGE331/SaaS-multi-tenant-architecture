import Link from 'next/link';
import { useRouter } from 'next/router';
import { useState } from 'react';

import { AuthShell } from '../components/layout/auth-shell';
import { Alert } from '../components/ui/alert';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { branding } from '../config/branding';
import { loginRequest, setToken } from '../utils/api';
import { hasFieldErrors, validateLoginForm } from '../utils/validation';

const initialForm = {
  tenantSlug: '',
  email: '',
  password: '',
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
    <AuthShell
      eyebrow={branding.appName}
      footer={
        <div className="flex items-center justify-between gap-3 text-[13px] text-muted-foreground">
          <span>Need an account?</span>
          <Button as={Link} href="/register" size="sm" variant="ghost">
            Register workspace
          </Button>
        </div>
      }
      hideAside
      title="Sign in"
    >
      <div className="space-y-6">
        {error ? <Alert variant="error">{error}</Alert> : null}

        <form className="space-y-5" onSubmit={handleSubmit}>
          <div>
            <label className="field-label" htmlFor="tenantSlug">
              Tenant slug
            </label>
            <Input
              autoComplete="organization"
              hasError={Boolean(fieldErrors.tenantSlug)}
              id="tenantSlug"
              name="tenantSlug"
              onChange={handleChange}
              placeholder="acme"
              required
              value={form.tenantSlug}
            />
            {fieldErrors.tenantSlug ? <p className="field-error">{fieldErrors.tenantSlug}</p> : null}
          </div>

          <div>
            <label className="field-label" htmlFor="email">
              Email
            </label>
            <Input
              autoComplete="email"
              hasError={Boolean(fieldErrors.email)}
              id="email"
              name="email"
              onChange={handleChange}
              placeholder="john@acme.com"
              required
              type="email"
              value={form.email}
            />
            {fieldErrors.email ? <p className="field-error">{fieldErrors.email}</p> : null}
          </div>

          <div>
            <label className="field-label" htmlFor="password">
              Password
            </label>
            <Input
              autoComplete="current-password"
              hasError={Boolean(fieldErrors.password)}
              id="password"
              name="password"
              onChange={handleChange}
              placeholder="Enter your password"
              required
              type="password"
              value={form.password}
            />
            {fieldErrors.password ? <p className="field-error">{fieldErrors.password}</p> : null}
          </div>

          <Button className="w-full" disabled={isSubmitting} type="submit">
            {isSubmitting ? 'Signing in...' : 'Sign in'}
          </Button>
        </form>
      </div>
    </AuthShell>
  );
}
