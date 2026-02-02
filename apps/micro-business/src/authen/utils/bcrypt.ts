// import { hash, compare } from 'bcrypt';

export const hashPassword = async (password: string) => {
  return await Bun.password.hash(password, 'bcrypt');
};

export const comparePassword = async (password: string, hash: string) => {
  return await Bun.password.verify(password, hash);
};

// export const hashPasswordAsync = async (password: string) => {
//   return await hash(password, 10);
// };

// export const comparePasswordAsync = async (password: string, hash: string) => {
//   return await compare(password, hash);
// };

