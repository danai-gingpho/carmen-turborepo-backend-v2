import { formatUserName } from './format-user-name';

describe('formatUserName', () => {
  const baseProfile = { firstname: '', middlename: null, lastname: '' };

  it('uses profile firstname + lastname when present', () => {
    expect(
      formatUserName({
        username: 'jdoe',
        email: 'jdoe@example.com',
        alias_name: 'JD',
        profile: { firstname: 'John', middlename: null, lastname: 'Doe' },
      }),
    ).toBe('John Doe');
  });

  it('includes middlename when present', () => {
    expect(
      formatUserName({
        username: 'x',
        email: 'x@x',
        alias_name: null,
        profile: { firstname: 'Jane', middlename: 'B', lastname: 'Roe' },
      }),
    ).toBe('Jane B Roe');
  });

  it('falls back to alias_name when profile is empty', () => {
    expect(
      formatUserName({
        username: 'x',
        email: 'x@x',
        alias_name: 'JD',
        profile: baseProfile,
      }),
    ).toBe('JD');
  });

  it('falls back to alias_name when profile is missing', () => {
    expect(
      formatUserName({
        username: 'x',
        email: 'x@x',
        alias_name: 'JD',
        profile: null,
      }),
    ).toBe('JD');
  });

  it('falls back to username when alias_name is empty/null', () => {
    expect(
      formatUserName({
        username: 'jdoe',
        email: 'x@x',
        alias_name: null,
        profile: baseProfile,
      }),
    ).toBe('jdoe');
  });

  it('falls back to email as last resort', () => {
    expect(
      formatUserName({
        username: '',
        email: 'jdoe@example.com',
        alias_name: null,
        profile: baseProfile,
      }),
    ).toBe('jdoe@example.com');
  });

  it('treats whitespace-only profile fields as empty', () => {
    expect(
      formatUserName({
        username: 'jdoe',
        email: 'x@x',
        alias_name: null,
        profile: { firstname: '   ', middlename: '', lastname: '\t' },
      }),
    ).toBe('jdoe');
  });
});
