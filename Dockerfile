FROM index.alauda.cn/library/alpine

WORKDIR /app

RUN apk --no-cache add tzdata nodejs && cp /usr/share/zoneinfo/Asia/Shanghai /etc/localtime
ADD kubectl /usr/local/bin/
ADD package.json /app/
ADD node_modules /app/node_modules
ADD public /app/public
ADD server /app/server
RUN npm install

EXPOSE 4200 50000
CMD node server/index.js
