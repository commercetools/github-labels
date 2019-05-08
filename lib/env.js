const isTest = process.env.NODE_ENV === 'test';

const owner = isTest ? 'owner' : process.env.OWNER;
const repo = isTest ? 'repository' : process.env.REPOSITORY;
const authToken = isTest ? 'token' : process.env.AUTH_TOKEN;

module.exports = {
  owner,
  repo,
  authToken,
};
