import * as pulumi from '@pulumi/pulumi';
import * as kubernetes from '@pulumi/kubernetes';
import {core} from '@pulumi/kubernetes/types/input'
import { kafka } from './src/kafka.container'

const kubernetesConfig = new pulumi.Config('kubernetes');
const namespaceName = kubernetesConfig.require('namespace')

// Configurations
const kafkaConfig = new pulumi.Config('kafka')

const namespace = new kubernetes.core.v1.Namespace('namespace', {metadata: {name: namespaceName}})

const kafkaCluster = kafka(namespace)





