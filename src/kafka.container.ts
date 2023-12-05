import Container = core.v1.Container
import * as pulumi from '@pulumi/pulumi'
import { core } from '@pulumi/kubernetes/types/input'
import EnvVar = core.v1.EnvVar
import { appLabel, appSelector, containerLabel, envVar } from './utils'
import VolumeMount = core.v1.VolumeMount
import * as kubernetes from '@pulumi/kubernetes'
import { createServices } from './broker.service'
import { Input } from '@pulumi/pulumi'

// Configurations
const kafkaConfig = new pulumi.Config('kafka')


export function kafka(namespace: kubernetes.core.v1.Namespace) {
  const ports: Array<core.v1.ContainerPort> = [{
    name: 'broker',
    containerPort: 9092,
  }, {
    name: 'controller',
    containerPort: 9093,
  }]

  const env: Array<EnvVar> = [
    envVar('KAFKA_CLUSTER_ID', 'SzHABYtJT8u_78AMLi52aw'),
    envVar('KAFKA_BROKER_ID', '10${HOSTNAME##*-}'),
    envVar('KAFKA_NODE_ID', '${KAFKA_BROKER_ID}'),
    envVar('KAFKA_BROKER_RACK', '${KAFKA_BROKER_ID}'),
    envVar('KAFKA_PROCESS_ROLES', 'broker,controller'),
    envVar('KAFKA_LISTENERS', 'BROKER://0.0.0.0:9092,CONTROLLER://0.0.0.0:9093'),
    envVar('KAFKA_LISTENER_SECURITY_PROTOCOL_MAP', 'BROKER:PLAINTEXT,CONTROLLER:PLAINTEXT'),
    envVar('KAFKA_INTER_BROKER_LISTENER_NAME', 'BROKER'),
    envVar('KAFKA_CONTROLLER_LISTENER_NAMES', 'CONTROLLER'),
    envVar('KAFKA_SECURITY_CONTROLLER_LISTENER_NAMES', 'CONTROLLER'),
    envVar('KAFKA_CONTROLLER_QUORUM_VOTERS', '100@broker-0:9093,101@broker-1:9093,102@broker-2:9093'),
    envVar('KAFKA_ADVERTISED_LISTENERS', 'BROKER://broker-${HOSTNAME##*-}:9092'),
    envVar('KAFKA_TOOLS_LOG4J_LOGLEVEL', 'INFO'),
    envVar('KAFKA_LOG4J_ROOT_LOGLEVEL', 'INFO'),
  ]

  const volumeMounts: Array<VolumeMount> = [
    {
      name: 'data',
      mountPath: '/var/lib/kafka/data',
    },
  ]

  const volumeClaimTemplates: Array<core.v1.PersistentVolumeClaim> = [{
    metadata: {
      name: 'data',
    },
    spec: {
      accessModes: ['ReadWriteOnce'],
      resources: {
        requests: {
          storage: '5Gi',
        },
      },
    },
  }]


  const kafkaContainer: Container = {
    name: 'kafka-container',
    image: kafkaConfig.require('image'),
    imagePullPolicy: 'IfNotPresent',
    securityContext: {
      runAsUser: 0,
    },
    ports,
    env,
    volumeMounts,
    command: [
      'sh',
      '-exc',
      `export CLUSTER_ID=SzHABYtJT8u_78AMLi52aw && \\
      export KAFKA_BROKER_ID=10\${HOSTNAME##*-} && \\
      export KAFKA_NODE_ID=\${KAFKA_BROKER_ID} && \\
      export KAFKA_BROKER_RACK=\${KAFKA_BROKER_ID} && \\
      export KAFKA_PROCESS_ROLES=broker,controller && \\
      export KAFKA_LISTENERS=BROKER://0.0.0.0:9092,CONTROLLER://0.0.0.0:9093 && \\
      export KAFKA_LISTENER_SECURITY_PROTOCOL_MAP=BROKER:PLAINTEXT,CONTROLLER:PLAINTEXT && \\
      export KAFKA_INTER_BROKER_LISTENER_NAME=BROKER && \\
      export KAFKA_CONTROLLER_LISTENER_NAMES=CONTROLLER && \\
      export KAFKA_SECURITY_CONTROLLER_LISTENER_NAMES=CONTROLLER && \\
      export KAFKA_CONTROLLER_QUORUM_VOTERS=100@kafka-0:9093,101@kafka-1:9093,102@kafka-2:9093 && \\
      export KAFKA_ADVERTISED_LISTENERS=BROKER://kafka-\${HOSTNAME##*-}:9092 && \\
      export KAFKA_TOOLS_LOG4J_LOGLEVEL=DEBUG && \\
      export KAFKA_LOG4J_ROOT_LOGLEVEL=DEBUG && \\
      exec bash -c /etc/confluent/docker/run`
    ],
  }


  const kafkaStatefulSet = new kubernetes.apps.v1.StatefulSet('kafka', {
    metadata: {
      name: 'kafka',
      namespace: namespace.metadata.name,
      labels: appLabel('kafka-sts'),
    },
    spec: {
      serviceName: 'kafka',
      replicas: kafkaConfig.requireNumber('replicas'),
      selector: {
        matchLabels: {
          app: 'kafka-container',
        },
      },
      template: {
        metadata: {
          labels: {
            app: 'kafka-container',
          },
        },
        spec: {
          containers: [kafkaContainer],
          volumes: [],
        },
      },
      volumeClaimTemplates,
    },
  })

  const servicePorts = [
    {
      name: 'broker',
      port: 9092,
      targetPort: 9092,
      protocol: 'TCP',
    },
    {
      name: 'controller',
      port: 9093,
      targetPort: 9093,
      protocol: 'TCP',
    },
  ]

  const kafkaServices = createServices(kafkaConfig.requireNumber('replicas'), 'kafka', 'kafka-container', servicePorts)

}

