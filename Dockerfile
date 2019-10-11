FROM node:10.14.1-alpine
COPY entrypoint.sh /entrypoint.sh
ENV WRANGLER_HOME /github/workspace
ENTRYPOINT ["/entrypoint.sh"]
