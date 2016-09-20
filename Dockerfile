FROM index.alauda.cn/library/alpine

WORKDIR /app

RUN apk --no-cache add tzdata nodejs python && cp /usr/share/zoneinfo/Asia/Shanghai /etc/localtime
ADD kubectl /usr/local/bin/
ADD package.json /app/
ADD node_modules /app/
ADD public /app/
ADD server /app/
RUN npm install

EXPOSE 4200 50000
CMD node server/index.js
