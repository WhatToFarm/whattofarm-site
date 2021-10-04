import { DecimalPipe } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { plainToClass } from 'class-transformer';
import { LoginComponent } from 'src/app/components/login/login.component';
import { BlockInfo, Link, NetworkInfo, Pageable, PairList, PairListInfo, PairStat, TokenWhitelist, TokenWhitelists } from 'src/app/models/defi';
import { ThousandSuffixPipe } from 'src/app/pipes/thousand-suffix';
import { AuthService } from 'src/app/services/auth.service';
import { DefiService } from 'src/app/services/defi.service';
import { WebsocketService } from 'src/app/websocket/websocket.service';

@Component({
  selector: 'app-new-app',
  templateUrl: './new-app.component.html',
  styleUrls: ['./new-app.component.scss']
})
export class NewAppComponent implements OnInit {
  query = '';
  network = '';
  networks = new Array<NetworkInfo>();
  pricesUsd = new Map<string, number>();
  priceDiffs = new Map<string, number>();
  groupNames: Array<string> = [];
  customGroupNames: Array<string> = ['USD', 'Coins&Tokens', 'DeFi', 'MEME Tokens', 'CeFi', 'Unknown'];
  groupNamesOptions = {};
  currentBlockBsc = 0;
  currentBlockEth = 0;
  currentBlockMatic = 0;

  pairLists = Array<PairListInfo>();
  pairFeaturedList = Array<PairListInfo>();
  allPairList = Array<PairList>();
  pairListMap = new Map<string, Set<string>>(); // pairListId -> pairAddress -> inList?
  activePairListId = '';

  assignedPairs = new Set<string>();
  listsChanged = false;

  tokenWhitelists: TokenWhitelists = new Map<string, TokenWhitelist>();

  totalCount = 0;
  perPage = 100;
  pagination = new Pageable(0, this.perPage);
  sortField = '';
  sortDirection = 'desc';
  filterBtn = false;
  searchTicker = '';

  transactionPeriod = [
    { name: 'All', name_alt: 'All', value: '' },
    { name: '5 min', name_alt: '5m', value: 'm5' },
    { name: '30 min', name_alt: '30m', value: 'm30' },
    { name: '1 hr', name_alt: '1h', value: 'h1' },
    { name: '24 hrs', name_alt: '24h', value: 'h24' },
  ];
  liquidityRanges = [
    { name: 'All', value: 'all', minRange: '', maxRange: '' },
    { name: '$1mln +', value: '1000000', minRange: '1000000', maxRange: '' },
    { name: '$300k – $1mln', value: '300000', minRange: '300000', maxRange: '1000000' },
    { name: '$150k – $300k', value: '150000', minRange: '150000', maxRange: '300000' },
    { name: '$30k – $150k', value: '30000', minRange: '30000', maxRange: '150000' },
    { name: 'No Liquidity (0 – $30k)', value: '0', minRange: '', maxRange: '30000' },
  ];
  liquidityDelta = [
    { name: 'All', value: '' },
    { name: '4h', value: 'h4' },
    { name: '1d', value: 'h24' },
    { name: '1w', value: 'w1' }
  ];

  links: Array<Link> = [];

  _period = '';
  get period(): string {
    return this._period;
  }
  set period(newPeriod: string) {
    this._period = newPeriod;

    if (this.sortField) {
      this.router.navigate(['/'], { queryParams: { period: this._period, sortField: this.sortField }, queryParamsHandling: 'merge' });
    } else {
      this.router.navigate(['/'], { queryParams: { period: undefined, sortField: undefined }, queryParamsHandling: 'merge' });
    }
  }

  _minLiquidity = '';
  get minLiquidity(): string {
    return this._minLiquidity;
  }
  set minLiquidity(newMinLiquidity: string) {
    this._minLiquidity = newMinLiquidity;
  }

  _maxLiquidity = '';
  get maxLiquidity(): string {
    return this._maxLiquidity;
  }
  set maxLiquidity(newMinLiquidity: string) {
    this._maxLiquidity = newMinLiquidity;
  }

  pairOrder: Array<string> = [];
  pairStats: Map<string, PairStat> = new Map<string, PairStat>();

