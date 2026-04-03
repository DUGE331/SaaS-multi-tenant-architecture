import Link from 'next/link';
import { useRouter } from 'next/router';
import { useState } from 'react';

import { AuthShell } from '../components/layout/auth-shell';
import { Alert } from '../components/ui/alert';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { branding } from '../config/branding';
import { apiRequest, setToken } from '../utils/api';
import { hasFieldErrors, validateRegisterForm } from '../utils/validation';

const initialForm = {
  tenantName: '',
  tenantSlug: '',
  fullName: '',
  email: '',
  password: '',
};

export default function RegisterPage() {
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
    const nextFieldErrors = validateRegisterForm(form);

    setError('');
    setFieldErrors(nextFieldErrors);

    if (hasFieldErrors(nextFieldErrors)) {
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await apiRequest('/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          tenantName: form.tenantName.trim(),
          tenantSlug: form.tenantSlug.trim().toLowerCase(),
          fullName: form.fullName.trim(),
          email: form.email.trim().toLowerCase(),
          password: form.password,
        }),
      });

      setToken(response.token);
      await router.push('/');
    } catch (requestError) {
      if (hasFieldErrors(requestError.fieldErrors || {})) {
        setFieldErrors(requestError.fieldErrors);
      } else {
        setError(requestError.message || 'Unable to register workspace');
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthShell
      compact
      eyebrow={branding.appName}
      footer={
        <div className="flex items-center justify-between gap-3 text-[13px] text-muted-foreground">
          <span>Already have an account?</span>
          <Button as={Link} href="/login" size="sm" variant="ghost">
            Sign in
          </Button>
        </div>
      }
      hideAside
      title="Create workspace"
    >
      <div className="space-y-4">
        {error ? <Alert variant="error">{error}</Alert> : null}

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="field-label" htmlFor="tenantName">
              Workspace name
            </label>
            <Input
              autoComplete="organization"
              hasError={Boolean(fieldErrors.tenantName)}
              id="tenantName"
              name="tenantName"
              onChange={handleChange}
              placeholder="Acme"
              required
              value={form.tenantName}
            />
            {fieldErrors.tenantName ? <p className="field-error">{fieldErrors.tenantName}</p> : null}
          </div>

          <div>
            <label className="field-label" htmlFor="tenantSlug">
              Workspace slug
            </label>
            <Input
              autoComplete="off"
              hasError={Boolean(fieldErrors.tenantSlug)}
              id="tenantSlug"
              name="tenantSlug"
              onChange={handleChange}
              placeholder="acme"
              required
              value={form.tenantSlug}
            />
            <p className={fieldErrors.tenantSlug ? 'field-error' : 'helper-text'}>
              {fieldErrors.tenantSlug || 'Use lowercase letters, numbers, and hyphens only.'}
            </p>
          </div>

          <div>
            <label className="field-label" htmlFor="fullName">
              Full name
            </label>
            <Input
              autoComplete="name"
              hasError={Boolean(fieldErrors.fullName)}
              id="fullName"
              name="fullName"
              onChange={handleChange}
              placeholder="John Smith"
              required
              value={form.fullName}
            />
            {fieldErrors.fullName ? <p className="field-error">{fieldErrors.fullName}</p> : null}
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
              autoComplete="new-password"
              hasError={Boolean(fieldErrors.password)}
              id="password"
              name="password"
              onChange={handleChange}
              placeholder="Create a secure password"
              required
              type="password"
              value={form.password}
            />
            {fieldErrors.password ? <p className="field-error">{fieldErrors.password}</p> : null}
          </div>

          <Button className="w-full" disabled={isSubmitting} type="submit">
            {isSubmitting ? 'Creating workspace...' : 'Create workspace'}
          </Button>
        </form>
      </div>
    </AuthShell>
  );
}
