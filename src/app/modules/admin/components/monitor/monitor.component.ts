import { Component, OnInit } from '@angular/core';
import { AbstractControl, FormArray, FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { MonitorService } from 'src/app/services/monitor.service';

@Component({
  selector: 'app-monitor',
  templateUrl: './monitor.component.html',
  styleUrls: ['./monitor.component.scss']
})
export class MonitorComponent implements OnInit {
  loading = true;
  errorMessage = {};
  monitorList: any[];
  createMonitorForm = this.fb.group({
    monitoring_address: ['', Validators.required],
    pool_contract_address: ['', Validators.required],
    farm_address: ['', Validators.required],
    description: [''],
  });
  monitorForm: FormGroup;
  monitors: FormArray;

  get monitorsArray(): FormArray {
    return this.monitorForm.get('monitors') as FormArray;
  }

  constructor(
    private fb: FormBuilder,
    private monitorService: MonitorService
  ) { }

  ngOnInit(): void {
    this.getMonitorList();
  }

  getMonitorList(): void {
    this.monitorForm = new FormGroup({
      monitors: new FormArray([])
    });
    this.monitorService.list().subscribe(res => {
      this.monitorList = res.list;
      this.addMonitors();
    });
  }

  addMonitors(): void {
    this.monitors = this.monitorForm.get('monitors') as FormArray;
    this.monitorList.map(monitor => this.monitors.push(this.createItem(monitor)));
    this.loading = false;
  }

  createItem(monitor): FormGroup {
    return this.fb.group({
      uuid: new FormControl(monitor.uuid),
      monitoring_address: new FormControl(monitor.monitoring_address),
      pool_contract_address: new FormControl(monitor.pool_contract_address),
      farm_address: new FormControl(monitor.farm_address),
      token_1_name: new FormControl(monitor.token_1_name),
      token_2_name: new FormControl(monitor.token_2_name),
      token_1_cost: new FormControl(monitor.token_1_cost),
      token_2_cost: new FormControl(monitor.token_2_cost),
      token_1_count: new FormControl(monitor.token_1_count),
      token_2_count: new FormControl(monitor.token_2_count),
      received_cost: new FormControl(monitor.received_cost),
      received_cutlet: new FormControl(monitor.received_cutlet),
      received_date: new FormControl(monitor.received_date, Validators.required),
      received_income: new FormControl(monitor.received_income),
      received_link: new FormControl(monitor.received_link),
      received_time: new FormControl(monitor.received_time, Validators.required),
      received_total: new FormControl(monitor.received_total, Validators.required),
      sent_cost: new FormControl(monitor.sent_cost),
      sent_cutlet: new FormControl(monitor.sent_cutlet),
      sent_date: new FormControl(monitor.sent_date, Validators.required),
      sent_income: new FormControl(monitor.sent_income),
      sent_link: new FormControl(monitor.sent_link),
      sent_time: new FormControl(monitor.sent_time, Validators.required),
      sent_total: new FormControl(monitor.sent_total, Validators.required),
      now_cost: new FormControl(monitor.now_cost),
      now_cutlet: new FormControl(monitor.now_cutlet),
      now_date: new FormControl(monitor.now_date),
      now_time: new FormControl(monitor.now_time),
      now_total: new FormControl(monitor.now_total),
    });
  }

  createMonitor(): void {
    this.loading = true;
    const data = this.createMonitorForm.value;
    this.monitorService.create(
      data.monitoring_address,
      data.pool_contract_address,
      data.farm_address,
      data.description
    ).subscribe(res => {
      if (res.ok) {
        this.createMonitorForm.reset();
        this.getMonitorList();
      }
    });
  }

  updateMonitor(monitorGroup: AbstractControl): void {
    const data = monitorGroup.value;
    this.errorMessage[data.uuid] = '';

    this.monitorService.update(
      data.uuid,
      data.received_date,
      data.received_time,
      +data.received_total,
      data.sent_date,
      data.sent_time,
      +data.sent_total
    ).subscribe(
      () => { },
      (err) => this.errorMessage[data.uuid] = err.error.errorMessage
    );
  }

  removeMonitor(monitorGroup: AbstractControl): void {
    const uuid = monitorGroup.get('uuid').value;
    this.monitorService.delete(uuid).subscribe(res => {
      if (res.ok) {
        this.loading = true;
        this.getMonitorList();
      }
    });
  }

  getFormValue(monitorGroup: AbstractControl, fieldName): string {
    return monitorGroup.get(fieldName).value;
  }

  getErrorMessage(monitorGroup: AbstractControl): string {
    const uuid = monitorGroup.get('uuid').value;
    return this.errorMessage[uuid];
  }

}
