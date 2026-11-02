const test = require('node:test');
const assert = require('node:assert/strict');
const { getDemoUserByCredentials } = require('../utils/demoAuth');

test('demo login returns the real account profile', () => {
  const user = getDemoUserByCredentials('demo@codetogether.com', 'demo123');

  assert.ok(user);
  assert.equal(user.email, 'demo@codetogether.com');
  assert.equal(user.name, 'Alex Johnson');
  assert.deepEqual(user.skills, ['React', 'Node.js', 'JavaScript']);
});

test('unknown credentials do not log in', () => {
  const user = getDemoUserByCredentials('wrong@example.com', 'wrongpass');
  assert.equal(user, null);
});
