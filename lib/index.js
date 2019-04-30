const fs = require('fs');
const {
  fetchLabels,
  createLabels,
  deleteLabels,
  updateLabels,
} = require('./api');

async function labelControl() {
  const labelData = await fetchLabels();
  const formattedPublishedLabels = await labelFormatter(labelData);
  const data = fs.readFileSync('./label-config.json', { encoding: 'utf8' });

  const localConfig = JSON.parse(data.toString());
  const newLabels = checkForNewOrOldLabels(
    localConfig,
    formattedPublishedLabels
  );
  const labelsToDelete = checkForNewOrOldLabels(
    formattedPublishedLabels,
    localConfig
  );
  const labelsToUpdate = checkForModifications(
    localConfig,
    formattedPublishedLabels
  );
  if (newLabels.length !== 0) {
    await createLabels(newLabels);
  }
  if (labelsToDelete.length !== 0) {
    await deleteLabels(labelsToDelete);
  }
  if (labelsToUpdate.length !== 0) {
    await updateLabels(labelsToUpdate);
  }
  await writeLabelsConfig();
  const changes =
    newLabels.length + labelsToDelete.length + labelsToUpdate.length;
  const summary =
    changes !== 0
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
  const labelData = await fetchLabels();
  const labels = await labelFormatter(labelData);
  fs.writeFileSync('./label-config.json', JSON.stringify(labels, null, 2));
}

function checkForNewOrOldLabels(newLabels, oldLabels) {
  const updatedLabels = [];
  const OldLabelIds = [];
  oldLabels.forEach(label => {
    OldLabelIds.push(label.id ? label.id : undefined);
  });
  newLabels.forEach(label => {
    if (!OldLabelIds.includes(label.id ? label.id : undefined)) {
      updatedLabels.push(label);
    }
  });
  return updatedLabels;
}

function checkForModifications(localConfig, publishedConfig) {
  const formattedPublishedConfig = labelFormatter(publishedConfig);
  const labelChanges = [];
  localConfig.forEach(localLabel => {
    formattedPublishedConfig.forEach(publicLabel => {
      if (localLabel.id === publicLabel.id) {
        if (
          Object.values(localLabel).toString() !==
          Object.values(publicLabel).toString()
        ) {
          labelChanges.push(localLabel);
        }
      }
    });
  });
  return labelChanges;
}

function labelFormatter(labelData) {
  const formattedLabels = labelData.map(label => {
    const data = {
      id: label.id,
      name: label.name,
      color: label.color,
      description: label.description || '',
    };
    return data;
  });
  return formattedLabels;
}

module.exports = {
  labelControl,
  writeLabelsConfig,
};
