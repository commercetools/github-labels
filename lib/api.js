const axios = require('axios');
require('dotenv').config();

const owner = process.env.OWNER;
const repo = process.env.REPOSITORY;
// eslint-disable-next-line dot-notation
axios.defaults.headers.common['Authorization'] = `token ${
  process.env.AUTH_TOKEN
}`;
// eslint-disable-next-line dot-notation
axios.defaults.headers.common['Accept'] =
  'application/vnd.github.symmetra-preview+json';

function fetchLabels() {
  const url = `https://api.github.com/repos/${owner}/${repo}/labels`;
  return axios.get(url).then(response => {
    const labels = [];
    response.data.forEach(label => {
      labels.push(label);
    });
    return labels;
  });
}

function createLabels(labels) {
  const url = `https://api.github.com/repos/${owner}/${repo}/labels`;
  labels.forEach(label => {
    const { name } = label;
    const { description } = label.description || '';
    const { color } = label.color || 'ededed';
    return axios
      .post(url, {
        name,
        description,
        color,
      })
      .catch(err => {
        console.log(err);
      });
  });
}

function deleteLabels(labels) {
  labels.forEach(label => {
    const url = `https://api.github.com/repos/${owner}/${repo}/labels/${
      label.name
    }`;
    return axios.delete(url).catch(err => {
      console.log(err);
    });
  });
}

async function updateLabels(labels) {
  const oldLabels = await fetchLabels();
  labels.forEach(label => {
    const requiredLabel = oldLabels.find(oldLabel => {
      return label.id === oldLabel.id ? oldLabel : undefined;
    });
    const url = `https://api.github.com/repos/${owner}/${repo}/labels/${
      requiredLabel.name
    }`;
    return axios.patch(url, {
      name: label.name || requiredLabel.name,
      description: label.description || requiredLabel.description,
      color: label.color || requiredLabel.color,
    });
  });
}

module.exports = {
  fetchLabels,
  createLabels,
  deleteLabels,
  updateLabels,
};
