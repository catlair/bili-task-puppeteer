 FROM catlair/alpine-chromium:3.12-86

 WORKDIR /usr/src/app

 COPY --chown=chrome package.json package-lock.json ./

 ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=1 \
     PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

 RUN npm config set registry https://registry.npm.taobao.org \
     && npm install \
     && npm prune --production

 ENTRYPOINT ["tini", "--"]

 CMD [ "node", "dist/index" ]
