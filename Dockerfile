FROM freqtradeorg/freqtrade:stable

USER root
RUN mkdir -p /freqtrade/user_data/logs /freqtrade/user_data/data \
    && chown -R ftuser:ftuser /freqtrade/user_data

# Build context = repo root (Heroku + docker-compose)
COPY --chown=ftuser:ftuser bot/user_data/ /freqtrade/user_data/
COPY --chown=ftuser:ftuser bot/entrypoint.sh /freqtrade/entrypoint.sh
RUN chmod +x /freqtrade/entrypoint.sh

USER ftuser
WORKDIR /freqtrade

EXPOSE 8080

ENTRYPOINT ["/freqtrade/entrypoint.sh"]
