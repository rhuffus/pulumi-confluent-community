import {Input} from '@pulumi/pulumi'

export function serviceLabel(name: string): { app: string } {
  return formatLabel(name, 'svc')
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

export enum ApiVersion {  V1 = 'v1', APPS_V1 = 'apps/v1' , undefined = 'undefined'}
export enum Kind {  POD = 'Pod', STATEFULSET = 'StatefulSet' }

export function apiVersion(apiVersion: ApiVersion): {apiVersion: Input<string> | undefined } {
  return {apiVersion: apiVersion === ApiVersion.undefined ? undefined : apiVersion}
}

export function kind(kind: Kind): { kind: string } {
  return {kind}
}