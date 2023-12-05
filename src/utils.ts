import {Input} from '@pulumi/pulumi'
import {core} from '@pulumi/kubernetes/types/input'
import EnvVar = core.v1.EnvVar

export function envFromFieldRef(name: string, fieldPath: string): EnvVar {
  return {
    name,
    valueFrom: {
      fieldRef: {
        fieldPath,
      },
    },
  }
}

export function envVar(name: string, value: string): EnvVar {
  return {
    name,
    value,
  }
}
export function appLabel(name: string): { app: string } {
  return formatLabel(name, 'app')
}

export function serviceLabel(name: string): { app: string } {
  return formatLabel(name, 'svc')
}

export function containerLabel(name: string): { app: string } {
  return formatLabel(name, 'container')
}

export function statefulsetLabel(name: string): { app: string } {
  return formatLabel(name, 'sts')
}

export function podLabel(name: string): { app: string } {
  return formatLabel(name, 'pod')
}

function formatLabel(name: string, suffix: string): { app: string } {
  return {app: `${name}-${suffix}`}
}

export function appSelector(name: string): {matchLabels: {app: string}} {
  return {matchLabels: {app: name}}
}

export function containerSelector(name: string): {matchLabels: {app: string}} {
  return {matchLabels: {app: name}}
}

export enum ApiVersion {  V1 = 'v1', APPS_V1 = 'apps/v1' , undefined = 'undefined'}
export enum Kind {  POD = 'Pod', STATEFULSET = 'StatefulSet' }

export function apiVersion(apiVersion: ApiVersion): {apiVersion: Input<string> | undefined } {
  return {apiVersion: apiVersion === ApiVersion.undefined ? undefined : apiVersion}
}

export function kind(kind: Kind): { kind: string } {
  return {kind}
}
