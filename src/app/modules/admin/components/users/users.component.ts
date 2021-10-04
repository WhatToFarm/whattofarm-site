import { Component, OnInit } from '@angular/core';
import { DefiService } from 'src/app/services/defi.service';
import { ApiListResponse, ApiResponse, Pageable } from 'src/app/models/defi';
import { ActivatedRoute, Router } from '@angular/router';
import { plainToClass } from 'class-transformer';

@Component({
  selector: 'app-users',
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.scss']
})
export class UsersComponent implements OnInit {
  users: any[];
  pagination = new Pageable(0, 100);

  constructor(
    private defiService: DefiService,
    public router: Router,
    public route: ActivatedRoute
  ) { }

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      this.pagination.page = +(params.page ?? '1');
      this.getUsers();
    });
  }

  getUsers(): void {
    this.defiService.usersList(this.pagination).subscribe((res: ApiListResponse<any>) => {
      if (res.ok) {
        this.users = res.list;
        const pagination = plainToClass(Pageable, res.pageable);
        if (this.pagination.page !== pagination.page) {
          this.pagination.page = pagination.page;
        }
        this.pagination.total = pagination.total;
      }
    });
  }

  deleteUser(username: string): void {
    this.defiService.removeUser(username).subscribe((res: ApiResponse) => {
      if (res.ok) {
        this.getUsers();
      }
    });
  }

  onPageChange(): void {
    if (this.pagination.page === 1) {
      this.router.navigate(['/admin/users'], { queryParams: { page: undefined }, queryParamsHandling: 'merge' });
    } else {
      this.router.navigate(['/admin/users'], { queryParams: { page: this.pagination.page }, queryParamsHandling: 'merge' });
    }
  }

}
