const fs = require('fs');
const shell = require('shelljs');
const nock = require('nock');
const { labelControl, writeLabelsConfig } = require('../lib');

jest.mock('fs');
jest.mock('cosmiconfig', () => () => ({
  searchSync: jest.fn(() => null),
}));
jest.mock('shelljs', () => ({
  exec: jest.fn(() => ({ stdout: 'git@github.com:owner/repository.git\n' })),
}));

const labels = {
  bug: {
    id: 1,
    name: 'Bug',
    color: '7067ff',
    description: 'for bugs',
  },
  feature: {
    id: 2,
    name: 'feature',
    color: '8aeac7',
    description: 'for features',
  },
  refactoring: {
    id: 3,
    name: 'refactoring',
    color: 'e2e2e2',
    description: 'for refactoring',
  },
};

const mockedLabels = [labels.bug, labels.feature];

const mockedCreatedLabels = [labels.bug, labels.feature, labels.refactoring];

const mockedDeletedLabels = [labels.bug];

const mockedUpdatedLabels = [
  labels.bug,
  {
    ...labels.feature,
    description: 'for new features',
  },
];

const mockedCreatedAndDeletedLabels = [labels.bug, labels.refactoring];

const mockedCreatedAndUpdatedLabels = [
  labels.bug,
  {
    ...labels.feature,
    color: 'e2e2e2',
  },
  labels.refactoring,
];

const mockedDeletedAndUpdatedLabels = [
  {
    ...labels.bug,
    color: 'e2e2e2',
  },
];

const mockedCreateDeleteAndUpdateLabels = [
  {
    ...labels.bug,
    description: 'for small bugs',
  },
  labels.refactoring,
];

const createMockForFetchLabels = ({
  statusCode = 200,
  apiResponse = mockedLabels,
  errorResponse,
} = {}) => {
  nock('https://api.github.com')
    .get(`/repos/owner/repository/labels`)
    .reply(statusCode, errorResponse || apiResponse);
};

const createMockForCreateLabels = ({
  statusCode = 200,
  apiResponse = {},
  errorResponse,
} = {}) => {
  nock('https://api.github.com')
    .post(`/repos/owner/repository/labels`)
    .reply(statusCode, errorResponse || apiResponse);
};

const createMockForDeleteLabels = (
  labelName,
  { statusCode = 200, apiResponse = {}, errorResponse } = {}
) => {
  nock('https://api.github.com')
    .delete(`/repos/owner/repository/labels/${labelName}`)
    .reply(statusCode, errorResponse || apiResponse);
};

const createMockForUpdateLabels = (
  labelName,
  { statusCode = 200, apiResponse = {}, errorResponse } = {}
) => {
  nock('https://api.github.com')
    .patch(`/repos/owner/repository/labels/${labelName}`)
    .reply(statusCode, errorResponse || apiResponse);
};

