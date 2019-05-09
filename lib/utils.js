const shell = require('shelljs');

function getRepoData() {
  const { stdout } = shell.exec('git config --get remote.origin.url', {
    silent: true,
  });
  // Strip out all new lines.
  const remoteUrl = stdout.replace(/(\r\n|\n|\r)/gm, '');
  const regex = /^(.*)github.com:(.*)\/(.*)\.git$/;
  const owner = remoteUrl.replace(regex, '$2');
  const repo = remoteUrl.replace(regex, '$3');
  return {
    owner,
    repo,
  };
}

module.exports = {
  getRepoData,
};
