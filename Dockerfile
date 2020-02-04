FROM rust:1
ENV XDG_CONFIG_HOME /github/workspace
ENV WRANGLER_HOME /github/workspace
ARG NVM_VERSION=0.35.2
ENV NVM_VERSION $NVM_VERSION
ARG NODE_VERSION=12.14.1
ENV NODE_VERSION $NODE_VERSION
ENV NODE_HOME $WRANGLER_HOME/nvm/versions/node/v$NODE_VERSION
ENV NODE_PATH $NODE_HOME/lib/node_modules

COPY entrypoint.sh /entrypoint.sh
COPY install.sh /install.sh
RUN chmod +x /install.sh /entrypoint.sh
RUN /install.sh
ENTRYPOINT ["/entrypoint.sh"]