describe('Config file', () => {
  beforeEach(() => {
    nock.cleanAll();
    shell.exec.mockReturnValue({
      stdout: 'git@github.com:commercetools/github-labels.git',
    });
  });
  describe('when writing labels into config', () => {
    beforeEach(() => {
      createMockForFetchLabels();
    });
    it('should write labels into the config', async () => {
      await writeLabelsConfig();
      expect(fs.writeFileSync).toHaveBeenCalledWith(
        expect.any(String),
        JSON.stringify(mockedLabels, null, 2)
      );
    });
  });
  describe('when creating a new label', () => {
    beforeEach(() => {
      createMockForFetchLabels();
      createMockForCreateLabels();
      createMockForFetchLabels({
        apiResponse: mockedCreatedLabels,
      });
    });
    it('should create a new label', async () => {
      fs.readFileSync.mockReturnValue(JSON.stringify(mockedCreatedLabels));
      const summary = await labelControl();
      expect(summary.stats.created).toBe(1);
      expect(fs.writeFileSync).toHaveBeenCalledWith(
        expect.any(String),
        JSON.stringify(mockedCreatedLabels, null, 2)
      );
    });
  });
  describe('when deleting a label', () => {
    beforeEach(() => {
      createMockForFetchLabels();
      createMockForDeleteLabels(labels.feature.name);
      createMockForFetchLabels({
        apiResponse: mockedDeletedLabels,
      });
    });
    it('should delete a label', async () => {
      fs.readFileSync.mockReturnValue(JSON.stringify(mockedDeletedLabels));
      const summary = await labelControl();
      expect(summary.stats.deleted).toBe(1);
      expect(fs.writeFileSync).toHaveBeenCalledWith(
        expect.any(String),
        JSON.stringify(mockedDeletedLabels, null, 2)
      );
    });
  });
  describe('when updating a label', () => {
    beforeEach(() => {
      createMockForFetchLabels();
      createMockForUpdateLabels(labels.feature.name);
      createMockForFetchLabels({
        apiResponse: mockedUpdatedLabels,
      });
    });
    it('should update a label', async () => {
      fs.readFileSync.mockReturnValue(JSON.stringify(mockedUpdatedLabels));
      const summary = await labelControl();
      expect(summary.stats.updated).toBe(1);
      expect(fs.writeFileSync).toHaveBeenCalledWith(
        expect.any(String),
        JSON.stringify(mockedUpdatedLabels, null, 2)
      );
    });
  });
  describe('when creating and deleting labels', () => {
    beforeEach(() => {
      createMockForFetchLabels();
      createMockForCreateLabels();
      createMockForDeleteLabels(labels.feature.name);
      createMockForFetchLabels({
        apiResponse: mockedCreatedAndDeletedLabels,
      });
    });
    it('should create and delete one label', async () => {
      fs.readFileSync.mockReturnValue(
        JSON.stringify(mockedCreatedAndDeletedLabels)
      );
      const summary = await labelControl();
      expect(summary.stats).toEqual({
        created: 1,
        deleted: 1,
        updated: 0,
      });
      expect(fs.writeFileSync).toHaveBeenCalledWith(
        expect.any(String),
        JSON.stringify(mockedCreatedAndDeletedLabels, null, 2)
      );
    });
  });
  describe('when creating and updating labels', () => {
    beforeEach(() => {
      createMockForFetchLabels();
      createMockForCreateLabels();
      createMockForUpdateLabels(labels.feature.name);
      createMockForFetchLabels({
        apiResponse: mockedCreatedAndUpdatedLabels,
      });
    });
    it('should create and update one label', async () => {
      fs.readFileSync.mockReturnValue(
        JSON.stringify(mockedCreatedAndUpdatedLabels)
      );
      const summary = await labelControl();
      expect(summary.stats).toEqual({
        created: 1,
        deleted: 0,
        updated: 1,
      });
      expect(fs.writeFileSync).toHaveBeenCalledWith(
        expect.any(String),
        JSON.stringify(mockedCreatedAndUpdatedLabels, null, 2)
      );
    });
  });
  describe('when deleting and updating labels', () => {
    beforeEach(() => {
      createMockForFetchLabels();
      createMockForDeleteLabels(labels.feature.name);
      createMockForUpdateLabels(labels.bug.name);
      createMockForFetchLabels({
        apiResponse: mockedDeletedAndUpdatedLabels,
      });
    });
    it('should delete and update one label', async () => {
      fs.readFileSync.mockReturnValue(
        JSON.stringify(mockedDeletedAndUpdatedLabels)
      );
      const summary = await labelControl();
      expect(summary.stats).toEqual({
        created: 0,
        deleted: 1,
        updated: 1,
      });
      expect(fs.writeFileSync).toHaveBeenCalledWith(
        expect.any(String),
        JSON.stringify(mockedDeletedAndUpdatedLabels, null, 2)
      );
    });
  });
  describe('when creating, deleting and updating labels', () => {
    beforeEach(() => {
      createMockForFetchLabels();
      createMockForCreateLabels();
      createMockForDeleteLabels(labels.feature.name);
      createMockForUpdateLabels(labels.bug.name);
      createMockForFetchLabels({
        apiResponse: mockedCreateDeleteAndUpdateLabels,
      });
    });
    it('should create, delete and update one label', async () => {
      fs.readFileSync.mockReturnValue(
        JSON.stringify(mockedCreateDeleteAndUpdateLabels)
      );
      const summary = await labelControl();
      expect(summary.stats).toEqual({
        created: 1,
        deleted: 1,
        updated: 1,
      });
      expect(fs.writeFileSync).toHaveBeenCalledWith(
        expect.any(String),
        JSON.stringify(mockedCreateDeleteAndUpdateLabels, null, 2)
      );
    });
  });
  describe('if no modification is provided', () => {
    beforeEach(() => {
      createMockForFetchLabels();
    });
    it('should return specific summary', async () => {
      fs.readFileSync.mockReturnValue(JSON.stringify(mockedLabels));
      const summary = await labelControl();
      expect(summary.message).toContain('up to date!');
    });
  });
});
