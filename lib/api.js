require('dotenv').config();
const octokit = require('@octokit/rest')({
  auth: `token ${process.env.AUTH_TOKEN}`,
  accept: 'application/vnd.github.v3+json',
  'user-agent': 'octokit/rest.js v1.2.3',
  previews: ['symmetra'],
});

const owner = process.env.OWNER;
const repo = process.env.REPOSITORY;

async function fetchLabels() {
  const res = await octokit.issues.listLabelsForRepo({
    owner,
    repo,
  });
  return res.data;
}

async function createLabels(labels) {
  const promiseList = labels.map(async label => {
    await octokit.issues.createLabel({
      owner,
      repo,
      name: label.name,
      color: label.color || 'ededed',
      description: label.description || '',
    });
  });
  return Promise.all(promiseList);
}

function deleteLabels(labels) {
  const promiseList = labels.map(async label => {
    await octokit.issues.deleteLabel({
      owner,
      repo,
      name: label.name,
    });
  });
  return Promise.all(promiseList);
}

async function updateLabels(labels) {
  const oldLabels = await fetchLabels();
  const promiseList = labels.map(async label => {
    const requiredLabel = oldLabels.find(oldLabel => {
      return label.id === oldLabel.id ? oldLabel : undefined;
    });
    await octokit.issues.updateLabel({
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
