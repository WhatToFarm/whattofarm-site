import { Component, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { BannerService } from 'src/app/services/banner.service';

@Component({
  selector: 'app-banner',
  templateUrl: './banner.component.html',
  styleUrls: ['./banner.component.scss']
})
export class BannerComponent implements OnInit {
  bannerList: any = [];
  bannerPositions = ['front', 'side'];
  bannerForm = this.fb.group({
    fileName: ['', Validators.required],
    file: [null, Validators.required],
    link: ['', Validators.required],
    position: ['', Validators.required],
  });

  constructor(
    private bannerService: BannerService,
    private fb: FormBuilder
  ) { }

  ngOnInit(): void {
    this.bannerService.list().subscribe(res => {
      this.bannerList = res.list;
    });
  }

  async onUpload(event, form): Promise<void> {
    form.patchValue({
      file: event.target.files[0]
    });
  }

  uploadBanner(): void {
    if (this.bannerForm.valid) {
      const data = this.bannerForm.value;
      this.bannerService.upload(data.link, data.position, data.file).subscribe(res => {
        if (res.ok) {
          this.bannerForm.reset();
        }
      });
    }
  }

  deleteBanner(uuid): void{
    this.bannerService.delete(uuid).subscribe(res => {
      if (res.ok) {
        this.bannerList = this.bannerList.filter(banner => banner.uuid !== uuid);
      }
    });
  }
}
