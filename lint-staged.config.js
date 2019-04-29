module.exports = {
  '*.md': ['npm run format:md', 'git add'],
  '*.{yaml,yml}': ['npm run format:yaml', 'git add'],
  '*.js': ['npm run lint'],
};
