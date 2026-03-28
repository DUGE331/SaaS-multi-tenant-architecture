const tenantSlugPattern = /^[a-z0-9-]+$/;
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function addError(errors, field, message) {
    if (!errors[field]) {
        errors[field] = message;
    }
}

function isBlank(value) {
    return !value || !value.trim();
}

function validateEmail(value, errors) {
    if (isBlank(value)) {
        addError(errors, 'email', 'email must be a valid email address');
        return;
    }

    if (!emailPattern.test(value.trim())) {
        addError(errors, 'email', 'email must be a valid email address');
    }
}

function validatePassword(value, errors) {
    if (!value || value.length < 8) {
        addError(errors, 'password', 'password must be at least 8 characters long');
        return;
    }

    if (value.length > 128) {
        addError(errors, 'password', 'password must be 128 characters or fewer');
    }
}

function validateTenantSlug(value, errors) {
    const trimmedValue = value.trim();

    if (trimmedValue.length < 3) {
        addError(errors, 'tenantSlug', 'tenantSlug must be at least 3 characters long');
        return;
    }

    if (trimmedValue.length > 100) {
        addError(errors, 'tenantSlug', 'tenantSlug must be 100 characters or fewer');
        return;
    }

    if (!tenantSlugPattern.test(trimmedValue)) {
        addError(errors, 'tenantSlug', 'tenantSlug may only contain lowercase letters, numbers, and hyphens');
    }
}

export function hasFieldErrors(fieldErrors) {
    return Object.keys(fieldErrors).length > 0;
}

export function validateLoginForm(form) {
    const errors = {};

    validateTenantSlug(form.tenantSlug || '', errors);
    validateEmail(form.email || '', errors);
    validatePassword(form.password || '', errors);

    return errors;
}

export function validateRegisterForm(form) {
    const errors = {};

    if (isBlank(form.tenantName) || form.tenantName.trim().length < 2) {
        addError(errors, 'tenantName', 'tenantName must be at least 2 characters long');
    } else if (form.tenantName.trim().length > 150) {
        addError(errors, 'tenantName', 'tenantName must be 150 characters or fewer');
    }

    validateTenantSlug(form.tenantSlug || '', errors);

    if (isBlank(form.fullName) || form.fullName.trim().length < 2) {
        addError(errors, 'fullName', 'fullName must be at least 2 characters long');
    } else if (form.fullName.trim().length > 150) {
        addError(errors, 'fullName', 'fullName must be 150 characters or fewer');
    }

    validateEmail(form.email || '', errors);
    validatePassword(form.password || '', errors);

    return errors;
}

export function validateAcceptInvitationForm(form) {
    const errors = {};

    if (isBlank(form.fullName) || form.fullName.trim().length < 2) {
        addError(errors, 'fullName', 'fullName must be at least 2 characters long');
    } else if (form.fullName.trim().length > 150) {
        addError(errors, 'fullName', 'fullName must be 150 characters or fewer');
    }

    validatePassword(form.password || '', errors);

    return errors;
}

export function validateProjectForm(form) {
    const errors = {};

    if (isBlank(form.name)) {
        addError(errors, 'name', 'name is required');
    } else if (form.name.trim().length > 150) {
        addError(errors, 'name', 'name must be 150 characters or fewer');
    }

    if ((form.description || '').trim().length > 2000) {
        addError(errors, 'description', 'description must be 2000 characters or fewer');
    }

    return errors;
}

export function validateInvitationForm(form) {
    const errors = {};
    const fullName = form.fullName || '';

    if (fullName.trim() && fullName.trim().length < 2) {
        addError(errors, 'fullName', 'fullName must be at least 2 characters long');
    } else if (fullName.trim().length > 150) {
        addError(errors, 'fullName', 'fullName must be 150 characters or fewer');
    }

    validateEmail(form.email || '', errors);

    if (!['admin', 'member'].includes(form.role)) {
        addError(errors, 'role', 'role must be admin or member');
    }

    return errors;
}