  get pairs(): PairStat[] {
    const pairs: PairStat[] = [];

    for (const pairAddress of this.pairOrder) {
      const pairStat = this.pairStats.get(pairAddress);

      if (pairStat) {
        pairs.push(pairStat);
      }
    }

    return pairs;
  }

  setLiquidityRange(min: string, max: string): void {
    if (this.minLiquidity === min && this.maxLiquidity === max) {
      this.minLiquidity = '';
      this.maxLiquidity = '';
    } else {
      this.minLiquidity = min;
      this.maxLiquidity = max;
    }
    this.router.navigate(['/'], {
      queryParams: {
        maxLiquidity: this.maxLiquidity || undefined,
        minLiquidity: this.minLiquidity || undefined
      },
      queryParamsHandling: 'merge'
    });
  }

  setPeriod(period: string, sortField: 'liquidity' | 'txs'): void {
    this.sortField = period ? sortField : '';
    this.period = period;
  }

  get authToken(): string {
    return this.authService.token;
  }

  get isAdmin(): boolean {
    return this.authService.isAdmin;
  }

  // get activePairListMap(): Map<string, boolean> | undefined {
  //   return this.pairListMap.get(this.activePairListId);
  // }

  get assignedPairCount(): number {
    return this.assignedPairs.size;
  }

  get unassignedPairCount(): number {
    return this.totalCount - this.assignedPairs.size;
  }

  getScanLink(pairStat: PairStat): string {
    switch (pairStat.pairInfo.lpToken.network.name) {
      case 'bsc':
        return 'https://bscscan.com/address/' + pairStat.pairInfo.address;
      case 'eth':
        return 'https://etherscan.io/address/' + pairStat.pairInfo.address;
      case 'matic':
        return 'https://polygonscan.com/address/' + pairStat.pairInfo.address;
      default:
        return '';
    }
  }

  constructor(
    private authService: AuthService,
    public thousandSuffixPipe: ThousandSuffixPipe,
    public decimalPipe: DecimalPipe,
    public route: ActivatedRoute,
    public wsService: WebsocketService,
    public defiService: DefiService,
    public router: Router,
    private modalService: NgbModal) {
    this.networks.push(
      new NetworkInfo('bsc', 'BNB'),
      new NetworkInfo('eth', 'ETH'),
      new NetworkInfo('matic', 'MATIC')
    );
    this.pricesUsd.set('BNB', 0.0);
    this.priceDiffs.set('BNB', 0.0);
    this.pricesUsd.set('ETH', 0.0);
    this.priceDiffs.set('ETH', 0.0);
    this.pricesUsd.set('MATIC', 0.0);
    this.priceDiffs.set('MATIC', 0.0);

    this.loadTokenWhitelists();
    this.loadPairLists();
  }

