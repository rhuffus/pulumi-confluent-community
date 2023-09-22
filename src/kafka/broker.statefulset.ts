import {StatefulSetArgs} from '@pulumi/kubernetes/apps/v1/statefulSet'
import {StatefulSet} from '@pulumi/kubernetes/apps/v1'
import {core} from '@pulumi/kubernetes/types/input'
import {Namespace, PersistentVolumeClaim} from '@pulumi/kubernetes/core/v1'
import Container = core.v1.Container
import ContainerPort = core.v1.ContainerPort
import PodTemplateSpec = core.v1.PodTemplateSpec

export function createContainer(
  name: string,
  image: string,
  ports: Array<ContainerPort> = [],
): Container {
  return {
    name,
    image,
    ports,
  }
}

function appLabel(name: string): { app: string } {
  return {app: name}
}


export function createPodTemplateSpec(
  name: string,
  namespace: Namespace,
  containers: Container[],
): PodTemplateSpec {
  const podTemplateSpecArgs: PodTemplateSpec = {
    metadata: {
      name,
      labels: {
        ...appLabel(name),
      },
      namespace: namespace.metadata.name,
    },
    spec: {
      containers,
      volumes: [{
        name: 'broker-workaround-cm',
        configMap: {
          name: 'broker-workaround-cm',
        },
      }, {
        name: 'jaas-conf-sc',
        secret: {
          secretName: 'jaas-config-sc',
        },
      }, {
        name: 'ssl-sc',
        secret: {
          secretName: 'ssl-sc',
        },
      }, {
        name: 'jmx-config-cm',
        configMap: {
          name: 'jmx-config-cm',
        },
      }],
    },
  }

  // Create volumes from volumeMounts in containers
  // If the volumeMount name ends with '-cm' it will be a configMap
  // If the  volumeMount name ends with '-sc' it will be a secret
  // for (const container of containers) {
  //   const volumeMounts = await container.volumeMounts
  //   if (volumeMounts && Array.isArray(volumeMounts)) {
  //     for (const volumeMount of volumeMounts) {
  //       if ('name' in volumeMount) {
  //         const volumeName = volumeMount.name
  //         if (volumeName.endsWith('-cm')) {
  //           podTemplateSpecArgs.spec.volumes.push({
  //             name: volumeName,
  //             configMap: {
  //               name: volumeName,
  //             },
  //           })
  //         } else if (volumeName.endsWith('-sc')) {
  //           podTemplateSpecArgs.spec.volumes.push({
  //             name: volumeName,
  //             secret: {
  //               secretName: volumeName,
  //             },
  //           })
  //         }
  //
  //       }
  //
  //     }
  //   }
  // }

  return podTemplateSpecArgs
}

// volumes:
//   - name: broker
// configMap:
//   name: broker
// defaultMode: 0777
// - name: jaas-conf
// secret:
//   secretName: jaas-config-secret
//   - name: ssl
// secret:
//   secretName: kafkacom-cluster-secret
//   - name: jmx-config
// configMap:
//   name: release-name-cp-kafka-jmx-configmap

export function createStatefulset(
  name: string,
  namespace: Namespace,
  template: PodTemplateSpec,
  replicas: number = 2,
  volumeClaimTemplates: Array<PersistentVolumeClaim> = [],
): StatefulSet {
  const statefulsetArgs: StatefulSetArgs = {
    apiVersion: 'apps/v1',
    kind: 'StatefulSet',
    metadata: {
      name,
      namespace: namespace.metadata.name,
      labels: {
        ...appLabel(name),
      },
    },
    spec: {
      serviceName: name,
      replicas,
      podManagementPolicy: 'Parallel',
      selector: {
        matchLabels: {
          app: name,
        },
      },
      template,
      volumeClaimTemplates,
    },
  }

  return new StatefulSet(
    name,
    statefulsetArgs,
  )
}