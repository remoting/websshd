FROM index.alauda.cn/library/alpine

WORKDIR /app

RUN apk --no-cache add tzdata nodejs python && cp /usr/share/zoneinfo/Asia/Shanghai /etc/localtime
ADD . /app/
RUN mv /app/kubectl /usr/local/bin/kubectl && npm install

EXPOSE 4200 50000
CMD node server/index.js
