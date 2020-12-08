const User = require('auth/user');

describe('User', () => {
  describe('new User', () => {
    test('should not be null', () => {
      expect(new User()).not.toBeNull();
    });

    test('should init with provided data', () => {
      const user = new User('token123', 'pass123', {});
      expect(user.getToken()).toEqual('token123');
      expect(user.getPassword()).toEqual('pass123');
      expect(user.data).toEqual({});
    });
  });

  test('should have a auth token', () => {
    expect(createNewUser().getToken()).toEqual('token123');
  });

  test('should clear the token', () => {
    const user = createNewUser();
    user.clearToken();
    expect(user.getToken()).toBeUndefined();
  });

  test('should have username', () => {
    expect(createNewUser().getUsername()).toEqual('testuser');
  });

  test('should have a password', () => {
    expect(createNewUser().getPassword()).toEqual('pass123');
  });

  test('should have authorities', () => {
    expect(createNewUser().getAuthorities())
      .toEqual(['ROLE_USER', 'READ_REPO_*', 'WRITE_REPO_*']);
  });

  test('should get property by name', () => {
    let user = createNewUser();
    expect(user.getProperty('username')).toEqual('testuser');
    expect(user.getProperty('missing')).toBeUndefined();
    user = new User('token123', 'pass123', null);
    expect(user.getProperty('data_is_missing')).toBeUndefined();
  });
});

function createNewUser() {
  return new User('token123', 'pass123', getUserData());
}

function getUserData() {
  return {
    'username': 'testuser',
    'authorities': [
      'ROLE_USER',
      'READ_REPO_*',
      'WRITE_REPO_*'
    ],
    'appSettings': {
      'DEFAULT_SAMEAS': true,
      'DEFAULT_INFERENCE': true,
      'EXECUTE_COUNT': true,
      'IGNORE_SHARED_QUERIES': false
    },
    'external': false
  };
}
