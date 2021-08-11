import {
  TwirpContext,
  TwirpServer,
  RouterEvents,
  TwirpError,
  TwirpErrorCode,
  Interceptor,
  TwirpContentType,
  chainInterceptors,
} from "twirp-ts";
import { GetServiceARequest, GetServiceAResponse } from "./service";

//==================================//
//          Client Code             //
//==================================//

interface Rpc {
  request(
    service: string,
    method: string,
    contentType: "application/json" | "application/protobuf",
    data: object | Uint8Array
  ): Promise<object | Uint8Array>;
}

export interface AServiceClient {
  CallServiceA(request: GetServiceARequest): Promise<GetServiceAResponse>;
}

export class AServiceClientJSON implements AServiceClient {
  private readonly rpc: Rpc;
  constructor(rpc: Rpc) {
    this.rpc = rpc;
    this.CallServiceA.bind(this);
  }
  CallServiceA(request: GetServiceARequest): Promise<GetServiceAResponse> {
    const data = GetServiceARequest.toJSON(request);
    const promise = this.rpc.request(
      "srva.protos.AService",
      "CallServiceA",
      "application/json",
      data as object
    );
    return promise.then((data) => GetServiceAResponse.fromJSON(data as any));
  }
}

export class AServiceClientProtobuf implements AServiceClient {
  private readonly rpc: Rpc;
  constructor(rpc: Rpc) {
    this.rpc = rpc;
    this.CallServiceA.bind(this);
  }
  CallServiceA(request: GetServiceARequest): Promise<GetServiceAResponse> {
    const data = GetServiceARequest.encode(request).finish();
    const promise = this.rpc.request(
      "srva.protos.AService",
      "CallServiceA",
      "application/protobuf",
      data
    );
    return promise.then((data) =>
      GetServiceAResponse.decode(data as Uint8Array)
    );
  }
}

//==================================//
//          Server Code             //
//==================================//

export interface AServiceTwirp<T extends TwirpContext = TwirpContext> {
  CallServiceA(
    ctx: T,
    request: GetServiceARequest
  ): Promise<GetServiceAResponse>;
}

export enum AServiceMethod {
  CallServiceA = "CallServiceA",
}

export const AServiceMethodList = [AServiceMethod.CallServiceA];

export function createAServiceServer<T extends TwirpContext = TwirpContext>(
  service: AServiceTwirp<T>
) {
  return new TwirpServer<AServiceTwirp, T>({
    service,
    packageName: "srva.protos",
    serviceName: "AService",
    methodList: AServiceMethodList,
    matchRoute: matchAServiceRoute,
  });
}

function matchAServiceRoute<T extends TwirpContext = TwirpContext>(
  method: string,
  events: RouterEvents<T>
) {
  switch (method) {
    case "CallServiceA":
      return async (
        ctx: T,
        service: AServiceTwirp,
        data: Buffer,
        interceptors?: Interceptor<T, GetServiceARequest, GetServiceAResponse>[]
      ) => {
        ctx = { ...ctx, methodName: "CallServiceA" };
        await events.onMatch(ctx);
        return handleCallServiceARequest(ctx, service, data, interceptors);
      };
    default:
      events.onNotFound();
      const msg = `no handler found`;
      throw new TwirpError(TwirpErrorCode.BadRoute, msg);
  }
}

function handleCallServiceARequest<T extends TwirpContext = TwirpContext>(
  ctx: T,
  service: AServiceTwirp,
  data: Buffer,
  interceptors?: Interceptor<T, GetServiceARequest, GetServiceAResponse>[]
): Promise<string | Uint8Array> {
  switch (ctx.contentType) {
    case TwirpContentType.JSON:
      return handleCallServiceAJSON<T>(ctx, service, data, interceptors);
    case TwirpContentType.Protobuf:
      return handleCallServiceAProtobuf<T>(ctx, service, data, interceptors);
    default:
      const msg = "unexpected Content-Type";
      throw new TwirpError(TwirpErrorCode.BadRoute, msg);
  }
}
async function handleCallServiceAJSON<T extends TwirpContext = TwirpContext>(
  ctx: T,
  service: AServiceTwirp,
  data: Buffer,
  interceptors?: Interceptor<T, GetServiceARequest, GetServiceAResponse>[]
) {
  let request: GetServiceARequest;
  let response: GetServiceAResponse;

  try {
    const body = JSON.parse(data.toString() || "{}");
    request = GetServiceARequest.fromJSON(body);
  } catch (e) {
    const msg = "the json request could not be decoded";
    throw new TwirpError(TwirpErrorCode.Malformed, msg).withCause(e, true);
  }

  if (interceptors && interceptors.length > 0) {
    const interceptor = chainInterceptors(...interceptors) as Interceptor<
      T,
      GetServiceARequest,
      GetServiceAResponse
    >;
    response = await interceptor(ctx, request, (ctx, inputReq) => {
      return service.CallServiceA(ctx, inputReq);
    });
  } else {
    response = await service.CallServiceA(ctx, request);
  }

  return JSON.stringify(GetServiceAResponse.toJSON(response) as string);
}
async function handleCallServiceAProtobuf<
  T extends TwirpContext = TwirpContext
>(
  ctx: T,
  service: AServiceTwirp,
  data: Buffer,
  interceptors?: Interceptor<T, GetServiceARequest, GetServiceAResponse>[]
) {
  let request: GetServiceARequest;
  let response: GetServiceAResponse;

  try {
    request = GetServiceARequest.decode(data);
  } catch (e) {
    const msg = "the protobuf request could not be decoded";
    throw new TwirpError(TwirpErrorCode.Malformed, msg).withCause(e, true);
  }

  if (interceptors && interceptors.length > 0) {
    const interceptor = chainInterceptors(...interceptors) as Interceptor<
      T,
      GetServiceARequest,
      GetServiceAResponse
    >;
    response = await interceptor(ctx, request, (ctx, inputReq) => {
      return service.CallServiceA(ctx, inputReq);
    });
  } else {
    response = await service.CallServiceA(ctx, request);
  }

  return Buffer.from(GetServiceAResponse.encode(response).finish());
}
