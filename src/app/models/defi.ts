import { Transform, Type } from 'class-transformer';

export type EventType = 'block' | 'sync' | 'swap';

export class NetworkInfo {
  constructor(
    public name: string,
    public currencySymbol: string) { }
}

export class TokenInfo {
  @Type(() => NetworkInfo)
  public network: NetworkInfo;

  constructor(
    network: NetworkInfo,
    public address: string,
    public name: string,
    public symbol: string,
    public decimals: number,
    public usdPrice: number,
    public pools: Map<string, boolean>) {
      this.network = network;
    }
}

export class PairInfo {
  @Type(() => TokenInfo)
  public lpToken: TokenInfo;

  @Type(() => TokenInfo)
  public token0: TokenInfo;

  @Type(() => TokenInfo)
  public token1: TokenInfo;

  constructor(
    public address: string,
    public ticker: string,
    lpToken: TokenInfo,
    token0: TokenInfo,
    token1: TokenInfo,
    public reserve0: number,
    public reserve1: number,
    public poolAddress: string,
    public tokenPrice?: number) {
      this.lpToken = lpToken;
      this.token0 = token0;
      this.token1 = token1;
    }

  getLiquidity(priceUsdt: number, tokenWhitelists: TokenWhitelists): number {
    let liquidity0 = 0.0;
    let liquidity1 = 0.0;

    const currencySymbol = this.lpToken.network.currencySymbol;
    const wrappedWhitelist = tokenWhitelists.get(currencySymbol)?.wrapped;
    const usdWhitelist = tokenWhitelists.get(currencySymbol)?.usd;

    if (wrappedWhitelist?.get(this.token0.address) === true) {
      liquidity0 += this.reserve0 * priceUsdt;
    } else if (usdWhitelist?.get(this.token0.address) === true) {
      liquidity0 += this.reserve0;
    }

    if (wrappedWhitelist?.get(this.token1.address) === true) {
      liquidity1 += this.reserve1 * priceUsdt;
    } else if (usdWhitelist?.get(this.token1.address) === true) {
      liquidity1 += this.reserve1;
    }

    if (liquidity0 === 0 && liquidity1 > 0) {
      return liquidity1 * 2.0;
    } else if (liquidity1 === 0 && liquidity0 > 0) {
      return liquidity0 * 2.0;
    } else {
      return liquidity0 + liquidity1;
    }
  }
}

export class CommonHeaders {
  constructor(
    public id: string,
    public timestamp: number,
    public blockNumber: number,
    public logIndex: number,
    public txIndex: number,
    public txHash: string,
    public pairInfo: PairInfo) { }
}

export type SwapSide = 'buy' | 'sell';

export class SwapData extends CommonHeaders {
  constructor(
    public id: string,
    public timestamp: number,
    public blockNumber: number,
    public logIndex: number,
    public txIndex: number,
    public txHash: string,
    public pairInfo: PairInfo,
    public side: SwapSide,
    public amount: number,
    public price: number) {
    super(id, timestamp, blockNumber, logIndex, txIndex, txHash, pairInfo);
  }
}

export class SyncData extends CommonHeaders {
  constructor(
    public id: string,
    public timestamp: number,
    public blockNumber: number,
    public logIndex: number,
    public txIndex: number,
    public txHash: string,
    public pairInfo: PairInfo,
    public reserve0: number,
    public reserve1: number) {
    super(id, timestamp, blockNumber, logIndex, txIndex, txHash, pairInfo);
  }
}

export class Count {
  constructor(
    public ts: Date,
    public total: number) { }
}

export class Link {
  constructor(
    public title: string,
    public href: string,
    public icon: 'web' | 'twitter' | 'chart' | 'fee' | 'snapshot' | 'coingecko' = 'web') { }

  get faIcon(): any {
    switch (this.icon) {
      case 'twitter':
        return ['fab', 'twitter'];
      case 'chart':
        return ['fas', 'chart-line'];
      case 'fee':
        return ['fas', 'dollar-sign'];
      case 'snapshot':
        return ['fas', 'database'];
      default:
        return ['fas', 'globe'];
    }
  }
}

export class PairStat {
  @Type(() => PairInfo)
  public pairInfo: PairInfo;

  @Type(() => Link)
  public links: Array<Link>;

  @Transform(({ value }) => value ?? [])
  public tags: Array<string>;

