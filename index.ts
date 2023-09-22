import {createPodTemplateSpec, createStatefulset} from './src/kafka/broker.statefulset'
import {ConfigMap, Namespace} from '@pulumi/kubernetes/core/v1'
import {core} from '@pulumi/kubernetes/types/input'
import PodTemplateSpec = core.v1.PodTemplateSpec
import EnvVar = core.v1.EnvVar
import Container = core.v1.Container
import * as fs from 'fs'

const confluentNamespace = new Namespace('confluent', {metadata: {name: 'confluent'}})

function envFromFieldRef(name: string, fieldPath: string): EnvVar {
  return {
    name,
    valueFrom: {
      fieldRef: {
        fieldPath,
      },
    },
  }
}

function envVar(name: string, value: string): EnvVar {
  return {
    name,
    value,
  }
}

const brokerWorkaroundConfigMap = new ConfigMap('broker-workaround', {
  metadata: {
    name: 'broker-workaround-cm',
    namespace: confluentNamespace.metadata.name,
  },
  data: {
    'broker-workaround.sh': fs.readFileSync('src/kafka/broker_workaround.sh').toString(),
  },
})

const kafkaContainer: Container = {
  name: 'kafka',
  image: 'confluentinc/cp-server:7.5.0',
  ports: [{
    name: 'internal',
    containerPort: 9092,
  }, {
    name: 'external',
    containerPort: 443,
  }],
  env: [
    envFromFieldRef('POD_NAME', 'metadata.name'),
    envFromFieldRef('POD_NAMESPACE', 'metadata.namespace'),
    envFromFieldRef('POD_IP', 'status.podIP'),
    envFromFieldRef('HOST_IP', 'status.hostIP'),
    envVar('KAFKA_OPTS', '-Djava.security.auth.login.config=/etc/kafka/jaas/kafka_server_jaas.conf'),
    envVar('KAFKA_BROKER_ID', '20${HOSTNAME##*-}'),
    envVar('KAFKA_NODE_ID', '${KAFKA_BROKER_ID}'),
    envVar('KAFKA_BROKER_RACK', 'r${HOSTNAME##*-}'),
    envVar('KAFKA_PROCESS_ROLES', 'broker'),
    envVar('KAFKA_LISTENERS', 'BROKER://0.0.0.0:9092,EXTERNAL://0.0.0.0:443'),
    envVar('KAFKA_LISTENER_SECURITY_PROTOCOL_MAP', 'BROKER:PLAINTEXT,EXTERNAL:PLAINTEXT,CONTROLLER:PLAINTEXT'),
    envVar('KAFKA_INTER_BROKER_LISTENER_NAME', 'BROKER'),
    envVar('KAFKA_CONTROLLER_LISTENER_NAMES', 'CONTROLLER'),
    envVar('KAFKA_SECURITY_CONTROLLER_LISTENER_NAMES', 'CONTROLLER'),
    envVar('KAFKA_CONTROLLER_QUORUM_VOTERS', '100@controller-0:9093,101@controller-1:9093,102@controller-2:9093'),
    envVar('KAFKA_ADVERTISED_LISTENERS', 'BROKER://broker-${HOSTNAME##*-}.broker.kafkacom.svc.cluster.local:9092,EXTERNAL://b${HOSTNAME##*-}.kafkacommunity.pre.rib.mercadona.es:443'),
  ],
  volumeMounts: [{
    name: 'broker-workaround-cm',
    mountPath: '/tmp/broker-workaround',
  }, {
    name: 'jaas-conf-sc',
    mountPath: '/etc/kafka/jaas',
  }, {
    name: 'ssl-sc',
    mountPath: '/etc/kafka/secrets',
  }, {
    name: 'jmx-config-cm',
    mountPath: '/etc/kafka/jmx',
  }],
  command: [
    'sh',
    '-c',
    'exec /tmp/broker-workaround/broker-workaround.sh && /etc/confluent/docker/run',
  ],
}

const kafkaPod: PodTemplateSpec = createPodTemplateSpec('kafka', confluentNamespace, [kafkaContainer])

const kafkaStatefulset = createStatefulset('kafka', confluentNamespace, kafkaPod)

// const appLabels = { app: "nginx" };
// const deployment = new k8s.apps.v1.Deployment("nginx", {
//     spec: {
//         selector: { matchLabels: appLabels },
//         replicas: 1,
//         template: {
//             metadata: { labels: appLabels },
//             spec: { containers: [{ name: "nginx", image: "nginx" }] }
//         }
//     }
// });
// export const name = deployment.metadata.name;
