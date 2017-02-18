
# Contributing

### Setup
```bash
git clone https://github.com/tianjianchn/midd
cd midd
npm install
npm run bootstrap # Installs all of packages' dependencies and links any cross-dependencies
```

### Develop
```bash
npm run bootstrap # Everytime you update (dev)deps in packages, run this command to install and link
npm run build # will lint, clean and babel
npm run watch # Build, then watch each package `src` files and build if changed
npm run test:only # No build task involved
npm test # Run lint, clean, build and test:only tasks
```

### Release
```bash
npm run publish # not `npm publish`
```
