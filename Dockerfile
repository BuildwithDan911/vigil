ARG IMAGE=irishealth-community:2027.1.0AI.109.0
FROM $IMAGE

USER root

# Install system dependencies, OpenJDK for Java PEX, and Python tools
RUN apt-get update && apt-get install -y --no-install-recommends \
    default-jdk-headless \
    curl \
    git \
    && rm -rf /var/lib/apt/lists/*

# Set up development directory with correct permissions
ENV DEV_HOME=/home/irisowner/dev
RUN mkdir -p ${DEV_HOME} && chown -R irisowner:irisowner ${DEV_HOME}

USER irisowner

WORKDIR ${DEV_HOME}

# Copy project files into container image
COPY --chown=irisowner:irisowner . ${DEV_HOME}

# Configure IRIS with merge.cpf and iris.script
RUN iris start IRIS \
    && iris session IRIS < ${DEV_HOME}/iris.script \
    && iris stop IRIS quietly
