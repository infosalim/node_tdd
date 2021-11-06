const request = require('supertest');

const app = require('../src/app');
const User = require('../src/user/User');
const sequelize = require('../src/config/database');

beforeAll(() => {
  return sequelize.sync();
});

beforeEach(() => {
  return User.destroy({ truncate: true });
});

const validUser = {
  username: 'user1',
  email: 'user1@mail.com',
  password: 'P4ssword',
};

const postUser = (user = validUser, options = {}) => {
  const agent = request(app).post('/api/1.0/users');
  if (options.language) {
    agent.set('Accept-Language', options.language);
  }
  return agent.send(user);
};

describe('User Registration', () => {
  it('returns 200 OK when signup request is valid', async () => {
    const response = await postUser();
    expect(response.status).toBe(200);
  });

  it('returns success message when signup request is valid', async () => {
    const response = await postUser();
    expect(response.body.message).toBe('User created');
  });

  it('save the user to database', async () => {
    const response = await postUser();
    const userList = await User.findAll();
    expect(userList.length).toBe(1);
  });

  it('saves the username and email to database', async () => {
    const response = await postUser();
    const userList = await User.findAll();
    const savedUser = userList[0];
    expect(savedUser.username).toBe('user1');
    expect(savedUser.email).toBe('user1@mail.com');
  });

  it('hashes the passoword in database', async () => {
    const response = await postUser();
    const userList = await User.findAll();
    const savedUser = userList[0];
    expect(savedUser.password).not.toBe('P4ssword');
  });

  it('returns 400 when username is null', async () => {
    const response = await postUser({
      username: null,
      email: 'user1@mail.com',
      password: 'P4ssword',
    });
    expect(response.status).toBe(400);
  });

  it('returns validationErrors field in response body when validation error occurs', async () => {
    const response = await postUser({
      username: null,
      email: 'user1@mail.com',
      password: 'P4ssword',
    });
    const body = response.body;
    expect(body.validationErrors).not.toBeUndefined();
  });

  it('returns errors for both when usename and email is null', async () => {
    const response = await postUser({
      username: null,
      email: null,
      password: 'P4ssword',
    });
    const body = response.body;
    expect(Object.keys(body.validationErrors)).toEqual(['username', 'email']);
  });

  const username_null = 'Username cannot be null';
  const username_size = 'Must have min 4 and max 32 characters';
  const email_null = 'Email cannot be null';
  const email_invalid = 'Email is not valid';
  const password_null = 'Password cannot be null';
  const password_size = 'Password must be at least 6 characters';
  const password_pattern = 'Password must have at least 1 uppercase, 1 lowercase letter and 1 number';
  const email_inuse = 'Email in use';

  it.each`
    field         | value               | expectedMessage
    ${'username'} | ${null}             | ${username_null}
    ${'username'} | ${'usr'}            | ${username_size}
    ${'username'} | ${'a'.repeat(33)}   | ${username_size}
    ${'email'}    | ${null}             | ${email_null}
    ${'email'}    | ${'mail.com'}       | ${email_invalid}
    ${'email'}    | ${'user.mail.com'}  | ${email_invalid}
    ${'email'}    | ${'user@.com'}      | ${email_invalid}
    ${'password'} | ${null}             | ${password_null}
    ${'password'} | ${'P4saw'}          | ${password_size}
    ${'password'} | ${'alllowercase'}   | ${password_pattern}
    ${'password'} | ${'ALLUPPERCASE'}   | ${password_pattern}
    ${'password'} | ${'1234567890'}     | ${password_pattern}
    ${'password'} | ${'lowerandUpper'}  | ${password_pattern}
    ${'password'} | ${'lowerandNumber'} | ${password_pattern}
    ${'password'} | ${'UPPERandNumber'} | ${password_pattern}
  `('returns $expectedMessage when $field is $value', async ({ field, expectedMessage, value }) => {
    const user = {
      username: 'user1',
      email: 'user1@mail.com',
      password: 'P4ssword',
    };

    user[field] = value;
    const response = await postUser(user);
    const body = response.body;
    expect(body.validationErrors[field]).toBe(expectedMessage);
  });

  it(`returns ${email_inuse} when same email is already in use`, async () => {
    await User.create({ ...validUser });
    const response = await postUser();
    expect(response.body.validationErrors.email).toBe(email_inuse);
  });
  it('returns errors for both username is null and email is in use', async () => {
    await User.create({ ...validUser });
    const response = await postUser({
      username: null,
      email: validUser.email,
      password: 'P4ssword',
    });
    const body = response.body;
    expect(Object.keys(body.validationErrors)).toEqual(['username', 'email']);
  });
});

describe('Internationalization', () => {
  const username_null = 'ইউসারনেম খালি থাকবে না';
  const username_size = 'সর্বনিম্ন ৪ এবং সর্বোচ্চ ৩২ অক্ষর';
  const email_null = 'ইমেইল খালি থাকবে না';
  const email_invalid = 'ইমেইল সঠিক নয়';
  const password_null = 'পাসওয়ার্ড খালি থাকবে না';
  const password_size = 'পাসওয়ার্ড সর্বনিন্ম ৬ অক্ষর হবে';
  const password_pattern = 'পাসওয়ার্ডে কমপক্ষে ১টি আপারকেস, ১টি লোওয়ারকেস এবং ১টি সংখ্যা থাকবে';
  const email_inuse = 'ইমেইলটি ব্যবহৃত হচ্ছে';
  const user_create_success = 'ইউজার তৈরী হয়েছে';

  it.each`
    field         | value               | expectedMessage
    ${'username'} | ${null}             | ${username_null}
    ${'username'} | ${'usr'}            | ${username_size}
    ${'username'} | ${'a'.repeat(33)}   | ${username_size}
    ${'email'}    | ${null}             | ${email_null}
    ${'email'}    | ${'mail.com'}       | ${email_invalid}
    ${'email'}    | ${'user.mail.com'}  | ${email_invalid}
    ${'email'}    | ${'user@.com'}      | ${email_invalid}
    ${'password'} | ${null}             | ${password_null}
    ${'password'} | ${'P4saw'}          | ${password_size}
    ${'password'} | ${'alllowercase'}   | ${password_pattern}
    ${'password'} | ${'ALLUPPERCASE'}   | ${password_pattern}
    ${'password'} | ${'1234567890'}     | ${password_pattern}
    ${'password'} | ${'lowerandUpper'}  | ${password_pattern}
    ${'password'} | ${'lowerandNumber'} | ${password_pattern}
    ${'password'} | ${'UPPERandNumber'} | ${password_pattern}
  `(
    'returns $expectedMessage when $field is $value when language is set as Bengali',
    async ({ field, expectedMessage, value }) => {
      const user = {
        username: 'user1',
        email: 'user1@mail.com',
        password: 'P4ssword',
      };

      user[field] = value;
      const response = await postUser(user, { language: 'bn' });
      const body = response.body;
      expect(body.validationErrors[field]).toBe(expectedMessage);
    }
  );

  it(`returns ${email_inuse} when same email is already in use when language is set as Bengali`, async () => {
    await User.create({ ...validUser });
    const response = await postUser({ ...validUser }, { language: 'bn' });
    expect(response.body.validationErrors.email).toBe(email_inuse);
  });

  it(`returns success message of ${user_create_success} when signup request is valid in BN`, async () => {
    const response = await postUser({ ...validUser }, { language: 'bn' });
    expect(response.body.message).toBe(user_create_success);
  });
});
