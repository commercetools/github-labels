# GitHub Labels

<div style="text-align: left">
  <img src="./pictures/gh-labels.png" width="150px"/>
</div>

## Scope
A cli for managing GitHub labels.

## Getting Started

1. Install the Label Manager

with npm:
```
npm install github-labels --save-dev
```

2. Define environment variable

  Generate a new GitHub [AUTH_TOKEN](https://github.com/settings/tokens) and write it into your **.env** file:
```
AUTH_TOKEN="your-token"
```

3. Create label config

  Execute this command to create a `.github-labelsrc.json` file with the current labels of your repository:
```
glm init
```

## Manage your labels
If you want to change your label config, just go to the `.github-labelsrc.json` file in your repository.
If you don't have this file yet, follow the given instructions at [3. Create label config](#getting-started).
In this file, you can see all your current label data. If you want to change something on your labels,
just modify the file as you like. After modifying, save your changes and run the command below:
```
glm sync
```
This will synchronize the config file with your GitHub repository.
If you want to see your changes, just go to your label settings on GitHub to see your current labels.

### Config structure:
```
{
  "id": 1336719046,
  "name": "bug",
  "color": "8eedc7",
  "description": "Something isn't working"
}
```

### Required fields:
| Data | Required | Type |
|:-------- |:-------:| :-------|
| id | no | Id (Created by GitHub) |
| name | yes | String (Native emojis can be added) |
| color | no | String (hexadecimal color code without the leading #) |
| description | no | String |


### Duplicate labels of an existing repository

1. Install label-manager on the repository with the labels you want to duplicate
2. Initialize the label-manager to get the `.github-labelsrc.json` file with your current labels:
```
glm init
```
3. Install label-manager on the repository where you want to implement these labels
4. Copy the `.github-labelsrc.json` file of your repository with the required labels and paste it into your new repository
5. Synchronize your duplicated `.github-labelsrc.json` file with GitHub:
glm sync
```
Now you should see your labels in the new repository.