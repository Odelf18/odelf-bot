# Build for Heroku (amd64). Platform is also set by scripts/deploy-heroku.sh.
FROM freqtradeorg/freqtrade:stable

# Heroku assigns a random non-root UID; without this, `pip --user` packages
# (freqtrade) are not found → ModuleNotFoundError: No module named 'freqtrade'
# See: https://github.com/freqtrade/freqtrade/issues/5625
ENV PYTHONUSERBASE="/home/ftuser/.local"
ENV PATH="/home/ftuser/.local/bin:${PATH}"
ENV FT_APP_ENV="docker"

USER root
RUN mkdir -p /freqtrade/user_data/logs /freqtrade/user_data/data \
    && chown -R ftuser:ftuser /freqtrade/user_data \
    && chmod -R a+rX /home/ftuser/.local /freqtrade

# Postgres driver (not in the default freqtrade image)
USER ftuser
RUN pip install --user --no-cache-dir "psycopg2-binary>=2.9.9"

USER root
# CACHEBUST forces fresh COPY when deploying config/strategy changes
ARG CACHEBUST=1
COPY --chown=ftuser:ftuser bot/user_data/ /freqtrade/user_data/
COPY --chown=ftuser:ftuser bot/entrypoint.sh /freqtrade/entrypoint.sh
RUN chmod +x /freqtrade/entrypoint.sh \
    && chmod -R a+rX /freqtrade/user_data /home/ftuser/.local

USER ftuser
WORKDIR /freqtrade

EXPOSE 8080

# Heroku wraps proc with `/bin/sh -c <run>`; use a shell as entrypoint.
ENTRYPOINT ["/bin/bash"]
CMD ["/freqtrade/entrypoint.sh"]
