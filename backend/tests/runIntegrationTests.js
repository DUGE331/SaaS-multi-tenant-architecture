process.env.NODE_ENV = 'test';

const assert = require('node:assert/strict');

const app = require('../app');
const db = require('../db');

let server;
let baseUrl;

async function request(path, options = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });

  const data = await response.json().catch(() => null);

  return {
    status: response.status,
    data,
  };
}

function authHeaders(token) {
  return {
    Authorization: `Bearer ${token}`,
  };
}

async function registerAndLogin({ tenantName, tenantSlug, fullName, email, password }) {
  const registerResponse = await request('/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      tenantName,
      tenantSlug,
      fullName,
      email,
      password,
    }),
  });

  assert.equal(registerResponse.status, 201);
  return registerResponse.data;
}

async function resetDatabase() {
  await db.raw('TRUNCATE TABLE invitations, memberships, projects, users, tenants RESTART IDENTITY CASCADE');
}

async function withFreshData(testFn) {
  await resetDatabase();
  await testFn();
}

async function testAuthRegisterLoginAndMe() {
  await withFreshData(async () => {
    const auth = await registerAndLogin({
      tenantName: 'Acme',
      tenantSlug: 'acme',
      fullName: 'John Smith',
      email: 'john@acme.com',
      password: 'Password123!',
    });

    assert.equal(auth.role, 'owner');
    assert.equal(auth.tenant.slug, 'acme');

    const meResponse = await request('/auth/me', {
      headers: authHeaders(auth.token),
    });

    assert.equal(meResponse.status, 200);
    assert.equal(meResponse.data.user.email, 'john@acme.com');
    assert.equal(meResponse.data.tenant.slug, 'acme');
    assert.equal(meResponse.data.role, 'owner');
  });
}

async function testTenantIsolationForProjects() {
  await withFreshData(async () => {
    const acmeOwner = await registerAndLogin({
      tenantName: 'Acme',
      tenantSlug: 'acme',
      fullName: 'Acme Owner',
      email: 'owner@acme.com',
      password: 'Password123!',
    });

    const betaOwner = await registerAndLogin({
      tenantName: 'Beta',
      tenantSlug: 'beta',
      fullName: 'Beta Owner',
      email: 'owner@beta.com',
      password: 'Password123!',
    });

    const acmeProject = await request('/projects', {
      method: 'POST',
      headers: authHeaders(acmeOwner.token),
      body: JSON.stringify({
        name: 'Acme Portal',
        description: 'Tenant one project',
      }),
    });

    const betaProject = await request('/projects', {
      method: 'POST',
      headers: authHeaders(betaOwner.token),
      body: JSON.stringify({
        name: 'Beta Dashboard',
        description: 'Tenant two project',
      }),
    });

    assert.equal(acmeProject.status, 201);
    assert.equal(betaProject.status, 201);

    const acmeProjects = await request('/projects', {
      headers: authHeaders(acmeOwner.token),
    });

    assert.equal(acmeProjects.status, 200);
    assert.equal(acmeProjects.data.length, 1);
    assert.equal(acmeProjects.data[0].name, 'Acme Portal');
    assert.equal(acmeProjects.data[0].tenant_id, acmeOwner.tenant.id);
  });
}

async function testMembersCannotManageProjects() {
  await withFreshData(async () => {
    const owner = await registerAndLogin({
      tenantName: 'Acme',
      tenantSlug: 'acme',
      fullName: 'Owner User',
      email: 'owner@acme.com',
      password: 'Password123!',
    });

    const invitationResponse = await request('/invitations', {
      method: 'POST',
      headers: authHeaders(owner.token),
      body: JSON.stringify({
        fullName: 'Member User',
        email: 'member@acme.com',
        role: 'member',
      }),
    });

    assert.equal(invitationResponse.status, 201);

    const acceptedInvitation = await request('/invitations/accept', {
      method: 'POST',
      body: JSON.stringify({
        token: invitationResponse.data.invitation_link.split('token=')[1],
        fullName: 'Member User',
        password: 'Password123!',
      }),
    });

    assert.equal(acceptedInvitation.status, 201);

    const ownerProject = await request('/projects', {
      method: 'POST',
      headers: authHeaders(owner.token),
      body: JSON.stringify({
        name: 'Protected Project',
        description: 'Should only be managed by admins or owners',
      }),
    });

    assert.equal(ownerProject.status, 201);

    const createResponse = await request('/projects', {
      method: 'POST',
      headers: authHeaders(acceptedInvitation.data.token),
      body: JSON.stringify({
        name: 'Member Project',
        description: 'Should fail',
      }),
    });

    const updateResponse = await request(`/projects/${ownerProject.data.id}`, {
      method: 'PATCH',
      headers: authHeaders(acceptedInvitation.data.token),
      body: JSON.stringify({
        name: 'Updated By Member',
        description: 'Should fail',
      }),
    });

    const deleteResponse = await request(`/projects/${ownerProject.data.id}`, {
      method: 'DELETE',
      headers: authHeaders(acceptedInvitation.data.token),
    });

    assert.equal(createResponse.status, 403);
    assert.equal(updateResponse.status, 403);
    assert.equal(deleteResponse.status, 403);
  });
}