  ngOnInit(): void {
    this.defiService.getPairCount().subscribe(res => {
      if (res.ok) {
        this.totalCount = res.totalCount;
        if (this.pairLists[0]) {
          this.pairLists[0].pairCount = res.totalCount;
          this.pairLists[1].pairCount = res.newCount;
        }
      }
    });

    this.route.queryParams.subscribe(params => {
      this.query = params.q;
      this.network = params.network;
      this.activePairListId = params.list ?? '';
      this.pagination.page = +(params.page ?? '1');
      this.sortField = params.sortField ?? '';
      this.sortDirection = params.sortDirection;
      this.searchTicker = params.q ?? '';
      this.minLiquidity = params.minLiquidity ?? '';
      this.maxLiquidity = params.maxLiquidity ?? '';
      this.period = params.period;

      const pairAddresses: Array<string> = [];
      let excludedPairAddresses: Array<string> = [];

      if (this.activePairListId === 'unassigned') {
        excludedPairAddresses = [...this.assignedPairs.values()];
      } else if (this.activePairListId !== '') {
        excludedPairAddresses = [];
        // pairAddresses = [...this.pairListMap.get(
        //   this.activePairListId)?.pairs?.values() ?? []];
      }

      this.defiService.getPairStatList(
        this.query,
        this.network,
        pairAddresses,
        excludedPairAddresses,
        this.pagination.page,
        this.perPage,
        this.sortField,
        this.sortDirection,
        this.period,
        this.minLiquidity,
        this.maxLiquidity,
        this.activePairListId).subscribe(res => {
        if (res?.ok) {
          const pagination = plainToClass(Pageable, res.pageable);
          if (this.pagination.page !== pagination.page) {
            this.pagination.page = pagination.page;
          }
          this.pagination.total = pagination.total;
          const pairStats: Array<PairStat> = plainToClass(PairStat, res.list);

          this.pairOrder = new Array<string>();
          this.pairStats.clear();

          for (const pairStat of pairStats) {
            this.pairOrder.push(pairStat.pairInfo.address);
            this.pairStats.set(pairStat.pairInfo.address, pairStat);
          }

          // this.updateUnassignedCount();
        }
      });
    });

    this.wsService.on<BlockInfo>('block').subscribe(blockInfo => {
      switch (blockInfo.networkName) {
        case 'bsc':
          this.currentBlockBsc = blockInfo.blockNumber;
          break;
        case 'eth':
          this.currentBlockEth = blockInfo.blockNumber;
          break;
        case 'matic':
          this.currentBlockMatic = blockInfo.blockNumber;
          break;
      }

      this.defiService.getPairCount().subscribe(res => {
        if (res.ok) {
          this.totalCount = res.totalCount;
          this.pairLists[0].pairCount = res.totalCount;
          this.pairLists[1].pairCount = res.newCount;
        }
      });

      const currentPagePairs = new Set<string>(this.pairOrder);

      const pairsToUpdate = this.activePairListId ?
        new Set<string>(blockInfo.updatedPairs.filter(p =>
          currentPagePairs.has(p) && this.pairListMap.get(this.activePairListId)?.has(p))) :
        new Set<string>(blockInfo.updatedPairs.filter(p =>
          currentPagePairs.has(p)));

      if (pairsToUpdate.size > 0) {
        this.defiService.getPairStatList(this.query, this.network, [...pairsToUpdate], [], 1, pairsToUpdate.size).subscribe(res => {
          if (res.ok) {
            const updatedPairStats: Array<PairStat> = plainToClass(PairStat, res.list);

            for (const updatedPairStat of updatedPairStats) {
              this.pairStats.set(updatedPairStat.pairInfo.address, updatedPairStat);
            }
          }
        });
      }
    });

    this.wsService.on<any>('rates').subscribe(data => {
      const pricesUsd = new Map<string, number>();
      Object.keys(data).forEach(k => pricesUsd.set(k, data[k]));

      for (const network of this.networks) {
        const oldPrice = this.pricesUsd.get(network.currencySymbol) ?? 0.0;
        const newPrice = pricesUsd.get(network.currencySymbol) ?? 0.0;
        this.priceDiffs.set(network.currencySymbol, newPrice - oldPrice);
        this.pricesUsd = pricesUsd;
        this.updatePairStats();
      }
    });
  }

  formatPrice(price: number, inverted = false, maxPrecision = 4): string {
    if (price === 0.0) {
      return inverted ? '1' : '0.000...';
    }

    if (inverted) {
      price = 1.0 / price;
    }

    if (price > 1000) {
      return this.thousandSuffixPipe.transform(price);
    } else if (price > 1) {
      return this.decimalPipe.transform(price, `1.0-${maxPrecision}`) ?? '1';
    } else {
      return '1';
    }
  }

  search(): void {
    this.query = this.searchTicker.trim();
    this.router.navigate(['/'], { queryParams: { q: this.query }, queryParamsHandling: 'merge' });
  }

  onPageChange(): void {
    if (this.pagination.page === 1) {
      this.router.navigate(['/'], { queryParams: { page: undefined }, queryParamsHandling: 'merge' });
    } else {
      this.router.navigate(['/'], { queryParams: { page: this.pagination.page }, queryParamsHandling: 'merge' });
    }
  }

  getTXCount(pairStat: PairStat): number {
    if (this.sortField === 'liquidity') {
      return pairStat.syncCount.total;
    } else {
      return this.period ? (pairStat.syncCount as any)[this.period] : pairStat.syncCount.total;
    }
  }

