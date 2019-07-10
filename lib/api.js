require('dotenv').config();
const createHttpUserAgent = require('@commercetools/http-user-agent');
const createHttpClient = require('@octokit/rest');
const pkg = require('../package.json');
const { authToken } = require('./env');
const { getRepoData } = require('./utils');

const { owner, repo } = getRepoData();

const userAgent = createHttpUserAgent({
  name: '@octokit/rest',
  version: pkg.dependencies['@octokit/rest'],
  libaryName: pkg.name,
  libaryVersion: pkg.version,
});

const octokit = createHttpClient({
  auth: `token ${authToken}`,
  accept: 'application/vnd.github.v3+json',
  'user-agent': userAgent,
  // For using descriptions in requests
  previews: ['symmetra'],
});

async function fetchLabels() {
  const options = octokit.issues.listLabelsForRepo.endpoint.merge({
    owner,
    repo,
  });
  const data = await octokit.paginate(options);
  return data.map(label => {
    return {
      id: label.id,
      name: label.name,
      color: label.color,
      description: label.description || '',
    };
  });
}

function createLabels(labels) {
  const promiseList = labels.map(label => {
    return octokit.issues.createLabel({
      owner,
      repo,
      name: label.name,
      color: label.color || 'ffffff',
      description: label.description || '',
    });
  });
  return Promise.all(promiseList);
}

function deleteLabels(labels) {
  const promiseList = labels.map(label => {
    return octokit.issues.deleteLabel({
      owner,
      repo,
      name: label.name,
    });
  });
  return Promise.all(promiseList);
}

async function updateLabels(labels, oldLabels) {
  const promiseList = labels.map(label => {
    const requiredLabel = oldLabels.find(oldLabel => {
      return label.id === oldLabel.id;
    });
    return octokit.issues.updateLabel({
      owner,
      repo,
      current_name: requiredLabel.name,
      name: label.name,
      description: label.description || requiredLabel.description || '',
      color: label.color || requiredLabel.color,
    });
  });
  return Promise.all(promiseList);
}

module.exports = {
  fetchLabels,
  createLabels,
  deleteLabels,
  updateLabels,
};
