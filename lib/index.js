const fs = require('fs');
const path = require('path');
const cosmiconfig = require('cosmiconfig');
const {
  fetchLabels,
  createLabels,
  deleteLabels,
  updateLabels,
} = require('./api');

const explorer = cosmiconfig('github-labels', {
  searchPlaces: ['package.json', '.github-labelsrc', '.github-labelsrc.json'],
});
const result = explorer.searchSync();
const configFile = result
  ? result.filepath
  : path.join(process.cwd(), '.github-labelsrc.json');

async function labelControl() {
  const data = fs.readFileSync(configFile);
  const localConfig = JSON.parse(data);
  const illegalLabels = checkForSameLabelName(localConfig);
  if (illegalLabels.length > 0) {
    throw new Error(`
    The config has labels with the same name:
    ${illegalLabels}
    The Label names have to be unique.
    `);
  }
  const publicLabels = await fetchLabels();
  const newLabels = checkForLabelsToCreate(localConfig, publicLabels);
  const labelsToDelete = checkForLabelsToDelete(localConfig, publicLabels);
  const labelsToUpdate = checkForModifications(localConfig, publicLabels);
  if (newLabels.length > 0) {
    await createLabels(newLabels);
  }
  if (labelsToDelete.length > 0) {
    await deleteLabels(labelsToDelete);
  }
  if (labelsToUpdate.length > 0) {
    await updateLabels(labelsToUpdate, publicLabels);
  }

  const hasChanges =
    newLabels.length > 0 ||
    labelsToDelete.length > 0 ||
    labelsToUpdate.length > 0;

  if (hasChanges) {
    await writeLabelsConfig();
  }

  const summary = hasChanges
    ? {
        message: 'Labels synchronized!',
        stats: {
          created: newLabels.length,
          deleted: labelsToDelete.length,
          updated: labelsToUpdate.length,
        },
      }
    : { message: 'Labels already up to date!' };
  return summary;
}

async function writeLabelsConfig() {
  const labels = await fetchLabels();
  fs.writeFileSync(configFile, JSON.stringify(labels, null, 2));
}

function checkForLabelsToCreate(localConfig, publicLabels) {
  const publicLabelIds = publicLabels.map(label => label.id);
  return localConfig.filter(label => !publicLabelIds.includes(label.id));
}

function checkForLabelsToDelete(localConfig, publicLabels) {
  const localLabelIds = localConfig.map(label => label.id).filter(Boolean);
  return publicLabels.filter(label => !localLabelIds.includes(label.id));
}

function checkForModifications(localConfig, publishedConfig) {
  const normalizedPublishedConfig = publishedConfig.reduce(
    (normalized, label) => ({
      ...normalized,
      [label.id]: label,
    }),
    {}
  );

  const [, updatedLabels] = localConfig.reduce(
    ([notUpdated, updated], label) => {
      if (!label.id) {
        return [notUpdated, updated];
      }
      const oldLabel = normalizedPublishedConfig[label.id];
      if (oldLabel) {
        if (
          label.name !== oldLabel.name ||
          label.color !== oldLabel.color ||
          label.description !== oldLabel.description
        ) {
          return [notUpdated, [...updated, label]];
        }
        return [[...notUpdated, label], updated];
      }
      return [notUpdated, updated];
    },
    [[], []]
  );
  return updatedLabels;
}

function checkForSameLabelName(localConfig) {
  const [, illegals] = localConfig.reduce(
    ([legal, illegal], label) => {
      if (legal.includes(label.name)) {
        return [legal, [...illegal, label.name]];
      }
      return [[...legal, label.name], illegal];
    },
    [[], []]
  );
  return illegals;
}

module.exports = {
  labelControl,
  writeLabelsConfig,
  configFile,
};