  loadTokenWhitelists(): void {
    this.defiService.getTokenWhitelists().subscribe(res => {
      if (res.ok) {
        const data = res.lists as any;

        this.tokenWhitelists.clear();
        Object.keys(data).forEach(key => {
          const obj = data[key] as unknown;
          const tokenWhitelist = plainToClass(TokenWhitelist, obj) ?? undefined;

          const wrapped = new Map<string, boolean>();
          const wrappedData = tokenWhitelist.wrapped as any;
          Object.keys(wrappedData).forEach(k => {
            wrapped.set(k, wrappedData[k]);
          });

          const usd = new Map<string, boolean>();
          const usdData = tokenWhitelist.usd as any;
          Object.keys(usdData).forEach(k => {
            usd.set(k, usdData[k]);
          });

          this.tokenWhitelists.set(key, new TokenWhitelist(
            wrapped,
            usd,
          ));
        });
      }
    });
  }

  loadPairLists(): void {
    const pairListInfoAll = new PairListInfo('', 'All', this.totalCount, 0, false);
    let remotePairListsInfo: Array<PairListInfo> = [];
    // let localPairListsInfo: Array<PairListInfo> = [];
    let index = 2; // All = 0, New = 1, ...

    this.defiService.getPairLists().subscribe(res => {
      if (res.ok) {
        this.allPairList = res.lists.filter(pair => pair.active);
        const groupNamesSet = new Set<string>();
        this.allPairList.map(pair => {
          if (!pair.isFeatured) {
            groupNamesSet.add(pair.groupName);
            this.groupNamesOptions[pair.groupName] = { isCollapsed: false, odd: [], even: [] };
          }
        });
        this.groupNames = [...groupNamesSet.values()].sort((a, b) => a.localeCompare(b));
        this.customGroupNames = this.customGroupNames.filter(groupName => this.groupNames.includes(groupName));
        this.groupNames = this.groupNames.filter(groupName => !this.customGroupNames.includes(groupName));
        this.groupNames = [...this.customGroupNames, ...this.groupNames];

        const remotePairLists = plainToClass(PairList, this.allPairList);

        // for (const remotePairList of remotePairLists) {
        //   this.savePairList(remotePairList);
        // }

        remotePairListsInfo = remotePairLists
          .map(p => new PairListInfo(p.id, p.name, p.count, index++, p.isFeatured, true))
          .sort((a, b) => a.isFeatured !== b.isFeatured ? (a.isFeatured ? 0 : 1) - (b.isFeatured ? 0 : 1) : (a.position - b.position));

        // const pairListsJsonString = localStorage.getItem('lists');

        // if (pairListsJsonString) {
        //   console.log(JSON.parse(pairListsJsonString));
        //   localPairListsInfo = (JSON.parse(pairListsJsonString) as Array<string>)
        //     .map(pairListJsonString => {
        //       const pairListInfo = PairListInfo.fromJsonString(pairListJsonString);
        //       pairListInfo.position = index++;
        //       return pairListInfo;
        //     })
        //     .filter(p => p.id !== '' && p.id !== 'unassigned')
        //     .filter(p => !remotePairListsInfo.map(rp => rp.id).includes(p.id));
        // }

        const pairListInfoUnassigned = new PairListInfo('unassigned', 'NEW', this.unassignedPairCount, 1, true);
        // this.pairLists = [pairListInfoAll, pairListInfoUnassigned, ...remotePairListsInfo, ...localPairListsInfo];
        this.pairLists = [pairListInfoAll, pairListInfoUnassigned, ...remotePairListsInfo];
        this.pairFeaturedList = this.pairLists.filter(pair => pair.isFeatured);
        this.groupNames.map(gName => this.setGroupPairLists(gName));
        // this.savePairLists();

        // console.log(this.pairLists);

        // this.pairListMap.clear();
        // this.assignedPairs.clear();

        // const allPairs = new Set<string>();

        // for (const pairList of res.lists) {
        //   const id = pairList.id;
        //   if (id) {
        //     const pairsInList = new Set<string>();

        //     for (const pairAddress of pairList.pairs) {
        //       pairsInList.add(pairAddress);
        //       allPairs.add(pairAddress);
        //     }

        //     this.pairListMap.set(id, pairsInList);

        //     for (const pairAddress of pairList.pairs) {
        //       this.assignedPairs.add(pairAddress);
        //     }
        //   }
        // }

        // this.pairListMap.set('', allPairs);

        // // console.log(this.assignedPairs.size);

        // this.updateAssignedPairs();
      }
    });
  }

