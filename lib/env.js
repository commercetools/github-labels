const isTest = process.env.NODE_ENV === 'test';

const authToken = isTest ? 'token' : process.env.AUTH_TOKEN;

module.exports = {
  authToken,
};
