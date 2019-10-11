FROM node:12
ENV XDG_CONFIG_HOME /github/workspace
RUN "curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.35.0/install.sh | bash"
RUN "nvm install latest"
ENV WRANGLER_HOME /github/workspace
COPY entrypoint.sh /entrypoint.sh
ENTRYPOINT ["/entrypoint.sh"]
