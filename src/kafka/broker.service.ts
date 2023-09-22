import {Service} from '@pulumi/kubernetes/core/v1'
import {core} from '@pulumi/kubernetes/types/input'
import ServicePort = core.v1.ServicePort


function createService(name: string, selectorApp: string, ports: Array<ServicePort>): Service {

  return new Service(
    name,
    {
      metadata: {
        name,
        labels: {
          app: `${name}-svc`,
        },
      },
      spec: {
        ports,
        selector: {
          app: selectorApp,
        },
      },
    })
}

function crateServices(numberOfServices: number, name: string, selectorApp: string, ports: Array<ServicePort>): Array<Service> {
  let services = new Array<Service>()

  for (let i = 0; i < numberOfServices; i++) {
    services.push(createService(formatServiceName(name, numberOfServices), selectorApp, ports))
  }

  return services
}

function formatServiceName(name: string, id: number): string {
  return `${name}-${id}`
}