  setGroupPairLists(groupName: string): void {
    const groupPairLists = this.allPairList.filter(pair => (pair.id && pair.active && !pair.isFeatured && pair.groupName === groupName));
    groupPairLists.map((pair, idx) => {
      if (idx % 2 === 1) {
        this.groupNamesOptions[groupName].even.push(pair);
      } else {
        this.groupNamesOptions[groupName].odd.push(pair);
      }
    });
  }

  // updateAssignedPairs(): void {
  //   this.assignedPairs.clear();

  //   for (const pairListInfo of this.pairLists) {
  //     const id = pairListInfo.id;
  //     // if (id) {
  //     const pairList = this.getPairList(id);
  //     for (const pairAddress of pairList.pairs) {
  //       this.assignedPairs.add(pairAddress);
  //     }
  //     // }
  //   }

  //   console.log('assigned:', this.assignedPairs.size);

  //   this.updateUnassignedCount();
  // }

  // updateUnassignedCount(): void {
  //   const unassignedPairListInfo = this.pairLists.find(pl => pl.id === 'unassigned');
  //   if (unassignedPairListInfo) {
  //     unassignedPairListInfo.pairCount = this.unassignedPairCount;
  //   }

  //   // console.log(unassignedPairListInfo?.pairCount);
  // }

  // savePairLists(): void {
  //   const pairListsJsonString = JSON.stringify(this.pairLists
  //     .filter(pl => pl.id !== '' && pl.id !== 'unassigned')
  //     .sort((a, b) => a.position - b.position)
  //     .map(p => p.toJsonString()));
  //   localStorage.setItem('lists', pairListsJsonString);
  // }

  getPairList(id: string): PairList {
    const pairListInfo = this.pairLists.find((pl: PairListInfo) => pl.id === id);

    // console.log('pli:', pairListInfo);

    switch (id) {
      case '':
        return new PairList('', 'All', '', 0, true, false, 0);
      case 'unassigned':
        return new PairList('', 'All', '', 0, true, false, 0);
      default:
        return new PairList(pairListInfo?.id ?? '', pairListInfo?.name ?? '', '', 0, true, false, 0);
    }
    // if (id) {
    //   // const jsonString = localStorage.getItem(`list-${id}`);
    //   // if (jsonString) {
    //   //   // return PairList.fromJsonString(jsonString);
    //   //   return new PairList(id, id);
    //   // }

    //   return new PairList(id, id, [], 0, false);
    // }

    // return new PairList('', 'All', [], 0, false);
  }

  // savePairList(pairList: PairList): void {
  //   localStorage.setItem(`list-${pairList.id}`, pairList.toJsonString());

  //   const pairListInfo = this.pairLists.find(p => p.id === pairList.id);
  //   if (pairListInfo) {
  //     pairListInfo.pairCount = pairList.pairs.size;
  //   }
  // }

  addPairList(): void {
    // const listName = prompt('Pair list name');

    // if (listName) {
    //   const pairList = new PairList('', listName, [], this.pairLists.length, false);
    //   pairList.createId();
    //   this.pairLists.push(pairList.info);
    //   this.pairListMap.set(pairList.id, pairList);
    //   this.savePairList(pairList);
    //   this.savePairLists();
    //   this.updateAssignedPairs();
    //   this.listsChanged = true;
    // }
  }

  removePairList(id: string): void {
    // const pairListIndex = this.pairLists.findIndex(p => p.id === id);

    // if (pairListIndex !== -1) {
    //   if (confirm('Are you sure?')) {
    //     const pairList = this.pairLists[pairListIndex];
    //     this.pairLists.splice(pairListIndex, 1);
    //     this.pairListMap.delete(pairList.id);

    //     for (let i = pairListIndex; i < this.pairLists.length; i++) {
    //       const pl = this.pairLists[i];
    //       pl.position = i;
    //       const plm = this.pairListMap.get(pl.id);
    //       if (plm) {
    //         plm.position = i;
    //       }
    //     }

    //     this.savePairLists();
    //     localStorage.removeItem(`list-${id}`);
    //     this.updateAssignedPairs();
    //     this.listsChanged = true;
    //   }
    // }
  }

