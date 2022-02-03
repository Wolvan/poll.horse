FROM node:lts-alpine
WORKDIR /usr/src/app

# Add Tini
RUN apk add --update tini

# Install and build application
COPY ["package.json", "package-lock.json*", "npm-shrinkwrap.json*", "./"]
RUN npm set-script prepublish ""
RUN npm install --silent && npm cache clean --silent --force
COPY . .
RUN npm test
RUN npm run build
RUN rm -rf src utils .eslintignore .eslintrc.json .mocharc.json test tsconfig.json
RUN npm prune --production --silent
RUN chown -R node /usr/src/app
RUN mv node_modules ../
ENV PORT=6969
RUN mkdir -p /data && chown -R node /data
USER node
ENTRYPOINT ["/sbin/tini", "--", "node", "dist/main", "--port", "env:PORT", "--data-directory", "/data"]
