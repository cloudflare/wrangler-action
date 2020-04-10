FROM rust:1
ENV WRANGLER_VERSION 1.6.0
ENV NVM_VERSION 0.35.2
ENV NODE_VERSION 12.14.1
ENV XDG_CONFIG_HOME /github/workspace
ENV WRANGLER_HOME /github/workspace
ENV NODE_HOME $WRANGLER_HOME/nvm/versions/node/v$NODE_VERSION
ENV NODE_PATH $NODE_HOME/lib/node_modules

COPY entrypoint.sh /entrypoint.sh
COPY install.sh /install.sh
RUN chmod +x /install.sh /entrypoint.sh
RUN /install.sh
RUN cargo install --version $WRANGLER_VERSION wrangler
ENTRYPOINT ["/entrypoint.sh"]
