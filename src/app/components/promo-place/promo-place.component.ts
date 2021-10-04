import { Component, Input, OnInit } from '@angular/core';
import { BannerService } from 'src/app/services/banner.service';

@Component({
  selector: 'app-promo-place',
  templateUrl: './promo-place.component.html',
  styleUrls: ['./promo-place.component.scss']
})
export class PromoPlaceComponent implements OnInit {
  href: string;
  imgSrc: string;

  @Input() place = 'front';

  constructor(
    private bannerService: BannerService
  ) { }

  ngOnInit(): void {
    this.bannerService.get(this.place).subscribe(res => {
      if (res.ok) {
        this.href = res.result.url;
        this.imgSrc = res.result.img;
      }
    });
  }
}