  isFavorite(pairListId: string, pairStat: PairStat): boolean {
    return pairStat.hasTag(pairListId);
  }

  toggleFavorite(pairListId: string, pairStat: PairStat): void {
    const pairListInfo = this.pairLists.find((pl: PairListInfo) => pl.id === pairListId);

    if (this.isFavorite(pairListId, pairStat)) {
      // console.log('unset tag', pairListId, pairStat.pairInfo.address);
      this.defiService.removePair(pairListId, pairStat.pairInfo.address).subscribe(res => {
        if (res.ok) {
          pairStat.removeTag(pairListId);
          // this.pairListMap?.get(pairListId)?.delete(pairStat.pairInfo.address);

          if (pairListInfo) {
            pairListInfo.pairCount--;
            // pairListInfo.pairCount = this.pairListMap?.get(pairListId)?.size ?? 0;
          }
        }
      });
    } else {
      // console.log('set tag', pairListId, pairStat.pairInfo.address);
      this.defiService.addPair(pairListId, pairStat.pairInfo.address).subscribe(res => {
        if (res.ok) {
          pairStat.addTag(pairListId);

          if (pairListInfo) {
            pairListInfo.pairCount++;
            // pairListInfo.pairCount = this.pairListMap?.get(pairListId)?.size ?? 0;
          }

          // this.pairListMap?.get(pairListId)?.add(pairStat.pairInfo.address);

          // if (pairListInfo) {
          //   pairListInfo.pairCount = this.pairListMap?.get(pairListId)?.size ?? 0;
          // }
        }
      });
    }

    // if (pairList) {
    //   const addressInList = pairList.pairs.has(pairStat.pairInfo.address);
    //   if (addressInList) {
    //     pairList.pairs.delete(pairStat.pairInfo.address);
    //   } else {
    //     pairList.pairs.add(pairStat.pairInfo.address);
    //   }

    //   const pairListInfo = this.pairLists.find(p => p.id === pairListId);
    //   if (pairListInfo) {
    //     pairListInfo.pairCount = pairList.pairs.size;
    //   }

    //   // this.savePairList(pairList);
    //   this.savePairLists();
    //   this.purgePairStats();
    //   this.updateAssignedPairs();
    //   this.listsChanged = true;
    // }
  }

  // purgePairStats(): void {
  //   if (this.activePairList?.id && this.activePairList?.id !== 'unassigned') {
  //     for (const key of this.pairStats.keys()) {
  //       if (!this.activePairList?.pairs.has(key)) {
  //         this.pairStats.delete(key);
  //       }
  //     }
  //   }
  // }

  getPriceUsd(currencySymbol?: string): number {
    if (currencySymbol === undefined) {
      return 0.0;
    }

    const priceUsd = this.pricesUsd.get(currencySymbol);

    if (priceUsd !== undefined) {
      return priceUsd;
    } else {
      return 0.0;
    }
  }

  getPriceDiffUsd(currencySymbol?: string): number {
    if (currencySymbol === undefined) {
      return 0.0;
    }

    const priceDiffUsd = this.priceDiffs.get(currencySymbol);

    if (priceDiffUsd !== undefined) {
      return priceDiffUsd;
    } else {
      return 0.0;
    }
  }

  updatePairStats(): void {
    for (const key of this.pairStats.keys()) {
      const pairStat = this.pairStats.get(key);
      const priceUsd = this.getPriceUsd(pairStat?.pairInfo.lpToken.network.currencySymbol);
      pairStat?.updateLiquidity(priceUsd, this.tokenWhitelists);
    }
  }

  login(): void {
    // const token = prompt('Login');
    // if (token) {
    //   this.defiService.checkToken(token).subscribe(res => {
    //     if (res.ok) {
    //       localStorage.setItem('authToken', token);
    //     }
    //   });
    // }
    this.modalService.open(LoginComponent);
  }

  logout(): void {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
  }

