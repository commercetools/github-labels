const shell = require('shelljs');

function getRepoData() {
  const result = shell.exec('git config --get remote.origin.url', {
    silent: true,
  }).stdout;
  const regex = /^(.*)github.com:(.*)\/(.*)\.git$/m;
  const owner = result.replace(regex, '$2');
  const repo = result.replace(regex, '$3');
  return {
    // The regex result contains an %0A at the end.
    // The next two lines remove them.
    owner: owner.substring(0, owner.length - 1),
    repo: repo.substring(0, repo.length - 1),
  };
}

module.exports = {
  getRepoData,
};
