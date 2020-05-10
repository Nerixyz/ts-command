import { Class } from './types';
import { getMetadata, hasMetadata, MetadataKey } from './decorators';
import { ServiceInfo } from './CommandContainer';
import * as assert from 'assert';

export function injectServices<T>(target: Class<T>, services: ServiceInfo<any>[]): T {
  if (target.length && Reflect && Reflect.getMetadata) {
    const meta: Class[] = Reflect.getMetadata('design:paramtypes', target);
    assert(
      meta,
      `${target.name} does not have any 'paramtypes' metadata. Are you missing the @Injectable() or @Service() decorator?`,
    );
    const params = meta.map(t => {
      let service: ServiceInfo<any> | undefined = services.find(s => s.type === t);
      if (!service) {
        if (hasMetadata(t, MetadataKey.ServiceId)) {
          const meta = getMetadata<string>(t, MetadataKey.ServiceId);
          service = services.find(s => s.serviceId === meta);
        }
        if (!service) {
          // check if it's a service that's not yet in the services
          if (hasMetadata(t, MetadataKey.ServiceId) && hasMetadata(t, MetadataKey.Filename)) {
            service = {
              type: t,
              value: injectServices(t, services),
              dependents: [getMetadata(target, MetadataKey.Filename)],
              serviceId: getMetadata(t, MetadataKey.ServiceId),
              filename: getMetadata(t, MetadataKey.Filename),
              forceCompute: false,
              invalid: false,
            };
          } else if (t.length === 0) {
            const value = new t();
            services.push({
              type: t,
              value,
              dependents: hasMetadata(target, MetadataKey.Filename) ? [getMetadata(target, MetadataKey.Filename)] : [],
              serviceId: null,
              filename: null,
              forceCompute: false,
              invalid: false,
              // no serviceId and filename
            });
            return value;
          } else {
            // pre add service
            services.push({
              type: t,
              value: undefined,
              dependents: hasMetadata(target, MetadataKey.Filename) ? [getMetadata(target, MetadataKey.Filename)] : [],
              invalid: true,
              forceCompute: false,
              filename: null,
              serviceId: null,
            });
            return undefined;
          }
        }
      }
      if (
        hasMetadata(target, MetadataKey.Filename) &&
        !service.dependents.includes(getMetadata(target, MetadataKey.Filename))
      ) {
        // it's a command constructor
        service.dependents.push(getMetadata(target, MetadataKey.Filename));
      }
      if (service.invalid) {
        return undefined;
      }
      if (service.value) return service.value;

      const instance = injectServices(service.type, services);
      if (!service.forceCompute) service.value = instance;

      return instance;
    });
    return new target(...params);
  } else {
    return new target();
  }
}
