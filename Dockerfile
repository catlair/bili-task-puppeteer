FROM catlair/alpine-chromium:latest

WORKDIR /usr/src/app

COPY --chown=chrome ./ ./builddir/

ENTRYPOINT ["tini", "--"]

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=1 \
     PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

# 国内将第一行换成这两行
# RUN npm config set registry https://registry.npm.taobao.org \
     # chown -R chrome ./ \
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

CMD ["node", "dist/bin.js" ]
