const fs = require('file-system');
const {
  fetchLabels,
  createLabels,
  deleteLabels,
  updateLabels,
} = require('./api');

function labelControl() {
  return new Promise(async (resolve, reject) => {
    try {
      const labelData = await fetchLabels();
      const formattedPublishedLabels = await labelFormatter(labelData);
      fs.readFile('./label-config.json', async (err, data) => {
        if (err) {
          throw err;
        }
        const localConfig = JSON.parse(data.toString());
        const newLabels = await checkForNewOrOldLabels(
          localConfig,
          formattedPublishedLabels
        );
        const labelsToDelete = await checkForNewOrOldLabels(
          formattedPublishedLabels,
          localConfig
        );
        const labelsToUpdate = await checkForModifications(
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
        const changes =
          newLabels.length + labelsToDelete.length + labelsToUpdate.length;
        const summary =
          changes !== 0
            ? {
                created: newLabels.length,
                deleted: labelsToDelete.length,
                updated: labelsToUpdate.length,
              }
            : 'Labels already up to date!';
        resolve(summary);
      });
    } catch (err) {
      reject(err);
    }
  });
}

function writeLabelsConfig() {
  return new Promise(async (resolve, reject) => {
    try {
      const labelData = await fetchLabels();
      const labels = await labelFormatter(labelData);
      fs.writeFile('./label-config.json', JSON.stringify(labels, null, 2));
      resolve();
    } catch (err) {
      reject(err);
    }
  });
}

function checkForNewOrOldLabels(newLabels, oldLabels) {
  return new Promise((resolve, reject) => {
    try {
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
      resolve(updatedLabels);
    } catch (err) {
      reject(err);
    }
  });
}

function checkForModifications(localConfig, publishedConfig) {
  return new Promise(async (resolve, reject) => {
    const formattedPublishedConfig = await labelFormatter(publishedConfig);
    const labelChanges = [];
    try {
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
      resolve(labelChanges);
    } catch (err) {
      reject(err);
    }
  });
}

function labelFormatter(labelData) {
  return new Promise((resolve, reject) => {
    try {
      const formattedLabels = [];
      labelData.forEach(label => {
        const data = {
          id: label.id,
          name: label.name,
          color: label.color,
          description: label.description,
        };
        formattedLabels.push(data);
      });
      resolve(formattedLabels);
    } catch (err) {
      reject(err);
    }
  });
}

module.exports = {
  labelControl,
  writeLabelsConfig,
};
