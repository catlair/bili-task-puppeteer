FROM catlair/alpine-chromium:latest

WORKDIR /usr/src/app

COPY --chown=chrome ./ ./builddir/

ENTRYPOINT ["tini", "--"]

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=1 \
     PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

RUN chown -R chrome ./ \
     && cd ./builddir/ \
     && npm cache clean -f \
     && npm install \
     && npm run build \
     && npm prune --production \
     && npm cache clean --force \
     && mv node_modules ../ \
     && mv dist ../ \
     && mv config ../ \
     && cd ../ \
     && rm -rf builddir

CMD ["node", "dist/index.js" ]
