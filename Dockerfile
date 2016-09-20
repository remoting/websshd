FROM index.alauda.cn/library/alpine

WORKDIR /app

RUN apk --no-cache add tzdata && cp /usr/share/zoneinfo/Asia/Shanghai /etc/localtime
RUN apk --no-cache add nodejs python
ADD . /app/
RUN mv /app/kubectl /usr/local/bin/kubectl && npm install

EXPOSE 4200
CMD node server/index.js