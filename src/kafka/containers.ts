import {core} from '@pulumi/kubernetes/types/input'
import Container = core.v1.Container

export const prometheusContainer: Container = {
  name: 'prometheus',
  image: 'docker.artifactory.gcp.mercadona.com/solsson/kafka-prometheus-jmx-exportersha25:70852d19ab9182c191684a8b08ac831230006d82e65d1db617479ea27884e4e8',
  imagePullPolicy: 'IfNotPresent',
  command: [
    'java',
    'X:+UnlockExperimentalVMOptions',
    'X:MaxRAMFraction=1',
    'XshowSetting:vm',
    '-jar',
    'jmx_prometheus_httpserver.jar',
    '5556',
    '/etc/jmx-kafka/jmx-kafka-prometheus.yml',
  ],
  ports: [{
    containerPort: 5556,
  }],
  volumeMounts: [{
    name: 'jmx-config',
    mountPath: '/etc/jmx-kafka',
  }],
}

export const kafkaContainer: Container = {
  name: 'controller',
  image: 'docker.artifactory.gcp.mercadona.com/confluentinc/cpkafk:7.3.0',
  imagePullPolicy: 'IfNotPresent',
  securityContext: {
    runAsUser: 0,
  },
  ports: [{
    name: 'controller',
    containerPort: 9093,
  }, {
    containerPort: 5555,
    name: 'jmx',
  }],
  env: [{
    name: 'POD_IP',
    valueFrom: {
      fieldRef: {
        fieldPath: 'status.podIP',
      },
    },
  }, {
    name: 'HOST_IP',
    valueFrom: {
      fieldRef: {
        fieldPath: 'status.hostIP',
      },
    },
  }, {
    name: 'POD_NAME',
    valueFrom: {
      fieldRef: {
        fieldPath: 'metadata.name',
      },
    },
  }, {
    name: 'POD_NAMESPACE',
    valueFrom: {
      fieldRef: {
        fieldPath: 'metadata.namespace',
      },
    },
  }, {
    name: 'KAFKA_HEAP_OPTS',
    value: '-Xms1024M -Xmx1024M -Djavax.net.ssl.trustStore=/etc/kafka/secrets/cacerts -Djavax.net.ssl.trustStorePassword=changeit',
  }, {
    name: 'KAFKA_LOG_DIRS',
    value: '/opt/kafka/data-0/logs',
  }, {
    name: 'KAFKA_DEFAULT_REPLICATION_FACTOR',
    value: '4',
  }, {
    name: 'KAFKA_LISTENER_NAME_EXTERNAL_SASL_ENABLED_MECHANISMS',
    value: 'PLAIN',
  }, {
    name: 'KAFKA_MIN_INSYNC_REPLICAS',
    value: '3',
  }, {
    name: 'KAFKA_OFFSETS_TOPIC_REPLICATION_FACTOR',
    value: '3',
  }, {
    name: 'KAFKA_ZOOKEEPER_SASL_CLIENT',
    value: 'false',
  }, {
    name: 'KAFKA_JMX_PORT',
    value: '5555',
  }],
  command: [
    'sh',
    '-exc',
    'export KAFKA_BROKER_ID=10${HOSTNAME##*-} && \\\nexport KAFKA_NODE_ID=${KAFKA_BROKER_ID} && \\\nexport KAFKA_BROKER_RACK=r${HOSTNAME##*-} && \\\nexport KAFKA_PROCESS_ROLES=controller && \\\n\nexport KAFKA_LISTENERSCONTROLLE://0.0..:9093 && \\\nexport KAFKA_CONTROLLER_LISTENER_NAMES=CONTROLLER && \\\nexport KAFKA_ADVERTISED_LISTENERSCONTROLLE://controller-${HOSTNAM##*-:9093 && \\\nexport KAFKA_LISTENER_SECURITY_PROTOCOL_MAPCONTROLLE:PLAINTEXT && \\\nexport KAFKA_CONTROLLER_QUORUM_VOTERS=100@controlle-:9093,101@controlle-:9093,102@controlle-:9093 && \\\nexec bash -c \'/tmp/controller/controller.sh && /etc/confluent/docker/run\'\n',
  ],
  volumeMounts: [{
    name: 'controller',
    mountPath: '/tmp/controller',
  }, {
    name: 'datadir-0',
    mountPath: '/opt/kafka/data-0',
  }, {
    name: 'ssl',
    mountPath: '/etc/kafka/secrets',
  }, {
    name: 'jaas-conf',
    mountPath: '/etc/kafka/jaas',
  }],
}