async function testInvitationAcceptanceCreatesMembership() {
  await withFreshData(async () => {
    const owner = await registerAndLogin({
      tenantName: 'Acme',
      tenantSlug: 'acme',
      fullName: 'Owner User',
      email: 'owner@acme.com',
      password: 'Password123!',
    });

    const invitationResponse = await request('/invitations', {
      method: 'POST',
      headers: authHeaders(owner.token),
      body: JSON.stringify({
        fullName: 'Admin User',
        email: 'admin@acme.com',
        role: 'admin',
      }),
    });

    assert.equal(invitationResponse.status, 201);
    assert.match(invitationResponse.data.invitation_link, /accept-invite\?token=/);

    const invitationToken = invitationResponse.data.invitation_link.split('token=')[1];

    const invitationDetails = await request(`/invitations/token/${invitationToken}`);
    assert.equal(invitationDetails.status, 200);
    assert.equal(invitationDetails.data.invitation.email, 'admin@acme.com');

    const acceptedInvitation = await request('/invitations/accept', {
      method: 'POST',
      body: JSON.stringify({
        token: invitationToken,
        fullName: 'Admin User',
        password: 'Password123!',
      }),
    });

    assert.equal(acceptedInvitation.status, 201);
    assert.equal(acceptedInvitation.data.role, 'admin');

    const membersResponse = await request('/memberships', {
      headers: authHeaders(owner.token),
    });

    assert.equal(membersResponse.status, 200);
    assert.equal(membersResponse.data.length, 2);
    assert.ok(membersResponse.data.some((member) => member.email === 'admin@acme.com' && member.role === 'admin'));
  });
}

async function testAdminCannotAssignOwnerRole() {
  await withFreshData(async () => {
    const owner = await registerAndLogin({
      tenantName: 'Acme',
      tenantSlug: 'acme',
      fullName: 'Owner User',
      email: 'owner@acme.com',
      password: 'Password123!',
    });

    const adminInvitation = await request('/invitations', {
      method: 'POST',
      headers: authHeaders(owner.token),
      body: JSON.stringify({
        fullName: 'Admin User',
        email: 'admin@acme.com',
        role: 'admin',
      }),
    });

    const memberInvitation = await request('/invitations', {
      method: 'POST',
      headers: authHeaders(owner.token),
      body: JSON.stringify({
        fullName: 'Member User',
        email: 'member@acme.com',
        role: 'member',
      }),
    });

    const adminAccepted = await request('/invitations/accept', {
      method: 'POST',
      body: JSON.stringify({
        token: adminInvitation.data.invitation_link.split('token=')[1],
        fullName: 'Admin User',
        password: 'Password123!',
      }),
    });

    const memberAccepted = await request('/invitations/accept', {
      method: 'POST',
      body: JSON.stringify({
        token: memberInvitation.data.invitation_link.split('token=')[1],
        fullName: 'Member User',
        password: 'Password123!',
      }),
    });

    assert.equal(adminAccepted.status, 201);
    assert.equal(memberAccepted.status, 201);

    const membersResponse = await request('/memberships', {
      headers: authHeaders(owner.token),
    });

    const memberMembership = membersResponse.data.find((member) => member.email === 'member@acme.com');
    assert.ok(memberMembership);

    const promoteToOwnerResponse = await request(`/memberships/${memberMembership.id}`, {
      method: 'PATCH',
      headers: authHeaders(adminAccepted.data.token),
      body: JSON.stringify({
        role: 'owner',
      }),
    });

    assert.equal(promoteToOwnerResponse.status, 403);
    assert.equal(promoteToOwnerResponse.data.error, 'Only owners can assign the owner role');
  });
}

async function testOwnerCanUpdateAndDeleteProjects() {
  await withFreshData(async () => {
    const owner = await registerAndLogin({
      tenantName: 'Acme',
      tenantSlug: 'acme',
      fullName: 'Owner User',
      email: 'owner@acme.com',
      password: 'Password123!',
    });

    const projectResponse = await request('/projects', {
      method: 'POST',
      headers: authHeaders(owner.token),
      body: JSON.stringify({
        name: 'Original Name',
        description: 'Original description',
      }),
    });

    assert.equal(projectResponse.status, 201);

    const updatedProject = await request(`/projects/${projectResponse.data.id}`, {
      method: 'PATCH',
      headers: authHeaders(owner.token),
      body: JSON.stringify({
        name: 'Updated Name',
        description: 'Updated description',
      }),
    });

    assert.equal(updatedProject.status, 200);
    assert.equal(updatedProject.data.name, 'Updated Name');
    assert.equal(updatedProject.data.description, 'Updated description');

    const deleteResponse = await request(`/projects/${projectResponse.data.id}`, {
      method: 'DELETE',
      headers: authHeaders(owner.token),
    });

    assert.equal(deleteResponse.status, 204);

    const remainingProjects = await request('/projects', {
      headers: authHeaders(owner.token),
    });

    assert.equal(remainingProjects.status, 200);
    assert.equal(remainingProjects.data.length, 0);
  });
}

async function main() {
  const tests = [
    ['auth register/login/me', testAuthRegisterLoginAndMe],
    ['tenant isolation for projects', testTenantIsolationForProjects],
    ['member RBAC for project management', testMembersCannotManageProjects],
    ['invitation acceptance creates membership', testInvitationAcceptanceCreatesMembership],
    ['admin cannot assign owner role', testAdminCannotAssignOwnerRole],
    ['owner can update and delete projects', testOwnerCanUpdateAndDeleteProjects],
  ];

  server = app.listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  const { port } = server.address();
  baseUrl = `http://127.0.0.1:${port}`;

  let failed = false;

  try {
    for (const [name, testFn] of tests) {
      try {
        await testFn();
        console.log(`PASS ${name}`);
      } catch (error) {
        failed = true;
        console.error(`FAIL ${name}`);
        console.error(error);
      }
    }
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => {
        if (error) {
          reject(error);
          return;
        }

        resolve();
      });
    });

    await db.destroy();
  }

  if (failed) {
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
