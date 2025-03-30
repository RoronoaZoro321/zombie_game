# install nvm if not already installed
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.3/install.sh | bash

# Install the latest version of Node.js
nvm install node

# use the latest version (v23.10.0)
nvm use node

# install the package
npm install --save three
npm install --save-dev vite

# to run the project
npx vite
