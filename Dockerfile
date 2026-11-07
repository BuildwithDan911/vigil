ARG IMAGE=irishealth-community:2027.1.0AI.109.0
FROM $IMAGE

USER root

# Set up development directory with correct permissions
ENV DEV_HOME=/home/irisowner/dev
RUN mkdir -p ${DEV_HOME} && chown -R irisowner:irisowner ${DEV_HOME}

USER irisowner

WORKDIR ${DEV_HOME}

# Copy project files into container image
COPY --chown=irisowner:irisowner . ${DEV_HOME}

ENV ISC_CPF_MERGE_FILE=${DEV_HOME}/merge.cpf

# Run configuration script via iris-main hook
CMD ["-a", "iris session IRIS < /home/irisowner/dev/iris.script"]
