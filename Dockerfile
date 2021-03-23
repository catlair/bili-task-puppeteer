FROM catlair/alpine-chromium:latest

WORKDIR /usr/src/app

COPY --chown=chrome package.json package-lock.json ./

ENTRYPOINT ["tini", "--"]

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=1 \
     PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

# RUN npm config set registry https://registry.npm.taobao.org \
RUN chown -R chrome ./ \
     && npm install --production \
     && npm prune --production \
     && rm -rf package*.json

COPY --chown=chrome ["./dist", "./dist"]

CMD ["node", "dist/index.js" ]
