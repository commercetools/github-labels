const fs = require('fs');
const path = require('path');
const {
  fetchLabels,
  createLabels,
  deleteLabels,
  updateLabels,
} = require('./api');

async function labelControl() {
  const publicLabels = await fetchLabels();
  const data = fs.readFileSync(path.join(process.cwd(), 'label-config.json'), {
    encoding: 'utf8',
  });

  const localConfig = JSON.parse(data.toString());
  const illegalLabels = checkForSameLabelName(localConfig);
  if (illegalLabels.length > 0) {
    throw new Error(`
    The config has labels with the same name:
    ${illegalLabels}
    The Label names have to be unique.
    `);
  }
  const newLabels = checkForNewOrOldLabels(localConfig, publicLabels);
  const labelsToDelete = checkForNewOrOldLabels(publicLabels, localConfig);
  const labelsToUpdate = checkForModifications(localConfig, publicLabels);
  if (newLabels.length > 0) {
    await createLabels(newLabels);
  }
  if (labelsToDelete.length > 0) {
    await deleteLabels(labelsToDelete);
  }
  if (labelsToUpdate.length > 0) {
    await updateLabels(labelsToUpdate);
  }
  await writeLabelsConfig();
  const hasChanges =
    newLabels.length > 0 ||
    labelsToDelete.length > 0 ||
    labelsToUpdate.length > 0;
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
  fs.writeFileSync(
    path.join(process.cwd(), 'label-config.json'),
    JSON.stringify(labels, null, 2)
  );
}

function checkForNewOrOldLabels(newLabels, oldLabels) {
  const oldLabelIds = oldLabels.map(label => {
    return label.id ? label.id : undefined;
  });
  const [, updatedLabels] = newLabels.reduce(
    ([notUpdated, updated], label) => {
      if (!oldLabelIds.includes(label.id ? label.id : undefined)) {
        return [notUpdated, [...updated, label]];
      }
      return [[...notUpdated, label], updated];
    },
    [[], []]
  );
  return updatedLabels;
}

function checkForModifications(localConfig, publishedConfig) {
  const [ids, names, colors, descriptions] = publishedConfig.reduce(
    ([id, name, color, description], label) => {
      return [
        [...id, label.id],
        [...name, label.name],
        [...color, label.color],
        [...description, label.description],
      ];
    },
    [[], [], [], []]
  );
  const [, updatedLabels] = localConfig.reduce(
    ([notUpdated, updated], label) => {
      if (ids.includes(label.id)) {
        if (
          names.includes(label.name) &&
          colors.includes(label.color) &&
          descriptions.includes(label.description)
        ) {
          return [[...notUpdated, label], updated];
        }
        return [notUpdated, [...updated, label]];
      }
      return [[...notUpdated, label], updated];
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
};