  constructor(
    public ts: Date,
    public swapCount: Count,
    public syncCount: Count,
    public price: number,
    public liquidity: number,
    pairInfo: PairInfo,
    links: Array<Link>,
    tags: Array<string>,
    public aprDay: number,
    public aprYear: number,
    ) {
    this.pairInfo = pairInfo;
    this.links = links;
    this.tags = tags;
  }

  static fromJsonString(jsonString: string): PairStat {
    const obj = JSON.parse(jsonString);
    return new PairStat(obj.ts, obj.swapCount, obj.syncCount, obj.price, obj.liquidity, obj.pairInfo, obj.links, obj.tags, obj.aprDay, obj.aprYear);
  }

  updateLiquidity(rate: number, tokenWhitelists: TokenWhitelists): void {
    this.liquidity = this.pairInfo.getLiquidity(rate, tokenWhitelists);
  }

  hasTag(tag: string): boolean {
    return this.tags.indexOf(tag) !== -1;
  }

  addTag(tag: string): void {
    const index = this.tags.indexOf(tag);

    if (index === -1) {
      this.tags.push(tag);
    }
  }

  removeTag(tag: string): void {
    const index = this.tags.indexOf(tag);

    if (index !== -1) {
      this.tags.splice(index, 1);
    }
  }
}

export class PairStatListRequest {
  constructor(
    public pairAddresses: Array<string>,
    public excludedPairAddresses: Array<string>) { }
}

export class BlockInfo {
  constructor(
    public networkName: string,
    public blockNumber: number,
    public updatedPairs: Array<string>) { }
}

export class ApiResponse {
  constructor(
    public ok: boolean,
    public errorMessage: string) { }
}

export class ApiCountResponse extends ApiResponse {
  constructor(
    ok: boolean,
    errorMessage: string,
    public totalCount: number,
    public newCount: number) {
    super(ok, errorMessage);
  }
}

export class ApiListResponse<T> extends ApiResponse {
  constructor(
    ok: boolean,
    errorMessage: string,
    public list: T[],
    public pageable?: Pageable) {
    super(ok, errorMessage);
  }
}

export class ApiItemResponse<T> {
  result: T;
}

export class Pageable {
  page: number;
  size: number;
  total?: number;

  constructor(page: number, size: number) {
    this.page = page;
    this.size = size;
  }
}

export class PairListInfo {
  constructor(
    public id: string,
    public name: string,
    public pairCount: number,
    public position: number,
    public isFeatured: boolean,
    public isSystem = false) { }

  static fromJsonString(jsonString: string): PairListInfo {
    const obj = JSON.parse(jsonString);
    return new PairListInfo(obj.id, obj.name, +obj.pairCount, obj.position, obj.isFeatured);
  }

  toJsonString(): string {
    return JSON.stringify(this);
  }
}

export class PairList {
  constructor(
    public id: string,
    public name: string,
    public groupName: string,
    public position: number,
    public active: boolean,
    public isFeatured: boolean,
    public count: number) {
  }

  get info(): PairListInfo {
    return new PairListInfo(this.id, this.name, this.count, this.position, this.isFeatured);
  }
}

export class PairListCreateRequest {
  constructor(
    public name: string,
    public groupName: string,
    public position: number,
    public isFeatured: boolean) {
  }
}

export class PairListUpdateRequest {
  constructor(
    public name: string,
    public groupName: string,
    public position: number,
    public active: boolean,
    public isFeatured: boolean) {
  }
}

export class ApiPairListResponse extends ApiResponse {
  constructor(
    ok: boolean,
    errorMessage: string,
    public list: PairList) {
    super(ok, errorMessage);
  }
}

export class ApiPairListsResponse extends ApiResponse {
  constructor(
    ok: boolean,
    errorMessage: string,
    public lists: Array<PairList>) {
    super(ok, errorMessage);
  }
}

export class TokenWhitelist {
  constructor(
    public wrapped: Map<string, boolean>,
    public usd: Map<string, boolean>) {}
}

export type TokenWhitelists = Map<string, TokenWhitelist>;

export class TokenWhitelistsResponse extends ApiResponse {
  constructor(
    ok: boolean,
    errorMessage: string,
    public lists: TokenWhitelists) {
    super(ok, errorMessage);
  }
}