  // uploadPairLists(): void {
  //   const pairLists = [...this.pairListMap.values()]
  //     .filter(pl => pl.id !== '' && pl.id !== 'unassigned').sort((a, b) => a.position - b.position);
  //   this.defiService.postPairLists(pairLists).subscribe(res => {
  //     if (res.ok) {
  //       this.listsChanged = false;
  //     }
  //   });
  // }

  showModal(content: any, pairStat: PairStat): void {
    const websiteLinkIndex = pairStat.links?.findIndex(l => l.icon === 'web') ?? -1;
    const twitterLinkIndex = pairStat.links?.findIndex(l => l.icon === 'twitter') ?? -1;
    const coingeckoLinkIndex = pairStat.links?.findIndex(l => l.icon === 'coingecko') ?? -1;
    const feeLinkIndex = pairStat.links?.findIndex(l => l.icon === 'fee') ?? -1;
    const snapshotLinkIndex = pairStat.links?.findIndex(l => l.icon === 'snapshot') ?? -1;
    const chart1LinkIndex = pairStat.links?.findIndex(l => l.icon === 'chart') ?? -1;
    const chart2LinkIndex = pairStat.links?.findIndex((l, index) => index > chart1LinkIndex && l.icon === 'chart') ?? -1;

    this.links = [
      new Link('Website', websiteLinkIndex !== -1 ? pairStat.links[websiteLinkIndex].href : ''),
      new Link('Twitter', twitterLinkIndex !== -1 ? pairStat.links[twitterLinkIndex].href : '', 'twitter'),
      new Link('CoinGecko', coingeckoLinkIndex !== -1 ? pairStat.links[coingeckoLinkIndex].href : '', 'coingecko'),
      new Link('Fee', feeLinkIndex !== -1 ? pairStat.links[feeLinkIndex].href : '', 'fee'),
      new Link('Snapshot', snapshotLinkIndex !== -1 ? pairStat.links[snapshotLinkIndex].href : '', 'snapshot'),
      new Link('Chart 1', chart1LinkIndex !== -1 ? pairStat.links[chart1LinkIndex].href : '', 'chart'),
      new Link('Chart 2', chart2LinkIndex !== -1 ? pairStat.links[chart2LinkIndex].href : '', 'chart')
    ];

    this.modalService.open(content, { ariaLabelledBy: 'modal-basic-title' }).result.then((result) => {
      if (result === 'OK') {
        const links = this.links.filter(l => l.href !== '');
        this.defiService.postPairStatLinks(pairStat.pairInfo.address, links).subscribe(res => {
          if (res.ok) {
            pairStat.links = links;
          }
        });
      }
    });
  }

  sortBy(sortField: string): void {
    this.filterBtn = false;
    switch (sortField) {
      case 'liquidity':
        this._period = '';
        this.router.navigate(['/'], {
          queryParams: {
            sortField: 'liquidity',
            sortDirection: this.sortField !== 'liquidity' ? undefined : this.sortDirection === 'asc' ? 'desc' : 'asc',
            period: undefined
          }
        });
        break;
      case 'txs':
        this.router.navigate(['/'], {
          queryParams: {
            sortField: 'txs',
            sortDirection: this.sortField !== 'txs' ? undefined : this.sortDirection === 'asc' ? 'desc' : 'asc',
            period: undefined
          },
          queryParamsHandling: 'merge'
        });
        break;
    }
  }

  setNetwork(networkName: any): void {
    this.filterBtn = false;
    this.router.navigate(['/'], {
      queryParams: {
        network: networkName || undefined
      },
      queryParamsHandling: 'merge'
    });
  }

  setPairList(pairListInfo: PairListInfo ): void {
    this.filterBtn = false;
    if (this.activePairListId !== pairListInfo.id) {
      this.router.navigate(['/'], {
        queryParams: {
          list: pairListInfo.id || undefined
        },
        queryParamsHandling: 'merge'
      });
    } else {
      this.router.navigate(['/'], {
        queryParams: {
          list: undefined
        },
        queryParamsHandling: 'merge'
      });
    }
  }

  collapseToggle(groupName: string): void {
    this.groupNamesOptions[groupName].isCollapsed = !this.groupNamesOptions[groupName].isCollapsed;
  }
}
